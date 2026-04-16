local trackedGarageVehicles = {}
local isGarageOpen = false

local function normalizePlate(value)
    return string.upper((tostring(value or ''):gsub('^%s*(.-)%s*$', '%1')))
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

    local coords = GetEntityCoords(vehicle)
    local props = {
        plate = plate,
        fuel = GetVehicleFuelLevel(vehicle),
        engineHealth = GetVehicleEngineHealth(vehicle),
        bodyHealth = GetVehicleBodyHealth(vehicle),
        dirtLevel = GetVehicleDirtLevel(vehicle),
        heading = GetEntityHeading(vehicle),
        coords = { x = coords.x, y = coords.y, z = coords.z }
    }

    TriggerServerEvent('fw:garage:storeVehicle', plate, props)
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
    print('[FW.Garage][Client] NUI requested vehicles')
    FW.TriggerCallback('fw:garage:getVehicles', function(vehicles)
        print(('[FW.Garage][Client] Callback returned %s vehicles'):format(type(vehicles) == 'table' and #vehicles or 0))
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

RegisterNetEvent('fw:garage:spawnVehicleClient', function(data)
    if type(data) ~= 'table' then return end

    local ped = PlayerPedId()
    if ped == 0 then return end

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
    local x = tonumber(coords.x) or -42.25
    local y = tonumber(coords.y) or -1098.88
    local z = tonumber(coords.z) or 26.42
    local heading = tonumber(data.heading) or tonumber(coords.w) or tonumber(coords.heading) or GetEntityHeading(ped)

    local spawnX = x
    local spawnY = y
    local spawnZ = z

    if not coords.x or not coords.y or not coords.z then
        local pedCoords = GetEntityCoords(ped)
        local forward = GetEntityForwardVector(ped)
        spawnX = pedCoords.x + (forward.x * 4.0)
        spawnY = pedCoords.y + (forward.y * 4.0)
        spawnZ = pedCoords.z + 1.0
    end

    local vehicle = CreateVehicle(modelHash, spawnX, spawnY, spawnZ, heading, true, false)
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

    local vehicleCoords = GetEntityCoords(vehicle)
    trackedGarageVehicles[string.upper(data.plate)] = netId

    TriggerServerEvent('fw:garage:vehicleSpawned', data.plate, netId, {
        x = vehicleCoords.x,
        y = vehicleCoords.y,
        z = vehicleCoords.z,
        heading = GetEntityHeading(vehicle)
    }, {
        plate = GetVehicleNumberPlateText(vehicle),
        fuel = GetVehicleFuelLevel(vehicle),
        engineHealth = GetVehicleEngineHealth(vehicle),
        bodyHealth = GetVehicleBodyHealth(vehicle),
        dirtLevel = GetVehicleDirtLevel(vehicle),
        heading = GetEntityHeading(vehicle)
    })

    SetModelAsNoLongerNeeded(modelHash)
end)

RegisterNetEvent('fw:garage:storedVehicle', function(plate)
    local vehicle = findVehicleByPlate(plate)
    if vehicle ~= 0 then
        SetEntityAsMissionEntity(vehicle, true, true)
        DeleteVehicle(vehicle)
    end
    trackedGarageVehicles[string.upper(plate)] = nil
end)

RegisterNetEvent('fw:garage:deleteSpawnedVehicle', function(plate)
    local vehicle = findVehicleByPlate(plate)
    if vehicle ~= 0 then
        SetEntityAsMissionEntity(vehicle, true, true)
        DeleteVehicle(vehicle)
    end
    trackedGarageVehicles[string.upper(plate)] = nil
end)

RegisterCommand('garage', function()
    print('[FW.Garage][Client] /garage invoked')
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
    print(('[FW.Garage][Client] Checking ownership for plate "%s"'):format(plate))

    FW.TriggerCallback('fw:garage:ownsVehicle', function(owns)
        print(('[FW.Garage][Client] Ownership callback for %s -> %s'):format(plate, tostring(owns)))
        if owns then
            TriggerEvent('FW:Notify', ('Du besitzt das Fahrzeug %s.'):format(plate), 'success')
        else
            TriggerEvent('FW:Notify', ('Du besitzt das Fahrzeug %s nicht.'):format(plate), 'error')
        end
    end, plate)
end, false)

exports('OpenGarage', OpenGarage)
