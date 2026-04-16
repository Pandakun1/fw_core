FW = FW or {}
FW.Garage = FW.Garage or {}

local RESOURCE_NAME = GetCurrentResourceName()
local DEFAULT_SPAWN_OFFSET = vector3(3.0, 0.0, 0.0)
local DEFAULT_GARAGE_POSITION = vector3(-42.25, -1098.88, 26.42)

local function round(value, decimals)
    local power = 10 ^ (decimals or 0)
    return math.floor((value * power) + 0.5) / power
end

local function decodeJson(value, fallback)
    if type(value) == 'table' then return value end
    if type(value) ~= 'string' or value == '' then return fallback end
    local ok, decoded = pcall(json.decode, value)
    if ok and decoded ~= nil then
        return decoded
    end
    return fallback
end

local function encodeJson(value)
    local ok, encoded = pcall(json.encode, value)
    if ok then
        return encoded
    end
    return '{}'
end

local function getPlayerIdentifier(src)
    local player = FW.GetPlayer and FW.GetPlayer(src)
    if player and player.identifier and player.identifier ~= '' then
        return player.identifier
    end

    local identifiers = GetPlayerIdentifiers(src)
    return identifiers and identifiers[1] or nil
end

local function getVehicleDisplayName(model)
    if not model or model == '' then return 'Unbekannt' end
    local label = GetDisplayNameFromVehicleModel(type(model) == 'number' and model or joaat(model))
    if label and label ~= 'NULL' and label ~= '' then
        local text = GetLabelText(label)
        if text and text ~= 'NULL' and text ~= '' then
            return text
        end
        return label
    end
    return tostring(model)
end

local function getVehicleProperties(entity)
    if not entity or entity == 0 or not DoesEntityExist(entity) then return nil end

    local coords = GetEntityCoords(entity)
    return {
        model = GetEntityModel(entity),
        plate = GetVehicleNumberPlateText(entity),
        fuel = round(GetVehicleFuelLevel(entity), 1),
        engineHealth = round(GetVehicleEngineHealth(entity), 1),
        bodyHealth = round(GetVehicleBodyHealth(entity), 1),
        dirtLevel = round(GetVehicleDirtLevel(entity), 1),
        heading = round(GetEntityHeading(entity), 2),
        coords = {
            x = round(coords.x, 3),
            y = round(coords.y, 3),
            z = round(coords.z, 3)
        },
        colors = {
            primary = select(1, GetVehicleColours(entity)),
            secondary = select(2, GetVehicleColours(entity))
        }
    }
end

local function applyVehicleProperties(entity, props)
    if not entity or entity == 0 or not DoesEntityExist(entity) or type(props) ~= 'table' then return end

    if props.plate then
        SetVehicleNumberPlateText(entity, props.plate)
    end

    if props.fuel then
        SetVehicleFuelLevel(entity, props.fuel + 0.0)
    end

    if props.engineHealth then
        SetVehicleEngineHealth(entity, props.engineHealth + 0.0)
    end

    if props.bodyHealth then
        SetVehicleBodyHealth(entity, props.bodyHealth + 0.0)
    end

    if props.dirtLevel then
        SetVehicleDirtLevel(entity, props.dirtLevel + 0.0)
    end

    if props.colors then
        SetVehicleColours(entity, props.colors.primary or 0, props.colors.secondary or 0)
    end
end

