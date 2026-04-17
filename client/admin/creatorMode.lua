FW = FW or {}
FW.Admin = FW.Admin or {}
FW.Creator = FW.Creator or {}

local noclip = false
local baseSpeed = 1.5
local minSpeed = 0.1
local maxSpeed = 10.0
local speedStep = 0.2
local shiftMultiplier = 3.0
local ctrlMultiplier = 0.3


-- NoClip Part

local function RotationToDirection(rotation)
    local rotZ = math.rad(rotation.z)
    local rotX = math.rad(rotation.x)
    local cosX = math.abs(math.cos(rotX))

    return vector3(
        -math.sin(rotZ) * cosX,
        math.cos(rotZ) * cosX,
        math.sin(rotX)
    )
end

local function GetCamDirection()
    local camRot = GetGameplayCamRot(0)
    return RotationToDirection(camRot)
end

local function Clamp(value, minVal, maxVal)
    if value < minVal then return minVal end
    if value > maxVal then return maxVal end
    return value
end

function FW.Admin.CreatorNoClip(state)
    local ped = PlayerPedId()
    noclip = state

    if noclip then
        FreezeEntityPosition(ped, true)
        SetEntityCollision(ped, false, false)
        SetEntityInvincible(ped, true)
        SetEntityVisible(ped, false, false)
    else
        FreezeEntityPosition(ped, false)
        SetEntityCollision(ped, true, true)
        SetEntityInvincible(ped, false)
        SetEntityVisible(ped, true, false)
    end
end

CreateThread(function()
    while true do
        if noclip then
            local ped = PlayerPedId()
            local coords = GetEntityCoords(ped)
            local forward = GetCamDirection()
            local right = vector3(forward.y, -forward.x, 0.0)
            local up = vector3(0.0, 0.0, 1.0)

            if IsControlJustPressed(0, 15) then
                baseSpeed = Clamp(baseSpeed + speedStep, minSpeed, maxSpeed)
            end

            if IsControlJustPressed(0, 14) then
                baseSpeed = Clamp(baseSpeed - speedStep, minSpeed, maxSpeed)
            end

            local currentSpeed = baseSpeed

            if IsControlPressed(0, 21) then
                currentSpeed = currentSpeed * shiftMultiplier
            end

            if IsControlPressed(0, 36) then
                currentSpeed = currentSpeed * ctrlMultiplier
            end

            local move = vector3(0.0, 0.0, 0.0)

            if IsControlPressed(0, 32) then -- W
                move = move + (forward * currentSpeed)
            end
            if IsControlPressed(0, 33) then -- S
                move = move - (forward * currentSpeed)
            end
            if IsControlPressed(0, 34) then -- A
                move = move - (right * currentSpeed)
            end
            if IsControlPressed(0, 35) then -- D
                move = move + (right * currentSpeed)
            end
            if IsControlPressed(0, 22) then -- SPACE
                move = move + (up * currentSpeed)
            end
            if IsControlPressed(0, 44) then -- Q
                move = move - (up * currentSpeed)
            end

            local newCoords = coords + move

            SetEntityVelocity(ped, 0.0, 0.0, 0.0)
            SetEntityCoordsNoOffset(ped, newCoords.x, newCoords.y, newCoords.z, true, true, true)

            DisableControlAction(0, 24, true)
            DisableControlAction(0, 25, true)
            DisableControlAction(0, 140, true)
            DisableControlAction(0, 141, true)
            DisableControlAction(0, 142, true)

            Wait(0)
        else
            Wait(500)
        end
    end
end)


-- Creator Part

FW = FW or {}
FW.Admin = FW.Admin or {}
FW.Creator = FW.Creator or {}

local CreatorState = {
    visible = false,
    focused = false,
    activeMode = nil,
    noclipEnabled = false,

    pendingTast = nil,

    cachedVehicle = nil,
    previewTickRegistered = false,

    doors = {
        label = '',
        locked = true,
        primary = nil,
        secondary = nil
    },

    jobs = {
        jobName = '',
        label = '',
        points = {
            garage = nil,
            duty = nil,
            bossmenu = nil,
            stash = nil
        }
    }
}

local CREATOR_NEARBY_TICK_ID = 'fw_creator_preview'

local function Notify(msg)
    if FW.ClientNotify then
        FW.ClientNotify(msg, 3000)
        print(msg)
    end
end

local function Round(num, decimals)
    local mult = 10 ^ (decimals or 2)
    return math.floor((num * mult) + 0.5) / mult
end

