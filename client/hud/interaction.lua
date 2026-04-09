FW = FW or {}
FW.Interaction = FW.Interaction or {}

local CFG = {
    holdDurationMs = 320,
    mouseSensitivity = 0.35,
}

local entities = {}
local activeTarget = nil
local menuTarget = nil
local isMenuOpen = false
local menuMode = nil
local holdStartAt = 0
local listIndex = 1
local radialMX = 0.0
local radialMY = 0.0
local coordIdCounter = 0
local lastHintState = nil
local lastListPosX = nil
local lastListPosY = nil
local blockedReopenTarget = nil
local globalPaused = false
local GetTargetCoords
local pendingPauseStates = {}

local function NUI(event, data)
    SendNUIMessage({ type = event, data = data or {} })
end

local function CloseMenu()
    if isMenuOpen then
        NUI('closeMenu', {})
    end

    isMenuOpen = false
    menuMode = nil
    menuTarget = nil
    holdStartAt = 0
    listIndex = 1
    radialMX = 0.0
    radialMY = 0.0
    lastListPosX = nil
    lastListPosY = nil
end

local function ClearActiveTarget()
    activeTarget = nil
    lastHintState = nil
    CloseMenu()
    NUI('hide', {})
end

local function GetCamForward()
    local rot = GetGameplayCamRot(2)
    local r = math.rad

    return vector3(
        -math.sin(r(rot.z)) * math.abs(math.cos(r(rot.x))),
        math.cos(r(rot.z)) * math.abs(math.cos(r(rot.x))),
        math.sin(r(rot.x))
    )
end

local function Raycast(maxDist)
    local ped = PlayerPedId()
    local origin = GetGameplayCamCoord()
    local dest = origin + GetCamForward() * maxDist
    local ray = StartShapeTestRay(
        origin.x, origin.y, origin.z,
        dest.x, dest.y, dest.z,
        -1, ped, 0
    )

    local _, hit, _, _, ent = GetShapeTestResult(ray)
    return (hit == 1 and ent and ent ~= 0) and ent or nil
end

local function WorldToScreen(wx, wy, wz)
    return GetScreenCoordFromWorldCoord(wx, wy, wz)
end

local function IsScreenPointVisible(x, y)
    return x and y and x > 0.08 and x < 0.92 and y > 0.08 and y < 0.88
end

local function IsCoordLike(value)
    local valueType = type(value)
    if valueType ~= 'table' and valueType ~= 'vector3' and valueType ~= 'userdata' then
        return false
    end

    return value.x ~= nil and value.y ~= nil and value.z ~= nil
end

local function NormalizeCoords(value)
    return vector3(tonumber(value.x) or 0.0, tonumber(value.y) or 0.0, tonumber(value.z) or 0.0)
end

local function CoordsText(coords)
    return ('%.2f, %.2f, %.2f'):format(coords.x, coords.y, coords.z)
end

local function MakeConfig(config)
    local syncId = config.syncId or config.id

    return {
        distance = config.distance or 2.5,
        viewDistance = config.viewDistance or 15.0,
        mode = config.mode or 'list',
        listPosition = config.listPosition or 'right',
        key = config.key or 38,
        keyLabel = config.keyLabel or 'E',
        options = config.options or {},
        heightOffset = config.heightOffset or 0.2,
        focusRadius = config.focusRadius or 0.0325,
        pauseAfterUse = config.pauseAfterUse == true,
        paused = config.paused == true,
        syncId = syncId and tostring(syncId) or nil,
    }
end

local function SerializeOptions(options)
    local serialized = {}

    for index, option in ipairs(options or {}) do
        serialized[index] = {
            label = option.label or ('Option ' .. index),
        }
    end

    return serialized
end