function FW.Garage.SetupTables()
    MySQL.query([[ 
        CREATE TABLE IF NOT EXISTS player_vehicles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            owner_identifier VARCHAR(64) NOT NULL,
            plate VARCHAR(16) NOT NULL UNIQUE,
            vehicle_model VARCHAR(64) NOT NULL,
            vehicle_label VARCHAR(128) DEFAULT NULL,
            state VARCHAR(16) NOT NULL DEFAULT 'stored',
            stored_at_garage VARCHAR(64) DEFAULT 'main_garage',
            last_coords LONGTEXT DEFAULT NULL,
            vehicle_props LONGTEXT DEFAULT NULL,
            spawned_net_id INT DEFAULT NULL,
            owned TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_owner_state (owner_identifier, state),
            CONSTRAINT fk_player_vehicles_owner FOREIGN KEY (owner_identifier) REFERENCES players(identifier) ON DELETE CASCADE
        ) ENGINE=InnoDB
    ]], {}, function()
        FW.Debug('Garage', 'player_vehicles table created or exists')
    end)
end

AddEventHandler('onResourceStart', function(resourceName)
    if resourceName ~= RESOURCE_NAME then return end
    FW.Garage.SetupTables()
end)

function FW.Garage.GetVehiclesByOwner(identifier, cb)
    MySQL.query('SELECT * FROM player_vehicles WHERE owner_identifier = ? ORDER BY updated_at DESC', { identifier }, function(rows)
        rows = rows or {}
        for _, row in ipairs(rows) do
            row.owned = row.owned == 1
            row.stored = row.state == 'stored'
            row.fuel = 100

            local props = decodeJson(row.vehicle_props, {})
            local coords = decodeJson(row.last_coords, nil)

            row.props = props
            row.position = coords
            row.model = row.vehicle_label or getVehicleDisplayName(row.vehicle_model)
            row.vehicleModel = row.vehicle_model
            row.fuel = props.fuel or row.fuel
        end
        cb(rows)
    end)
end

function FW.Garage.GetVehicleByPlate(plate, cb)
    MySQL.single('SELECT * FROM player_vehicles WHERE plate = ? LIMIT 1', { plate }, function(row)
        if row then
            row.owned = row.owned == 1
            row.stored = row.state == 'stored'
            row.props = decodeJson(row.vehicle_props, {})
            row.position = decodeJson(row.last_coords, nil)
        end
        cb(row)
    end)
end

function FW.Garage.SaveVehicle(identifier, data, cb)
    local props = data.props or {}
    local coords = data.coords or nil
    local state = data.state or 'stored'

    MySQL.insert([[ 
        INSERT INTO player_vehicles
            (owner_identifier, plate, vehicle_model, vehicle_label, state, stored_at_garage, last_coords, vehicle_props, spawned_net_id, owned)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
            owner_identifier = VALUES(owner_identifier),
            vehicle_model = VALUES(vehicle_model),
            vehicle_label = VALUES(vehicle_label),
            state = VALUES(state),
            stored_at_garage = VALUES(stored_at_garage),
            last_coords = VALUES(last_coords),
            vehicle_props = VALUES(vehicle_props),
            spawned_net_id = VALUES(spawned_net_id),
            owned = VALUES(owned)
    ]], {
        identifier,
        data.plate,
        tostring(data.model or 'adder'),
        data.label or getVehicleDisplayName(data.model or 'adder'),
        state,
        data.garage or 'main_garage',
        coords and encodeJson(coords) or nil,
        encodeJson(props),
        data.netId or nil
    }, function(result)
        if cb then cb(result) end
    end)
end

function FW.Garage.UpdateVehicleState(plate, state, coords, props, netId, cb)
    MySQL.update([[ 
        UPDATE player_vehicles
        SET state = ?,
            last_coords = ?,
            vehicle_props = ?,
            spawned_net_id = ?
        WHERE plate = ?
    ]], {
        state,
        coords and encodeJson(coords) or nil,
        encodeJson(props or {}),
        netId,
        plate
    }, function(affectedRows)
        if cb then cb(affectedRows or 0) end
    end)
end

function FW.Garage.DeleteVehicle(plate, identifier, cb)
    MySQL.update('DELETE FROM player_vehicles WHERE plate = ? AND owner_identifier = ?', { plate, identifier }, function(affectedRows)
        if cb then cb(affectedRows or 0) end
    end)
end

