-- ============================================
-- FW CORE: EQUIPMENT STORAGE SYSTEM
-- ============================================
-- Rucksäcke, Taschen, Bauchtaschen mit eigenem Inventar
-- Item-gebundenes Lager-System
-- ============================================

FW = FW or {}
FW.Equipment = FW.Equipment or {}
FW.EquipmentConfig = FW.EquipmentConfig or {}

-- ============================================
-- EQUIPMENT CONFIG LOADER
-- ============================================

function FW.Equipment.LoadConfig()
    local filename = "configs/equipment.json"
    local config = LoadJsonFromResource(filename)
    
    if not config then
        print('[FW Equipment] ⚠️ Equipment Config konnte nicht geladen werden!')
        return
    end
    
    FW.EquipmentConfig = config
    
    print(('[FW Equipment] ✅ %d Equipment-Items geladen'):format(
        config.equipmentItems and #config.equipmentItems or 0
    ))
end

function FW.Equipment.GetItemData(itemName)
    if not FW.EquipmentConfig.equipmentItems then return nil end
    return FW.EquipmentConfig.equipmentItems[itemName]
end

function FW.Equipment.IsEquipmentItem(itemName)
    return FW.Equipment.GetItemData(itemName) ~= nil
end

function FW.Equipment.HasStorage(itemName)
    local itemData = FW.Equipment.GetItemData(itemName)
    return itemData and itemData.hasStorage == true
end

function FW.Equipment.GetStorageConfig(itemName)
    local itemData = FW.Equipment.GetItemData(itemName)
    if itemData and itemData.storage then
        return itemData.storage
    end
    return nil
end

-- ============================================
-- UNIQUE ID GENERATION
-- ============================================

local function GenerateEquipmentId(itemName)
    local timestamp = os.time()
    local random = math.random(10000, 99999)
    return ('%s_%d_%d'):format(itemName, timestamp, random)
end

-- ============================================
-- EQUIPMENT EQUIP/UNEQUIP
-- ============================================

RegisterNetEvent('fw:inventory:equipItem', function(itemName, fromSlot)
    local src = source
    
    if not FW.Equipment.IsEquipmentItem(itemName) then
        print(('[FW Equipment] ❌ Item "%s" ist kein Equipment-Item'):format(itemName))
        return
    end
    
    local itemData = FW.Equipment.GetItemData(itemName)
    local targetSlot = itemData.equipSlot
    
    print(('[FW Equipment] 🎒 Spieler %s rüstet %s aus (Slot: %s)'):format(src, itemName, targetSlot))
    
    -- Hole Spieler-Inventar
    FW.Inventory.GetInventory(src, function(inventory)
        if not inventory[itemName] or inventory[itemName].amount < 1 then
            TriggerClientEvent('fw:client:notify', src, 'Item nicht gefunden')
            return
        end
        
        -- Prüfe ob Slot bereits belegt
        local currentEquipped = inventory['equipped_' .. targetSlot]
        
        if currentEquipped then
            -- Tausche: Altes Equipment zurück ins Inventar
            -- (wird im Client-Drag&Drop gehandled)
            print(('[FW Equipment] 🔄 Tausche Equipment in Slot %s'):format(targetSlot))
        end
        
        -- Wenn Equipment Storage hat: Erstelle Equipment-Storage Entry
        if itemData.hasStorage then
            local equipmentId = inventory[itemName].equipmentId
            
            -- Falls noch keine ID: Generiere neue
            if not equipmentId then
                equipmentId = GenerateEquipmentId(itemName)
                inventory[itemName].equipmentId = equipmentId
                
                -- Erstelle Equipment-Storage in DB
                local storageConfig = itemData.storage
                MySQL.insert(
                    'INSERT INTO equipment_storage (equipment_id, equipment_type, item_name, max_slots, max_weight, owner, inventory) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    { 
                        equipmentId, 
                        itemData.type, 
                        itemName, 
                        storageConfig.maxSlots, 
                        storageConfig.maxWeight,
                        exports['fw_core']:GetCharacterIdentifier(src),
                        '{}' 
                    },
                    function(insertId)
                        print(('[FW Equipment] ✅ Equipment-Storage erstellt: %s (ID: %s)'):format(itemName, equipmentId))
                    end
                )
            end
            
            print(('[FW Equipment] 🗃️ Equipment hat Storage: %s (ID: %s)'):format(itemName, equipmentId))
        end
        
        -- Speichere Inventar
        SaveInventory(src, inventory, function()
            TriggerClientEvent('fw:inventory:refresh', src, inventory)
        end)
    end)
end)

-- ============================================
-- EQUIPMENT STORAGE ÖFFNEN
-- ============================================

FW.RegisterServerCallback('fw:equipment:getStorage', function(source, cb, equipmentId)
    local src = source
    
    if not equipmentId or equipmentId == '' then
        print('[FW Equipment] ❌ Keine Equipment-ID angegeben')
        cb(nil)
        return
    end
    
    -- Lade Equipment-Storage aus DB
    MySQL.single('SELECT * FROM equipment_storage WHERE equipment_id = ?', { equipmentId }, function(row)
        if not row then
            print(('[FW Equipment] ❌ Equipment-Storage "%s" nicht gefunden'):format(equipmentId))
            cb(nil)
            return
        end
        
        -- Validierung: Gehört Equipment dem Spieler?
        local identifier = exports['fw_core']:GetCharacterIdentifier(src)
        if row.owner and row.owner ~= identifier then
            print(('[FW Equipment] ❌ Equipment gehört anderem Spieler'):format(equipmentId))
            TriggerClientEvent('fw:client:notify', src, 'Dieses Equipment gehört dir nicht')
            cb(nil)
            return
        end
        
        -- Parse Inventory
        local equipmentInventory = {}
        if row.inventory and row.inventory ~= '' then
            local ok, decoded = pcall(json.decode, row.inventory)
            if ok and type(decoded) == 'table' then
                equipmentInventory = decoded
            end
        end
        
        cb({
            inventory = equipmentInventory,
            maxSlots = row.max_slots or 20,
            maxWeight = row.max_weight or 40,
            equipmentId = equipmentId,
            equipmentType = row.equipment_type,
            itemName = row.item_name,
            durability = row.durability or 100
        })
    end)
end)

