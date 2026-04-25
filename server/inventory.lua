FW = FW or {}
FW.Inventory = FW.Inventory or {}
FW.Inventory.List = FW.Inventory.List or {}
FW.GroundItems = FW.GroundItems or {}
FW.Equipment = FW.Equipment or {}
FW.EquipmentConfig = FW.EquipmentConfig or {}

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

local FORCE_NON_STACKABLE_TYPES = {
    weapon = true,
    vest = true,
    armor = true,
    backpack = true,
    large_bag = true,
    hip_bag = true,
    small_bag = true,
    bag = true
}

local function IsForceNonStackableItem(item)
    if not item or type(item) ~= 'table' then
        return false
    end

    if item.hasStorage == true then
        return true
    end

    if item.equipmentId ~= nil then
        return true
    end

    if item.equipSlot ~= nil then
        return true
    end

    local itemType = item.type or 'item'
    if FORCE_NON_STACKABLE_TYPES[itemType] then
        return true
    end

    local metadata = item.metadata or {}
    if metadata.serial or metadata.plate or metadata.durability or metadata.ammo or metadata.owner or metadata.equipmentId then
        return true
    end

    return false
end

local function NormalizeStackable(item)
    -- Sicherheitsnetz:
    -- Diese Funktion darf nur mit einem Item-Table arbeiten.
    -- Wenn aus Versehen true/false/nil/string übergeben wird, blocken wir stackable.
    if type(item) ~= 'table' then
        print(('[FW Inventory] WARNING NormalizeStackable bekam kein Item-Table, sondern: %s'):format(type(item)))
        return false
    end

    if IsForceNonStackableItem(item) then
        return false
    end

    return item.stackable == true
end