FW.RegisterServerCallback('fw:garage:getVehicles', function(src, cb)
    local identifier = getPlayerIdentifier(src)
    if not identifier then
        cb({})
        return
    end

    FW.Garage.GetVehiclesByOwner(identifier, cb)
end)

FW.RegisterServerCallback('fw:garage:ownsVehicle', function(src, cb, plate)
    local identifier = getPlayerIdentifier(src)
    if not identifier or not plate then
        cb(false)
        return
    end

    FW.Garage.GetVehicleByPlate(plate, function(vehicle)
        cb(vehicle ~= nil and vehicle.owner_identifier == identifier and vehicle.owned == true)
    end)
end)

RegisterNetEvent('fw:garage:storeVehicle', function(plate, props)
    local src = source
    local identifier = getPlayerIdentifier(src)
    if not identifier or not plate then return end

    FW.Garage.GetVehicleByPlate(plate, function(vehicle)
        if not vehicle or vehicle.owner_identifier ~= identifier then
            TriggerClientEvent('FW:Notify', src, 'Dieses Fahrzeug gehört dir nicht.', 'error')
            return
        end

        FW.Garage.UpdateVehicleState(plate, 'stored', nil, props or vehicle.props or {}, nil, function(affectedRows)
            if affectedRows > 0 then
                TriggerClientEvent('fw:garage:storedVehicle', src, plate)
                TriggerClientEvent('FW:Notify', src, ('Fahrzeug %s wurde eingeparkt.'):format(plate), 'success')
            else
                TriggerClientEvent('FW:Notify', src, 'Fahrzeug konnte nicht eingeparkt werden.', 'error')
            end
        end)
    end)
end)

RegisterNetEvent('fw:garage:spawnVehicle', function(plate)
    local src = source
    local identifier = getPlayerIdentifier(src)
    if not identifier or not plate then return end

    FW.Garage.GetVehicleByPlate(plate, function(vehicle)
        if not vehicle or vehicle.owner_identifier ~= identifier then
            TriggerClientEvent('FW:Notify', src, 'Dieses Fahrzeug gehört dir nicht.', 'error')
            return
        end

        if vehicle.state ~= 'stored' then
            TriggerClientEvent('FW:Notify', src, 'Dieses Fahrzeug ist bereits ausgeparkt.', 'error')
            return
        end

        local props = vehicle.props or {}
        local spawnCoords = vehicle.position or {
            x = DEFAULT_GARAGE_POSITION.x + DEFAULT_SPAWN_OFFSET.x,
            y = DEFAULT_GARAGE_POSITION.y + DEFAULT_SPAWN_OFFSET.y,
            z = DEFAULT_GARAGE_POSITION.z + DEFAULT_SPAWN_OFFSET.z,
            heading = props.heading or 90.0
        }

        TriggerClientEvent('fw:garage:spawnVehicleClient', src, {
            plate = plate,
            model = vehicle.vehicle_model,
            props = props,
            coords = spawnCoords,
            heading = spawnCoords.heading or props.heading or 90.0
        })
    end)
end)

RegisterNetEvent('fw:garage:vehicleSpawned', function(plate, netId, coords, props)
    local src = source
    local identifier = getPlayerIdentifier(src)
    if not identifier or not plate then return end

    FW.Garage.GetVehicleByPlate(plate, function(vehicle)
        if not vehicle or vehicle.owner_identifier ~= identifier then return end
        FW.Garage.UpdateVehicleState(plate, 'outside', coords, props, netId, function() end)
        TriggerClientEvent('FW:Notify', src, ('Fahrzeug %s wurde ausgeparkt.'):format(plate), 'success')
    end)
end)

