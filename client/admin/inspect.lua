FW = FW or {}
FW.Admin = FW.Admin or {}

local inspectorEnabled = false
local inspectorMenuOpen = false
local currentTarget = nil
local menuTarget = nil
local currentInspectorTarget = nil
local menuInspectorTarget = nil
local outlinedTarget = nil
local placementMode = false
local placementPreview = nil
local placementData = nil
local CloseInspectorMenu

local INSPECTOR_CFG = {
    maxDistance = 250.0,
    lineAlpha = 190,
    markerScale = 0.1,
    lineThickness = 0.00004,
    placementAlpha = 170,
    placementRotateStep = 7.5,
    placementMoveStep = 0.08,
    placementVerticalStep = 0.04,
}

local function SafeNativeCall(fn, ...)
    local ok, resultA, resultB, resultC, resultD, resultE = pcall(fn, ...)
    if not ok then
        return nil
    end

    return resultA, resultB, resultC, resultD, resultE
end

local function SendInspectorState()
    SendNUIMessage({
        action = 'adminInspectorState',
        data = {
            enabled = inspectorEnabled
        }
    })
end

local function SendPlacementState(visible, speedMultiplier)
    SendNUIMessage({
        action = 'adminPlacementState',
        data = {
            visible = visible,
            speedMultiplier = speedMultiplier or 1.0,
            speedLabel = ('%.2fx'):format(speedMultiplier or 1.0),
        }
    })
end

local function GetGameplayCameraForward()
    local rot = GetGameplayCamRot(2)
    local rx = math.rad(rot.x)
    local rz = math.rad(rot.z)

    return vector3(
        -math.sin(rz) * math.abs(math.cos(rx)),
        math.cos(rz) * math.abs(math.cos(rx)),
        math.sin(rx)
    )
end

local function GetPedHeadCoords(ped)
    local head = SafeNativeCall(GetPedBoneCoords, ped, 0x796E, 0.0, 0.0, 0.0)
    if head then
        return head
    end

    local fallback = SafeNativeCall(GetEntityCoords, ped)
    if fallback then
        return vector3(fallback.x, fallback.y, fallback.z + 0.75)
    end

    return vector3(0.0, 0.0, 0.0)
end

local function RaycastFromCamera(maxDistance)
    local ped = PlayerPedId()
    local origin = GetGameplayCamCoord()
    local destination = origin + GetGameplayCameraForward() * maxDistance
    local ray = StartShapeTestRay(
        origin.x, origin.y, origin.z,
        destination.x, destination.y, destination.z,
        -1, ped, 0
    )

    local _, hit, hitCoords, _, entity = GetShapeTestResult(ray)
    if hit == 1 then
        return (entity and entity ~= 0) and entity or nil, hitCoords or destination, destination
    end

    return nil, destination, destination
end

local function ClearOutline()
    if outlinedTarget and DoesEntityExist(outlinedTarget) then
        SetEntityDrawOutline(outlinedTarget, false)
    end

    outlinedTarget = nil
end

local function CleanupPlacementPreview()
    if placementPreview and DoesEntityExist(placementPreview) then
        SetEntityDrawOutline(placementPreview, false)
        DeleteEntity(placementPreview)
    end

    placementPreview = nil
    placementData = nil
    placementMode = false
    SendPlacementState(false, 1.0)
end

local function ApplyOutline(entity)
    if outlinedTarget == entity then
        return
    end

    ClearOutline()

    if entity and DoesEntityExist(entity) then
        local entityType = SafeNativeCall(GetEntityType, entity)
        if entityType == 1 then
            return
        end

        SafeNativeCall(SetEntityDrawOutlineShader, 1)
        SetEntityDrawOutlineColor(70, 210, 255, 255)
        SetEntityDrawOutline(entity, true)
        outlinedTarget = entity
    end
end

local function TypeLabel(entityType)
    if entityType == 1 then
        return 'Ped'
    elseif entityType == 2 then
        return 'Vehicle'
    elseif entityType == 3 then
        return 'Object'
    end

    return 'Entity'
