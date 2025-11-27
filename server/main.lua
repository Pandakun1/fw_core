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

-- Characters table is now merged with players table in handler/db.lua

RegisterNetEvent('fw:playerReady')
AddEventHandler('fw:playerReady', function(srcOverride)
    local src = srcOverride or source
    print(('[FW] playerReady handler called for player %s'):format(src))
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
        print(('[FW] Spawning player %s with character data: %s at %s,%s,%s'):format(src, char.firstname, spawnData.x, spawnData.y, spawnData.z))
    else
        print(('[FW] Spawning player %s without character data (first spawn)'):format(src))
    end

    print(('[FW] Sending fw:spawnPlayer to client %s with model: %s'):format(src, spawnData.model))
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

    -- Use individual UPDATE queries since characters already exist
    local updateCount = 0
    for _, row in ipairs(rowsToSave) do
        MySQL.query([[
            UPDATE players SET
                money_cash = ?,
                money_bank = ?,
                job_name = ?,
                job_grade = ?,
                position_x = ?,
                position_y = ?,
                position_z = ?,
                inventory = ?,
                daten = ?,
                last_seen = CURRENT_TIMESTAMP
            WHERE identifier = ?
        ]], {
            row.money_cash,
            row.money_bank,
            row.job_name,
            row.job_grade,
            row.position_x,
            row.position_y,
            row.position_z,
            row.inventory,
            row.daten,
            row.identifier
        }, function(affectedRows)
            updateCount = updateCount + 1
            if updateCount >= #rowsToSave then
                for _, player in pairs(FW.Players) do
                    player.saveClean()
                end
                print(('[FW] - %d Spieler wurden gespeichert.'):format(#rowsToSave))
            end
        end)
    end
    
    if #rowsToSave == 0 then
        print('[FW] - Keine ungespeicherten Spieler gefunden.')
    end
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