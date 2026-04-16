local trackedGarageVehicles = {}
local isGarageOpen = false
local hydratedOutsideVehicles = {}
local outsideVehicleEntities = {}
local outsideVehicleLastSync = {}

local OUTSIDE_SYNC_DISTANCE_THRESHOLD = 4.0
local OUTSIDE_SYNC_HEADING_THRESHOLD = 20.0
local OUTSIDE_SYNC_INTERVAL_MS = 15000
local OUTSIDE_MONITOR_INTERVAL_MS = 2000

local function normalizePlate(value)
    return string.upper((tostring(value or ''):gsub('^%s*(.-)%s*$', '%1')))
end

local function collectVehicleState(vehicle)
    local coords = GetEntityCoords(vehicle)
    return {
        coords = {
            x = coords.x,
            y = coords.y,
            z = coords.z,
            heading = GetEntityHeading(vehicle)
        },
        props = {
            plate = GetVehicleNumberPlateText(vehicle),
            fuel = GetVehicleFuelLevel(vehicle),
            engineHealth = GetVehicleEngineHealth(vehicle),
            bodyHealth = GetVehicleBodyHealth(vehicle),
            dirtLevel = GetVehicleDirtLevel(vehicle),
            heading = GetEntityHeading(vehicle)
        }
    }
end

local function clearTrackedVehicle(plate)
    local plateKey = normalizePlate(plate)
    if plateKey == '' then return end
    trackedGarageVehicles[plateKey] = nil
    outsideVehicleEntities[plateKey] = nil
    outsideVehicleLastSync[plateKey] = nil
    hydratedOutsideVehicles[plateKey] = nil
end

local function rememberTrackedVehicle(plate, vehicle, state)
    local plateKey = normalizePlate(plate)
    if plateKey == '' or not vehicle or not DoesEntityExist(vehicle) then return end
    trackedGarageVehicles[plateKey] = NetworkGetNetworkIdFromEntity(vehicle)
    outsideVehicleEntities[plateKey] = vehicle
    outsideVehicleLastSync[plateKey] = state and state.coords or collectVehicleState(vehicle).coords
end

local function findVehicleByPlate(plate)
    local targetPlate = normalizePlate(plate)
    local ped = PlayerPedId()
    local pedCoords = GetEntityCoords(ped)
    local closestVehicle = 0
    local closestDistance = 9999.0

    local pool = GetGamePool('CVehicle')
    for i = 1, #pool do
        local vehicle = pool[i]
        if DoesEntityExist(vehicle) then
            local vehiclePlate = normalizePlate(GetVehicleNumberPlateText(vehicle))
            if vehiclePlate == targetPlate then
                local vehicleCoords = GetEntityCoords(vehicle)
                local distance = #(pedCoords - vehicleCoords)
                if distance < closestDistance then
                    closestDistance = distance
                    closestVehicle = vehicle
                end
            end
        end
    end

    if closestVehicle ~= 0 and closestDistance <= 15.0 then
        return closestVehicle
    end

    return 0
end

local function OpenGarage()
    if isGarageOpen then return end
    if exports['fw_core']:IsAnyUIOpen() then return end

    isGarageOpen = true
    SendNUIMessage({
        action = 'openGarage'
    })
    exports['fw_core']:RegisterUIOpen('garage', true)
end

local function CloseGarage()
    if not isGarageOpen then return end
    isGarageOpen = false
    SendNUIMessage({ action = 'closeUI' })
    exports['fw_core']:RegisterUIClose('garage')
end

local function storeCurrentVehicle(targetPlate)
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)

    if vehicle == 0 then
        vehicle = findVehicleByPlate(targetPlate)
    end

    if vehicle == 0 then
        TriggerEvent('FW:Notify', 'Kein passendes Fahrzeug in deiner Nähe gefunden.', 'error')
        return false
    end

    local plate = GetVehicleNumberPlateText(vehicle)
    if targetPlate and normalizePlate(plate) ~= normalizePlate(targetPlate) then
        TriggerEvent('FW:Notify', 'Das gewählte Fahrzeug ist nicht in deiner Nähe.', 'error')
        return false
    end

    local state = collectVehicleState(vehicle)
    TriggerServerEvent('fw:garage:storeVehicle', plate, state.props)
    return true
end