RegisterNetEvent('fw:equipment:saveStorage', function(equipmentId, inventory)
    local src = source
    
    if not equipmentId or not inventory then
        print('[FW Equipment] ❌ Ungültige Daten zum Speichern')
        return
    end
    
    local invJSON = json.encode(inventory or {})
    
    MySQL.query('UPDATE equipment_storage SET inventory = ? WHERE equipment_id = ?', { invJSON, equipmentId }, function(affected)
        if affected > 0 then
            print(('[FW Equipment] ✅ Equipment-Storage gespeichert: %s'):format(equipmentId))
        else
            print(('[FW Equipment] ⚠️ Equipment-Storage nicht gefunden: %s'):format(equipmentId))
        end
    end)
end)

-- ============================================
-- DRAG & DROP VALIDATION
-- ============================================

function FW.Equipment.CanEquipToSlot(itemName, targetSlot)
    local itemData = FW.Equipment.GetItemData(itemName)
    if not itemData then return false, 'Kein Equipment-Item' end
    
    local rules = FW.EquipmentConfig.dragDropRules.rules
    
    for _, rule in ipairs(rules) do
        if rule.targetSlot == targetSlot then
            -- Prüfe ob Item-Typ erlaubt ist
            for _, allowedType in ipairs(rule.allowedTypes) do
                if itemData.type == allowedType then
                    return true, nil
                end
            end
            -- Wenn nicht erlaubt: Gib Fehlermeldung zurück
            return false, rule.rejectMessage
        end
    end
    
    return false, 'Ungültiger Equipment-Slot'
end

-- Server Event: Validiere Equip-Versuch
RegisterNetEvent('fw:equipment:validateEquip', function(itemName, targetSlot)
    local src = source
    local canEquip, errorMsg = FW.Equipment.CanEquipToSlot(itemName, targetSlot)
    
    if not canEquip then
        TriggerClientEvent('fw:client:notify', src, errorMsg)
        TriggerClientEvent('fw:equipment:equipRejected', src, itemName, targetSlot)
    else
        TriggerClientEvent('fw:equipment:equipAccepted', src, itemName, targetSlot)
    end
end)

-- ============================================
-- EQUIPMENT LÖSCHEN (bei Item-Entfernung)
-- ============================================

RegisterNetEvent('fw:equipment:deleteStorage', function(equipmentId)
    local src = source
    
    if not equipmentId then return end
    
    -- Prüfe Owner
    local identifier = exports['fw_core']:GetCharacterIdentifier(src)
    
    MySQL.single('SELECT owner FROM equipment_storage WHERE equipment_id = ?', { equipmentId }, function(row)
        if row and row.owner == identifier then
            MySQL.query('DELETE FROM equipment_storage WHERE equipment_id = ?', { equipmentId }, function(affected)
                if affected > 0 then
                    print(('[FW Equipment] 🗑️ Equipment-Storage gelöscht: %s'):format(equipmentId))
                end
            end)
        end
    end)
end)

-- ============================================
-- ADMIN COMMANDS
-- ============================================

RegisterCommand('giveequipment', function(source, args)
    local src = source
    if not IsPlayerAceAllowed(src, 'admin') then return end
    
    local itemName = args[1]
    local amount = tonumber(args[2]) or 1
    
    if not itemName then
        TriggerClientEvent('fw:client:notify', src, 'Verwendung: /giveequipment [itemName] [amount]')
        return
    end
    
    if not FW.Equipment.IsEquipmentItem(itemName) then
        TriggerClientEvent('fw:client:notify', src, 'Kein gültiges Equipment-Item')
        return
    end
    
    FW.Inventory.AddItem(src, itemName, amount, nil, nil)
    TriggerClientEvent('fw:client:notify', src, ('Equipment "%s" x%d hinzugefügt'):format(itemName, amount))
end, true)

RegisterCommand('listequipment', function(source, args)
    local src = source
    if not IsPlayerAceAllowed(src, 'admin') then return end
    
    if not FW.EquipmentConfig.equipmentItems then
        TriggerClientEvent('fw:client:notify', src, 'Equipment Config nicht geladen')
        return
    end
    
    print('=== VERFÜGBARE EQUIPMENT-ITEMS ===')
    for itemName, itemData in pairs(FW.EquipmentConfig.equipmentItems) do
        local storage = itemData.hasStorage and itemData.storage or nil
        if storage then
            print(('%s (%s) - Slot: %s - Storage: %d Slots, %dkg'):format(
                itemData.label, 
                itemName, 
                itemData.equipSlot,
                storage.maxSlots,
                storage.maxWeight
            ))
        else
            print(('%s (%s) - Slot: %s'):format(
                itemData.label, 
                itemName, 
                itemData.equipSlot
            ))
        end
    end
    print('==================================')
    
    TriggerClientEvent('fw:client:notify', src, 'Equipment-Liste in Server-Console')
end, true)

-- ============================================
-- INITIALIZATION
-- ============================================

AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    
    -- Lade Equipment Config
    FW.Equipment.LoadConfig()
    
    print('[FW] ✅ Equipment Storage System geladen')
end)

print('[FW] 🎒 Equipment Storage Server Script loaded')