local function GetPlayerCoordsWithHeading()
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)

    return {
        x = Round(coords.x, 3),
        y = Round(coords.y, 3),
        z = Round(coords.z, 3),
        w = Round(GetEntityHeading(ped), 2)
    }
end

local function ResetCreatorDrafts()
    CreatorState.doors.label = ''
    CreatorState.doors.locked = true
    CreatorState.doors.primary = nil
    CreatorState.doors.secondary = nil

    CreatorState.jobs.jobName = ''
    CreatorState.jobs.label = ''
    CreatorState.jobs.points = {
        garage = nil,
        duty = nil,
        bossmenu = nil,
        stash = nil
    }
end

local function SetCreatorAppearance(enabled)
    local ped = PlayerPedId()
    local isInVehicle = IsPedInAnyVehicle(ped, false)

    if enabled then
        if isInVehicle then
            local veh = GetVehiclePedIsIn(ped, false)
            if veh and veh ~= 0 and DoesEntityExist(veh) then
                CreatorState.cachedVehicle = veh
                SetEntityVisible(veh, false, false)
                SetEntityCollision(veh, false, false)
                SetEntityAlpha(veh, 0, false)
            end
        end

        SetEntityVisible(ped, false, false)
        SetEntityCollision(ped, false, false)
        SetEntityAlpha(ped, 0, false)
        SetEntityInvincible(ped, true)
    else
        if CreatorState.cachedVehicle and DoesEntityExist(CreatorState.cachedVehicle) then
            SetEntityVisible(CreatorState.cachedVehicle, true, false)
            SetEntityCollision(CreatorState.cachedVehicle, true, true)
            ResetEntityAlpha(CreatorState.cachedVehicle)
        end

        CreatorState.cachedVehicle = nil

        SetEntityVisible(ped, true, false)
        SetEntityCollision(ped, true, true)
        ResetEntityAlpha(ped)
        SetEntityInvincible(ped, false)
    end
end

local function SetCreatorNoclip(state, silent)
    state = state == true

    if CreatorState.noclipEnabled == state then
        SendNUIMessage({
            action = 'creator:setNoclipState',
            enabled = state
        })
        return
    end

    CreatorState.noclipEnabled = state

    if FW.Admin.CreatorNoClip then
        FW.Admin.CreatorNoClip(state)
    end

    SetCreatorAppearance(state)

    SendNUIMessage({
        action = 'creator:setNoclipState',
        enabled = state
    })

    if not silent then
        Notify(state and '[Creator] Noclip aktiviert.' or '[Creator] Noclip deaktiviert.')
    end
end

local function SetCreatorFocus(state)
    CreatorState.focused = state == true
    SetNuiFocus(CreatorState.focused, CreatorState.focused)

    SendNUIMessage({
        action = 'creator:setFocus',
        focused = CreatorState.focused
    })
end

local function OpenCreator()
    CreatorState.visible = true
    CreatorState.focused = true

    -- Falls Admin-Menü offen ist, zuerst schließen
    if FW.Admin and FW.Admin.IsMenuOpen and FW.Admin.IsMenuOpen() then
        CloseAdminMenu()
    end

    SetNuiFocus(true, true)

    -- Zentrales App-Route-System öffnen
    SendNUIMessage({
        action = 'open',
        data = {
            route = 'creatorMode'
        }
    })

    -- Creator-spezifischen State setzen
    SendNUIMessage({
        action = 'creator:setFocus',
        focused = true
    })

    SendNUIMessage({
        action = 'creator:setMode',
        mode = CreatorState.activeMode
    })

    SendNUIMessage({
        action = 'creator:setNoclipState',
        enabled = CreatorState.noclipEnabled
    })
end

local function HideCreatorMenu()
    CreatorState.visible = false
    CreatorState.focused = false

    SetNuiFocus(false, false)

    SendNUIMessage({
        action = 'closeMenu'
    })
end

local function ExitCreatorMode()
    HideCreatorMenu()
    CreatorState.activeMode = nil
    SetCreatorNoclip(false, true)

    SendNUIMessage({
        action = 'creator:setMode',
        mode = nil
    })

    Notify('[Creator] Creator Mode beendet.')
end

function FW.Admin.IsCreatorOpen()
    return CreatorState.visible == true
end

function FW.Admin.IsCreatorFocused()
    return CreatorState.focused == true
end

