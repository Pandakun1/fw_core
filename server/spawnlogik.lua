FW = FW or {}
FW.Spawn = FW.Spawn or {}

RegisterNetEvent('fw:serverTeleportTo')
AddEventHandler('fw:serverTeleportTo', function(x, y, z, heading)
    local src = source
    local ped = GetPlayerPed(src)
    if ped == 0 then return end
    SetEntityCoords(ped, x, y, z, false, false, false, false)
    if heading then
        SetEntityHeading(ped, heading)
    end
end)

local ActiveCharacters = {} 
-- Füge eine Getter-Funktion für ActiveCharacters in deine Exports ein, falls du sie brauchst.

-- Handler for loading a character by ID
RegisterNetEvent('fw:loadCharacter')
AddEventHandler('fw:loadCharacter', function(src, charId)
    if not src or not charId then return end
    
    local identifier = GetIdentifier(src)
    if not identifier then return end
    
    -- Load character from database
    MySQL.single('SELECT * FROM characters WHERE id = ? AND identifier = ?', {charId, identifier}, function(character)
        if not character then
            print(('[FW] Character %s not found for player %s'):format(charId, src))
            return
        end
        
        -- Parse skin data
        local skinData = {}
        if character.skin and character.skin ~= '' then
            skinData = json.decode(character.skin) or {}
        end
        
        -- Set active character
        ActiveCharacters[src] = charId
        
        -- Update character as active in database
        MySQL.update('UPDATE characters SET is_active = 1 WHERE id = ?', {charId})
        MySQL.update('UPDATE characters SET is_active = 0 WHERE identifier = ? AND id != ?', {identifier, charId})
        
        -- Create or load player entry in players table
        local fullName = character.firstname .. ' ' .. character.lastname
        MySQL.single('SELECT * FROM players WHERE identifier = ?', {identifier}, function(playerRow)
            if playerRow then
                -- Update existing player with character data
                local player = FW.CreatePlayer(src, playerRow)
                if player then
                    -- Update player data with character info
                    player.data.character = {
                        id = character.id,
                        firstname = character.firstname,
                        lastname = character.lastname,
                        dateofbirth = character.dateofbirth,
                        sex = character.sex,
                        height = character.height,
                        skin = skinData
                    }
                    player.unsaved = true
                    
                    TriggerClientEvent('fw:updateHud', src, src, player.money.cash, player.money.bank)
                    TriggerClientEvent('FW:playerLoaded', src, player.toRow())
                    
                    -- Trigger spawn
                    TriggerEvent('fw:playerReady', src)
                end
            else
                -- Create new player entry for this character
                local newPlayerRow = {
                    identifier = identifier,
                    name = fullName,
                    money_cash = 5000,
                    money_bank = 25000,
                    inventory = '{}',
                    job_name = 'unemployed',
                    job_grade = 0,
                    position_x = Config.Firstspawn.x,
                    position_y = Config.Firstspawn.y,
                    position_z = Config.Firstspawn.z,
                    daten = json.encode({
                        character = {
                            id = character.id,
                            firstname = character.firstname,
                            lastname = character.lastname,
                            dateofbirth = character.dateofbirth,
                            sex = character.sex,
                            height = character.height,
                            skin = skinData
                        }
                    })
                }
                
                FW.DB.InsertPlayer(newPlayerRow, function()
                    local player = FW.CreatePlayer(src, newPlayerRow)
                    if player then
                        TriggerClientEvent('fw:updateHud', src, src, player.money.cash, player.money.bank)
                        TriggerClientEvent('FW:playerLoaded', src, player.toRow())
                        
                        -- Trigger spawn
                        TriggerEvent('fw:playerReady', src)
                    end
                end)
            end
        end)
    end)
end)