RegisterNUICallback('closeGarage', function(_, cb)
    CloseGarage()
    cb({ ok = true })
end)

RegisterNUICallback('closeUI', function(_, cb)
    CloseGarage()
    cb({ ok = true })
end)

RegisterNUICallback('garage:getVehicles', function(_, cb)
    FW.TriggerCallback('fw:garage:getVehicles', function(vehicles)
        cb({ vehicles = vehicles })
    end)
end)

RegisterNUICallback('garage:spawnVehicle', function(data, cb)
    TriggerServerEvent('fw:garage:spawnVehicle', data.plate)
    CloseGarage()
    cb('ok')
end)

RegisterNUICallback('garage:storeVehicle', function(data, cb)
    local success = storeCurrentVehicle(data.plate)
    cb(success and 'ok' or 'error')
end)

local DEFAULT_TIMEOUT_MS = 5000

local function loadVehicleModel(modelHash, timeoutMs)
    timeoutMs = timeoutMs or DEFAULT_TIMEOUT_MS
    local startedAt = GetGameTimer()

    RequestModel(modelHash)
    while not HasModelLoaded(modelHash) do
        if GetGameTimer() - startedAt > timeoutMs then
            return false
        end
        Wait(0)
    end

    return true
end

local function ensureGroundedVehicle(vehicle)
    local attempts = 0
    while attempts < 100 do
        if DoesEntityExist(vehicle) and HasCollisionLoadedAroundEntity(vehicle) then
            return true
        end
        Wait(50)
        attempts = attempts + 1
    end
    return DoesEntityExist(vehicle)
end

local function spawnGarageVehicle(data, isHydration)
    if type(data) ~= 'table' then return end

    local ped = PlayerPedId()
    if ped == 0 then return end

    local plateKey = normalizePlate(data.plate)
    if plateKey == '' then return end

    local existingVehicle = outsideVehicleEntities[plateKey]
    if existingVehicle and DoesEntityExist(existingVehicle) then
        return
    end

    local modelName = tostring(data.model or 'adder')
    local modelHash = type(data.model) == 'number' and data.model or joaat(modelName)

    if not IsModelInCdimage(modelHash) or not IsModelAVehicle(modelHash) then
        TriggerEvent('FW:Notify', ('Ungültiges Fahrzeugmodell: %s'):format(modelName), 'error')
        return
    end

    if not loadVehicleModel(modelHash, DEFAULT_TIMEOUT_MS) then
        TriggerEvent('FW:Notify', ('Modell konnte nicht geladen werden: %s'):format(modelName), 'error')
        return
    end

    local coords = data.coords or {}
    local x = tonumber(coords.x)
    local y = tonumber(coords.y)
    local z = tonumber(coords.z)
    local heading = tonumber(data.heading) or tonumber(coords.w) or tonumber(coords.heading) or GetEntityHeading(ped)

    if not x or not y or not z then
        local pedCoords = GetEntityCoords(ped)
        local forward = GetEntityForwardVector(ped)
        x = pedCoords.x + (forward.x * 4.0)
        y = pedCoords.y + (forward.y * 4.0)
        z = pedCoords.z + 1.0
    end

    local vehicle = CreateVehicle(modelHash, x, y, z, heading, true, false)
    if not DoesEntityExist(vehicle) then
        SetModelAsNoLongerNeeded(modelHash)
        TriggerEvent('FW:Notify', 'Fahrzeug konnte nicht erstellt werden.', 'error')
        return
    end

    SetVehicleOnGroundProperly(vehicle)
    SetEntityAsMissionEntity(vehicle, true, true)
    SetVehicleHasBeenOwnedByPlayer(vehicle, true)
    SetVehRadioStation(vehicle, 'OFF')
    SetVehicleEngineOn(vehicle, true, true, false)
    SetVehicleDoorsLocked(vehicle, 1)

    ensureGroundedVehicle(vehicle)

    local netId = NetworkGetNetworkIdFromEntity(vehicle)
    SetNetworkIdCanMigrate(netId, true)
    SetNetworkIdExistsOnAllMachines(netId, true)

    if data.props then
        SetVehicleNumberPlateText(vehicle, data.props.plate or data.plate)
        SetVehicleFuelLevel(vehicle, (data.props.fuel or 100.0) + 0.0)
        SetVehicleEngineHealth(vehicle, (data.props.engineHealth or 1000.0) + 0.0)
        SetVehicleBodyHealth(vehicle, (data.props.bodyHealth or 1000.0) + 0.0)
        SetVehicleDirtLevel(vehicle, (data.props.dirtLevel or 0.0) + 0.0)
    else
        SetVehicleNumberPlateText(vehicle, data.plate)
    end

    TaskWarpPedIntoVehicle(ped, vehicle, -1)
    local startedAt = GetGameTimer()
    while GetVehiclePedIsIn(ped, false) ~= vehicle and (GetGameTimer() - startedAt) < 2000 do
        TaskWarpPedIntoVehicle(ped, vehicle, -1)
        Wait(50)
    end
    if GetVehiclePedIsIn(ped, false) ~= vehicle then
        SetPedIntoVehicle(ped, vehicle, -1)
    end

    local state = collectVehicleState(vehicle)
    rememberTrackedVehicle(data.plate, vehicle, state)

    if not isHydration then
        TriggerServerEvent('fw:garage:vehicleSpawned', data.plate, netId, state.coords, state.props)
    end

    SetModelAsNoLongerNeeded(modelHash)