end

local function CoordsText(coords)
    return ('%.2f, %.2f, %.2f'):format(coords.x, coords.y, coords.z)
end

local function GetEntityDisplayName(entity, entityType, modelHash)
    if entityType == 2 then
        local label = GetDisplayNameFromVehicleModel(modelHash)
        local translated = label and label ~= '' and GetLabelText(label) or nil
        if translated and translated ~= 'NULL' then
            return translated
        end
        return label ~= '' and label or 'Vehicle'
    end

    if entityType == 1 then
        if IsPedAPlayer(entity) then
            local playerIndex = NetworkGetPlayerIndexFromPed(entity)
            if playerIndex and playerIndex ~= -1 then
                return GetPlayerName(playerIndex) or 'Player'
            end
            return 'Player'
        end
        return 'Ped'
    end

    return 'Object'
end

local function GetEntityInfo(entity)
    if not entity or entity == 0 or not DoesEntityExist(entity) then
        return nil
    end

    local ped = PlayerPedId()
    local coords = SafeNativeCall(GetEntityCoords, entity)
    if not coords or not DoesEntityExist(entity) then
        return nil
    end

    local playerCoords = SafeNativeCall(GetEntityCoords, ped)
    if not playerCoords then
        return nil
    end

    local distance = #(playerCoords - coords)
    local entityType = SafeNativeCall(GetEntityType, entity)
    if not entityType or entityType == 0 or not DoesEntityExist(entity) then
        return nil
    end

    local modelHash = SafeNativeCall(GetEntityModel, entity)
    if not modelHash then
        return nil
    end

    local isNetworked = SafeNativeCall(NetworkGetEntityIsNetworked, entity)
    local networkId = isNetworked and SafeNativeCall(NetworkGetNetworkIdFromEntity, entity) or nil
    local heading = SafeNativeCall(GetEntityHeading, entity) or 0.0
    local health = SafeNativeCall(GetEntityHealth, entity) or 0
    local maxHealth = SafeNativeCall(GetEntityMaxHealth, entity) or 0
    local unsignedModelHash = modelHash >= 0 and modelHash or (modelHash + 4294967296)

    local info = {
        handle = entity,
        entityType = entityType,
        typeLabel = TypeLabel(entityType),
        displayName = GetEntityDisplayName(entity, entityType, modelHash),
        modelHash = ('%s (0x%X)'):format(modelHash, unsignedModelHash),
        networkId = networkId,
        distance = distance,
        distanceText = ('%.2f m'):format(distance),
        coords = coords,
        coordsText = CoordsText(coords),
        heading = heading,
        headingText = ('%.2f'):format(heading),
        health = health,
        healthText = maxHealth and maxHealth > 0 and ('%s / %s'):format(health, maxHealth) or tostring(health),
        rawModelHash = modelHash,
    }

    if entityType == 2 then
        info.extraLabel = 'Kennzeichen'
        info.extraValue = GetVehicleNumberPlateText(entity)
    elseif entityType == 1 then
        info.extraLabel = 'Spieler'
        info.extraValue = IsPedAPlayer(entity) and 'Ja' or 'Nein'
    elseif entityType == 3 then
        info.extraLabel = 'Mission Entity'
        info.extraValue = IsEntityAMissionEntity(entity) and 'Ja' or 'Nein'
    end

    return info
end

local function ColorForEntity(entityType)
    if entityType == 2 then
        return 80, 180, 255
    elseif entityType == 1 then
        return 255, 120, 80
    elseif entityType == 3 then
        return 80, 255, 170
    end

    return 220, 220, 220
end

local function Normalize(vec)
    local length = math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z)
    if length <= 0.0001 then
        return vector3(0.0, 0.0, 0.0)
    end

    return vector3(vec.x / length, vec.y / length, vec.z / length)
end

