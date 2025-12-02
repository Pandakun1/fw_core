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
                emoji = item.emoji or '📦',
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
    local Player = FW.GetPlayer(src)
    if not Player then
        print('[FW] GetInventory: No player object for ' .. src)
        cb({})
        return
    end
    
    -- Return cached slot-based inventory from Player object
    local slots = Player.getInventory()
    cb(slots or {})
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

local function SaveInventory(src, slotsData, cb)
    local Player = FW.GetPlayer(src)
    if not Player then
        print('[FW] SaveInventory: No player object for ' .. src)
        return
    end
    
    -- Ensure slotsData is a proper array (1-50) with json.null() for empty slots
    local cleanSlots = {}
    for i = 1, 50 do
        if slotsData[i] and type(slotsData[i]) == 'table' and slotsData[i].name then
            -- Valid item, keep it (money excluded from inventory)
            if slotsData[i].name ~= 'money' then
                cleanSlots[i] = slotsData[i]
            else
                cleanSlots[i] = json.null()
            end
        else
            -- Empty slot
            cleanSlots[i] = json.null()
        end
    end
    
    -- Update Player's cached inventory
    Player.setInventory(cleanSlots)
    
    -- Save to database using toRow() + SavePlayer
    local row = Player.toRow()
    FW.DB.SavePlayer(row, function(affected)
        if affected then
            Player.saveClean()
            print('[FW] ✅ Inventory saved for ' .. Player.identifier)
        end
        if cb then cb(affected) end
    end)
end

function FW.Inventory.AddItem(src, itemName, amount, metadata, slot)
    print('[FW AddItem] START - src:', src, 'itemName:', itemName, 'amount:', amount)
    local Player = FW.GetPlayer(src)
    if not Player then
        print('[FW] AddItem: No player object for ' .. src)
        return
    end
    print('[FW AddItem] Player gefunden:', Player.identifier)
    
    amount = tonumber(amount or 1)
    local itemDef = FW.Inventory.List[itemName]
    if not itemDef then
        print(('[FW] AddItem: Item "%s" existiert nicht in der itemlist.json!'):format(itemName))
        return
    end
    print('[FW AddItem] Item definition gefunden:', itemDef.label)

    local slots = Player.getInventory()
    
    -- If slot specified, add to that slot or stack
    if slot ~= nil then
        local existingItem = slots[slot]
        if existingItem and existingItem.name == itemName then
            -- Stack on existing item
            existingItem.quantity = (existingItem.quantity or 1) + amount
        else
            -- Place new item in specified slot
            slots[slot] = {
                name = itemName,
                label = itemDef.label,
                emoji = itemDef.emoji or '📦',
                quantity = amount,
                itemweight = itemDef.itemweight,
                type = itemDef.type,
                canUse = itemDef.canUse,
                metadata = metadata or {}
            }
        end
    else
        -- Find first free slot (1-50)
        local freeSlot = nil
        print('[FW AddItem] Searching for free slot in 50 slots')
        for i = 1, 50 do
            local slotItem = slots[i]
            if not slotItem or slotItem == json.null() or (type(slotItem) == 'table' and not slotItem.name) then
                freeSlot = i
                print('[FW AddItem] Found free slot:', i)
                break
            else
                if i <= 5 then -- Only log first 5 to avoid spam
                    print('[FW AddItem] Slot', i, 'occupied:', slotItem.name or 'unknown')
                end
            end
        end
        
        if freeSlot then
            slots[freeSlot] = {
                name = itemName,
                label = itemDef.label,
                emoji = itemDef.emoji or '📦',
                quantity = amount,
                itemweight = itemDef.itemweight,
                type = itemDef.type,
                canUse = itemDef.canUse,
                metadata = metadata or {}
            }
            slot = freeSlot
        else
            print('[FW] AddItem: Kein freier Slot gefunden!')
            return
        end
    end

    print('[FW AddItem] Rufe SaveInventory auf für Slot:', slot)
    SaveInventory(src, slots, function()
        print(('[FW] ✅ %dx %s zu Slot %d hinzugefügt'):format(amount, itemDef.label, slot))
    end)
end

