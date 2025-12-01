FW = FW or {}
FW.Inventory = FW.Inventory or {}
FW.Inventory.List = FW.Inventory.List or {}
FW.GroundItems = FW.GroundItems or {}

-- Helper: Generiere eindeutige ID für Ground Items
local function GenerateGroundItemId()
    return 'ground_' .. math.random(100000, 999999) .. '_' .. os.time()
end

-- Helper: Hole Ground-Items in der Nähe eines Spielers
local function GetNearbyGroundItems(src, radius)
    local playerPed = GetPlayerPed(src)
    local playerCoords = GetEntityCoords(playerPed)
    local nearbyItems = {}
    
    for id, itemData in pairs(FW.GroundItems or {}) do
        if itemData and itemData.coords then
            local distance = #(playerCoords - itemData.coords)
            if distance <= radius then
                table.insert(nearbyItems, {
                    name = itemData.itemName,
                    label = itemData.label,
                    amount = itemData.amount
                })
            end
        end
    end
    
    return nearbyItems
end

function LoadJsonFromResource(fileName)
    local resourceName = GetCurrentResourceName()
    local content = LoadResourceFile(resourceName, fileName)

    if not content then
        print(('[FW] Keine %s gefunden!'):format(fileName))
        return nil
    end

    local ok, data = pcall(json.decode, content)
    if not ok then
        print(('[FW] Fehler beim lesen der Datei: %s - %s'):format(fileName, data))
        return nil
    end

    return data

end