local function HorizontalForward()
    local forward = GetGameplayCameraForward()
    forward = vector3(forward.x, forward.y, 0.0)
    local normalized = Normalize(forward)

    if normalized.x == 0.0 and normalized.y == 0.0 and normalized.z == 0.0 then
        return vector3(0.0, 1.0, 0.0)
    end

    return normalized
end

local function DrawInspectorLine(entity, hitCoords)
    local ped = PlayerPedId()
    local from = GetPedHeadCoords(ped)
    local targetCoords = hitCoords

    if entity and (not targetCoords or (targetCoords.x == 0.0 and targetCoords.y == 0.0 and targetCoords.z == 0.0)) then
        targetCoords = GetEntityCoords(entity)
    end

    if not targetCoords then
        return
    end

    local r, g, b = 220, 220, 220
    if entity and DoesEntityExist(entity) then
        local entityType = GetEntityType(entity)
        r, g, b = ColorForEntity(entityType)
    end

    local direction = Normalize(targetCoords - from)
    local up = vector3(0.0, 0.0, 0.1)
    local side = Normalize(vector3(
        direction.y * up.z - direction.z * up.y,
        direction.z * up.x - direction.x * up.z,
        direction.x * up.y - direction.y * up.x
    ))

    if side.x == 0.0 and side.y == 0.0 and side.z == 0.0 then
        side = vector3(INSPECTOR_CFG.lineThickness, 0.0, 0.0)
    else
        side = side * INSPECTOR_CFG.lineThickness
    end

    DrawLine(from.x, from.y, from.z, targetCoords.x, targetCoords.y, targetCoords.z, r, g, b, INSPECTOR_CFG.lineAlpha)
    DrawLine(from.x + side.x, from.y + side.y, from.z + side.z, targetCoords.x + side.x, targetCoords.y + side.y, targetCoords.z + side.z, r, g, b, math.min(255, INSPECTOR_CFG.lineAlpha + 20))
    DrawLine(from.x - side.x, from.y - side.y, from.z - side.z, targetCoords.x - side.x, targetCoords.y - side.y, targetCoords.z - side.z, r, g, b, math.min(255, INSPECTOR_CFG.lineAlpha + 20))

    DrawMarker(
        28,
        targetCoords.x, targetCoords.y, targetCoords.z,
        0.0, 0.0, 0.0,
        0.0, 0.0, 0.0,
        INSPECTOR_CFG.markerScale, INSPECTOR_CFG.markerScale, INSPECTOR_CFG.markerScale,
        r, g, b, 180,
        false, false, 2, false, nil, nil, false
    )
end

local function CreatePlacementPreview(modelHash, entityType)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)

    RequestModel(modelHash)
    while not HasModelLoaded(modelHash) do
        Wait(0)
    end

    local preview = nil
    if entityType == 2 then
        preview = CreateVehicle(modelHash, coords.x, coords.y, coords.z, 0.0, false, false)
    elseif entityType == 1 then
        preview = CreatePed(4, modelHash, coords.x, coords.y, coords.z, 0.0, false, false)
    else
        preview = CreateObjectNoOffset(modelHash, coords.x, coords.y, coords.z, false, false, false)
    end

    if preview and preview ~= 0 and DoesEntityExist(preview) then
        SetEntityCollision(preview, false, false)
        FreezeEntityPosition(preview, true)
        SetEntityAlpha(preview, INSPECTOR_CFG.placementAlpha, false)
        SetEntityDrawOutlineColor(100, 255, 160, 255)
        SetEntityDrawOutline(preview, true)
    end

    SetModelAsNoLongerNeeded(modelHash)
    return preview
end

local function GetPlacementLift(modelHash)
    local minDim, maxDim = SafeNativeCall(GetModelDimensions, modelHash)
    if not minDim or not maxDim then
        return 0.0
    end

    return math.max(0.0, -minDim.z)
end

