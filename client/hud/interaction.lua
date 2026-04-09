FW = FW or {}
FW.Interaction = FW.Interaction or {}

local CFG = {
    holdDurationMs = 50,
    mouseSensitivity = 0.5,
    listRepeatDelayMs = 120,
    pointOnlyTickMs = 33,
    pointOnlyHintIntervalMs = 33,
    listVisualTickMs = 33,
    listHintIntervalMs = 33,
    listPosIntervalMs = 33,
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
local lastHintSentAt = 0
local lastListPosX = nil
local lastListPosY = nil
local lastListPosSentAt = 0
local lastListMoveAt = 0
local lastListRepeatAt = 0
local blockedReopenTarget = nil
local globalPaused = false
local GetTargetCoords
local pendingPauseStates = {}
local pendingListDelta = 0
local pendingListSelect = false
local interactionCache = {
    targetCount = 0,
    entityCount = 0,
    coordKeys = {},
    maxViewDistance = 15.0,
}

local function RefreshInteractionCache()
    local coordKeys = {}
    local targetCount = 0
    local entityCount = 0
    local maxViewDistance = 15.0

    for key, cfg in pairs(entities) do
        targetCount = targetCount + 1

        if cfg.kind == 'coord' then
            coordKeys[#coordKeys + 1] = key
        elseif not cfg.paused then
            entityCount = entityCount + 1
        end

        if not cfg.paused and cfg.viewDistance and cfg.viewDistance > maxViewDistance then
            maxViewDistance = cfg.viewDistance
        end
    end

    interactionCache.targetCount = targetCount
    interactionCache.entityCount = entityCount
    interactionCache.coordKeys = coordKeys
    interactionCache.maxViewDistance = maxViewDistance
end

local function SetRadialFocus(enabled)
    if SetNuiFocusKeepInput then
        SetNuiFocusKeepInput(false)
    end

    if enabled then
        SetNuiFocus(true, true)
    else
        SetNuiFocus(false, false)
    end
end

local function NUI(event, data)
    SendNUIMessage({ type = event, data = data or {} })
end

local function CloseMenu(immediate)
    local wasRadial = menuMode == 'radial'
    if isMenuOpen then
        NUI('closeMenu', { immediate = immediate == true })
    end

    if wasRadial then
        SetRadialFocus(false)
    end

    isMenuOpen = false
    menuMode = nil
    menuTarget = nil
    holdStartAt = 0
    listIndex = 1
    lastListMoveAt = 0
    radialMX = 0.0
    radialMY = 0.0
    lastListPosX = nil
    lastListPosY = nil
    lastListPosSentAt = 0
    lastHintSentAt = 0
    pendingListDelta = 0
    pendingListSelect = false
    lastListRepeatAt = 0
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

local function Raycast(origin, forward, maxDist)
    local ped = PlayerPedId()
    local dest = origin + forward * maxDist
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

local function ResolveControlKey(config)
    local rawKey = config.key
    if rawKey == nil and type(config.keyLabel) == 'string' and FW.Keys and FW.Keys.Has(config.keyLabel) then
        rawKey = config.keyLabel
    end

    if FW.Keys then
        local resolved = FW.Keys.Get(rawKey)
        if resolved ~= nil then
            local label = config.keyLabel
            if type(rawKey) == 'string' and (label == nil or label == '') then
                label = FW.Keys.Name(rawKey)
            elseif (label == nil or label == '') and type(resolved) == 'number' then
                label = FW.Keys.Name(resolved)
            end

            return resolved, label
        end
    end

    return rawKey or 38, config.keyLabel
end

local function MakeConfig(config)
    local syncId = config.syncId or config.id
    local resolvedKey, resolvedKeyLabel = ResolveControlKey(config)

    return {
        distance = config.distance or 2.5,
        viewDistance = config.viewDistance or 15.0,
        mode = config.mode or 'list',
        listPosition = config.listPosition or 'right',
        key = resolvedKey,
        keyLabel = resolvedKeyLabel or 'E',
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
    local now = GetGameTimer()
    local pointOnly = payload.visible and not payload.inRange and not isMenuOpen
    local listVisual = payload.visible and payload.inRange and isMenuOpen and menuMode == 'list'
    local minInterval = 0
    if pointOnly then
        minInterval = CFG.pointOnlyHintIntervalMs
    elseif listVisual then
        minInterval = CFG.listHintIntervalMs
    end

    if minInterval > 0 and (now - lastHintSentAt) < minInterval then
        return
    end

    local xPrecision = 0.001
    local yPrecision = 0.001
    local scalePrecision = 0.015
    local morphPrecision = 0.02

    if pointOnly then
        xPrecision = 0.0025
        yPrecision = 0.0025
        scalePrecision = 0.035
        morphPrecision = 0.05
    elseif listVisual then
        xPrecision = 0.0018
        yPrecision = 0.0018
        scalePrecision = 0.025
        morphPrecision = 0.03
    end

    local function quantize(value, precision)
        return math.floor(((value or 0.0) / precision) + 0.5) * precision
    end

    local signature = table.concat({
        payload.visible and '1' or '0',
        ('%.4f'):format(quantize(payload.x, xPrecision)),
        ('%.4f'):format(quantize(payload.y, yPrecision)),
        payload.key or '',
        payload.inRange and '1' or '0',
        ('%.3f'):format(quantize(payload.scale, scalePrecision)),
        ('%.3f'):format(quantize(payload.morph, morphPrecision)),
    }, '|')

    if signature == lastHintState then
        return
    end

    lastHintState = signature
    lastHintSentAt = now
    NUI('keyHint', payload)
end

local function SendListPosition(x, y)
    local now = GetGameTimer()
    if (now - lastListPosSentAt) < CFG.listPosIntervalMs then
        return
    end

    if lastListPosX and lastListPosY then
        if math.abs(lastListPosX - x) < 0.0015 and math.abs(lastListPosY - y) < 0.0015 then
            return
        end
    end

    lastListPosX = x
    lastListPosY = y
    lastListPosSentAt = now
    NUI('updatePos', { x = x, y = y })
end

local function GetMaxViewDistance()
    return interactionCache.maxViewDistance
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

local function FindCoordTarget(playerCoords, camOrigin, camForward)
    local bestTarget = nil
    local bestScore = nil
    local candidates = {}
    local candidateCount = 0

    for _, key in ipairs(interactionCache.coordKeys) do
        local cfg = entities[key]
        if cfg and not cfg.paused and cfg.kind == 'coord' then
            local worldPoint = vector3(cfg.coords.x, cfg.coords.y, cfg.coords.z + cfg.heightOffset)
            local dx = playerCoords.x - cfg.coords.x
            local dy = playerCoords.y - cfg.coords.y
            local dz = playerCoords.z - cfg.coords.z
            local distSq = (dx * dx) + (dy * dy) + (dz * dz)
            local viewDistSq = (cfg.viewDistance or 15.0) * (cfg.viewDistance or 15.0)

            if distSq <= viewDistSq then
                local toPoint = worldPoint - camOrigin
                local forwardDot =
                    (toPoint.x * camForward.x) +
                    (toPoint.y * camForward.y) +
                    (toPoint.z * camForward.z)

                if forwardDot > 0.1 then
                    local candidateScore = distSq - (forwardDot * 0.45)

                    if candidateCount < 3 then
                        candidateCount = candidateCount + 1
                        candidates[candidateCount] = {
                            key = key,
                            cfg = cfg,
                            worldPoint = worldPoint,
                            dist = math.sqrt(distSq),
                            candidateScore = candidateScore,
                        }
                    else
                        local replaceIndex = 1
                        local replaceScore = candidates[1].candidateScore
                        for index = 2, candidateCount do
                            if candidates[index].candidateScore > replaceScore then
                                replaceIndex = index
                                replaceScore = candidates[index].candidateScore
                            end
                        end

                        if candidateScore < replaceScore then
                            candidates[replaceIndex] = {
                                key = key,
                                cfg = cfg,
                                worldPoint = worldPoint,
                                dist = math.sqrt(distSq),
                                candidateScore = candidateScore,
                            }
                        end
                    end
                end
            end
        end
    end

    for index = 1, candidateCount do
        local candidate = candidates[index]
        local visible, sx, sy = WorldToScreen(
            candidate.worldPoint.x,
            candidate.worldPoint.y,
            candidate.worldPoint.z
        )

        if visible and IsScreenPointVisible(sx, sy) then
            local dx = sx - 0.5
            local dy = sy - 0.5
            local centerScore = (dx * dx) + (dy * dy)
            local score = candidate.dist + (centerScore * 2.5)

            if not bestScore or score < bestScore then
                bestScore = score
                bestTarget = candidate.key
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
        RefreshInteractionCache()
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

    RefreshInteractionCache()
    return id
end

function FW.Interaction.RegisterCoords(coords, config)
    return FW.Interaction.Register(coords, config)
end

function FW.Interaction.Get(targetId)
    local resolvedId = targetId
    if entities[resolvedId] == nil then
        local matches = CollectMatchingTargetKeys(targetId)
        resolvedId = matches[1]
    end

    local cfg = resolvedId and entities[resolvedId]
    if not cfg then
        return nil
    end

    local data = {}
    for key, value in pairs(cfg) do
        data[key] = value
    end

    if cfg.coords then
        data.coords = vector3(cfg.coords.x, cfg.coords.y, cfg.coords.z)
    end

    data.id = resolvedId
    return data
end

function FW.Interaction.Unregister(targetId)
    local matches = CollectMatchingTargetKeys(targetId)
    if #matches == 0 then
        return false
    end

    for _, matchId in ipairs(matches) do
        entities[matchId] = nil
        if activeTarget == matchId then
            ClearActiveTarget()
        end
    end

    RefreshInteractionCache()
    return true
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

    RefreshInteractionCache()
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

function FW.Interaction.Handle(request, config)
    if request == nil then
        return nil
    end

    if type(request) ~= 'table' then
        return FW.Interaction.Register(request, config or {})
    end

    local action = request.action or request.type or request.op or 'register'

    if action == 'register' or action == 'create' then
        local target = request.target or request.entity or request.coords or request.position
        local registrationConfig = request.config or request
        return FW.Interaction.Register(target, registrationConfig)
    end

    if action == 'update' then
        local targetId = request.id or request.targetId or request.target or request.syncId
        assert(targetId ~= nil, 'FW.Interaction.Handle(update): targetId fehlt')

        local existing = FW.Interaction.Get(targetId)
        if not existing then
            return nil
        end

        local merged = {}
        for key, value in pairs(existing) do
            if key ~= 'id' and key ~= 'kind' then
                merged[key] = value
            end
        end

        local patch = request.config or request.data or request.patch or {}
        for key, value in pairs(patch) do
            merged[key] = value
        end

        local target = request.target or request.entity or request.coords or request.position
        if target == nil then
            if existing.kind == 'coord' and existing.coords then
                target = existing.coords
            else
                target = targetId
            end
        end

        if type(targetId) == 'string' and existing.kind == 'coord' then
            merged.id = targetId
        end

        FW.Interaction.Unregister(targetId)
        return FW.Interaction.Register(target, merged)
    end

    if action == 'remove' or action == 'delete' or action == 'unregister' then
        local targetId = request.id or request.targetId or request.target or request.syncId
        FW.Interaction.Unregister(targetId)
        return true
    end

    if action == 'pause' then
        local targetId = request.id or request.targetId or request.target or request.syncId
        return FW.Interaction.SetPaused(targetId, true)
    end

    if action == 'resume' then
        local targetId = request.id or request.targetId or request.target or request.syncId
        return FW.Interaction.SetPaused(targetId, false)
    end

    if action == 'setPaused' then
        local targetId = request.id or request.targetId or request.target or request.syncId
        return FW.Interaction.SetPaused(targetId, request.paused == true)
    end

    if action == 'get' then
        local targetId = request.id or request.targetId or request.target or request.syncId
        return FW.Interaction.Get(targetId)
    end

    if action == 'pauseAll' then
        FW.Interaction.PauseAll()
        return true
    end

    if action == 'resumeAll' then
        FW.Interaction.ResumeAll()
        return true
    end

    if action == 'setGlobalPaused' then
        FW.Interaction.SetGlobalPaused(request.paused == true)
        return true
    end

    error(('FW.Interaction.Handle: unbekannte action "%s"'):format(tostring(action)))
end

exports('Interaction', function(request, config)
    return FW.Interaction.Handle(request, config)
end)

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
    if globalPaused or interactionCache.targetCount == 0 then
        if activeTarget or isMenuOpen then
            ClearActiveTarget()
        end
        return 250
    end

    local target = nil
    local camOrigin = GetGameplayCamCoord()
    local camForward = GetCamForward()

    if isMenuOpen and menuMode == 'list' and menuTarget and entities[menuTarget] and not entities[menuTarget].paused then
        target = menuTarget
    else
        local rawTarget = nil
        if interactionCache.entityCount > 0 then
            rawTarget = Raycast(camOrigin, camForward, GetMaxViewDistance())
        end

        if rawTarget and entities[rawTarget] and not entities[rawTarget].paused then
            target = rawTarget
        end

        if not target then
            target = FindCoordTarget(playerCoords, camOrigin, camForward)
        end
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

    local radialOpen = isMenuOpen and menuMode == 'radial'
    SendHintState({
        visible = not radialOpen,
        x = sx,
        y = sy,
        key = cfg.keyLabel,
        inRange = inRange,
        mode = cfg.mode,
        scale = hintScale,
        morph = hintMorph,
    })

    local passiveHintOnly = not inRange and not isMenuOpen

    if cfg.mode == 'radial' then
        if blockedReopenTarget == activeTarget and not IsControlPressed(0, cfg.key) then
            blockedReopenTarget = nil
        end

        if switchedTarget and isMenuOpen then
            CloseMenu(true)
        end

        if menuMode == 'list' then
            CloseMenu(true)
        end

        if not inRange then
            holdStartAt = 0
            if isMenuOpen then
                CloseMenu()
            end
            return CFG.pointOnlyTickMs
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
                    SetRadialFocus(true)
                    if SetCursorLocation then
                        SetCursorLocation(0.5, 0.5)
                    end
                    NUI('openRadial', { options = SerializeOptions(cfg.options) })
                end
            else
                holdStartAt = 0
            end

            return 16
        end

        DisableControlAction(0, 1, true)
        DisableControlAction(0, 2, true)
        DisableControlAction(0, 24, true)
        DisableControlAction(0, 25, true)

        if IsDisabledControlJustReleased(0, cfg.key) then
            NUI('selectRadial', {})
            isMenuOpen = false
            menuMode = nil
            holdStartAt = 0
            radialMX = 0.0
            radialMY = 0.0
        end

        return 16
    end

    holdStartAt = 0

    if menuMode == 'radial' then
        CloseMenu()
    end

    if not inRange then
        if isMenuOpen then
            CloseMenu()
        end
        return CFG.pointOnlyTickMs
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
        pendingListDelta = 0
        pendingListSelect = false
        lastListRepeatAt = GetGameTimer()
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
        pendingListDelta = 0
        pendingListSelect = false
        lastListRepeatAt = GetGameTimer()
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

    if pendingListDelta ~= 0 then
        local previousIndex = listIndex
        listIndex = math.max(1, math.min(#cfg.options, listIndex + pendingListDelta))
        pendingListDelta = 0
        if listIndex ~= previousIndex then
            lastListMoveAt = GetGameTimer()
            NUI('listScroll', { index = listIndex })
        end
    end

    if pendingListSelect then
        pendingListSelect = false
        NUI('selectList', { index = listIndex })
    end

    if passiveHintOnly then
        return CFG.pointOnlyTickMs
    end

    if isMenuOpen and menuMode == 'list' then
        return CFG.listVisualTickMs
    end

    return 16
end

CreateThread(function()
    while not FW.Client or not FW.Client.RegisterNearbyTick do
        Wait(50)
    end

    FW.Client.RegisterNearbyTick('interaction', ProcessInteractionTick)
end)

CreateThread(function()
    while true do
        if not (isMenuOpen and menuMode == 'list' and menuTarget) then
            Wait(120)
        else
            local cfg = entities[menuTarget]
            if not cfg or cfg.paused then
                Wait(50)
            else
                DisableControlAction(0, 241, true)
                DisableControlAction(0, 242, true)
                DisableControlAction(0, 172, true)
                DisableControlAction(0, 173, true)

                local now = GetGameTimer()
                local moved = false

                local scrollUpTap =
                    IsDisabledControlJustPressed(0, 241) or
                    IsControlJustPressed(0, 241) or
                    IsDisabledControlJustPressed(0, 172) or
                    IsControlJustPressed(0, 172)

                local scrollDownTap =
                    IsDisabledControlJustPressed(0, 242) or
                    IsControlJustPressed(0, 242) or
                    IsDisabledControlJustPressed(0, 173) or
                    IsControlJustPressed(0, 173)

                if scrollUpTap then
                    pendingListDelta = pendingListDelta - 1
                    lastListRepeatAt = now
                    moved = true
                elseif scrollDownTap then
                    pendingListDelta = pendingListDelta + 1
                    lastListRepeatAt = now
                    moved = true
                elseif (now - lastListRepeatAt) >= CFG.listRepeatDelayMs then
                    if (IsDisabledControlPressed(0, 172) or IsControlPressed(0, 172)) then
                        pendingListDelta = pendingListDelta - 1
                        lastListRepeatAt = now
                        moved = true
                    elseif (IsDisabledControlPressed(0, 173) or IsControlPressed(0, 173)) then
                        pendingListDelta = pendingListDelta + 1
                        lastListRepeatAt = now
                        moved = true
                    end
                end

                if moved and pendingListDelta > 2 then
                    pendingListDelta = 2
                elseif moved and pendingListDelta < -2 then
                    pendingListDelta = -2
                end

                if
                    IsDisabledControlJustReleased(0, cfg.key) or
                    IsControlJustReleased(0, cfg.key)
                then
                    pendingListSelect = true
                end

                Wait(0)
            end
        end
    end
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
