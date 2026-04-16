FW = FW or {}
FW.Garage = FW.Garage or {}
FW.Garage.ActiveOutsideVehicles = FW.Garage.ActiveOutsideVehicles or {}
FW.Garage.PendingSpawnRequests = FW.Garage.PendingSpawnRequests or {}
FW.Garage.OutsideVehicleSettles = FW.Garage.OutsideVehicleSettles or {}

local RESOURCE_NAME = GetCurrentResourceName()
local OUTSIDE_SETTLE_CHECK_INTERVAL_MS = 3000
local OUTSIDE_SETTLE_MAX_IDLE_TICKS = 3
local OUTSIDE_SETTLE_POSITION_EPSILON = 0.15
local OUTSIDE_SETTLE_HEADING_EPSILON = 2.5

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

local function normalizePlate(value)
    return tostring(value or ''):match('^%s*(.-)%s*$')
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
    if player and player.identifier and player.identifier ~= '' then
        return player.identifier
    end

    local identifiers = getPlayerIdentifiersForGarage(src)
    return identifiers[1] or nil
end

local function playerOwnsVehicle(src, vehicle)
    if not vehicle then return false end

    local player = FW.GetPlayer and FW.GetPlayer(src)
    if player and player.identifier and vehicle.owner_identifier == player.identifier then
        return true
    end

    local identifiers = getPlayerIdentifiersForGarage(src)
    for _, identifier in ipairs(identifiers) do
        if vehicle.owner_identifier == identifier then
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

    return tostring(model):gsub('^%l', string.upper)
end

local function decorateVehicleRow(row)
    local ownerValue = row.owner_identifier
    row.owned = ownerValue ~= nil and ownerValue ~= ''
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

local function areCoordsSettled(previous, current)
    if type(previous) ~= 'table' or type(current) ~= 'table' then
        return false
    end

    local dx = math.abs((current.x or 0.0) - (previous.x or 0.0))
    local dy = math.abs((current.y or 0.0) - (previous.y or 0.0))
    local dz = math.abs((current.z or 0.0) - (previous.z or 0.0))
    local dh = math.abs((current.heading or 0.0) - (previous.heading or 0.0))

    return dx <= OUTSIDE_SETTLE_POSITION_EPSILON
        and dy <= OUTSIDE_SETTLE_POSITION_EPSILON
        and dz <= OUTSIDE_SETTLE_POSITION_EPSILON
        and dh <= OUTSIDE_SETTLE_HEADING_EPSILON
end

local function clearActiveOutsideVehicle(plate)
    local normalizedPlate = normalizePlate(plate)
    if normalizedPlate == '' then return end
    FW.Garage.ActiveOutsideVehicles[normalizedPlate] = nil
    FW.Garage.PendingSpawnRequests[normalizedPlate] = nil
    FW.Garage.OutsideVehicleSettles[normalizedPlate] = nil
end

local function markOutsideVehicleActive(plate, ownerIdentifier, src, netId)
    local normalizedPlate = normalizePlate(plate)
    if normalizedPlate == '' then return end

    local existing = FW.Garage.ActiveOutsideVehicles[normalizedPlate] or {}
    FW.Garage.ActiveOutsideVehicles[normalizedPlate] = {
        owner = ownerIdentifier,
        source = src,
        netId = netId or existing.netId,
        lastUpdateAt = os.time()
    }
end

local function queueOutsideVehicleSettle(plate, coords, props, netId)
    local normalizedPlate = normalizePlate(plate)
    if normalizedPlate == '' or type(coords) ~= 'table' then return end

    local tracked = FW.Garage.OutsideVehicleSettles[normalizedPlate] or {}
    local idleTicks = 0
    if areCoordsSettled(tracked.coords, coords) then
        idleTicks = (tracked.idleTicks or 0) + 1
    end

    FW.Garage.OutsideVehicleSettles[normalizedPlate] = {
        coords = coords,
        props = props or tracked.props or {},
        netId = netId or tracked.netId,
        idleTicks = idleTicks,
        updatedAt = os.time()
    }
end

local function finalizeSettledOutsideVehicles()
    for plate, tracked in pairs(FW.Garage.OutsideVehicleSettles) do
        if tracked.idleTicks >= OUTSIDE_SETTLE_MAX_IDLE_TICKS then
            FW.Garage.UpdateVehicleState(plate, 'outside', tracked.coords, tracked.props, tracked.netId, function() end)
            FW.Garage.OutsideVehicleSettles[plate] = nil
        end
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

