FW = FW or {}
FW.Player = {}

AddEventHandler('onServerResourceStart', function(resourceName)
    if (GetCurrentResourceName() ~= resourceName) then
        return
    end
    Wait(50)
    FW.Inventory.LoadItems()
    print('FW Core Loaded')
end)

AddEventHandler('onServerResourceStop', function(resourceName)
    if (GetCurrentResourceName() ~= resourceName) then
        return
    end
    Wait(50)
    print('FW Core Stopped')
end)

CreateThread(function()
    MySQL.query([[
        CREATE TABLE IF NOT EXISTS characters (
            id INT AUTO_INCREMENT PRIMARY KEY,
            identifier VARCHAR(64) NOT NULL,
            firstname VARCHAR(50) NOT NULL,
            lastname VARCHAR(50) NOT NULL,
            dateofbirth VARCHAR(20) NOT NULL,
            sex VARCHAR(10) NOT NULL,
            height INT NOT NULL,
            skin LONGTEXT DEFAULT NULL,
            is_active TINYINT(1) DEFAULT 0,
            last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_identifier (identifier),
            INDEX idx_active (identifier, is_active)
        )
    ]])
end)

RegisterNetEvent('fw:playerReady')
AddEventHandler('fw:playerReady', function(srcOverride)
    local src = srcOverride or source
    local spawnData = {
        x = Config.Firstspawn.x,
        y = Config.Firstspawn.y,
        z = Config.Firstspawn.z,
        heading = Config.Firstspawn.w,
        model = "mp_m_freemode_01",
        skin = nil,
        health = 200,
        armor = 0,
        hunger = 100,
        thirst = 100
    }
    local player = FW.GetPlayer(src)
    if player and player.data and player.data.character then
        local char = player.data.character
        spawnData = {
            x = player.position.x or Config.Firstspawn.x,
            y = player.position.y or Config.Firstspawn.y,
            z = player.position.z or Config.Firstspawn.z,
            heading = 0.0,
            skin = char.skin or nil,
            model = (char.sex == 'male' and 'mp_m_freemode_01' or 'mp_f_freemode_01'),
            health = 200,
            armor = 0,
            hunger = 100,
            thirst = 100
        }
    end

    TriggerClientEvent('fw:spawnPlayer', src, spawnData)
end)

AddEventHandler('playerJoining', function(name, setKickReason, deferrals)
    local src = source
    while not src do Wait(100) src = source end
    print(('[core] playerJoining: %s'):format(name or 'Unbekannt'))
end)

AddEventHandler('playerDropped', function(reason)
    local src = source
    local player = FW.GetPlayer(src)
    if not player then return end
    player.position = GetEntityCoords(GetPlayerPed(src))
    local row = player.toRow()
    FW.DB.SavePlayer(row, function()
        print(('[FW] - Spieler %s mit der ID %s wurde gespeichert nachdem er mit dem Grund: %s die Verbindung getrennt hat.'):format(player.name, src, reason))
    end)
end)

function GetIdentifier(src)
    while not src do Wait(100) end
    local identifiers = GetPlayerIdentifiers(src)
    return identifiers[1] or nil
end

function FW.LoadPlayer(src)
    print('Lade Spieler mit der Quelle: ' .. tostring(src))
    while not src do Wait(100) src = source end
    local identifier = GetIdentifier(src)
    if not identifier then
        print('Keine gültige Identifikation gefunden.')
        DropPlayer(src, 'Keine gültige Identifikation gefunden.')
        return
    end

    FW.DB.LoadPlayer(src, identifier, function(row)
        if row then
            local player = FW.CreatePlayer(src, row)
            TriggerClientEvent('fw:updateHud', src, src, player.money.cash, player.money.bank)
        else
            local newRow = {
                identifier = identifier,
                name       = GetPlayerName(src),
                money_cash = 0,
                money_bank = 25000,
                inventory = '{}',
                job_name   = 'unemployed',
                job_grade  = 0,
                position_x = 0.0,
                position_y = 0.0,
                position_z = 75.0,
                daten       = '{}'
            }
            FW.DB.InsertPlayer(newRow, function()
                local player = FW.CreatePlayer(src, newRow)
                TriggerClientEvent('FW:playerLoaded', src, player.toRow())
            end)
        end
    end)
end

RegisterNetEvent('fw:loadPlayer')
AddEventHandler('fw:loadPlayer', function()
    local src = source
    --FW.LoadPlayer(src)
end)

function FW.SaveAllPlayers()
    local rowsToSave = {}
    while not FW.Players do Wait(100) end
    for src, player in pairs(FW.Players) do
        if player.isUnsaved() then
            table.insert(rowsToSave, player.toRow())
        end
    end

    if #rowsToSave == 0 then return end

    local placeholder = {}
    local params = {}

    for _, row in ipairs(rowsToSave) do
        table.insert(placeholder, '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        table.insert(params, row.identifier)
        table.insert(params, row.name)
        table.insert(params, row.money_cash)
        table.insert(params, row.money_bank)
        table.insert(params, row.job_name)
        table.insert(params, row.job_grade)
        table.insert(params, row.position_x)
        table.insert(params, row.position_y)
        table.insert(params, row.position_z)
        table.insert(params, row.daten)
    end
    local query = [[
        INSERT INTO players
            (identifier, name, money_cash, money_bank, job_name, job_grade, position_x, position_y, position_z, daten)
        VALUES ]] .. table.concat(placeholder, ',') .. [[
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            money_cash = VALUES(money_cash),
            money_bank = VALUES(money_bank),
            job_name = VALUES(job_name),
            job_grade = VALUES(job_grade),
            position_x = VALUES(position_x),
            position_y = VALUES(position_y),
            position_z = VALUES(position_z),
            daten = VALUES(daten),
            last_seen = CURRENT_TIMESTAMP
    ]]

    MySQL.query(query, params, function(affectedRows)
        for _, player in pairs(FW.Players) do
            player.saveClean()
        end
        print(('[FW] - %d Spieler wurden gespeichert.'):format(#rowsToSave))
    end)
end

local SAVE_INTERVAL = 60 * Config.AutoSaveInterval

Citizen.CreateThread(function()
    while true do
        Wait(SAVE_INTERVAL * 1000)
        FW.SaveAllPlayers()
    end
end)

function FW.Debug(source, message)
    print("[FW] ID: " .. tostring(source) .. " - Message: " .. tostring(message))
end

RegisterNetEvent('fw:debug', function(source, message)
    print("[FW] ID: " .. tostring(source) .. " - Message: " .. tostring(message))
end)

function GetCoreObject()
    return FW
end
exports('GetCoreObject', GetCoreObject)