function FW.Inventory.LoadItems()
    local filename = "configs/itemlist.json"
    local items = LoadJsonFromResource(filename)

    for _, item in ipairs(items) do
        if item.name and item.label then
            local normalizedItem = {
            name = item.name,
            label = item.label,
            emoji = item.emoji or '📦',
            itemweight = item.itemweight or 0,
            type = item.type or 'item',
            canUse = item.canUse or false,
            hasStorage = item.hasStorage or false,
            equipSlot = item.equipSlot or nil,
            equipmentId = item.equipmentId or nil,
            metadata = item.metadata or {}
        }

        normalizedItem.stackable = NormalizeStackable(normalizedItem)

        FW.Inventory.List[item.name] = normalizedItem
            --print(('[FW] Item mit dem Label: %s erfolgreich registriert.'):format(item.label))
        else
            print('[FW] Ungltiger Item-Eintrag in der itemlist.json (kein name/label).')
        end
    end

    if FW.EquipmentConfig and FW.EquipmentConfig.equipmentItems then
        local mergedEquipment = 0

        for itemName, equipItem in pairs(FW.EquipmentConfig.equipmentItems) do
            FW.Inventory.List[itemName] = FW.Inventory.List[itemName] or {}

            FW.Inventory.List[itemName].name = equipItem.name or itemName
            FW.Inventory.List[itemName].label = equipItem.label or FW.Inventory.List[itemName].label or itemName
            FW.Inventory.List[itemName].emoji = equipItem.emoji or FW.Inventory.List[itemName].emoji or '📦'
            FW.Inventory.List[itemName].itemweight = equipItem.itemweight or FW.Inventory.List[itemName].itemweight or 0
            FW.Inventory.List[itemName].type = equipItem.type or FW.Inventory.List[itemName].type or 'item'
            FW.Inventory.List[itemName].equipSlot = equipItem.equipSlot or FW.Inventory.List[itemName].equipSlot
            FW.Inventory.List[itemName].hasStorage = equipItem.hasStorage or false
            FW.Inventory.List[itemName].canUse = equipItem.canUse or FW.Inventory.List[itemName].canUse or false

            -- Equipment niemals stackbar
            FW.Inventory.List[itemName].stackable = false

            mergedEquipment = mergedEquipment + 1
        end

        print(('[FW] ✅ %d Equipment-Items in Inventory.List gemerged.'):format(mergedEquipment))
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
        if existingItem and existingItem.name == itemName and NormalizeStackable(itemDef) then
            existingItem.quantity = (existingItem.quantity or 1) + amount
        else
            slots[slot] = {
                name = itemName,
                label = itemDef.label,
                emoji = itemDef.emoji or '📦',
                quantity = amount,
                itemweight = itemDef.itemweight,
                type = itemDef.type,
                canUse = itemDef.canUse,
                hasStorage = itemDef.hasStorage or false,
                equipSlot = itemDef.equipSlot or nil,
                equipmentId = itemDef.equipmentId or nil,
                metadata = metadata or {},
                stackable = NormalizeStackable(itemDef)
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
                stackable = NormalizeStackable(itemDef),
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
    if FW.Equipment and FW.Equipment.LoadConfig then
        FW.Equipment.LoadConfig()
    end
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
    FW.Debug('Inventory', 'getInventoryData', src)

    local Player = FW.GetPlayer(src)
    if not Player then
        FW.Debug('Inventory', 'No player object', src)
        cb({})
        return
    end

    local slots = Player.getInventory()
    
    -- Build object format: { itemName_slotX: { slot, label, emoji, amount, ... } }
    -- Use unique keys to support multiple items with same name in different slots
    local inventoryObject = {}
    local itemCount = 0
    
    for i = 1, 50 do
        local item = slots[i]
        if item and type(item) == 'table' and item.name and item.name ~= 'money' then
            -- Valid item, add to object with unique key: itemName_slot0, itemName_slot5, etc.
            local uniqueKey = item.name .. '_slot' .. (i - 1)
            
            -- BUGFIX: Lookup item in itemlist.json (by name OR by label for legacy items)
            local itemData = FW.Inventory.List[item.name]
            
            -- Legacy Fix: Wenn Item nicht gefunden, suche nach Label
            if not itemData then
                for itemName, data in pairs(FW.Inventory.List) do
                    if data.label == item.name then
                        itemData = data
                        FW.Debug('Inventory', 'Legacy item fix', item.name, '→', itemName)
                        break
                    end
                end
            end
            
            -- Use itemlist.json data if found, otherwise use DB data
            local finalType = 'item'
            local finalEmoji = item.emoji or '📦'
            local finalWeight = item.itemweight or 0
            local finalCanUse = item.canUse or false
            local finalHasStorage = item.hasStorage or false
            local finalEquipSlot = item.equipSlot
            local finalEquipmentId = item.equipmentId
            local finalMetadata = item.metadata or {}

            if itemData then
                finalType = itemData.type or finalType
                finalEmoji = itemData.emoji or finalEmoji
                finalWeight = itemData.itemweight or finalWeight
                finalCanUse = itemData.canUse or finalCanUse
                finalHasStorage = itemData.hasStorage or finalHasStorage
                finalEquipSlot = itemData.equipSlot or finalEquipSlot
                finalEquipmentId = itemData.equipmentId or finalEquipmentId
            end

            local finalStackable = NormalizeStackable({
                name = item.name,
                type = finalType,
                hasStorage = finalHasStorage,
                equipSlot = finalEquipSlot,
                equipmentId = finalEquipmentId,
                metadata = finalMetadata,

                -- wichtig:
                -- stackable darf true sein, wird aber durch NormalizeStackable bei Equipment wieder false
                stackable = itemData and itemData.stackable or item.stackable
            })
            
            inventoryObject[uniqueKey] = {
                slot = i - 1, -- Frontend uses 0-indexed
                name = item.name, -- Original item name (keep for compatibility)
                label = item.label,
                emoji = finalEmoji,
                amount = item.quantity or 1,
                itemweight = finalWeight,
                type = finalType,
                canUse = finalCanUse,
                stackable = finalStackable,
                metadata = item.metadata or {}
            }
            itemCount = itemCount + 1
        end
    end
    
    -- Get equipment slots
    local equipment = Player.getEquipment()
    local equipmentData = {
        vest = nil,
        weapon = nil,
        bag1 = nil,
        bag2 = nil
    }
    
    -- Convert equipment to client format
    for slot, item in pairs(equipment) do
        if item and item.name then
            local itemData = FW.Inventory.List[item.name]
            equipmentData[slot] = {
                name = item.name,
                label = item.label or (itemData and itemData.label) or item.name,
                emoji = item.emoji or (itemData and itemData.emoji) or '📦',
                quantity = item.quantity or 1,
                itemweight = item.itemweight or (itemData and itemData.itemweight) or 0,
                type = item.type or (itemData and itemData.type) or 'item',
                canUse = item.canUse or (itemData and itemData.canUse) or false,
                metadata = item.metadata or {},
                equipmentId = item.equipmentId -- Important for storage bags
            }
        end
    end
    
    FW.Debug('Inventory', 'Sending items', itemCount, '+ equipment')
    cb({ 
        inventory = inventoryObject,
        equipment = equipmentData
    })
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
    
    local itemCount = 0
    for _ in pairs(nearbyItems) do itemCount = itemCount + 1 end
    FW.Debug('Inventory', 'Ground items nearby', itemCount)
    cb(nearbyItems)
end)

