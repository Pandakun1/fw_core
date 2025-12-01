-- ========================================
-- Server-Side Inventory Item Handler
-- ========================================

-- UseItem Event Handler
RegisterNetEvent('fw:inventory:useItem', function(data)
    local source = source
    local itemName = data.itemName
    local slot = data.slot
    local zone = data.zone
    local amount = data.amount or 1
    
    print(string.format('[FW Core] Player %d using item: %s', source, itemName))
    
    -- Hole Spieler-Inventar aus Datenbank
    local Player = GetPlayer(source) -- Deine GetPlayer Funktion
    if not Player then
        print('[FW Core] Player not found:', source)
        return
    end
    
    -- Prüfe ob Spieler das Item hat
    local hasItem = false
    local itemSlot = nil
    
    if Player.inventory and Player.inventory.main then
        for name, item in pairs(Player.inventory.main) do
            if name == itemName and item.slot == slot then
                hasItem = true
                itemSlot = item
                break
            end
        end
    end
    
    if not hasItem then
        TriggerClientEvent('fw:notify', source, {
            type = 'error',
            message = 'Du hast dieses Item nicht!'
        })
        return
    end
    
    -- Item-spezifische Logik
    local consumed = false
    local success = false
    
    if itemName == 'bread' or itemName == 'burger' or itemName == 'sandwich' then
        -- Essen: Heilt 20 HP
        TriggerClientEvent('fw:player:heal', source, 20)
        consumed = true
        success = true
        TriggerClientEvent('fw:notify', source, {
            type = 'success',
            message = 'Du hast etwas gegessen!'
        })
        
    elseif itemName == 'water' or itemName == 'vodka' then
        -- Trinken: Reduziert Durst
        TriggerClientEvent('fw:player:hydrate', source, 30)
        consumed = true
        success = true
        TriggerClientEvent('fw:notify', source, {
            type = 'success',
            message = 'Du hast etwas getrunken!'
        })
        
    elseif itemName == 'medkit' or itemName == 'bandage' then
        -- Heilung
        local healAmount = itemName == 'medkit' and 50 or 25
        TriggerClientEvent('fw:player:heal', source, healAmount)
        consumed = true
        success = true
        TriggerClientEvent('fw:notify', source, {
            type = 'success',
            message = 'Du hast dich geheilt!'
        })
        
    elseif itemName == 'phone' then
        -- Telefon öffnen
        TriggerClientEvent('fw:phone:open', source)
        success = true
        
    elseif itemName == 'id_card' or itemName == 'driver_license' then
        -- Ausweis anzeigen
        TriggerClientEvent('fw:id:show', source, itemName)
        success = true
        
    else
        -- Standardverhalten für unbekannte Items
        print('[FW Core] No use handler for item:', itemName)
        TriggerClientEvent('fw:notify', source, {
            type = 'info',
            message = 'Dieses Item kann nicht verwendet werden.'
        })
        return
    end
    
    -- Item verbrauchen falls consumed = true
    if consumed and itemSlot then
        if itemSlot.count and itemSlot.count > 1 then
            -- Menge reduzieren
            Player.inventory.main[itemName].count = itemSlot.count - 1
        else
            -- Item komplett entfernen
            Player.inventory.main[itemName] = nil
        end
        
        -- Inventar in DB speichern
        SavePlayerInventory(source, Player.inventory)
        
        -- Client benachrichtigen
        TriggerClientEvent('fw:inventory:itemUsed', source, {
            itemName = itemName,
            slot = slot,
            consumed = true
        })
        
        -- Inventar refreshen
        TriggerClientEvent('fw:inventory:refresh', source, Player.inventory)
    end
end)

-- MoveItem Event Handler
RegisterNetEvent('fw:inventory:moveItem', function(fromSlot, toSlot)
    local source = source
    
    -- Handle both formats: direct parameters OR table
    if type(fromSlot) == 'table' then
        toSlot = fromSlot.toSlot
        fromSlot = fromSlot.fromSlot
    end
    
    fromSlot = tonumber(fromSlot)
    toSlot = tonumber(toSlot)
    
    if not fromSlot or not toSlot then
        print('[FW Core] Invalid slots provided')
        return
    end
    
    print(string.format('[FW Core] Player %d moving item: slot %d -> slot %d', source, fromSlot, toSlot))
    
    local Player = GetPlayer(source)
    if not Player then return end
    
    if not Player.inventory or not Player.inventory.main then
        print('[FW Core] Player has no inventory')
        return
    end
    
    -- Finde Items in den Slots
    local sourceItem = nil
    local targetItem = nil
    local sourceItemName = nil
    local targetItemName = nil
    
    for itemName, item in pairs(Player.inventory.main) do
        if item.slot == fromSlot then
            sourceItem = item
            sourceItemName = itemName
        end
        if item.slot == toSlot then
            targetItem = item
            targetItemName = itemName
        end
    end
    
    if not sourceItem then
        print('[FW Core] No item in source slot:', fromSlot)
        return
    end
    
    -- Swap oder Move
    if targetItem then
        -- Swap: Tausche Positionen
        Player.inventory.main[sourceItemName].slot = toSlot
        Player.inventory.main[targetItemName].slot = fromSlot
        print('[FW Core] Swapped items:', sourceItemName, '<->', targetItemName)
    else
        -- Move: Verschiebe zu leerem Slot
        Player.inventory.main[sourceItemName].slot = toSlot
        print('[FW Core] Moved item:', sourceItemName, 'to slot', toSlot)
    end
    
    -- Inventar speichern
    SavePlayerInventory(source, Player.inventory)
    
    -- Client aktualisieren
    TriggerClientEvent('fw:inventory:refresh', source, Player.inventory)
end)

-- Hilfsfunktion: Inventar speichern (ersetze durch deine DB-Logik)
function SavePlayerInventory(source, inventory)
    -- Beispiel mit MySQL
    local Player = GetPlayer(source)
    if not Player then return end
    
    local inventoryJson = json.encode(inventory)
    
    -- exports.oxmysql:execute('UPDATE players SET inventory = ? WHERE id = ?', {
    --     inventoryJson,
    --     Player.id
    -- })
    
    print('[FW Core] Inventory saved for player:', source)
end

-- Hilfsfunktion: Spieler-Objekt holen (ersetze durch deine Framework-Logik)
function GetPlayer(source)
    -- Beispiel für QBCore
    -- return QBCore.Functions.GetPlayer(source)
    
    -- Beispiel für ESX
    -- return ESX.GetPlayerFromId(source)
    
    -- Temporär: Mock-Daten
    return {
        id = source,
        inventory = {
            main = {} -- Wird aus DB geladen
        }
    }
end