local function BuildInspectorInfo(targetId, cfg)
    if not cfg then
        return nil
    end

    local coords = GetTargetCoords(targetId, cfg)
    local sourceLabel = cfg.kind == 'coord' and 'Koordinate' or 'Entity'

    return {
        inspectorKind = 'interaction',
        interactionKey = cfg.syncId or tostring(targetId),
        interactionId = cfg.syncId or tostring(targetId),
        typeLabel = sourceLabel,
        displayName = 'Interaktionspunkt',
        mode = cfg.mode,
        modeLabel = cfg.mode == 'radial' and 'Radial' or 'Liste',
        keyLabel = cfg.keyLabel or 'E',
        distanceText = ('%.2f m'):format(cfg.distance or 0.0),
        viewDistanceText = ('%.2f m'):format(cfg.viewDistance or 0.0),
        paused = cfg.paused == true,
        pausedText = cfg.paused and 'Pausiert' or 'Aktiv',
        optionsCount = #(cfg.options or {}),
        listPosition = cfg.listPosition or 'right',
        sourceLabel = sourceLabel,
        coordsText = coords and CoordsText(coords) or '-',
        worldCoords = coords and { x = coords.x, y = coords.y, z = coords.z } or nil,
    }
end

local function CollectMatchingTargetKeys(targetId)
    local matches = {}
    local seen = {}

    local function addMatch(id)
        if id ~= nil and not seen[id] then
            seen[id] = true
            matches[#matches + 1] = id
        end
    end

    addMatch(targetId)

    local numericId = tonumber(targetId)
    if numericId then
        addMatch(numericId)
    end

    local syncId = tostring(targetId)
    for key, cfg in pairs(entities) do
        if cfg.syncId and cfg.syncId == syncId then
            addMatch(key)
        end
    end

    return matches
end

local function SmoothStep(value)
    local t = math.min(math.max(value, 0.0), 1.0)
    return t * t * (3.0 - (2.0 * t))
end

local function DistancePointToSegment(point, a, b)
    local ab = b - a
    local ap = point - a
    local abLenSq = (ab.x * ab.x) + (ab.y * ab.y) + (ab.z * ab.z)
    if abLenSq <= 0.0001 then
        return #(point - a)
    end

    local t = ((ap.x * ab.x) + (ap.y * ab.y) + (ap.z * ab.z)) / abLenSq
    t = math.min(math.max(t, 0.0), 1.0)

    local closest = vector3(
        a.x + (ab.x * t),
        a.y + (ab.y * t),
        a.z + (ab.z * t)
    )

    return #(point - closest)
end

local function SendHintState(payload)
    local signature = table.concat({
        payload.visible and '1' or '0',
        ('%.4f'):format(payload.x or 0.0),
        ('%.4f'):format(payload.y or 0.0),
        payload.key or '',
        payload.inRange and '1' or '0',
        ('%.3f'):format(payload.scale or 1.0),
        ('%.3f'):format(payload.morph or 0.0),
    }, '|')

    if signature == lastHintState then
        return
    end

    lastHintState = signature
    NUI('keyHint', payload)
end

local function SendListPosition(x, y)
    if lastListPosX and lastListPosY then
        if math.abs(lastListPosX - x) < 0.00045 and math.abs(lastListPosY - y) < 0.00045 then
            return
        end
    end

    lastListPosX = x
    lastListPosY = y
    NUI('updatePos', { x = x, y = y })
end

local function GetMaxViewDistance()
    local maxDist = 15.0

    for _, cfg in pairs(entities) do
        if not cfg.paused and cfg.viewDistance and cfg.viewDistance > maxDist then
            maxDist = cfg.viewDistance
        end
    end

    return maxDist
end

GetTargetCoords = function(target, cfg)
    if not cfg then
        return nil
    end

    if cfg.kind == 'coord' then
        return cfg.coords
    end

    if not DoesEntityExist(target) then
        return nil
    end

    return GetEntityCoords(target)
end

local function FindCoordTarget(playerCoords)
    local bestTarget = nil
    local bestScore = nil

    for key, cfg in pairs(entities) do
        if not cfg.paused and cfg.kind == 'coord' then
            local worldPoint = vector3(cfg.coords.x, cfg.coords.y, cfg.coords.z + cfg.heightOffset)
            local dist = #(playerCoords - cfg.coords)
            if dist <= cfg.viewDistance then
                local visible, sx, sy = WorldToScreen(
                    worldPoint.x,
                    worldPoint.y,
                    worldPoint.z
                )

                if visible and IsScreenPointVisible(sx, sy) then
                    local dx = sx - 0.5
                    local dy = sy - 0.5
                    local centerScore = (dx * dx) + (dy * dy)
                    local score = dist + (centerScore * 2.5)

                    if not bestScore or score < bestScore then
                        bestScore = score
                        bestTarget = key
                    end
                end
            end
        end
    end

    return bestTarget
end

function FW.Interaction.GetInspectorTarget(entity, hitCoords, rayOrigin, rayDestination)
    if entity and entities[entity] then
        return BuildInspectorInfo(entity, entities[entity])
    end

    local bestTarget = nil
    local bestScore = nil

    for key, cfg in pairs(entities) do
        local coords = GetTargetCoords(key, cfg)
        if coords then
            local worldPoint = vector3(coords.x, coords.y, coords.z + cfg.heightOffset)
            local visible, sx, sy = WorldToScreen(worldPoint.x, worldPoint.y, worldPoint.z)
            if visible and IsScreenPointVisible(sx, sy) then
                local dx = sx - 0.5
                local dy = sy - 0.5
                local centerScore = (dx * dx) + (dy * dy)
                local hitScore = hitCoords and #(coords - hitCoords) or 9999.0
                local rayScore = rayOrigin and rayDestination and DistancePointToSegment(coords, rayOrigin, rayDestination) or hitScore
                local lockRadius = math.max(0.08, (cfg.distance or 2.5) * 0.16)
                local softRadius = lockRadius * 1.9
                local centerWeight = centerScore * 1.2
                local rayWeight = rayScore / softRadius
                local hitWeight = math.min(hitScore / math.max(softRadius * 2.2, 0.55), 2.5) * 0.06
                local score = centerWeight + (rayWeight * 0.5) + hitWeight

                if rayScore <= softRadius and centerScore <= 0.03 and (not bestScore or score < bestScore) then
                    bestScore = score
                    bestTarget = key
                end
            end
        end
    end

    if bestTarget then
        return BuildInspectorInfo(bestTarget, entities[bestTarget])
    end

    return nil
end

function FW.Interaction.Register(entityOrCoords, config)
    assert(type(config) == 'table', 'FW.Interaction.Register: config muss eine Tabelle sein')

    if type(entityOrCoords) == 'number' then
        entities[entityOrCoords] = MakeConfig(config)
        entities[entityOrCoords].kind = 'entity'
        if not entities[entityOrCoords].syncId then
            entities[entityOrCoords].syncId = ('entity:%s'):format(entityOrCoords)
        end
        if pendingPauseStates[entities[entityOrCoords].syncId] ~= nil then
            entities[entityOrCoords].paused = pendingPauseStates[entities[entityOrCoords].syncId] == true
            pendingPauseStates[entities[entityOrCoords].syncId] = nil
        end
        return entityOrCoords
    end

    assert(IsCoordLike(entityOrCoords), 'FW.Interaction.Register: entity muss ein Handle oder Koordinate mit x/y/z sein')

    coordIdCounter = coordIdCounter + 1
    local id = config.id or ('coord:' .. coordIdCounter)
    entities[id] = MakeConfig(config)
    entities[id].kind = 'coord'
    entities[id].coords = NormalizeCoords(entityOrCoords)
    if not entities[id].syncId then
        entities[id].syncId = tostring(id)
    end
    if pendingPauseStates[entities[id].syncId] ~= nil then
        entities[id].paused = pendingPauseStates[entities[id].syncId] == true
        pendingPauseStates[entities[id].syncId] = nil
    end

    return id
end

function FW.Interaction.RegisterCoords(coords, config)
    return FW.Interaction.Register(coords, config)
end

function FW.Interaction.Unregister(targetId)
    entities[targetId] = nil
    if activeTarget == targetId then
        ClearActiveTarget()
    end
end

function FW.Interaction.SetPaused(targetId, paused)
    local matches = CollectMatchingTargetKeys(targetId)
    if #matches == 0 then
        pendingPauseStates[tostring(targetId)] = paused == true
        return false
    end

    pendingPauseStates[tostring(targetId)] = nil

    for _, matchId in ipairs(matches) do
        local cfg = entities[matchId]
        if cfg then
            cfg.paused = paused == true
            if cfg.syncId then
                pendingPauseStates[cfg.syncId] = nil
            end
            if cfg.paused and (activeTarget == matchId or menuTarget == matchId) then
                ClearActiveTarget()
            end
        end
    end

    return true
end

function FW.Interaction.Pause(targetId)
    return FW.Interaction.SetPaused(targetId, true)
end

function FW.Interaction.Resume(targetId)
    return FW.Interaction.SetPaused(targetId, false)
end

function FW.Interaction.SetGlobalPaused(paused)
    globalPaused = paused == true
    if globalPaused then
        ClearActiveTarget()
    end
end

function FW.Interaction.PauseAll()
    FW.Interaction.SetGlobalPaused(true)
end

function FW.Interaction.ResumeAll()
    FW.Interaction.SetGlobalPaused(false)
end

RegisterNetEvent('fw:interaction:setPaused', function(targetId, paused)
    FW.Interaction.SetPaused(targetId, paused == true)
end)

RegisterNetEvent('fw:interaction:syncPauseStates', function(states)
    if type(states) ~= 'table' then
        return
    end

    for _, entry in ipairs(states) do
        if entry and entry.id ~= nil then
            FW.Interaction.SetPaused(entry.id, entry.paused == true)
        end
    end
end)

CreateThread(function()
    Wait(500)
    TriggerServerEvent('fw:interaction:requestPauseStates')
end)

local function ProcessInteractionTick(playerCoords)
    if globalPaused then
        if activeTarget or isMenuOpen then
            ClearActiveTarget()
        end
        return 250
    end

    local rawTarget = Raycast(GetMaxViewDistance())
    local target = nil
    if rawTarget and entities[rawTarget] and not entities[rawTarget].paused then
        target = rawTarget
    end
    if not target then
        target = FindCoordTarget(playerCoords)
    end

    local cfg = target and entities[target]
    if not cfg then
        if activeTarget or isMenuOpen then
            ClearActiveTarget()
        end
        return 100
    end

    local previousTarget = activeTarget
    local targetCoords = GetTargetCoords(target, cfg)
    if not targetCoords then
        ClearActiveTarget()
        return 100
    end

    local dist = #(playerCoords - targetCoords)
    if dist > cfg.viewDistance then
        ClearActiveTarget()
        return 100
    end

    local camOrigin = GetGameplayCamCoord()
    local camForward = GetCamForward()
    local hintWorldPoint = vector3(targetCoords.x, targetCoords.y, targetCoords.z + cfg.heightOffset)
    local toHint = hintWorldPoint - camOrigin
    local forwardDot =
        (toHint.x * camForward.x) +
        (toHint.y * camForward.y) +
        (toHint.z * camForward.z)

    if forwardDot <= 0.15 then
        ClearActiveTarget()
        return 100
    end

    local visible, sx, sy = WorldToScreen(hintWorldPoint.x, hintWorldPoint.y, hintWorldPoint.z)
    if not visible or not IsScreenPointVisible(sx, sy) then
        ClearActiveTarget()
        return 100
    end

    activeTarget = target
    local inRange = dist <= cfg.distance
    local switchedTarget = previousTarget and previousTarget ~= activeTarget
    local outerSpan = math.max(cfg.viewDistance - cfg.distance, 0.01)
    local hintMorph = 1.0 - math.min(math.max((dist - cfg.distance) / outerSpan, 0.0), 1.0)
    hintMorph = SmoothStep(hintMorph)
    local hintScale = 0.42 + (hintMorph * 0.58)

    SendHintState({
        visible = true,
        x = sx,
        y = sy,
        key = cfg.keyLabel,
        inRange = inRange,
        mode = cfg.mode,
        scale = hintScale,
        morph = hintMorph,
    })

    if cfg.mode == 'radial' then
        if blockedReopenTarget == activeTarget and not IsControlPressed(0, cfg.key) then
            blockedReopenTarget = nil
        end

        if switchedTarget and isMenuOpen then
            CloseMenu()
        end

        if menuMode == 'list' then
            CloseMenu()
        end

        if not inRange then
            holdStartAt = 0
            if isMenuOpen then
                CloseMenu()
            end
            return 16
        end

        if not isMenuOpen then
            if blockedReopenTarget == activeTarget then
                return 16
            end

            if IsControlPressed(0, cfg.key) then
                if holdStartAt == 0 then
                    holdStartAt = GetGameTimer()
                end

                if (GetGameTimer() - holdStartAt) >= CFG.holdDurationMs then
                    isMenuOpen = true
                    menuMode = 'radial'
                    menuTarget = activeTarget
                    radialMX = 0.0
                    radialMY = 0.0
                    NUI('openRadial', { options = SerializeOptions(cfg.options) })
                end
            else
                holdStartAt = 0
            end

            return 16
        end

        DisableControlAction(0, 1, true)
        DisableControlAction(0, 2, true)

        radialMX = radialMX + (GetDisabledControlNormal(0, 239) * CFG.mouseSensitivity)
        radialMY = radialMY + (GetDisabledControlNormal(0, 240) * CFG.mouseSensitivity)
        NUI('radialMouse', { x = radialMX, y = radialMY })

        if IsDisabledControlJustReleased(0, cfg.key) then
            NUI('selectRadial', {})
            isMenuOpen = false
            menuMode = nil
            holdStartAt = 0
            radialMX = 0.0
            radialMY = 0.0
        end

        return 0
    end

    holdStartAt = 0

    if menuMode == 'radial' then
        CloseMenu()
    end

    if not inRange then
        if isMenuOpen then
            CloseMenu()
        end
        return 16
    end

    if switchedTarget then
        listIndex = 1
    end

    if blockedReopenTarget == activeTarget and not IsControlPressed(0, cfg.key) then
        blockedReopenTarget = nil
    end

    if switchedTarget and isMenuOpen then
        menuTarget = activeTarget
        lastListPosX = sx
        lastListPosY = sy
        NUI('openList', {
            options = SerializeOptions(cfg.options),
            position = cfg.listPosition,
            x = sx,
            y = sy,
            index = listIndex,
        })
        return 16
    end

    if not isMenuOpen then
        if blockedReopenTarget == activeTarget then
            return 16
        end

        isMenuOpen = true
        menuMode = 'list'
        menuTarget = activeTarget
        listIndex = 1
        lastListPosX = sx
        lastListPosY = sy
        NUI('openList', {
            options = SerializeOptions(cfg.options),
            position = cfg.listPosition,
            x = sx,
            y = sy,
            index = listIndex,
        })
        return 16
    end

    SendListPosition(sx, sy)

    DisableControlAction(0, 241, true)
    DisableControlAction(0, 242, true)
    DisableControlAction(0, 172, true)
    DisableControlAction(0, 173, true)

    local scrollUp =
        IsDisabledControlJustPressed(0, 241) or
        IsDisabledControlJustPressed(0, 172) or
        IsControlJustPressed(0, 241) or
        IsControlJustPressed(0, 172)

    local scrollDown =
        IsDisabledControlJustPressed(0, 242) or
        IsDisabledControlJustPressed(0, 173) or
        IsControlJustPressed(0, 242) or
        IsControlJustPressed(0, 173)

    if scrollUp and listIndex > 1 then
        listIndex = listIndex - 1
        NUI('listScroll', { index = listIndex })
    elseif scrollDown and listIndex < #cfg.options then
        listIndex = listIndex + 1
        NUI('listScroll', { index = listIndex })
    end

    if IsControlJustReleased(0, cfg.key) then
        NUI('selectList', { index = listIndex })
    end

    return 0
end

CreateThread(function()
    while not FW.Client or not FW.Client.RegisterNearbyTick do
        Wait(50)
    end

    FW.Client.RegisterNearbyTick('interaction', ProcessInteractionTick)
end)

RegisterNUICallback('selectOption', function(data, cb)
    local target = menuTarget or activeTarget
    local cfg = target and entities[target]
    if cfg then
        local opt = cfg.options[data.index]
        blockedReopenTarget = target

        local shouldPause = cfg.pauseAfterUse
        if opt and opt.pauseAfterUse ~= nil then
            shouldPause = opt.pauseAfterUse == true
        elseif opt and opt.pauseInteraction ~= nil then
            shouldPause = opt.pauseInteraction == true
        end

        if shouldPause then
            cfg.paused = true
        end

        if opt and opt.action then
            Citizen.SetTimeout(80, function()
                opt.action()
            end)
        end
    end

    CloseMenu()
    cb({})
end)

RegisterNUICallback('closeMenu', function(_, cb)
    CloseMenu()
    cb({})
end)

CreateThread(function()
    while true do
        DisableControlAction(0, 37, true)
        Wait(0)
    end
end)