-------------------------------------------------
-- Item benutzen
-------------------------------------------------
RegisterNetEvent('fw:inventory:useItem', function(itemName)
    local src = source
    if type(itemName) ~= "string" or itemName == "" then
        FW.Debug('Inventory', 'useItem invalid', src)
        return
    end

    FW.Debug('Inventory', 'useItem', itemName)

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
        FW.Debug('Inventory', 'dropItem invalid', src)
        return
    end
    
    FW.Debug('Inventory', 'dropItem', itemName, amount)

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
    
    -- Equipment slots are strings ('vest', 'weapon', 'bag1', 'bag2')
    -- Normal slots are numbers (0-49 from frontend)
    local fromIsEquip = type(fromSlot) == 'string'
    local toIsEquip = type(toSlot) == 'string'
    
    -- Convert numeric slots to 1-based for Lua
    if not fromIsEquip then
        fromSlot = tonumber(fromSlot)
        if fromSlot then fromSlot = fromSlot + 1 end
    end
    if not toIsEquip then
        toSlot = tonumber(toSlot)
        if toSlot then toSlot = toSlot + 1 end
    end
    
    if not fromSlot or not toSlot or fromSlot == toSlot then
        print('[FW] moveItem: ungültige Slots')
        return
    end
    
    -- Validate numeric slot ranges
    if not fromIsEquip and (fromSlot < 1 or fromSlot > 50) then
        print('[FW] moveItem: fromSlot außerhalb des Bereichs (1-50)')
        return
    end
    if not toIsEquip and (toSlot < 1 or toSlot > 50) then
        print('[FW] moveItem: toSlot außerhalb des Bereichs (1-50)')
        return
    end
    
    print(('[FW Equipment] Move: %s → %s'):format(
        fromIsEquip and fromSlot or ('slot' .. (fromSlot-1)),
        toIsEquip and toSlot or ('slot' .. (toSlot-1))
    ))

    local Player = FW.GetPlayer(src)
    if not Player then
        print('[FW] moveItem: Kein Player object für ' .. src)
        return
    end

    -- Get current inventory and equipment
    local slots = Player.getInventory()
    local equipment = Player.getEquipment()
    
    -- Create copies
    local slotsCopy = {}
    for i = 1, 50 do
        local slot = slots[i]
        if slot and type(slot) == 'table' and slot.name then
            slotsCopy[i] = slot
        else
            slotsCopy[i] = nil
        end
    end
    
    local equipmentCopy = {
        vest = equipment.vest,
        weapon = equipment.weapon,
        bag1 = equipment.bag1,
        bag2 = equipment.bag2
    }
    
    -- Get items from their locations
    local fromItem = nil
    if fromIsEquip then
        fromItem = equipmentCopy[fromSlot]
    else
        fromItem = slotsCopy[fromSlot]
    end
    
    local toItem = nil
    if toIsEquip then
        toItem = equipmentCopy[toSlot]
    else
        toItem = slotsCopy[toSlot]
    end

    if not fromItem then
        print(('[FW Equipment] No item in source slot'):format())
        return
    end

    -- DEBUG: Print full item data
    print(('[FW Equipment] DEBUG fromItem: name=%s, label=%s, type=%s'):format(
        tostring(fromItem.name), 
        tostring(fromItem.label), 
        tostring(fromItem.type)
    ))

    -- Money darf nicht verschoben werden
    if fromItem.name == 'money' or (toItem and type(toItem) == 'table' and toItem.name == 'money') then
        print('[FW] moveItem: Money kann nicht verschoben werden')
        return
    end

    -- Validate equipment slot compatibility
    if toIsEquip then
        local itemName = fromItem.name or fromItem.itemName
        local itemData = FW.Equipment.GetItemData(itemName)

        local slotConfig = FW.EquipmentConfig
            and FW.EquipmentConfig.equipmentSlots
            and FW.EquipmentConfig.equipmentSlots[toSlot]

        local itemType = nil
        local itemEquipSlot = nil

        if itemData then
            itemType = itemData.type
            itemEquipSlot = itemData.equipSlot
        end

        -- Fallback auf Itemdaten aus Inventar / itemlist.json
        itemType = itemType or fromItem.type
        itemEquipSlot = itemEquipSlot or fromItem.equipSlot

        local allowed = false

        -- Direkter equipSlot-Match: backpack_medium -> bag1
        if itemEquipSlot and itemEquipSlot == toSlot then
            allowed = true
        end

        -- Fallback über allowedTypes: type backpack darf in bag1
        if not allowed and slotConfig and slotConfig.allowedTypes and itemType then
            for _, allowedType in ipairs(slotConfig.allowedTypes) do
                if allowedType == itemType then
                    allowed = true
                    break
                end
            end
        end

        print(('[FW Equipment] Validate equip: item=%s type=%s equipSlot=%s target=%s result=%s'):format(
            tostring(itemName),
            tostring(itemType),
            tostring(itemEquipSlot),
            tostring(toSlot),
            allowed and 'ALLOWED' or 'BLOCKED'
        ))

        if not allowed then
            print(('[FW Equipment] Item %s cannot be equipped to %s slot'):format(tostring(itemName), tostring(toSlot)))
            TriggerClientEvent('fw:client:notify', src, 'Ungültiges Item für diesen Slot', 'error')
            return
        end

        -- Equipment-Metadaten sauber ergänzen
        if itemData then
            fromItem.type = itemData.type or fromItem.type
            fromItem.equipSlot = itemData.equipSlot or fromItem.equipSlot
            fromItem.hasStorage = itemData.hasStorage or fromItem.hasStorage or false
            fromItem.itemweight = itemData.itemweight or fromItem.itemweight or 0
            fromItem.canUse = itemData.canUse or fromItem.canUse or false
            fromItem.stackable = false
        end
    end

    print(('[FW Equipment] Moving %s'):format(fromItem.name))

    -- Handle the move/swap
    if toItem and type(toItem) == 'table' then
        -- Both slots occupied - check if can stack
        if fromItem.name == toItem.name and not toIsEquip then
            -- Stack items (only in inventory, not equipment)
            local totalQuantity = (fromItem.quantity or 1) + (toItem.quantity or 1)
            toItem.quantity = totalQuantity
            
            if fromIsEquip then
                equipmentCopy[fromSlot] = nil
            else
                slotsCopy[fromSlot] = nil
            end
            
            slotsCopy[toSlot] = toItem
            print(('[FW Equipment] Stacked to total: %d'):format(totalQuantity))
        else
            -- Swap items
            if fromIsEquip then
                equipmentCopy[fromSlot] = toItem
            else
                slotsCopy[fromSlot] = toItem
            end
            
            if toIsEquip then
                equipmentCopy[toSlot] = fromItem
            else
                slotsCopy[toSlot] = fromItem
            end
            print('[FW Equipment] Swapped items')
        end
    else
        -- Target slot empty - just move
        if fromIsEquip then
            equipmentCopy[fromSlot] = nil
        else
            slotsCopy[fromSlot] = nil
        end
        
        if toIsEquip then
            equipmentCopy[toSlot] = fromItem
        else
            slotsCopy[toSlot] = fromItem
        end
        print('[FW Equipment] Moved to empty slot')
    end

    -- Update player state
    Player.setInventory(slotsCopy)
    local equipmentSlotNames = { 'vest', 'weapon', 'bag1', 'bag2' }

    for _, slotName in ipairs(equipmentSlotNames) do
        Player.setEquipment(slotName, equipmentCopy[slotName])
    end

    -- Save to database
    SaveInventory(src, slotsCopy, function()
        print(('[FW Equipment] Inventory and equipment saved for player %s'):format(src))
        
        -- Send updated inventory to client
        local inventoryObject = {}
        for i = 1, 50 do
            local item = slotsCopy[i]
            if item and type(item) == 'table' and item.name and item.name ~= 'money' then
                local uniqueKey = item.name .. '_slot' .. (i - 1)
                local itemData = FW.Inventory.List[item.name]
                inventoryObject[uniqueKey] = {
                    slot = i - 1,
                    name = item.name,
                    label = item.label,
                    emoji = item.emoji or (itemData and itemData.emoji) or '📦',
                    amount = item.quantity or 1,
                    itemweight = item.itemweight,
                    type = item.type,
                    canUse = item.canUse,
                    stackable = item.stackable ~= false,
                    metadata = item.metadata or {}
                }
            end
        end
        
        -- Build equipment data for client
        local equipmentData = {
            vest = nil,
            weapon = nil,
            bag1 = nil,
            bag2 = nil
        }
        
        local equipmentSlotNames = { 'vest', 'weapon', 'bag1', 'bag2' }

        for _, slot in ipairs(equipmentSlotNames) do
            local item = equipmentCopy[slot]

            if item and item.name then
                local itemData = FW.Inventory.List[item.name]
                local equipData = FW.Equipment.GetItemData(item.name)

                equipmentData[slot] = {
                    name = item.name,
                    label = item.label or (equipData and equipData.label) or (itemData and itemData.label) or item.name,
                    emoji = item.emoji or (equipData and equipData.emoji) or (itemData and itemData.emoji) or '📦',
                    quantity = item.quantity or 1,
                    itemweight = item.itemweight or (equipData and equipData.itemweight) or (itemData and itemData.itemweight) or 0,
                    type = item.type or (equipData and equipData.type) or (itemData and itemData.type) or 'item',
                    equipSlot = item.equipSlot or (equipData and equipData.equipSlot) or slot,
                    hasStorage = item.hasStorage or (equipData and equipData.hasStorage) or false,
                    canUse = item.canUse or (equipData and equipData.canUse) or (itemData and itemData.canUse) or false,
                    stackable = false,
                    metadata = item.metadata or {},
                    equipmentId = item.equipmentId
                }
            else
                equipmentData[slot] = nil
            end
        end
        
        local itemCount = 0
        for _ in pairs(inventoryObject) do itemCount = itemCount + 1 end
        print(('[FW Equipment] Sending %d items + equipment in refresh'):format(itemCount))
        TriggerClientEvent('fw:inventory:refreshWithEquipment', src, inventoryObject, equipmentData)
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
                    stackable = item.stackable or false,
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