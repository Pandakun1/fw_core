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

local function getPlayerIdentifiersForGarage(src)
    local candidates = {}
    local seen = {}

    local function add(value)
        if type(value) ~= 'string' or value == '' or seen[value] then return end
        seen[value] = true
        table.insert(candidates, value)
    end

    local player = FW.GetPlayer and FW.GetPlayer(src)
    if player then
        add(player.identifier)
        add(player.license)
    end

    local identifiers = GetPlayerIdentifiers(src)
    if identifiers then
        for _, identifier in ipairs(identifiers) do
            if type(identifier) == 'string' and identifier:find('license:', 1, true) == 1 then
                add(identifier)
            end
        end
        for _, identifier in ipairs(identifiers) do
            add(identifier)
        end
    end

    return candidates
end

local function getPrimaryPlayerIdentifier(src)
    local player = FW.GetPlayer and FW.GetPlayer(src)
    if player then
        if player.license and player.license ~= '' then
            return player.license
        end
        if player.identifier and player.identifier ~= '' then
            return player.identifier
        end
    end

    local identifiers = GetPlayerIdentifiers(src)
    if identifiers then
        for _, identifier in ipairs(identifiers) do
            if type(identifier) == 'string' and identifier:find('license:', 1, true) == 1 then
                return identifier
            end
        end
        return identifiers[1]
    end

    return nil
end

local function playerOwnsVehicle(src, vehicle)
    if not vehicle then return false end
    local identifiers = getPlayerIdentifiersForGarage(src)
    for _, identifier in ipairs(identifiers) do
        if vehicle.owner_identifier == identifier and vehicle.owned == true then
            return true
        end
    end
    return false
end

local function getVehicleDisplayName(model)
    if not model or model == '' then
        return 'Unbekannt'
    end

    if type(model) == 'number' then
        return tostring(model)
    end

    local normalized = tostring(model):gsub('^%l', string.upper)
    return normalized
end

local function decorateVehicleRow(row)
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
    return row
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

function FW.Garage.GetVehiclesByOwnerIdentifiers(identifiers, cb)
    if type(identifiers) ~= 'table' or #identifiers == 0 then
        cb({})
        return
    end

    local placeholders = {}
    for _ = 1, #identifiers do
        table.insert(placeholders, '?')
    end

    MySQL.query(('SELECT * FROM player_vehicles WHERE owner_identifier IN (%s) ORDER BY updated_at DESC'):format(table.concat(placeholders, ',')), identifiers, function(rows)
        rows = rows or {}
        local normalized = {}
        local seenPlates = {}

        for _, row in ipairs(rows) do
            if row.plate and not seenPlates[row.plate] then
                seenPlates[row.plate] = true
                table.insert(normalized, decorateVehicleRow(row))
            end
        end

        cb(normalized)
    end)
end

function FW.Garage.GetVehicleByPlate(plate, cb)
    MySQL.single('SELECT * FROM player_vehicles WHERE plate = ? LIMIT 1', { plate }, function(row)
        if row then
            row = decorateVehicleRow(row)
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
    local identifiers = getPlayerIdentifiersForGarage(src)
    FW.Garage.GetVehiclesByOwnerIdentifiers(identifiers, function(rows)
        print(('[FW.Garage] getVehicles for %s -> %s identifiers, %s vehicles'):format(src, #identifiers, #(rows or {})))
        cb(rows)
    end)
end)

FW.RegisterServerCallback('fw:garage:ownsVehicle', function(src, cb, plate)
    if not plate then
        cb(false)
        return
    end

    FW.Garage.GetVehicleByPlate(plate, function(vehicle)
        local owns = playerOwnsVehicle(src, vehicle)
        if vehicle then
            print(('[FW.Garage] ownsVehicle src=%s plate=%s owner=%s owns=%s'):format(src, plate, tostring(vehicle.owner_identifier), tostring(owns)))
        else
            print(('[FW.Garage] ownsVehicle src=%s plate=%s vehicle=nil'):format(src, tostring(plate)))
        end
        cb(owns)
    end)
end)

RegisterNetEvent('fw:garage:storeVehicle', function(plate, props)
    local src = source
    local identifier = getPrimaryPlayerIdentifier(src)
    if not identifier or not plate then return end

    FW.Garage.GetVehicleByPlate(plate, function(vehicle)
        if not playerOwnsVehicle(src, vehicle) then
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
    local identifier = getPrimaryPlayerIdentifier(src)
    if not identifier or not plate then return end

    FW.Garage.GetVehicleByPlate(plate, function(vehicle)
        if not playerOwnsVehicle(src, vehicle) then
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
    local identifier = getPrimaryPlayerIdentifier(src)
    if not identifier or not plate then return end

    FW.Garage.GetVehicleByPlate(plate, function(vehicle)
        if not playerOwnsVehicle(src, vehicle) then return end
        FW.Garage.UpdateVehicleState(plate, 'outside', coords, props, netId, function() end)
        TriggerClientEvent('FW:Notify', src, ('Fahrzeug %s wurde ausgeparkt.'):format(plate), 'success')
    end)
end)

RegisterNetEvent('fw:garage:test:createOwnedVehicle', function(model)
    local src = source
    local identifier = getPrimaryPlayerIdentifier(src)
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
    local identifier = getPrimaryPlayerIdentifier(src)
    if not identifier or not plate then return end

    FW.Garage.GetVehicleByPlate(plate, function(vehicle)
        if not playerOwnsVehicle(src, vehicle) then
            TriggerClientEvent('FW:Notify', src, 'Testfahrzeug nicht gefunden.', 'error')
            return
        end

        FW.Garage.DeleteVehicle(plate, vehicle.owner_identifier, function(affectedRows)
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

    local identifier = getPrimaryPlayerIdentifier(src)
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

    local identifier = getPrimaryPlayerIdentifier(src)
    if not identifier then
        TriggerClientEvent('FW:Notify', src, 'Spieler konnte nicht identifiziert werden.', 'error')
        return
    end

    FW.Garage.GetVehicleByPlate(plate, function(vehicle)
        if not playerOwnsVehicle(src, vehicle) then
            TriggerClientEvent('FW:Notify', src, 'Testfahrzeug nicht gefunden.', 'error')
            return
        end

        FW.Garage.DeleteVehicle(plate, vehicle.owner_identifier, function(affectedRows)
            if affectedRows > 0 then
                TriggerClientEvent('fw:garage:deleteSpawnedVehicle', src, plate)
                TriggerClientEvent('FW:Notify', src, ('Fahrzeug %s entfernt.'):format(plate), 'success')
            else
                TriggerClientEvent('FW:Notify', src, 'Fahrzeug konnte nicht entfernt werden.', 'error')
            end
        end)
    end)
end, false)