local function BeginClonePlacement(entity)
    if not entity or entity == 0 or not DoesEntityExist(entity) then
        FW.ClientNotify('[Admin] Kein gültiges Ziel zum Kopieren vorhanden.', 3000)
        return
    end

    local entityType = GetEntityType(entity)
    if entityType == 1 then
        FW.ClientNotify('[Admin] Peds/NPCs können im Platziermodus derzeit nicht sicher geklont werden.', 4500)
        return
    end

    local modelHash = SafeNativeCall(GetEntityModel, entity)
    if not modelHash then
        FW.ClientNotify('[Admin] Modell konnte nicht gelesen werden.', 4000)
        return
    end

    CleanupPlacementPreview()

    placementPreview = CreatePlacementPreview(modelHash, entityType)
    if not placementPreview or placementPreview == 0 or not DoesEntityExist(placementPreview) then
        FW.ClientNotify('[Admin] Vorschau konnte nicht erstellt werden.', 4000)
        CleanupPlacementPreview()
        return
    end

    placementData = {
        entityType = entityType,
        modelHash = modelHash,
        heading = SafeNativeCall(GetEntityHeading, entity) or 0.0,
        distanceOffset = 0.0,
        lateralOffset = 0.0,
        verticalOffset = GetPlacementLift(modelHash),
        speedMultiplier = 1.0,
    }

    placementMode = true
    CloseInspectorMenu()
    SendPlacementState(true, placementData.speedMultiplier)
    FW.ClientNotify('[Admin] Platzierungsmodus aktiv. Pfeile bewegen, Q/E rotieren, Mausrad hoch/runter setzt die Höhe, Linksklick platziert, ESC bricht ab.', 6500)
end

local function FinalizePlacement()
    if not placementPreview or not DoesEntityExist(placementPreview) then
        CleanupPlacementPreview()
        return
    end

    SetEntityAlpha(placementPreview, 255, false)
    SetEntityCollision(placementPreview, true, true)
    FreezeEntityPosition(placementPreview, false)
    SetEntityDrawOutline(placementPreview, false)

    placementPreview = nil
    placementData = nil
    placementMode = false
    SendPlacementState(false, 1.0)
    FW.ClientNotify('[Admin] Kopie platziert.', 3000)
end

local function OpenInspectorMenu(targetInfo)
    if not targetInfo then
        FW.ClientNotify('[Admin] Kein gültiges Ziel im Fokus.', 3000)
        return
    end

    inspectorMenuOpen = true
    menuTarget = currentTarget
    menuInspectorTarget = targetInfo
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'adminInspectorOpen',
        data = {
            target = targetInfo
        }
    })
end

CloseInspectorMenu = function()
    inspectorMenuOpen = false
    menuTarget = nil
    menuInspectorTarget = nil
    if not (FW.Admin.IsMenuOpen and FW.Admin.IsMenuOpen()) then
        SetNuiFocus(false, false)
    end
    SendNUIMessage({ action = 'adminInspectorClose' })
end

local function RequestEntityControl(entity)
    if not entity or entity == 0 or not DoesEntityExist(entity) then
        return false
    end

    if not NetworkGetEntityIsNetworked(entity) then
        return true
    end

    local attempts = 0
    while attempts < 20 do
        if NetworkHasControlOfEntity(entity) then
            return true
        end

        NetworkRequestControlOfEntity(entity)
        Wait(50)
        attempts = attempts + 1
    end

    return NetworkHasControlOfEntity(entity)
end

local function DeleteInspectedEntity()
    if menuInspectorTarget and menuInspectorTarget.inspectorKind == 'interaction' then
        FW.ClientNotify('[Admin] Interaktionspunkte werden nicht ueber den Entity-Loeschpfad entfernt.', 3500)
        return
    end

    local entity = menuTarget or currentTarget
    if not entity or entity == 0 or not DoesEntityExist(entity) then
        FW.ClientNotify('[Admin] Das Ziel existiert nicht mehr.', 3000)
        CloseInspectorMenu()
        return
    end

    if GetEntityType(entity) == 1 and IsPedAPlayer(entity) then
        FW.ClientNotify('[Admin] Spieler-Peds werden hier nicht clientseitig gelöscht.', 4000)
        return
    end

    if not RequestEntityControl(entity) then
        FW.ClientNotify('[Admin] Konnte keine Kontrolle über die Entity übernehmen.', 4000)
        return
    end

    SetEntityAsMissionEntity(entity, true, true)

    local entityType = GetEntityType(entity)
    if entityType == 2 then
        DeleteVehicle(entity)
    elseif entityType == 1 then
        DeletePed(entity)
    elseif entityType == 3 then
        DeleteObject(entity)
    else
        DeleteEntity(entity)
    end

    if DoesEntityExist(entity) then
        DeleteEntity(entity)
    end

    ClearOutline()
    currentTarget = nil
    CloseInspectorMenu()
    FW.ClientNotify('[Admin] Ziel entfernt.', 3000)