RegisterNetEvent('fw:garage:test:createOwnedVehicle', function(model)
    local src = source
    local identifier = getPlayerIdentifier(src)
    if not identifier then return end

    local modelName = tostring(model or 'adder')
    local plate = ('TST%03d'):format(math.random(100, 999))

    FW.Garage.SaveVehicle(identifier, {
        plate = plate,
        model = modelName,
        label = getVehicleDisplayName(modelName),
        state = 'stored',
        props = {
            plate = plate,
            fuel = 100.0,
            engineHealth = 1000.0,
            bodyHealth = 1000.0,
            dirtLevel = 0.0,
            heading = 90.0
        }
    }, function()
        TriggerClientEvent('FW:Notify', src, ('Testfahrzeug %s (%s) erstellt.'):format(plate, modelName), 'success')
    end)
end)

RegisterNetEvent('fw:garage:test:removeOwnedVehicle', function(plate)
    local src = source
    local identifier = getPlayerIdentifier(src)
    if not identifier or not plate then return end

    FW.Garage.GetVehicleByPlate(plate, function(vehicle)
        if not vehicle or vehicle.owner_identifier ~= identifier then
            TriggerClientEvent('FW:Notify', src, 'Testfahrzeug nicht gefunden.', 'error')
            return
        end

        FW.Garage.DeleteVehicle(plate, identifier, function(affectedRows)
            if affectedRows > 0 then
                TriggerClientEvent('fw:garage:deleteSpawnedVehicle', src, plate)
                TriggerClientEvent('FW:Notify', src, ('Fahrzeug %s entfernt.'):format(plate), 'success')
            else
                TriggerClientEvent('FW:Notify', src, 'Fahrzeug konnte nicht entfernt werden.', 'error')
            end
        end)
    end)
end)

RegisterCommand('giveownedvehicle', function(source, args)
    local src = source
    if src == 0 then
        print('Benutzung: /giveownedvehicle [model]')
        return
    end

    local identifier = getPlayerIdentifier(src)
    if not identifier then
        TriggerClientEvent('FW:Notify', src, 'Spieler konnte nicht identifiziert werden.', 'error')
        return
    end

    local modelName = tostring(args[1] or 'adder')
    local plate = ('TST%03d'):format(math.random(100, 999))

    FW.Garage.SaveVehicle(identifier, {
        plate = plate,
        model = modelName,
        label = getVehicleDisplayName(modelName),
        state = 'stored',
        props = {
            plate = plate,
            fuel = 100.0,
            engineHealth = 1000.0,
            bodyHealth = 1000.0,
            dirtLevel = 0.0,
            heading = 90.0
        }
    }, function()
        TriggerClientEvent('FW:Notify', src, ('Testfahrzeug %s (%s) erstellt.'):format(plate, modelName), 'success')
    end)
end, false)

RegisterCommand('removeownedvehicle', function(source, args)
    local src = source
    if src == 0 then
        print('Benutzung: /removeownedvehicle [plate]')
        return
    end

    local plate = args[1]
    if not plate then
        TriggerClientEvent('FW:Notify', src, 'Benutzung: /removeownedvehicle [plate]', 'error')
        return
    end

    local identifier = getPlayerIdentifier(src)
    if not identifier then
        TriggerClientEvent('FW:Notify', src, 'Spieler konnte nicht identifiziert werden.', 'error')
        return
    end

    FW.Garage.GetVehicleByPlate(plate, function(vehicle)
        if not vehicle or vehicle.owner_identifier ~= identifier then
            TriggerClientEvent('FW:Notify', src, 'Testfahrzeug nicht gefunden.', 'error')
            return
        end

        FW.Garage.DeleteVehicle(plate, identifier, function(affectedRows)
            if affectedRows > 0 then
                TriggerClientEvent('fw:garage:deleteSpawnedVehicle', src, plate)
                TriggerClientEvent('FW:Notify', src, ('Fahrzeug %s entfernt.'):format(plate), 'success')
            else
                TriggerClientEvent('FW:Notify', src, 'Fahrzeug konnte nicht entfernt werden.', 'error')
            end
        end)
    end)
end, false)