CreateThread(function()
    while true do
        Wait(OUTSIDE_SETTLE_CHECK_INTERVAL_MS)
        finalizeSettledOutsideVehicles()
    end
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
            local plateKey = normalizePlate(row.plate)
            if plateKey ~= '' and not seenPlates[plateKey] then
                seenPlates[plateKey] = true
                table.insert(normalized, decorateVehicleRow(row))
            end
        end

        cb(normalized)
    end)
end

function FW.Garage.GetVehicleByPlate(plate, cb)
    local normalizedPlate = normalizePlate(plate)
    MySQL.single('SELECT * FROM player_vehicles WHERE TRIM(plate) = TRIM(?) LIMIT 1', { normalizedPlate }, function(row)
        if row then
            row = decorateVehicleRow(row)
        end
        cb(row)
    end)
end

function FW.Garage.GetOutsideVehiclesByOwnerIdentifiers(identifiers, cb)
    if type(identifiers) ~= 'table' or #identifiers == 0 then
        cb({})
        return
    end

    local placeholders = {}
    for _ = 1, #identifiers do
        table.insert(placeholders, '?')
    end

    MySQL.query(('SELECT * FROM player_vehicles WHERE owner_identifier IN (%s) AND state = ? ORDER BY updated_at DESC'):format(table.concat(placeholders, ',')),
        (function()
            local params = {}
            for _, identifier in ipairs(identifiers) do
                table.insert(params, identifier)
            end
            table.insert(params, 'outside')
            return params
        end)(),
        function(rows)
            rows = rows or {}
            for index, row in ipairs(rows) do
                rows[index] = decorateVehicleRow(row)
            end
            cb(rows)
        end
    )
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
    local normalizedPlate = normalizePlate(plate)
    MySQL.update([[ 
        UPDATE player_vehicles
        SET state = ?,
            last_coords = ?,
            vehicle_props = ?,
            spawned_net_id = ?
        WHERE TRIM(plate) = TRIM(?)
    ]], {
        state,
        coords and encodeJson(coords) or nil,
        encodeJson(props or {}),
        netId,
        normalizedPlate
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
    local player = FW.GetPlayer and FW.GetPlayer(src)
    local identifiers = {}

    if player and player.identifier and player.identifier ~= '' then
        identifiers = { player.identifier }
    else
        identifiers = getPlayerIdentifiersForGarage(src)
    end

    FW.Garage.GetVehiclesByOwnerIdentifiers(identifiers, cb)
end)

FW.RegisterServerCallback('fw:garage:ownsVehicle', function(src, cb, plate)
    if not plate then
        cb(false)
        return
    end

    local normalizedPlate = normalizePlate(plate)
    FW.Garage.GetVehicleByPlate(normalizedPlate, function(vehicle)
        cb(playerOwnsVehicle(src, vehicle))
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
                clearActiveOutsideVehicle(plate)
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

    local normalizedPlate = normalizePlate(plate)
    if normalizedPlate == '' then return end

    if FW.Garage.PendingSpawnRequests[normalizedPlate] then
        TriggerClientEvent('FW:Notify', src, 'Für dieses Fahrzeug läuft bereits ein Spawn.', 'error')
        return
    end

    local active = FW.Garage.ActiveOutsideVehicles[normalizedPlate]
    if active then
        TriggerClientEvent('FW:Notify', src, 'Dieses Fahrzeug ist bereits draußen aktiv.', 'error')
        return
    end

    FW.Garage.GetVehicleByPlate(normalizedPlate, function(vehicle)
        if not playerOwnsVehicle(src, vehicle) then
            TriggerClientEvent('FW:Notify', src, 'Dieses Fahrzeug gehört dir nicht.', 'error')
            return
        end

        if vehicle.state ~= 'stored' then
            TriggerClientEvent('FW:Notify', src, 'Dieses Fahrzeug ist bereits ausgeparkt.', 'error')
            return
        end

        FW.Garage.PendingSpawnRequests[normalizedPlate] = {
            source = src,
            requestedAt = os.time()
        }

        local props = vehicle.props or {}
        TriggerClientEvent('fw:garage:spawnVehicleClient', src, {
            plate = normalizedPlate,
            model = vehicle.vehicle_model,
            props = props,
            coords = { heading = props.heading or 90.0 },
            heading = props.heading or 90.0
        })
    end)
end)

RegisterNetEvent('fw:garage:vehicleSpawned', function(plate, netId, coords, props)
    local src = source
    local identifier = getPrimaryPlayerIdentifier(src)
    if not identifier or not plate then return end

    local normalizedPlate = normalizePlate(plate)
    FW.Garage.GetVehicleByPlate(normalizedPlate, function(vehicle)
        if not playerOwnsVehicle(src, vehicle) then
            FW.Garage.PendingSpawnRequests[normalizedPlate] = nil
            return
        end

        FW.Garage.PendingSpawnRequests[normalizedPlate] = nil
        markOutsideVehicleActive(normalizedPlate, vehicle.owner_identifier, src, netId)
        queueOutsideVehicleSettle(normalizedPlate, coords, props, netId)
        FW.Garage.UpdateVehicleState(normalizedPlate, 'outside', coords, props, netId, function() end)
        TriggerClientEvent('FW:Notify', src, ('Fahrzeug %s wurde ausgeparkt.'):format(normalizedPlate), 'success')
    end)
end)

RegisterNetEvent('fw:garage:requestOutsideVehicles', function()
    local src = source
    local player = FW.GetPlayer and FW.GetPlayer(src)
    local identifiers = player and player.identifier and { player.identifier } or getPlayerIdentifiersForGarage(src)

    FW.Garage.GetOutsideVehiclesByOwnerIdentifiers(identifiers, function(vehicles)
        local filtered = {}
        for _, vehicle in ipairs(vehicles) do
            local normalizedPlate = normalizePlate(vehicle.plate)
            if normalizedPlate ~= '' and not FW.Garage.ActiveOutsideVehicles[normalizedPlate] then
                table.insert(filtered, vehicle)
            end
        end
        TriggerClientEvent('fw:garage:spawnPersistedOutsideVehicles', src, filtered)
    end)
end)

RegisterNetEvent('fw:garage:updateOutsideVehicleState', function(plate, coords, props)
    local src = source
    local normalizedPlate = normalizePlate(plate)
    if normalizedPlate == '' then return end

    FW.Garage.GetVehicleByPlate(normalizedPlate, function(vehicle)
        if not playerOwnsVehicle(src, vehicle) then return end
        markOutsideVehicleActive(normalizedPlate, vehicle.owner_identifier, src, vehicle.spawned_net_id)
        queueOutsideVehicleSettle(normalizedPlate, coords, props, vehicle.spawned_net_id)
        FW.Garage.UpdateVehicleState(normalizedPlate, 'outside', coords, props, vehicle.spawned_net_id, function() end)
    end)
end)

AddEventHandler('playerDropped', function()
    local src = source
    for plate, active in pairs(FW.Garage.ActiveOutsideVehicles) do
        if active and active.source == src then
            active.source = nil
            active.lastUpdateAt = os.time()
        end
    end
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
                clearActiveOutsideVehicle(plate)
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

RegisterCommand('garageowns_server', function(source, args)
    local src = source
    if src == 0 then
        print('Benutzung: /garageowns_server [plate]')
        return
    end

    local plate = args[1]
    if not plate then
        TriggerClientEvent('FW:Notify', src, 'Benutzung: /garageowns_server [plate]', 'error')
        return
    end

    local normalizedPlate = normalizePlate(plate)
    FW.Garage.GetVehicleByPlate(normalizedPlate, function(vehicle)
        local owns = playerOwnsVehicle(src, vehicle)
        if owns then
            TriggerClientEvent('FW:Notify', src, ('Servercheck: Du besitzt %s.'):format(normalizedPlate), 'success')
        else
            TriggerClientEvent('FW:Notify', src, ('Servercheck: Du besitzt %s nicht.'):format(normalizedPlate), 'error')
        end
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
                clearActiveOutsideVehicle(plate)
                TriggerClientEvent('fw:garage:deleteSpawnedVehicle', src, plate)
                TriggerClientEvent('FW:Notify', src, ('Fahrzeug %s entfernt.'):format(plate), 'success')
            else
                TriggerClientEvent('FW:Notify', src, 'Fahrzeug konnte nicht entfernt werden.', 'error')
            end
        end)
    end)
end, false)