function FW.Inventory.RemoveItem(src, itemName, amount, fromSlot)
    local Player = FW.GetPlayer(src)
    if not Player then
        print('[FW] RemoveItem: No player object for ' .. src)
        return
    end
    
    amount = tonumber(amount) or 1
    local slots = Player.getInventory()
    
    -- If slot specified, remove from that slot
    if fromSlot then
        local item = slots[fromSlot]
        if not item or item.name ~= itemName then
            print(('[FW] Item %s nicht in Slot %d gefunden'):format(itemName, fromSlot))
            return
        end
        
        if item.quantity < amount then
            print(('[FW] Zu wenig %s in Slot %d (Aktuell: %d)'):format(itemName, fromSlot, item.quantity))
            return
        end
        
        item.quantity = item.quantity - amount
        if item.quantity <= 0 then
            slots[fromSlot] = nil
        end
    else
        -- Find first slot with this item and remove from it
        local found = false
        for slotIdx, item in pairs(slots) do
            if item and item.name == itemName and item.quantity >= amount then
                item.quantity = item.quantity - amount
                if item.quantity <= 0 then
                    slots[slotIdx] = nil
                end
                found = true
                fromSlot = slotIdx
                break
            end
        end
        
        if not found then
            print(('[FW] %s nicht im Inventar gefunden oder zu wenig'):format(itemName))
            return
        end
    end

    SaveInventory(src, slots, function()
        print(('[FW] ✅ %dx %s aus Slot %d entfernt'):format(amount, itemName, fromSlot))
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
    
    local Player = FW.GetPlayer(src)
    if Player then
        local slots = Player.getInventory()
        SaveInventory(src, slots, function(result)
            if result then
                print('[FW Server] ✅ Inventar erfolgreich gespeichert für Spieler:', src)
            else
                print('[FW Server] ⚠️ Inventar-Speicherung fehlgeschlagen für Spieler:', src)
            end
        end)
    end
end)

-- Callback: Inventar an Client senden (Slot-based Array)
FW.RegisterServerCallback('fw:inventory:getInventoryData', function(source, cb)
    local src = source
    print('[FW Server] getInventoryData callback called for player:', src)

    local Player = FW.GetPlayer(src)
    if not Player then
        print('[FW Server] No player object for:', src)
        cb({})
        return
    end

    local slots = Player.getInventory()
    
    -- Debug: Print slots content
    print('[FW Server] Raw slots from player:', json.encode(slots))
    
    -- Build object format: { itemName_slotX: { slot, label, emoji, amount, ... } }
    -- Use unique keys to support multiple items with same name in different slots
    local inventoryObject = {}
    local itemCount = 0
    
    for i = 1, 50 do
        local item = slots[i]
        if item and type(item) == 'table' and item.name and item.name ~= 'money' then
            -- Valid item, add to object with unique key: itemName_slot0, itemName_slot5, etc.
            local uniqueKey = item.name .. '_slot' .. (i - 1)
            inventoryObject[uniqueKey] = {
                slot = i - 1, -- Frontend uses 0-indexed
                name = item.name, -- Original item name
                label = item.label,
                emoji = item.emoji or '📦',
                amount = item.quantity or 1,
                itemweight = item.itemweight or 0,
                type = item.type or 'item',
                canUse = item.canUse or false,
                metadata = item.metadata or {}
            }
            itemCount = itemCount + 1
            print('[FW Server] Adding item:', item.name, 'to slot', i - 1, 'quantity:', item.quantity)
        end
    end
    
    print('[FW Server] Sending', itemCount, 'items as object (money excluded)')
    cb({ inventory = inventoryObject })
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
    -- Frontend sendet 0-basiert, Lua nutzt 1-basiert
    fromSlot = tonumber(fromSlot)
    toSlot = tonumber(toSlot)
    
    if not fromSlot or not toSlot then
        print('[FW] moveItem: fromSlot oder toSlot ist nil')
        return
    end
    
    fromSlot = fromSlot + 1
    toSlot = toSlot + 1
    
    print(('[FW Core] Player %d moving item: slot %d (0-based: %d) -> slot %d (0-based: %d)'):format(src, fromSlot, fromSlot-1, toSlot, toSlot-1))

    if not fromSlot or not toSlot or fromSlot == toSlot then
        print('[FW] moveItem: ungültige Slots')
        return
    end

    if fromSlot < 1 or fromSlot > 50 or toSlot < 1 or toSlot > 50 then
        print('[FW] moveItem: Slots außerhalb des Bereichs (1-50)')
        return
    end

    local Player = FW.GetPlayer(src)
    if not Player then
        print('[FW] moveItem: Kein Player object für ' .. src)
        return
    end

    -- Get current inventory - this returns a reference to the internal table
    local slots = Player.getInventory()
    
    -- Create a deep copy to avoid corrupting state during async save
    -- Filter out json.null() values which are functions/userdata
    local slotsCopy = {}
    for i = 1, 50 do
        local slot = slots[i]
        if slot and type(slot) == 'table' and slot.name then
            slotsCopy[i] = slot
        else
            slotsCopy[i] = nil
        end
    end
    
    local fromItem = slotsCopy[fromSlot]
    local toItem = slotsCopy[toSlot]

    if not fromItem then
        print(('[FW Core] No item in source slot: %d'):format(fromSlot))
        return
    end

    -- Money darf nicht verschoben werden
    if fromItem.name == 'money' or (toItem and type(toItem) == 'table' and toItem.name == 'money') then
        print('[FW] moveItem: Money kann nicht verschoben werden')
        return
    end

    print(('[FW] moveItem: Verschiebe %s von Slot %d zu Slot %d'):format(fromItem.name, fromSlot, toSlot))

    -- Items stacken, tauschen oder verschieben
    if toItem and type(toItem) == 'table' then
        -- Prüfe ob gleicher Item-Typ → Stack
        if fromItem.name == toItem.name then
            -- Stack: Addiere Mengen zusammen
            local totalQuantity = (fromItem.quantity or 1) + (toItem.quantity or 1)
            toItem.quantity = totalQuantity
            slotsCopy[toSlot] = toItem
            slotsCopy[fromSlot] = nil
            print(('[FW] Stack: %s (%d + %d = %d) → Slot %d'):format(
                fromItem.name, 
                fromItem.quantity or 1, 
                (toItem.quantity or 1) - (fromItem.quantity or 1), 
                totalQuantity, 
                toSlot
            ))
        else
            -- Swap: Unterschiedliche Items tauschen
            slotsCopy[fromSlot] = toItem
            slotsCopy[toSlot] = fromItem
            print(('[FW] Swap: %s ↔ %s'):format(fromItem.name, toItem.name))
        end
    else
        -- Move: Verschiebe zu leerem Slot
        slotsCopy[toSlot] = fromItem
        slotsCopy[fromSlot] = nil
        print(('[FW] Move: %s → Slot %d'):format(fromItem.name, toSlot))
    end

    -- Update Player Cache with modified copy
    Player.setInventory(slotsCopy)

    -- In DB speichern
    SaveInventory(src, slotsCopy, function()
        print(('[FW] Slots aktualisiert für Spieler %s'):format(src))
        
        -- Sende aktualisiertes Inventar an Client
        -- Frontend erwartet: { inventory: { itemname_slot0: {slot, label, emoji, amount} } }
        local inventoryObject = {}
        for i = 1, 50 do
            local item = slotsCopy[i]
            if item and type(item) == 'table' and item.name and item.name ~= 'money' then
                -- Unique key: itemname_slot0, itemname_slot1, etc.
                local uniqueKey = item.name .. '_slot' .. (i - 1)
                inventoryObject[uniqueKey] = {
                    slot = i - 1, -- Frontend nutzt 0-basiert
                    name = item.name,
                    label = item.label,
                    emoji = item.emoji or '📦',
                    amount = item.quantity or 1,
                    itemweight = item.itemweight,
                    type = item.type,
                    canUse = item.canUse,
                    metadata = item.metadata or {}
                }
            end
        end
        
        -- Count object keys properly
        local itemCount = 0
        for _ in pairs(inventoryObject) do itemCount = itemCount + 1 end
        print(('[FW] Sending %d items in refresh'):format(itemCount))
        TriggerClientEvent('fw:inventory:refresh', src, inventoryObject)
    end)
end)