end

RegisterNetEvent('fw:garage:spawnVehicleClient', function(data)
    spawnGarageVehicle(data, false)
end)

RegisterNetEvent('fw:garage:spawnPersistedOutsideVehicles', function(vehicles)
    vehicles = vehicles or {}
    for _, vehicle in ipairs(vehicles) do
        local plateKey = normalizePlate(vehicle.plate)
        if plateKey ~= '' and not hydratedOutsideVehicles[plateKey] and not outsideVehicleEntities[plateKey] then
            hydratedOutsideVehicles[plateKey] = true
            spawnGarageVehicle({
                plate = vehicle.plate,
                model = vehicle.vehicle_model,
                props = vehicle.props,
                coords = vehicle.position or {},
                heading = vehicle.position and vehicle.position.heading or (vehicle.props and vehicle.props.heading) or 0.0
            }, true)
        end
    end
end)

RegisterNetEvent('fw:garage:storedVehicle', function(plate)
    local vehicle = findVehicleByPlate(plate)
    if vehicle ~= 0 then
        SetEntityAsMissionEntity(vehicle, true, true)
        DeleteVehicle(vehicle)
    end
    clearTrackedVehicle(plate)
end)

RegisterNetEvent('fw:garage:deleteSpawnedVehicle', function(plate)
    local vehicle = findVehicleByPlate(plate)
    if vehicle ~= 0 then
        SetEntityAsMissionEntity(vehicle, true, true)
        DeleteVehicle(vehicle)
    end
    clearTrackedVehicle(plate)
end)

RegisterCommand('garage', function()
    OpenGarage()
end, false)

RegisterNetEvent('fw:client:closeGarage', function()
    CloseGarage()
end)

RegisterCommand('parkvehicle', function(_, args)
    local success = storeCurrentVehicle(args[1])
    if success then
        TriggerEvent('FW:Notify', 'Fahrzeug wurde eingeparkt.', 'success')
    end
end, false)

RegisterCommand('garageowns', function(_, args)
    local plate = args[1]
    if not plate then
        local ped = PlayerPedId()
        local vehicle = GetVehiclePedIsIn(ped, false)
        if vehicle ~= 0 then
            plate = GetVehicleNumberPlateText(vehicle)
        end
    end

    if not plate then
        TriggerEvent('FW:Notify', 'Benutzung: /garageowns [plate]', 'error')
        return
    end

    plate = tostring(plate):match('^%s*(.-)%s*$')
    FW.TriggerCallback('fw:garage:ownsVehicle', function(owns)
        if owns then
            TriggerEvent('FW:Notify', ('Du besitzt das Fahrzeug %s.'):format(plate), 'success')
        else
            TriggerEvent('FW:Notify', ('Du besitzt das Fahrzeug %s nicht.'):format(plate), 'error')
        end
    end, plate)
end, false)

local function requestOutsideVehiclesHydration(forceReset)
    if forceReset then
        hydratedOutsideVehicles = {}
    end
    TriggerServerEvent('fw:garage:requestOutsideVehicles')
end

