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

-- NEU: Triggered, wenn ein Charakter aus dem Creator kommt
RegisterNetEvent('charcreator:server:createCharacter')
AddEventHandler('charcreator:server:createCharacter', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    
    if not identifier then return end
    
    -- Prüfen ob maximale Anzahl erreicht
    MySQL.scalar.await('SELECT COUNT(id) FROM characters WHERE identifier = ?', {identifier}, function(count)
        if count >= Config.MaxCharacters then
            TriggerClientEvent('charcreator:client:notify', src, "Maximale Anzahl an Charakteren erreicht.", "error")
            return
        end

        -- Standard-Skin setzen (Wird in der UI festgelegt)
        local defaultSkin = json.encode({
            face = data.skin.face, -- Face data kommt vom Client
            sex = data.sex
            -- Weitere Appearance-Daten hier hinzufügen, z.B. Hair, Tattoos etc.
        })
        
        -- Charakter in DB einfügen
        MySQL.insert('INSERT INTO characters (identifier, firstname, lastname, dateofbirth, sex, height, skin, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)', 
        {identifier, data.firstname, data.lastname, data.dateofbirth, data.sex, data.height, defaultSkin}, 
        function(charId)
            -- Startgeld und Inventar in der Haupt-Player-Tabelle initialisieren (falls benötigt)
            -- Hier müsste die Logik zur Erstellung eines Eintrags in der 'players' Tabelle für diesen charId rein.
            
            local player = FW.GetPlayer(src)
            -- Da FW.GetPlayer(src) auf der license:ID basiert, müssen wir hier einen neuen 'player' Kontext erstellen,
            -- der die charId als primären Schlüssel verwendet, um die Daten in FW korrekt zu speichern.
            
            -- WICHTIG: Hier muss der neue Charakter geladen werden
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
    local identifier = GetPlayerIdentifier(src)
    
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