end

function FW.Admin.ToggleInspectorMode()
    inspectorEnabled = not inspectorEnabled

    if not inspectorEnabled then
        currentTarget = nil
        menuTarget = nil
        ClearOutline()
        if inspectorMenuOpen then
            CloseInspectorMenu()
        end
    end

    SendInspectorState()
    FW.ClientNotify(inspectorEnabled and '[Admin] Objekt-Inspektor aktiviert.' or '[Admin] Objekt-Inspektor deaktiviert.', 3000)
end

RegisterNUICallback('adminInspectorClose', function(_, cb)
    CloseInspectorMenu()
    cb({})
end)

RegisterNUICallback('adminInspectorDelete', function(_, cb)
    DeleteInspectedEntity()
    cb({})
end)

RegisterNUICallback('adminInspectorClone', function(_, cb)
    BeginClonePlacement(menuTarget or currentTarget)
    cb({})
end)

RegisterNUICallback('adminInspectorSetInteractionPaused', function(data, cb)
    if menuInspectorTarget and menuInspectorTarget.inspectorKind == 'interaction' then
        TriggerServerEvent('fw:interaction:setPaused', menuInspectorTarget.interactionKey, data and data.paused == true)
        menuInspectorTarget.paused = data and data.paused == true
        menuInspectorTarget.pausedText = menuInspectorTarget.paused and 'Pausiert' or 'Aktiv'
        SendNUIMessage({
            action = 'adminInspectorOpen',
            data = {
                target = menuInspectorTarget
            }
        })
    end

    cb({})
end)

