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

-- Get character-specific identifier for active character
function GetCharacterIdentifier(src)
    local charId = ActiveCharacters[src]
    if not charId then
        print('[FW] WARNING: No active character for player ' .. src)
        return nil
    end
    local license = GetIdentifier(src)
    return 'char' .. charId .. ':' .. license
end
exports('GetCharacterIdentifier', GetCharacterIdentifier)

-- Handler for loading a character by ID
RegisterNetEvent('fw:loadCharacter')
AddEventHandler('fw:loadCharacter', function(src, charId)
    if not src or not charId then return end
    
    local license = GetIdentifier(src)
    if not license then return end
    
    -- Load character from players table
    MySQL.single('SELECT * FROM players WHERE id = ? AND license = ?', {charId, license}, function(playerRow)
        if not playerRow then
            print(('[FW] Character %s not found for player %s'):format(charId, src))
            return
        end
        
        -- Parse skin data
        local skinData = {}
        if playerRow.skin and playerRow.skin ~= '' then
            skinData = json.decode(playerRow.skin) or {}
        end

        local normalizedSex = playerRow.sex or 'male'
        if normalizedSex == 'male' then normalizedSex = 'm' end
        if normalizedSex == 'female' then normalizedSex = 'f' end
        local fallbackModel = (normalizedSex == 'm') and 'mp_m_freemode_01' or 'mp_f_freemode_01'
        if not skinData.model or skinData.model == '' then
            skinData.model = fallbackModel
        end
        if not skinData.sex or skinData.sex == '' then
            skinData.sex = normalizedSex
        end
        
        -- Set active character
        ActiveCharacters[src] = charId
        
        -- Update character as active in database
        MySQL.update('UPDATE players SET is_active = 1 WHERE id = ?', {charId})
        MySQL.update('UPDATE players SET is_active = 0 WHERE license = ? AND id != ?', {license, charId})
        
        -- Create char-specific identifier
        local charIdentifier = 'char' .. charId .. ':' .. license
        print('[FW] Loading player with char identifier: ' .. charIdentifier)
        
        -- Update identifier if needed
        if playerRow.identifier ~= charIdentifier then
            MySQL.update('UPDATE players SET identifier = ? WHERE id = ?', {charIdentifier, charId})
            playerRow.identifier = charIdentifier
        end
        
        -- Continue with old playerRow logic
        local character = playerRow
        -- Create player object from combined data
        local player = FW.CreatePlayer(src, playerRow)
        if player then
            -- Ensure player.data exists and update with character info
            if not player.data then
                player.data = {}
            end
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
            print(('[FW] Triggering playerReady for player %s with character %s'):format(src, character.id))
            print(('[FW] Player object created and cached for source %s'):format(src))
            TriggerEvent('fw:playerReady', src)
        else
            print(('[FW] ERROR: Failed to create player object for %s'):format(src))
        end
    end)
end)

-- NEU: Triggered, wenn ein Charakter aus dem Creator kommt
RegisterNetEvent('charcreator:server:createCharacter')
AddEventHandler('charcreator:server:createCharacter', function(data)
    local src = source
    local license = GetIdentifier(src)
    
    if not license then return end
    
    -- Prüfen ob maximale Anzahl erreicht
    MySQL.scalar('SELECT COUNT(id) FROM players WHERE license = ?', {license}, function(count)
        if count >= Config.MaxCharacters then
            TriggerClientEvent('charcreator:client:notify', src, "Maximale Anzahl an Charakteren erreicht.", "error")
            return
        end

        -- Standard-Skin setzen mit strukturierten Daten für das Appearance-System
        local gender = (data.identity.gender == 'male') and 'm' or data.identity.gender
        local model = (gender == 'm') and 'mp_m_freemode_01' or 'mp_f_freemode_01'
        local skinData = {
            sex = gender,
            model = model
        }
        
        -- Wenn Skin-Daten vom Client kommen, übernehmen
        if data.skin then
            for k, v in pairs(data.skin) do
                skinData[k] = v
            end
        end
        
        local defaultSkin = json.encode(skinData)
        
        -- Deaktiviere alle anderen Charaktere für diesen Spieler
        MySQL.update('UPDATE players SET is_active = 0 WHERE license = ?', {license})
        
        -- Neuen Charakter in players Tabelle einfügen (ohne identifier, wird nach Insert gesetzt)
        MySQL.insert([[INSERT INTO players 
            (license, firstname, lastname, dateofbirth, sex, height, skin, is_active, identifier, money_cash, money_bank, inventory, job_name, job_grade, position_x, position_y, position_z, daten) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'temp', 5000, 25000, '{}', 'unemployed', 0, ?, ?, ?, '{}')]], 
        {license, data.identity.firstname, data.identity.lastname, data.identity.birthdate, data.identity.gender, 180, defaultSkin, Config.Firstspawn.x, Config.Firstspawn.y, Config.Firstspawn.z}, 
        function(charId)
            if not charId then
                TriggerClientEvent('charcreator:client:notify', src, "Fehler beim Erstellen des Charakters.", "error")
                return
            end
            
            -- Setze den richtigen char-identifier
            local charIdentifier = 'char' .. charId .. ':' .. license
            MySQL.update('UPDATE players SET identifier = ? WHERE id = ?', {charIdentifier, charId})
            
            print('[FW] Created character ID: ' .. charId .. ' for license: ' .. license)
            
            -- Lade den neuen Charakter
            --TriggerEvent('fw:loadCharacter', src, charId)
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
    local license = GetIdentifier(src)
    
    -- Löscht den Charakter nur, wenn er zur License passt
    MySQL.update('DELETE FROM players WHERE id = ? AND license = ?', {charId, license}, function(affectedRows)
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
    
    -- Speichert den gesamten Skin-Datensatz als JSON in players Tabelle
    MySQL.update('UPDATE players SET skin = ? WHERE id = ?', {json.encode(skinData), charId})
end)