function FW.Admin.ToggleCreatorMode()
    local ped = PlayerPedId()

    if IsPedInAnyVehicle(ped, false) then
        Notify('[Creator] Bitte steige zuerst aus dem Fahrzeug aus.')
        return
    end

    if not CreatorState.visible then
        OpenCreator()
        Notify('Creator Mode aktiviert.')
        return
    end

    SetCreatorFocus(not CreatorState.focused)
end

function FW.Admin.ExitCreatorMode()
    ExitCreatorMode()
end

local function SetCreatorMode(mode)
    if mode ~= 'doors' and mode ~= 'jobs' and mode ~= nil then
        return
    end

    CreatorState.activeMode = mode

    SendNUIMessage({
        action = 'creator:setMode',
        mode = mode
    })

    if mode == 'doors' then
        Notify('[Creator] Doors Creator aktiv.')

    elseif mode == 'jobs' then
        Notify('[Creator] Jobs Creator aktiv.')
    else
        Notify('[Creator] Creator-Modus beendet.')
    end
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

local function SafeDoorRaycast(maxDistance)
    HideCreatorMenu()
    local ped = PlayerPedId()
    local origin = GetGameplayCamCoord()
    local destination = origin + GetGameplayCameraForward() * (maxDistance or 20.0)

    local ray = StartShapeTestRay(
        origin.x, origin.y, origin.z,
        destination.x, destination.y, destination.z,
        16 + 32 + 64 + 1,
        ped,
        0
    )

    local _, hit, hitCoords, _, entity = GetShapeTestResult(ray)

    if hit ~= 1 or not entity or entity == 0 or not DoesEntityExist(entity) then
        return nil, hitCoords
    end

    local entityType = GetEntityType(entity)
    if entityType ~= 2 and entityType ~= 3 then
        return nil, hitCoords
    end

    OpenCreator()
    return entity, hitCoords
end

local function BuildDoorCapture(entity, hitCoords)
    if not entity or entity == 0 or not DoesEntityExist(entity) then
        return nil
    end

    local coords = GetEntityCoords(entity)
    local model = GetEntityModel(entity)
    local heading = GetEntityHeading(entity)

    return {
        entity = entity,
        entityType = GetEntityType(entity),
        model = model,
        coords = {
            x = Round(coords.x, 3),
            y = Round(coords.y, 3),
            z = Round(coords.z, 3),
            w = Round(heading, 2)
        },
        hit = hitCoords and {
            x = Round(hitCoords.x, 3),
            y = Round(hitCoords.y, 3),
            z = Round(hitCoords.z, 3)
        } or nil
    }
end

local function CaptureDoorsPrimary()
    local entity, hitCoords = SafeDoorRaycast(25.0)
    if not entity then
        return nil, 'no_door_target'
    end

    local capture = BuildDoorCapture(entity, hitCoords)
    if not capture then
        return nil, 'invalid_entity'
    end

    CreatorState.doors.primary = capture
    Notify('[Creator] Primäre Tür übernommen.')
    return capture
end

local function CaptureDoorsSecondary()
    local entity, hitCoords = SafeDoorRaycast(25.0)
    if not entity then
        return nil, 'no_door_target'
    end

    local capture = BuildDoorCapture(entity, hitCoords)
    if not capture then
        return nil, 'invalid_entity'
    end

    CreatorState.doors.secondary = capture
    Notify('[Creator] Sekundäre Tür übernommen.')
    return capture
end

local function CaptureJobPoint(pointType)
    if pointType ~= 'garage' and pointType ~= 'duty' and pointType ~= 'bossmenu' and pointType ~= 'stash' then
        return nil
    end

    local coords = GetPlayerCoordsWithHeading()
    CreatorState.jobs.points[pointType] = coords

    Notify(('[Creator] Punkt "%s" gesetzt.'):format(pointType))
    return coords
end

local function DrawCreatorMarker(coords, r, g, b)
    if not coords then return end

    DrawMarker(
        28,
        coords.x, coords.y, coords.z + 0.02,
        0.0, 0.0, 0.0,
        0.0, 0.0, 0.0,
        0.08, 0.08, 0.08,
        r or 80, g or 200, b or 255, 180,
        false, false, 2, false, nil, nil, false
    )
end