CreateThread(function()
    while true do
        if inspectorEnabled then
            local entity, hitCoords, rayDestination = RaycastFromCamera(INSPECTOR_CFG.maxDistance)
            local rayOrigin = GetGameplayCamCoord()
            local entityInfo = GetEntityInfo(entity)
            local interactionInfo = nil
            if not entityInfo and FW.Interaction and FW.Interaction.GetInspectorTarget then
                interactionInfo = FW.Interaction.GetInspectorTarget(entity, hitCoords, rayOrigin, rayDestination)
            end
            local targetInfo = entityInfo or interactionInfo

            local inspectorHitCoords = hitCoords
            if interactionInfo and interactionInfo.worldCoords then
                inspectorHitCoords = vector3(
                    interactionInfo.worldCoords.x or 0.0,
                    interactionInfo.worldCoords.y or 0.0,
                    interactionInfo.worldCoords.z or 0.0
                )
            end

            DrawInspectorLine(entityInfo and entity or nil, inspectorHitCoords)

            if entityInfo then
                currentTarget = entity
            elseif not inspectorMenuOpen then
                currentTarget = nil
            end

            currentInspectorTarget = targetInfo

            if targetInfo and currentTarget then
                ApplyOutline(currentTarget)

                if not inspectorMenuOpen and IsControlJustReleased(0, 25) then
                    OpenInspectorMenu(targetInfo)
                end
            elseif targetInfo then
                ClearOutline()

                if not inspectorMenuOpen and IsControlJustReleased(0, 25) then
                    OpenInspectorMenu(targetInfo)
                end
            elseif not inspectorMenuOpen then
                ClearOutline()
            end

            if inspectorMenuOpen and menuInspectorTarget and menuInspectorTarget.inspectorKind ~= 'interaction' and menuTarget and not DoesEntityExist(menuTarget) then
                CloseInspectorMenu()
            end

            if placementMode and placementPreview and placementData and DoesEntityExist(placementPreview) then
                local placeCoords = hitCoords
                if not placeCoords then
                    local ped = PlayerPedId()
                    local head = GetPedHeadCoords(ped)
                    placeCoords = head + GetGameplayCameraForward() * 3.0
                end

                local forwardFlat = HorizontalForward()
                local rightFlat = vector3(forwardFlat.y, -forwardFlat.x, 0.0)
                local adjustedCoords = placeCoords
                    + forwardFlat * placementData.distanceOffset
                    + rightFlat * placementData.lateralOffset
                    + vector3(0.0, 0.0, placementData.verticalOffset)

                SetEntityCoordsNoOffset(placementPreview, adjustedCoords.x, adjustedCoords.y, adjustedCoords.z, false, false, false)
                SetEntityHeading(placementPreview, placementData.heading)

                DisableControlAction(0, 24, true)
                DisableControlAction(0, 25, true)
                DisableControlAction(0, 322, true)
                DisableControlAction(0, 200, true)
                DisableControlAction(0, 172, true)
                DisableControlAction(0, 173, true)
                DisableControlAction(0, 174, true)
                DisableControlAction(0, 175, true)
                DisableControlAction(0, 44, true)
                DisableControlAction(0, 38, true)
                DisableControlAction(0, 37, true)
                DisableControlAction(0, 21, true)
                DisableControlAction(0, 36, true)
                DisableControlAction(0, 241, true)
                DisableControlAction(0, 242, true)

                if IsDisabledControlJustPressed(0, 21) then
                    placementData.speedMultiplier = math.min(4.0, placementData.speedMultiplier + 0.25)
                    SendPlacementState(true, placementData.speedMultiplier)
                elseif IsDisabledControlJustPressed(0, 36) then
                    placementData.speedMultiplier = math.max(0.25, placementData.speedMultiplier - 0.25)
                    SendPlacementState(true, placementData.speedMultiplier)
                end

                local moveStep = INSPECTOR_CFG.placementMoveStep * placementData.speedMultiplier
                local rotateStep = INSPECTOR_CFG.placementRotateStep * placementData.speedMultiplier
                local verticalStep = INSPECTOR_CFG.placementVerticalStep * placementData.speedMultiplier

                if IsDisabledControlJustPressed(0, 172) then
                    placementData.distanceOffset = placementData.distanceOffset + moveStep
                elseif IsDisabledControlJustPressed(0, 173) then
                    placementData.distanceOffset = placementData.distanceOffset - moveStep
                elseif IsDisabledControlJustPressed(0, 174) then
                    placementData.lateralOffset = placementData.lateralOffset - moveStep
                elseif IsDisabledControlJustPressed(0, 175) then
                    placementData.lateralOffset = placementData.lateralOffset + moveStep
                elseif IsDisabledControlJustPressed(0, 44) then
                    placementData.heading = placementData.heading + rotateStep
                elseif IsDisabledControlJustPressed(0, 38) then
                    placementData.heading = placementData.heading - rotateStep
                elseif IsDisabledControlJustPressed(0, 241) then
                    placementData.verticalOffset = placementData.verticalOffset + verticalStep
                elseif IsDisabledControlJustPressed(0, 242) then
                    placementData.verticalOffset = placementData.verticalOffset - verticalStep
                end

                if IsDisabledControlJustReleased(0, 24) then
                    FinalizePlacement()
                elseif IsDisabledControlJustReleased(0, 322) or IsDisabledControlJustReleased(0, 200) then
                    CleanupPlacementPreview()
                    FW.ClientNotify('[Admin] Platzierung abgebrochen.', 3000)
                end
            end

            Wait(0)
        else
            if placementMode then
                CleanupPlacementPreview()
            end
            Wait(250)
        end
    end
end)