-- Event: Inventar-Reihenfolge aktualisieren (nach Mouse-Wheel Splitting)
RegisterNetEvent('fw:inventory:updateInventoryOrder', function(data)
    local src = source
    
    if not data or not data.inventory or type(data.inventory) ~= 'table' then
        print('[FW] updateInventoryOrder: ungültige Daten')
        return
    end

    local Player = FW.GetPlayer(src)
    if not Player then
        print('[FW] updateInventoryOrder: Kein Player object für ' .. src)
        return
    end

    -- Konvertiere Frontend-Array (mit slot property) zu Server-Slot-Array
    local newSlots = {}
    for i = 1, 50 do
        newSlots[i] = nil
    end
    
    for _, item in pairs(data.inventory) do
        if item and item.slot and item.name then
            local slotIndex = tonumber(item.slot) + 1 -- Frontend: 0-based, Server: 1-based
            if slotIndex >= 1 and slotIndex <= 50 then
                newSlots[slotIndex] = {
                    name = item.name,
                    label = item.label or item.name,
                    quantity = item.quantity or item.amount or 1,
                    emoji = item.emoji or '📦',
                    itemweight = item.itemweight or 0,
                    type = item.type or 'item',
                    canUse = item.canUse or false,
                    metadata = item.metadata or {}
                }
            end
        end
    end
    
    print(('[FW] updateInventoryOrder: Aktualisiere Inventar für Spieler %d'):format(src))
    Player.setInventory(newSlots)
    
    -- Speichere in DB
    SaveInventory(src, newSlots, function()
        print('[FW] ✅ Inventar nach Mouse-Wheel-Split gespeichert')
    end)
end)

-- Event: Inventar-Reihenfolge aktualisieren (LEGACY - für Vuedraggable)
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