local function RegisterCreatorPreviewTick()
    if CreatorState.previewTickRegistered then
        return true
    end

    if not (FW.Client and FW.Client.RegisterNearbyTick) then
        return false
    end

    FW.Client.RegisterNearbyTick(CREATOR_NEARBY_TICK_ID, function(_, sleep)
        if not CreatorState.visible then
            return sleep
        end

        if CreatorState.activeMode == 'doors' then
            if CreatorState.doors.primary and CreatorState.doors.primary.coords then
                local c = CreatorState.doors.primary.coords
                DrawCreatorMarker(vector3(c.x, c.y, c.z), 0, 200, 255)
            end

            if CreatorState.doors.secondary and CreatorState.doors.secondary.coords then
                local c = CreatorState.doors.secondary.coords
                DrawCreatorMarker(vector3(c.x, c.y, c.z), 255, 180, 80)
            end

            return 0
        end

        if CreatorState.activeMode == 'jobs' then
            local points = CreatorState.jobs.points

            if points.garage then
                DrawCreatorMarker(vector3(points.garage.x, points.garage.y, points.garage.z), 80, 180, 255)
            end
            if points.duty then
                DrawCreatorMarker(vector3(points.duty.x, points.duty.y, points.duty.z), 80, 255, 170)
            end
            if points.bossmenu then
                DrawCreatorMarker(vector3(points.bossmenu.x, points.bossmenu.y, points.bossmenu.z), 255, 200, 80)
            end
            if points.stash then
                DrawCreatorMarker(vector3(points.stash.x, points.stash.y, points.stash.z), 220, 120, 255)
            end

            return 0
        end

        return sleep
    end)

    CreatorState.previewTickRegistered = true
    return true
end

CreateThread(function()
    while not RegisterCreatorPreviewTick() do
        Wait(250)
    end
end)

RegisterNUICallback('creator:close', function(_, cb)
    HideCreatorMenu()
    cb({ ok = true })
end)

RegisterNUICallback('creator:exit', function(_, cb)
    ExitCreatorMode()
    cb({ ok = true })
end)

RegisterNUICallback('creator:toggleFocus', function(_, cb)
    if CreatorState.visible then
        SetCreatorFocus(not CreatorState.focused)
    end

    cb({
        ok = true,
        focused = CreatorState.focused
    })
end)

RegisterNUICallback('creator:setMode', function(data, cb)
    SetCreatorMode(data and data.mode or nil)

    cb({
        ok = true,
        mode = CreatorState.activeMode
    })
end)

RegisterNUICallback('creator:setNoclip', function(data, cb)
    SetCreatorNoclip(data and data.enabled == true)

    cb({
        ok = true,
        enabled = CreatorState.noclipEnabled
    })
end)

RegisterNUICallback('creator:doors:capturePrimary', function(_, cb)
    if CreatorState.activeMode ~= 'doors' then
        cb({ ok = false, error = 'doors_mode_not_active' })
        return
    end

    local result, err = CaptureDoorsPrimary()
    if not result then
        cb({ ok = false, error = err })
        return
    end

    cb({
        ok = true,
        coords = result.coords,
        entity = result
    })
end)

RegisterNUICallback('creator:doors:captureSecondary', function(_, cb)
    if CreatorState.activeMode ~= 'doors' then
        cb({ ok = false, error = 'doors_mode_not_active' })
        return
    end

    local result, err = CaptureDoorsSecondary()
    if not result then
        cb({ ok = false, error = err })
        return
    end

    cb({
        ok = true,
        coords = result.coords,
        entity = result
    })
end)

RegisterNUICallback('creator:doors:saveDraft', function(data, cb)
    if data then
        CreatorState.doors.label = data.label or CreatorState.doors.label
        CreatorState.doors.locked = data.locked == true
    end

    cb({
        ok = true,
        payload = {
            label = CreatorState.doors.label,
            locked = CreatorState.doors.locked,
            primary = CreatorState.doors.primary,
            secondary = CreatorState.doors.secondary
        }
    })
end)

RegisterNUICallback('creator:jobs:capturePoint', function(data, cb)
    if CreatorState.activeMode ~= 'jobs' then
        cb({ ok = false, error = 'jobs_mode_not_active' })
        return
    end

    local result = CaptureJobPoint(data and data.type)
    if not result then
        cb({ ok = false, error = 'invalid_point_type' })
        return
    end

    cb({
        ok = true,
        coords = result
    })
end)

RegisterNUICallback('creator:jobs:saveDraft', function(data, cb)
    if data then
        CreatorState.jobs.jobName = data.jobName or CreatorState.jobs.jobName
        CreatorState.jobs.label = data.label or CreatorState.jobs.label
    end

    cb({
        ok = true,
        payload = {
            jobName = CreatorState.jobs.jobName,
            label = CreatorState.jobs.label,
            points = CreatorState.jobs.points
        }
    })
end)