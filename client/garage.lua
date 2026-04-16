local trackedGarageVehicles = {}
local isGarageOpen = false

local function findVehicleByPlate(plate)
    local pool = GetGamePool('CVehicle')
    for i = 1, #pool do
        local vehicle = pool[i]
        if DoesEntityExist(vehicle) and string.upper(GetVehicleNumberPlateText(vehicle) or '') == string.upper(plate or '') then
            return vehicle
        end
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
        TriggerEvent('FW:Notify', 'Kein passendes Fahrzeug gefunden.', 'error')
        return false
    end

    local plate = GetVehicleNumberPlateText(vehicle)
    if targetPlate and string.upper(plate or '') ~= string.upper(targetPlate) then
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

    SetEntityAsMissionEntity(vehicle, true, true)
    DeleteVehicle(vehicle)
    trackedGarageVehicles[string.upper(plate)] = nil
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

RegisterNetEvent('fw:garage:spawnVehicleClient', function(data)
    if type(data) ~= 'table' then return end

    local model = type(data.model) == 'number' and data.model or joaat(data.model)
    if not IsModelInCdimage(model) then
        TriggerEvent('FW:Notify', 'Fahrzeugmodell ist ungültig.', 'error')
        return
    end

    RequestModel(model)
    while not HasModelLoaded(model) do
        Wait(0)
    end

    local coords = data.coords or {}
    local x = coords.x or -42.25
    local y = coords.y or -1098.88
    local z = coords.z or 26.42
    local heading = data.heading or coords.heading or 90.0

    local vehicle = CreateVehicle(model, x, y, z, heading, true, false)
    if vehicle == 0 then
        TriggerEvent('FW:Notify', 'Fahrzeug konnte nicht gespawnt werden.', 'error')
        SetModelAsNoLongerNeeded(model)
        return
    end

    SetVehicleOnGroundProperly(vehicle)
    SetPedIntoVehicle(PlayerPedId(), vehicle, -1)

    if data.props then
        SetVehicleNumberPlateText(vehicle, data.props.plate or data.plate)
        SetVehicleFuelLevel(vehicle, (data.props.fuel or 100.0) + 0.0)
        SetVehicleEngineHealth(vehicle, (data.props.engineHealth or 1000.0) + 0.0)
        SetVehicleBodyHealth(vehicle, (data.props.bodyHealth or 1000.0) + 0.0)
        SetVehicleDirtLevel(vehicle, (data.props.dirtLevel or 0.0) + 0.0)
    else
        SetVehicleNumberPlateText(vehicle, data.plate)
    end

    local netId = NetworkGetNetworkIdFromEntity(vehicle)
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

    SetModelAsNoLongerNeeded(model)
end)

RegisterNetEvent('fw:garage:storedVehicle', function(plate)
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