function FW.Inventory.LoadItems()
    local filename = "configs/itemlist.json"
    local items = LoadJsonFromResource(filename)

    for _, item in ipairs(items) do
        if item.name and item.label then
            FW.Inventory.List[item.name] = {
                name = item.name,
                label = item.label,
                itemweight = item.itemweight or 0,
                type = item.type or 'item',
                canUse = item.canUse or false
            }
            --print(('[FW] Item mit dem Label: %s erfolgreich registriert.'):format(item.label))
        else
            print('[FW] Ungltiger Item-Eintrag in der itemlist.json (kein name/label).')
        end
    end

    print(('[FW] %d Items aus itemlist.json geladen.'):format(#items))

end

function FW.Inventory.GetItemList(cb)
    cb(FW.Inventory.List)
end

function FW.Inventory.GetItemData(itemName, cb)
    if FW.Inventory.List[itemName] then
        cb(FW.Inventory.List[itemName])
    else
        cb(false)
    end

end

function FW.Inventory.GetInventory(src, cb)
    local identifier = exports['fw_core']:GetCharacterIdentifier(src)
    if not identifier then
        print('[FW] GetInventory: No character identifier for player ' .. src)
        cb({})
        return
    end
    MySQL.single(
        'SELECT inventory FROM players WHERE identifier = ?',
        { identifier},
        function(row)
            local inventory = {}
            if row and row.inventory and row.inventory ~= '' then
                local ok, decoded = pcall(json.decode, row.inventory)
                if ok and type(decoded) == 'table' then
                    inventory = decoded
                end
            end
            cb(inventory)
        end
    )
end

function FW.Inventory.HasItem(src, itemName, amount)
    amount = tonumber(amount) or 1
    local hasItem = false
    
    FW.Inventory.GetInventory(src, function(inventory)
        if inventory[itemName] and inventory[itemName].amount >= amount then
            hasItem = true
        end
    end)
    
    return hasItem
end

function FW.Inventory.GetItemCount(src, itemName)
    local count = 0
    
    FW.Inventory.GetInventory(src, function(inventory)
        if inventory[itemName] then
            count = inventory[itemName].amount
        end
    end)
    
    return count
end

local function SaveInventory(src, inventory, cb)
    local identifier = exports['fw_core']:GetCharacterIdentifier(src)
    if not identifier then
        print('[FW] SaveInventory: No character identifier for player ' .. src)
        return
    end
    
    -- Erstelle Kopie ohne Money (Money wird nicht in DB gespeichert)
    local invCopy = {}
    for itemName, itemData in pairs(inventory or {}) do
        if itemName ~= 'money' then
            invCopy[itemName] = itemData
        end
    end
    
    local invJSON = json.encode(invCopy)
    MySQL.query(
        'UPDATE players SET inventory = ? WHERE identifier = ?',
        { invJSON, identifier },
        function(affected)
            if cb then cb(affected) end
        end
    )
end

function FW.Inventory.AddItem(src, itemName, amount, metadata, slot)
    local identifier = exports['fw_core']:GetCharacterIdentifier(src) or 'Unknown'
    amount = tonumber(amount or 1)
    local itemDef = FW.Inventory.List[itemName]
    if not itemDef then
        print(('[FW] AddItem: Item "%s" existiert nicht in der itemlist.json!'):format(itemName))
        return
    end

    FW.Inventory.GetInventory(src, function(inventory)
        if not inventory[itemName] then
            -- Finde freien Slot falls kein Slot angegeben wurde
            if slot == nil then
                local usedSlots = {}
                for _, item in pairs(inventory) do
                    if item.slot ~= nil then
                        usedSlots[item.slot] = true
                    end
                end
                
                -- Finde ersten freien Slot (0-49)
                for i = 0, 49 do
                    if not usedSlots[i] then
                        slot = i
                        break
                    end
                end
                
                if slot == nil then slot = 0 end -- Fallback
            end
            
            inventory[itemName] = {
                label = itemDef.label,
                itemweight = itemDef.itemweight * amount,
                type = itemDef.type,
                canUse = itemDef.canUse,
                amount = 0,
                metadata = {},
                slot = slot -- Speichere Slot-Position
            }
        end
        inventory[itemName].amount = inventory[itemName].amount + amount
        if metadata then inventory[itemName].metadata = metadata end
        if slot ~= nil and inventory[itemName].slot == nil then 
            inventory[itemName].slot = slot -- Update Slot falls angegeben und noch nicht gesetzt
        end

        SaveInventory(src, inventory, function()
            print(('[FW] %dx %s (%s) zu %s hinzugefügt. Neue Menge: %d (Slot: %s)'):format(
                amount,
                itemDef.label,
                itemName,
                identifier,
                inventory[itemName].amount,
                tostring(inventory[itemName].slot)
            ))
        end)
    end)
end

function FW.Inventory.RemoveItem(src, itemName, amount)
    local identifier = exports['fw_core']:GetCharacterIdentifier(src) or 'Unknown'
    amount = tonumber(amount) or 0
    FW.Inventory.GetInventory(src, function(inventory)

        if not inventory[itemName] then 
            print(('[FW] %s nicht im Inventar gefunden.'):format(itemName))
            return
        end
        
        if amount == 0 then amount = inventory[itemName].amount end
        
        if inventory[itemName].amount < amount then
            print(('[FW] Zu wenig %s im Inventar, Aktuell: %d'):format(
                itemName,
                inventory[itemName].amount
            ))
            return
        end
        
        if (inventory[itemName].amount - amount) < 0 then
            print('[FW] Menge darf nicht weniger als 0 sein')
            return
        end
        
        inventory[itemName].amount = inventory[itemName].amount - amount
        if inventory[itemName].amount == 0 then inventory[itemName] = nil end

        SaveInventory(src, inventory, function()
            print(('[FW] %dx %s von %s entfernt.'):format(amount, itemName, identifier))
        end)
    end)
end

RegisterNetEvent('fw:inventory:LoadItemList', function()
    FW.Inventory.LoadItems()
end)

RegisterNetEvent('fw:inventory:AddItemSelf', function(itemName, amount, metadata)
    FW.Inventory.AddItem(source, itemName, amount, metadata)
end)

RegisterNetEvent('fw:inventory:RemoveItemSelf', function (itemName, amount)
    FW.Inventory.RemoveItem(source, itemName, amount)
end)

-- Manuelles Inventar speichern (nach Close mit Delay)
RegisterNetEvent('fw:inventory:saveInventory', function()
    local src = source
    print('[FW Server] Manuelles Speichern für Spieler:', src)
    
    FW.Inventory.GetInventory(src, function(inventory)
        if inventory then
            SaveInventory(src, inventory, function(result)
                -- MySQL.query gibt ein result object zurück, nicht nur affected rows
                if result then
                    print('[FW Server] ✅ Inventar erfolgreich gespeichert für Spieler:', src)
                else
                    print('[FW Server] ⚠️ Inventar-Speicherung fehlgeschlagen für Spieler:', src)
                end
            end)
        end
    end)
end)

-- Callback: Inventar an Client senden
FW.RegisterServerCallback('fw:inventory:getInventoryData', function(source, cb)
    local src = source
    print('[FW Server] getInventoryData callback called for player:', src)

    FW.Inventory.GetInventory(src, function(inventory)
        inventory = inventory or {}
        
        -- Füge automatisch das money Item mit der aktuellen Bargeld-Menge hinzu
        local Player = FW.GetPlayer(src)
        local cash = 0
        if Player then
            cash = Player.money.cash or 0
            local moneyDef = FW.Inventory.List['money']
            if moneyDef and cash > 0 then
                inventory['money'] = {
                    name = 'money',
                    label = moneyDef.label,
                    itemweight = moneyDef.itemweight,
                    type = moneyDef.type,
                    canUse = moneyDef.canUse,
                    amount = cash
                }
            end
        end
        
        print('[FW Server] Sending inventory to client with', cash, 'cash')
        cb(inventory)
    end)
end)

-- Callback: Ground Items in der Nähe abrufen
FW.RegisterServerCallback('fw:inventory:getGroundItems', function(source, cb)
    local src = source
    local playerPed = GetPlayerPed(src)
    local playerCoords = GetEntityCoords(playerPed)
    local nearbyItems = {}
    
    for id, groundItem in pairs(FW.GroundItems) do
        local distance = #(playerCoords - groundItem.coords)
        if distance < 5.0 then
            nearbyItems[groundItem.itemName] = {
                name = groundItem.itemName,
                label = groundItem.label,
                amount = groundItem.amount,
                itemweight = groundItem.itemweight,
                type = groundItem.type,
                canUse = groundItem.canUse,
                id = id
            }
        end
    end
    
    print('[FW Server] Ground items near player:', json.encode(nearbyItems))
    cb(nearbyItems)
end)

-------------------------------------------------
-- Item benutzen
-------------------------------------------------
RegisterNetEvent('fw:inventory:useItem', function(itemName)
    local src = source
    if type(itemName) ~= "string" or itemName == "" then
        print(('[FW] useItem: ungültiger itemName von %s'):format(src))
        return
    end

    print(('[FW] Spieler %s benutzt Item: %s'):format(src, itemName))

    local itemDef = FW.Inventory.List[itemName]

    if not itemDef then
        TriggerClientEvent('fw:client:notify', src, 'Unbekanntes Item.')
        return
    end

    if not itemDef.canUse then
        TriggerClientEvent('fw:client:notify', src, 'Du kannst das nicht benutzen.')
        return
    end

    if not FW.Inventory.HasItem or not FW.Inventory.HasItem(src, itemName, 1) then
        TriggerClientEvent('fw:client:notify', src, 'Du besitzt dieses Item nicht.')
        return
    end

    TriggerClientEvent('fw:client:notify', src, 'Du benutzt ' .. (itemDef.label or itemName))
    FW.Inventory.RemoveItem(src, itemName, 1)

    FW.Inventory.GetInventory(src, function(inv)
        TriggerClientEvent('fw:inventory:refresh', src, inv or {})
    end)
end)

-------------------------------------------------
-- Item wegwerfen (auf den Boden legen)
-------------------------------------------------
RegisterNetEvent('fw:inventory:dropItem', function(itemName, amount)
    local src = source
    amount = tonumber(amount) or 1
    if amount <= 0 then amount = 1 end

    if type(itemName) ~= "string" or itemName == "" then
        print(('[FW] dropItem: ungültiger itemName von %s'):format(src))
        return
    end

    local itemDef = FW.Inventory.List[itemName]
    if not itemDef then
        print(('[FW] dropItem: Item %s nicht in itemlist.json gefunden'):format(itemName))
        return
    end

    -- Prüfe erst ob Item im Inventar existiert
    FW.Inventory.GetInventory(src, function(inventory)
        if not inventory[itemName] then
            print(('[FW] dropItem: %s nicht im Inventar von Spieler %s'):format(itemName, src))
            TriggerClientEvent('fw:client:notify', src, 'Du hast dieses Item nicht.')
            return
        end

        if inventory[itemName].amount < amount then
            print(('[FW] dropItem: Nicht genug %s im Inventar (hat %d, will %d)'):format(itemName, inventory[itemName].amount, amount))
            TriggerClientEvent('fw:client:notify', src, 'Nicht genug Items.')
            return
        end

        -- Item aus Inventar entfernen
        inventory[itemName].amount = inventory[itemName].amount - amount
        if inventory[itemName].amount == 0 then
            inventory[itemName] = nil
        end

        -- Inventar speichern
        local identifier = exports['fw_core']:GetCharacterIdentifier(src)
        if not identifier then return end
        
        local invJSON = json.encode(inventory or {})
        MySQL.query('UPDATE players SET inventory = ? WHERE identifier = ?', { invJSON, identifier }, function()
            -- Item auf den Boden legen
            local playerPed = GetPlayerPed(src)
            local playerCoords = GetEntityCoords(playerPed)
            local groundItemId = GenerateGroundItemId()
            
            FW.GroundItems[groundItemId] = {
                itemName = itemName,
                label = itemDef.label,
                amount = amount,
                itemweight = itemDef.itemweight,
                type = itemDef.type,
                canUse = itemDef.canUse,
                coords = playerCoords,
                timestamp = os.time()
            }
            
            print(('[FW] Item %s (x%d) auf den Boden gelegt bei %s'):format(itemName, amount, playerCoords))

            -- Inventar refreshen
            TriggerClientEvent('fw:inventory:refresh', src, inventory or {})
            
            -- Ground-Items aktualisieren
            local nearbyGroundItems = GetNearbyGroundItems(src, 5.0)
            TriggerClientEvent('fw:inventory:updateGroundItems', src, nearbyGroundItems)
        end)
    end)
end)

-------------------------------------------------
-- Item vom Boden aufheben
-------------------------------------------------
RegisterNetEvent('fw:inventory:pickupItem', function(itemName, amount)
    local src = source
    amount = tonumber(amount) or 1
    if amount <= 0 then amount = 1 end

    if type(itemName) ~= "string" or itemName == "" then
        print(('[FW] pickupItem: ungültiger itemName von %s'):format(src))
        return
    end

    local playerPed = GetPlayerPed(src)
    local playerCoords = GetEntityCoords(playerPed)
    local foundItem = nil
    local foundId = nil
    
    -- Finde das Item in der Nähe
    for id, groundItem in pairs(FW.GroundItems) do
        if groundItem.itemName == itemName then
            local distance = #(playerCoords - groundItem.coords)
            if distance < 5.0 then
                foundItem = groundItem
                foundId = id
                break
            end
        end
    end
    
    if not foundItem then
        TriggerClientEvent('fw:client:notify', src, 'Item nicht in der Nähe gefunden.')
        return
    end
    
    -- Entferne oder reduziere das Item vom Boden
    if foundItem.amount <= amount then
        FW.GroundItems[foundId] = nil
        amount = foundItem.amount
    else
        FW.GroundItems[foundId].amount = FW.GroundItems[foundId].amount - amount
    end
    
    -- Füge Item zum Spieler-Inventar hinzu (ohne Slot, Client findet freien Slot)
    FW.Inventory.AddItem(src, itemName, amount, nil, nil)
    
    print(('[FW] Spieler %s hat %dx %s vom Boden aufgehoben'):format(src, amount, itemName))
    
    -- Warte kurz damit AddItem Zeit hat, das Inventar zu aktualisieren
    Citizen.Wait(100)
    
    FW.Inventory.GetInventory(src, function(inv)
        print('[FW] Sende Inventar-Update nach Pickup:', json.encode(inv or {}))
        TriggerClientEvent('fw:inventory:refresh', src, inv or {})
        
        -- Ground-Items aktualisieren
        local nearbyGroundItems = GetNearbyGroundItems(src, 5.0)
        TriggerClientEvent('fw:inventory:updateGroundItems', src, nearbyGroundItems)
    end)
end)

-------------------------------------------------
-- Item an NPC geben (simuliert)
-------------------------------------------------
RegisterNetEvent('fw:inventory:giveToNPC', function(itemName, amount)
    local src = source
    amount = tonumber(amount) or 1
    
    if type(itemName) ~= "string" or itemName == "" then
        print(('[FW] giveToNPC: ungültiger itemName von %s'):format(src))
        return
    end

    print(('[FW] Spieler %s gibt %dx %s an NPC'):format(src, amount, itemName))

    -- Spezielle Behandlung für Geld
    if itemName == 'money' then
        local Player = FW.GetPlayer(src)
        if Player then
            local currentCash = Player.money.cash or 0
            if currentCash >= amount then
                Player.removeMoney('cash', amount)
                TriggerClientEvent('fw:client:notify', src, ('Du gibst $%d an den NPC.'):format(amount))
                print(('[FW] Spieler %s gibt $%d an NPC (Bargeld entfernt)'):format(src, amount))
            else
                TriggerClientEvent('fw:client:notify', src, 'Nicht genug Bargeld.')
                print(('[FW] Spieler %s hat nicht genug Bargeld (%d von %d)'):format(src, currentCash, amount))
            end
        end
    else
        -- Normale Items entfernen
        FW.Inventory.RemoveItem(src, itemName, amount)
        TriggerClientEvent('fw:client:notify', src, ('Du gibst %dx %s an den NPC.'):format(amount, itemName))
    end

    -- Refresh Inventar
    FW.Inventory.GetInventory(src, function(invSrc)
        TriggerClientEvent('fw:inventory:refresh', src, invSrc or {})
    end)
end)

-------------------------------------------------
-- Item an einen anderen Spieler geben
-------------------------------------------------
RegisterNetEvent('fw:inventory:giveItem', function(itemName, amount, targetId)
    local src = source
    amount = tonumber(amount) or 1
    if amount <= 0 then amount = 1 end

    if type(itemName) ~= "string" or itemName == "" then
        print(('[FW] giveItem: ungültiger itemName von %s'):format(src))
        return
    end

    if not targetId then
        TriggerClientEvent('fw:client:notify', src, 'Kein Zielspieler angegeben.')
        return
    end

    local target = tonumber(targetId)
    if not target or not GetPlayerName(target) then
        TriggerClientEvent('fw:client:notify', src, 'Zielspieler nicht gefunden.')
        return
    end

    if FW.Inventory.GetItemCount and FW.Inventory.GetItemCount(src, itemName) < amount then
        TriggerClientEvent('fw:client:notify', src, 'Du hast nicht genug davon.')
        return
    end

    FW.Inventory.RemoveItem(src, itemName, amount)
    FW.Inventory.AddItem(target, itemName, amount)

    TriggerClientEvent('fw:client:notify', src, ('Du gibst %d× %s an %s.'):format(
        amount, itemName, GetPlayerName(target)
    ))
    TriggerClientEvent('fw:client:notify', target, ('Du hast %d× %s erhalten.'):format(
        amount, itemName
    ))

    FW.Inventory.GetInventory(src, function(invSrc)
        TriggerClientEvent('fw:inventory:refresh', src, invSrc or {})
    end)

    FW.Inventory.GetInventory(target, function(invTarget)
        TriggerClientEvent('fw:inventory:refresh', target, invTarget or {})
    end)
end)

-- Event: Item zwischen Slots verschieben (Modern Inventory - Name-basiert)
RegisterNetEvent('fw:inventory:moveItem', function(fromSlot, toSlot)
    local src = source
    fromSlot = tonumber(fromSlot)
    toSlot = tonumber(toSlot)

    if not fromSlot or not toSlot or fromSlot == toSlot then
        print('[FW] moveItem: ungültige Slots')
        return
    end

    FW.Inventory.GetInventory(src, function(inventory)
        if not inventory then
            print('[FW] moveItem: Kein Inventar gefunden für Spieler ' .. src)
            return
        end

        local fromItemData = nil
        local toItemData = nil
        local fromItemName = nil
        local toItemName = nil
        
        for name, data in pairs(inventory) do
            if data.slot == fromSlot then
                fromItemData = data
                fromItemName = name
            end
            if data.slot == toSlot then
                toItemData = data
                toItemName = name
            end
        end

        if not fromItemName then
            print(('[FW] moveItem: Kein Item in Slot %d gefunden'):format(fromSlot))
            return
        end

        -- Money darf nicht verschoben werden
        if fromItemName == 'money' or toItemName == 'money' then
            print('[FW] moveItem: Money kann nicht verschoben werden')
            return
        end

        print(('[FW] moveItem: Verschiebe %s von Slot %d zu Slot %d'):format(fromItemName, fromSlot, toSlot))

        -- Items tauschen oder verschieben
        if toItemName then
            -- Swap: Tausche die Slot-Positionen
            fromItemData.slot = toSlot
            toItemData.slot = fromSlot
            print(('[FW] Swap: %s ↔ %s'):format(fromItemName, toItemName))
        else
            -- Move: Verschiebe zu leerem Slot
            fromItemData.slot = toSlot
            print(('[FW] Move: %s → Slot %d'):format(fromItemName, toSlot))
        end

        -- In DB speichern (SaveInventory filtert Money automatisch raus)
        SaveInventory(src, inventory, function()
            print(('[FW] Slots aktualisiert für Spieler %s'):format(src))
            
            -- Hole aktuelles Inventar mit Money für Refresh
            FW.Inventory.GetInventory(src, function(refreshInventory)
                -- Füge Money dynamisch hinzu
                local Player = FW.GetPlayer(src)
                if Player then
                    local cash = Player.money.cash or 0
                    local moneyDef = FW.Inventory.List['money']
                    if moneyDef and cash > 0 then
                        refreshInventory['money'] = {
                            name = 'money',
                            label = moneyDef.label,
                            itemweight = moneyDef.itemweight,
                            type = moneyDef.type,
                            canUse = moneyDef.canUse,
                            amount = cash
                        }
                    end
                end
                
                TriggerClientEvent('fw:inventory:refresh', src, refreshInventory)
            end)
        end)
    end)
end)

-- Event: Inventar-Reihenfolge aktualisieren (Vuedraggable)
RegisterNetEvent('fw:inventory:updateOrder', function(slots)
    local src = source
    
    if not slots or type(slots) ~= 'table' then
        print('[FW] updateOrder: ungültige Slots')
        return
    end

    local identifier = exports['fw_core']:GetCharacterIdentifier(src)
    if not identifier then
        print('[FW] updateOrder: Kein Character Identifier für Spieler ' .. src)
        return
    end

    -- Konvertiere Array zu name-basiertem Inventar mit Slot-Property
    FW.Inventory.GetInventory(src, function(inventory)
        -- Update slot property für alle Items
        for itemName, itemData in pairs(inventory) do
            itemData.slot = nil -- Reset erstmal alle
        end
        
        -- Setze die neuen Slot-Positionen
        for i, item in ipairs(slots) do
            if item and item.name and inventory[item.name] then
                local slotIndex = i - 1 -- Lua ist 1-basiert, Client will 0-basiert
                inventory[item.name].slot = slotIndex
            end
        end
        
        SaveInventory(src, inventory, function()
            print(('[FW] Slot-Positionen aktualisiert für Spieler %s'):format(src))
            TriggerClientEvent('fw:inventory:refresh', src, inventory)
        end)
    end)
end)

-- Event: Items stacken (gleiche Items zusammenführen)
RegisterNetEvent('fw:inventory:stackItems', function(fromSlot, toSlot, itemName)
    local src = source
    fromSlot = tonumber(fromSlot)
    toSlot = tonumber(toSlot)

    if not fromSlot or not toSlot or fromSlot == toSlot or not itemName then
        print('[FW] stackItems: ungültige Parameter')
        return
    end

    local identifier = exports['fw_core']:GetCharacterIdentifier(src)
    if not identifier then
        print('[FW] stackItems: Kein Character Identifier für Spieler ' .. src)
        return
    end

    MySQL.single('SELECT inventory FROM players WHERE identifier = ?', { identifier }, function(row)
        if not row then return end

        local inventory = {}
        if row.inventory and row.inventory ~= '' then
            local ok, decoded = pcall(json.decode, row.inventory)
            if ok and type(decoded) == 'table' then
                inventory = decoded
            end
        end

        local fromItem = inventory[tostring(fromSlot)]
        local toItem = inventory[tostring(toSlot)]

        -- Prüfe ob beide Items existieren und gleich sind
        if fromItem and toItem and fromItem.name == itemName and toItem.name == itemName then
            -- Stacke die Mengen
            toItem.amount = toItem.amount + fromItem.amount
            toItem.itemweight = (FW.Inventory.List[itemName] and FW.Inventory.List[itemName].itemweight or toItem.itemweight) * toItem.amount
            
            -- Entferne das from-Item
            inventory[tostring(fromSlot)] = nil
            
            print(('[FW] Items gestackt: %s von Slot %d zu Slot %d. Neue Menge: %d'):format(itemName, fromSlot, toSlot, toItem.amount))
        end

        -- In DB speichern
        local invJSON = json.encode(inventory)
        MySQL.update('UPDATE players SET inventory = ? WHERE identifier = ?', { invJSON, identifier }, function(affectedRows)
            if affectedRows > 0 then
                TriggerClientEvent('fw:inventory:refresh', src, inventory)
            end
        end)
    end)
end)