AddEventHandler('onClientResourceStart', function(resourceName)
    if resourceName ~= GetCurrentResourceName() then return end
    Wait(2000)
    requestOutsideVehiclesHydration(false)
end)

RegisterNetEvent('FW:playerLoaded', function()
    Wait(2000)
    requestOutsideVehiclesHydration(true)
end)

local function shouldSyncOutsideVehicle(plateKey, coords)
    local last = outsideVehicleLastSync[plateKey]
    if not last then return true end

    local dx = (coords.x or 0.0) - (last.x or 0.0)
    local dy = (coords.y or 0.0) - (last.y or 0.0)
    local dz = (coords.z or 0.0) - (last.z or 0.0)
    local distance = math.sqrt((dx * dx) + (dy * dy) + (dz * dz))
    local headingDelta = math.abs((coords.heading or 0.0) - (last.heading or 0.0))

    return distance >= OUTSIDE_SYNC_DISTANCE_THRESHOLD or headingDelta >= OUTSIDE_SYNC_HEADING_THRESHOLD
end

local function syncOutsideVehicleNow(plateKey, vehicle)
    if not vehicle or not DoesEntityExist(vehicle) then
        clearTrackedVehicle(plateKey)
        return false
    end

    local state = collectVehicleState(vehicle)
    outsideVehicleLastSync[plateKey] = state.coords
    TriggerServerEvent('fw:garage:updateOutsideVehicleState', plateKey, state.coords, state.props)
    return true
end

local function eachTrackedOutsideVehicle(callback)
    for plateKey, vehicle in pairs(outsideVehicleEntities) do
        callback(plateKey, vehicle)
    end
end

local function runOutsideVehicleSyncTick()
    eachTrackedOutsideVehicle(function(plateKey, vehicle)
        if vehicle and DoesEntityExist(vehicle) then
            local state = collectVehicleState(vehicle)
            if shouldSyncOutsideVehicle(plateKey, state.coords) then
                outsideVehicleLastSync[plateKey] = state.coords
                TriggerServerEvent('fw:garage:updateOutsideVehicleState', plateKey, state.coords, state.props)
            end
        else
            clearTrackedVehicle(plateKey)
        end
    end)
end

local function runOutsideVehicleMonitorTick()
    eachTrackedOutsideVehicle(function(plateKey, vehicle)
        if not vehicle or not DoesEntityExist(vehicle) then
            clearTrackedVehicle(plateKey)
            return
        end

        local networkOwner = NetworkGetEntityOwner(vehicle)
        if networkOwner == PlayerId() then
            local state = collectVehicleState(vehicle)
            if shouldSyncOutsideVehicle(plateKey, state.coords) then
                TriggerServerEvent('fw:garage:updateOutsideVehicleState', plateKey, state.coords, state.props)
                outsideVehicleLastSync[plateKey] = state.coords
            end
        end
    end)
end

CreateThread(function()
    while true do
        Wait(OUTSIDE_SYNC_INTERVAL_MS)
        runOutsideVehicleSyncTick()
    end
end)

CreateThread(function()
    while true do
        Wait(OUTSIDE_MONITOR_INTERVAL_MS)
        runOutsideVehicleMonitorTick()
    end
end)

AddEventHandler('onClientResourceStop', function(resourceName)
    if resourceName ~= GetCurrentResourceName() then return end
    eachTrackedOutsideVehicle(function(plateKey, vehicle)
        syncOutsideVehicleNow(plateKey, vehicle)
    end)
end)

AddEventHandler('gameEventTriggered', function(name)
    if name ~= 'CEventNetworkPlayerEnteredVehicle' and name ~= 'CEventNetworkPlayerExitedVehicle' then
        return
    end

    local ped = PlayerPedId()
    if not ped or ped == 0 then return end

    local vehicle = GetVehiclePedIsIn(ped, false)
    if vehicle == 0 then
        vehicle = GetVehiclePedIsTryingToEnter(ped)
    end
    if vehicle == 0 or not DoesEntityExist(vehicle) then return end

    local plateKey = normalizePlate(GetVehicleNumberPlateText(vehicle))
    if plateKey ~= '' and outsideVehicleEntities[plateKey] then
        syncOutsideVehicleNow(plateKey, vehicle)
    end
end)

exports('OpenGarage', OpenGarage)