-- NEU: Triggered, wenn ein Charakter aus dem Creator kommt
RegisterNetEvent('charcreator:server:createCharacter')
AddEventHandler('charcreator:server:createCharacter', function(data)
    local src = source
    local identifier = GetIdentifier(src)
    
    if not identifier then return end
    
    -- Prüfen ob maximale Anzahl erreicht
    MySQL.scalar('SELECT COUNT(id) FROM characters WHERE identifier = ?', {identifier}, function(count)
        if count >= Config.MaxCharacters then
            TriggerClientEvent('charcreator:client:notify', src, "Maximale Anzahl an Charakteren erreicht.", "error")
            return
        end

        -- Standard-Skin setzen mit strukturierten Daten für das Appearance-System
        local skinData = {
            sex = data.sex,
            model = data.sex == 'male' and 'mp_m_freemode_01' or 'mp_f_freemode_01'
        }
        
        -- Wenn Skin-Daten vom Client kommen, übernehmen
        if data.skin then
            for k, v in pairs(data.skin) do
                skinData[k] = v
            end
        end
        
        local defaultSkin = json.encode(skinData)
        
        -- Deaktiviere alle anderen Charaktere für diesen Spieler
        MySQL.update('UPDATE characters SET is_active = 0 WHERE identifier = ?', {identifier})
        
        -- Charakter in DB einfügen
        MySQL.insert('INSERT INTO characters (identifier, firstname, lastname, dateofbirth, sex, height, skin, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)', 
        {identifier, data.firstname, data.lastname, data.dateofbirth, data.sex, data.height, defaultSkin}, 
        function(charId)
            if not charId then
                TriggerClientEvent('charcreator:client:notify', src, "Fehler beim Erstellen des Charakters.", "error")
                return
            end
            
            -- Lade den neuen Charakter und erstelle Player-Eintrag
            TriggerEvent('fw:loadCharacter', src, charId)
        end)
    end)
end)

-- NEU: Triggered, wenn ein Charakter ausgewählt wird
RegisterNetEvent('charcreator:server:selectCharacter')
AddEventHandler('charcreator:server:selectCharacter', function(charId)
    local src = source
    -- ... (Logik, um is_active in der DB zu setzen, alle anderen auf 0)
    -- ... (Logik, um den Charakter zu laden: FW.LoadCharacter(src, charId))
    TriggerEvent('fw:loadCharacter', src, charId) -- Gehe davon aus, dass Sie ein FW-Event zum Laden haben
end)

-- NEU: Triggered, wenn ein Charakter gelöscht wird
RegisterNetEvent('charcreator:server:deleteCharacter')
AddEventHandler('charcreator:server:deleteCharacter', function(charId)
    local src = source
    local identifier = GetIdentifier(src)
    
    -- Löscht den Charakter nur, wenn er zur Identität passt
    MySQL.update('DELETE FROM characters WHERE id = ? AND identifier = ?', {charId, identifier}, function(affectedRows)
        if affectedRows > 0 then
            TriggerClientEvent('charcreator:client:notify', src, "Charakter erfolgreich gelöscht.", "success")
        else
            TriggerClientEvent('charcreator:client:notify', src, "Löschen fehlgeschlagen.", "error")
        end
    end)
end)

-- NEU: Skin speichern (z.B. nach Kauf beim Friseur)
RegisterNetEvent('charcreator:server:saveSkin')
AddEventHandler('charcreator:server:saveSkin', function(skinData)
    local src = source
    local charId = ActiveCharacters[src] -- Holt die ID des aktiven Charakters
    
    if not charId then return end
    
    -- Speichert den gesamten Skin-Datensatz als JSON
    MySQL.update('UPDATE characters SET skin = ? WHERE id = ?', {json.encode(skinData), charId})
    
    -- WICHTIG: Sie müssen diese Skin-Daten auch in der Haupt 'players' Tabelle in das 'daten' Feld
    -- des aktuell geladenen FW-Player-Objekts (player.data) speichern, um sie im Framework verfügbar zu machen.
end)