-- ============================================
-- FW CORE: DUAL INVENTORY SERVER SYSTEM
-- ============================================
-- Sicheres Secondary Inventory System mit Anti-Duping
-- Unterstützt: Give, Ground, Trunk, Glovebox, Stash
-- ============================================

FW = FW or {}
FW.SecondaryInventory = FW.SecondaryInventory or {}
FW.VehicleConfig = FW.VehicleConfig or {}

-- ============================================
-- VEHICLE CONFIG LOADER
-- ============================================

function FW.SecondaryInventory.LoadVehicleConfig()
    local filename = "configs/vehicles.json"
    local config = LoadJsonFromResource(filename)
    
    if not config or not config.vehicles then
        print('[FW] ⚠️ Vehicle Config konnte nicht geladen werden!')
        return
    end
    
    -- Index vehicles by model for fast lookup (case-insensitive)
    for _, vehicleData in ipairs(config.vehicles) do
        if vehicleData.model then
            local modelKey = string.upper(vehicleData.model)
            FW.VehicleConfig[modelKey] = vehicleData
        end
    end
    
    print(('[FW] ✅ %d Fahrzeug-Konfigurationen geladen'):format(#config.vehicles))
end

function FW.SecondaryInventory.GetVehicleConfig(model)
    local modelKey = string.upper(model)
    return FW.VehicleConfig[modelKey] or FW.VehicleConfig['DEFAULT'] or {
        trunk = { enabled = true, maxSlots = Config.Inventory.TrunkMaxSlots, maxWeight = 80 },
        glovebox = { enabled = true, maxSlots = Config.Inventory.GloveboxMaxSlots, maxWeight = 10 }
    }
end

-- ============================================
-- INVENTORY LOCK SYSTEM (ANTI-DUPING)
-- ============================================

local ActiveLocks = {} -- Format: { player_identifier = { type = 'player', locked_at = timestamp } }

function FW.SecondaryInventory.AcquireLock(src, lockType, lockId)
    local identifier = exports['fw_core']:GetCharacterIdentifier(src)
    if not identifier then return false end
    
    local lockKey = lockType .. ':' .. lockId
    
    -- Check if already locked
    if ActiveLocks[lockKey] then
        local lockAge = os.time() - ActiveLocks[lockKey].locked_at
        
        -- Auto-Release alte Locks (>5 Minuten)
        if lockAge > 300 then
            print(('[FW Lock] 🔓 Auto-Release verwaister Lock: %s (Alter: %ds)'):format(lockKey, lockAge))
            ActiveLocks[lockKey] = nil
        else
            print(('[FW Lock] ❌ Lock bereits aktiv: %s (von Spieler %s)'):format(lockKey, ActiveLocks[lockKey].player_src))
            return false
        end
    end
    
    -- Acquire Lock
    ActiveLocks[lockKey] = {
        player_src = src,
        player_identifier = identifier,
        locked_at = os.time(),
        type = lockType
    }
    
    print(('[FW Lock] 🔒 Lock erworben: %s von Spieler %s'):format(lockKey, src))
    return true
end

function FW.SecondaryInventory.ReleaseLock(src, lockType, lockId)
    local lockKey = lockType .. ':' .. lockId
    
    if ActiveLocks[lockKey] and ActiveLocks[lockKey].player_src == src then
        ActiveLocks[lockKey] = nil
        print(('[FW Lock] 🔓 Lock freigegeben: %s'):format(lockKey))
        return true
    end
    
    return false
end

function FW.SecondaryInventory.HasLock(src, lockType, lockId)
    local lockKey = lockType .. ':' .. lockId
    return ActiveLocks[lockKey] and ActiveLocks[lockKey].player_src == src
end

-- Auto-Cleanup bei Disconnect
AddEventHandler('playerDropped', function(reason)
    local src = source
    local identifier = exports['fw_core']:GetCharacterIdentifier(src)
    
    -- Release all locks owned by this player
    for lockKey, lockData in pairs(ActiveLocks) do
        if lockData.player_src == src then
            ActiveLocks[lockKey] = nil
            print(('[FW Lock] 🔓 Auto-Release Lock bei Disconnect: %s (Grund: %s)'):format(lockKey, reason))
        end
    end
end)

-- ============================================
-- 1. GEBEN-MODUS (Spieler zu Spieler)
-- ============================================

RegisterNetEvent('fw:inventory:giveItems', function(targetId, items)
    local src = source
    local target = tonumber(targetId)
    
    if not target or not GetPlayerName(target) then
        TriggerClientEvent('fw:client:notify', src, 'Zielspieler nicht gefunden.')
        return
    end
    
    -- Distanz-Validierung
    local srcPed = GetPlayerPed(src)
    local targetPed = GetPlayerPed(target)
    local srcCoords = GetEntityCoords(srcPed)
    local targetCoords = GetEntityCoords(targetPed)
    local distance = #(srcCoords - targetCoords)
    
    if distance > 3.0 then
        TriggerClientEvent('fw:client:notify', src, 'Zielspieler zu weit entfernt.')
        return
    end
    
    -- Lock beide Inventare (Transaktionssicherheit)
    local srcIdentifier = exports['fw_core']:GetCharacterIdentifier(src)
    local targetIdentifier = exports['fw_core']:GetCharacterIdentifier(target)
    
    if not FW.SecondaryInventory.AcquireLock(src, 'player', srcIdentifier) then
        TriggerClientEvent('fw:client:notify', src, 'Inventar ist gerade gesperrt.')
        return
    end
    
    if not FW.SecondaryInventory.AcquireLock(target, 'player', targetIdentifier) then
        FW.SecondaryInventory.ReleaseLock(src, 'player', srcIdentifier)
        TriggerClientEvent('fw:client:notify', src, 'Zielspieler Inventar ist gesperrt.')
        return
    end
    
    -- Transaktion durchführen
    local success = true
    local transferredItems = {}
    
    for _, itemData in ipairs(items or {}) do
        local itemName = itemData.name or itemData.itemName
        local amount = tonumber(itemData.quantity or itemData.amount) or 1
        
        if itemName and amount > 0 then
            -- Prüfe ob Sender genug hat
            if FW.Inventory.GetItemCount(src, itemName) >= amount then
                FW.Inventory.RemoveItem(src, itemName, amount)
                FW.Inventory.AddItem(target, itemName, amount, nil, nil)
                table.insert(transferredItems, { name = itemName, amount = amount })
                print(('[FW Give] ✅ %dx %s von %s zu %s'):format(amount, itemName, src, target))
            else
                print(('[FW Give] ❌ Nicht genug %s (hat nur %d)'):format(itemName, FW.Inventory.GetItemCount(src, itemName)))
                success = false
            end
        end
    end
    
    -- Locks freigeben
    FW.SecondaryInventory.ReleaseLock(src, 'player', srcIdentifier)
    FW.SecondaryInventory.ReleaseLock(target, 'player', targetIdentifier)
    
    -- Benachrichtigungen
    if #transferredItems > 0 then
        local itemList = {}
        for _, item in ipairs(transferredItems) do
            table.insert(itemList, ('%dx %s'):format(item.amount, item.name))
        end
        
        TriggerClientEvent('fw:client:notify', src, ('Gegeben: %s'):format(table.concat(itemList, ', ')))
        TriggerClientEvent('fw:client:notify', target, ('Erhalten: %s'):format(table.concat(itemList, ', ')))
    end
    
    -- Inventare refreshen
    FW.Inventory.GetInventory(src, function(invSrc)
        TriggerClientEvent('fw:inventory:refresh', src, invSrc or {})
    end)
    
    FW.Inventory.GetInventory(target, function(invTarget)
        TriggerClientEvent('fw:inventory:refresh', target, invTarget or {})
    end)
end)

-- ============================================
-- 2. BODEN-MODUS (Ground Items)
-- ============================================
-- (Bereits in server/inventory.lua implementiert - siehe FW.GroundItems)
-- HINWEIS: Ground Items werden im RAM gespeichert, nicht in DB
-- ============================================

-- Callback: Hole Ground Items in der Nähe (bereits implementiert)
FW.RegisterServerCallback('fw:inventory:getGroundInventory', function(source, cb)
    local src = source
    local playerPed = GetPlayerPed(src)
    local playerCoords = GetEntityCoords(playerPed)
    local groundInventory = {}
    
    for id, groundItem in pairs(FW.GroundItems) do
        local distance = #(playerCoords - groundItem.coords)
        if distance < 5.0 then
            groundInventory[groundItem.itemName] = {
                name = groundItem.itemName,
                label = groundItem.label,
                emoji = groundItem.emoji or '📦',
                amount = groundItem.amount,
                slot = groundItem.slot or 0,
                itemweight = groundItem.itemweight,
                type = groundItem.type,
                canUse = groundItem.canUse
            }
        end
    end
    
    cb(groundInventory)
end)

-- ============================================
-- 3. KOFFERRAUM (Vehicle Trunk)
-- ============================================

FW.RegisterServerCallback('fw:inventory:getTrunkInventory', function(source, cb, plate, vehicleModel)
    local src = source
    
    if not plate or plate == '' then
        print('[FW Trunk] ❌ Kein Nummernschild angegeben')
        cb(nil)
        return
    end
    
    -- Falls kein Modell übergeben wurde, nutze DEFAULT
    vehicleModel = vehicleModel or 'DEFAULT'
    
    -- Validierung: Ist Spieler nahe genug am Fahrzeug?
    local playerPed = GetPlayerPed(src)
    local playerCoords = GetEntityCoords(playerPed)
    local vehicle = nil
    
    -- Finde Fahrzeug mit diesem Plate in der Nähe
    local allVehicles = GetAllVehicles()
    for _, veh in ipairs(allVehicles) do
        local vehPlate = GetVehicleNumberPlateText(veh)
        if vehPlate and string.gsub(vehPlate, '^%s*(.-)%s*$', '%1') == plate then
            local vehCoords = GetEntityCoords(veh)
            if #(playerCoords - vehCoords) < 5.0 then
                vehicle = veh
                break
            end
        end
    end
    
    if not vehicle then
        print('[FW Trunk] ❌ Fahrzeug nicht in Reichweite')
        cb(nil)
        return
    end
    
    -- Hole Fahrzeug-Config basierend auf Modell-Name vom Client
    local vehicleConfig = FW.SecondaryInventory.GetVehicleConfig(vehicleModel)
    
    if not vehicleConfig.trunk or not vehicleConfig.trunk.enabled then
        print('[FW Trunk] ❌ Dieses Fahrzeug hat keinen Kofferraum')
        cb(nil)
        return
    end
    
    -- Lade Kofferraum aus DB
    MySQL.single('SELECT trunk, vehicle_model FROM vehicle_storage WHERE plate = ?', { plate }, function(row)
        local trunkSlots = {}
        
        if row and row.trunk and row.trunk ~= '' then
            print(('[FW Trunk DEBUG] Raw DB trunk: %s'):format(row.trunk))
            local ok, decoded = pcall(json.decode, row.trunk)
            if ok and type(decoded) == 'table' then
                trunkSlots = decoded
                print(('[FW Trunk DEBUG] Decoded trunk slots: %d entries'):format(#trunkSlots))
                for k, v in pairs(trunkSlots) do
                    print(('[FW Trunk DEBUG] Slot[%s] = %s'):format(tostring(k), v and v.name or 'nil'))
                end
            else
                print('[FW Trunk DEBUG] ❌ Failed to decode trunk JSON')
            end
        else
            print('[FW Trunk DEBUG] ❌ No row or empty trunk in DB')
        end
        
        -- Falls Fahrzeug noch nicht in DB: Erstelle Eintrag mit echtem Modell
        if not row then
            MySQL.insert('INSERT INTO vehicle_storage (plate, vehicle_model, trunk, glovebox) VALUES (?, ?, ?, ?)', 
                { plate, vehicleModel, '{}', '{}' },
                function(insertId)
                    print(('[FW Trunk] ✅ Neuer Kofferraum erstellt für %s (Plate: %s)'):format(vehicleModel, plate))
                end
            )
        end
        
        -- Konvertiere zu Object-Format mit unique keys (wie Player Inventar)
        local inventoryObject = {}
        local maxSlots = vehicleConfig.trunk.maxSlots or Config.Inventory.TrunkMaxSlots
        
        for i = 1, maxSlots do
            local item = trunkSlots[i]
            if item and type(item) == 'table' and item.name then
                local uniqueKey = item.name .. '_slot' .. (i - 1)
                inventoryObject[uniqueKey] = {
                    slot = i - 1,
                    name = item.name,
                    label = item.label or item.name,
                    emoji = item.emoji or '📦',
                    amount = item.quantity or item.amount or 1,
                    itemweight = item.itemweight or 0,
                    type = item.type or 'item',
                    canUse = item.canUse or false,
                    metadata = item.metadata or {}
                }
            end
        end
        
        local itemCount = 0
        for _ in pairs(inventoryObject) do itemCount = itemCount + 1 end
        print(('[FW Trunk] Loaded %d items from trunk %s'):format(itemCount, plate))
        
        cb({
            inventory = inventoryObject,
            maxSlots = maxSlots,
            maxWeight = vehicleConfig.trunk.maxWeight or 80,
            plate = plate,
            model = 'DEFAULT'
        })
    end)
end)

RegisterNetEvent('fw:inventory:saveTrunkInventory', function(plate, trunkInventory, mainInventory)
    local src = source
    
    if not plate or not trunkInventory then
        print('[FW Trunk] ❌ Ungültige Daten zum Speichern')
        return
    end
    
    print(('[FW Trunk DEBUG] Received trunkInventory type: %s'):format(type(trunkInventory)))
    print(('[FW Trunk DEBUG] Raw trunkInventory: %s'):format(json.encode(trunkInventory)))
    
    -- Convert frontend array (with slot properties) to slot-based array
    -- Use pairs() instead of ipairs() to handle sparse arrays (with null values)
    local trunkSlots = {}
    local itemCount = 0
    for i, item in pairs(trunkInventory) do
        if type(item) == 'table' and item.slot ~= nil then
            itemCount = itemCount + 1
            local targetSlot = item.slot + 1 -- Lua is 1-indexed
            print(('[FW Trunk DEBUG] Processing item: slot=%s, name=%s → Lua slot %d'):format(tostring(item.slot), tostring(item.name), targetSlot))
            trunkSlots[targetSlot] = {
                name = item.name,
                label = item.label,
                emoji = item.emoji,
                quantity = item.quantity or item.amount or 1,
                itemweight = item.itemweight or 0,
                type = item.type or 'item',
                canUse = item.canUse or false,
                metadata = item.metadata or {}
            }
        end
    end
    
    print(('[FW Trunk DEBUG] Processed %d items for storage'):format(itemCount))
    
    local trunkJSON = json.encode(trunkSlots)
    print(('[FW Trunk DEBUG] Final trunkJSON: %s'):format(trunkJSON))
    
    -- Speichere Kofferraum (Upsert: Insert or Update)
    MySQL.query('INSERT INTO vehicle_storage (plate, trunk, glovebox, vehicle_model) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE trunk = ?', 
        { plate, trunkJSON, '[]', 'DEFAULT', trunkJSON }, 
        function(affectedRows)
            print(('[FW Trunk] ✅ Kofferraum gespeichert für Plate: %s (Rows: %s)'):format(plate, affectedRows))
        end
    )
    
    -- Speichere Haupt-Inventar (Anti-Duping)
    if mainInventory then
        local player = FW.GetPlayer(src)
        if player then
            -- Convert main inventory array to slot-based array
            -- Use pairs() to handle sparse arrays with null values
            local mainSlots = {}
            for _, item in pairs(mainInventory) do
                if type(item) == 'table' and item.slot ~= nil then
                    mainSlots[item.slot + 1] = { -- Lua is 1-indexed
                        name = item.name,
                        label = item.label,
                        emoji = item.emoji,
                        quantity = item.quantity or item.amount or 1,
                        itemweight = item.itemweight or 0,
                        type = item.type or 'item',
                        canUse = item.canUse or false,
                        metadata = item.metadata or {}
                    }
                end
            end
            
            local mainJSON = json.encode(mainSlots)
            MySQL.update('UPDATE players SET inventory = ? WHERE identifier = ?', { mainJSON, player.identifier }, function(affected)
                if affected > 0 then
                    print(('[FW Trunk] ✅ Spieler-Inventar gespeichert (Anti-Duping) für: %s'):format(player.identifier))
                    
                    -- Update player object in cache
                    if player and player.setInventory then
                        player.setInventory(mainSlots)
                    end
                end
            end)
        end
    end
end)

-- ============================================
-- 4. HANDSCHUHFACH (Vehicle Glovebox)
-- ============================================

FW.RegisterServerCallback('fw:inventory:getGloveboxInventory', function(source, cb, plate, vehicleModel)
    local src = source
    
    if not plate or plate == '' then
        print('[FW Glovebox] ❌ Kein Nummernschild angegeben')
        cb(nil)
        return
    end
    
    -- Falls kein Modell übergeben wurde, nutze DEFAULT
    vehicleModel = vehicleModel or 'DEFAULT'
    
    -- Validierung: Ist Spieler IM Fahrzeug?
    local playerPed = GetPlayerPed(src)
    local vehicle = GetVehiclePedIsIn(playerPed, false)
    
    if not vehicle or vehicle == 0 then
        print('[FW Glovebox] ❌ Spieler nicht in einem Fahrzeug')
        cb(nil)
        return
    end
    
    local vehPlate = GetVehicleNumberPlateText(vehicle)
    if not vehPlate or string.gsub(vehPlate, '^%s*(.-)%s*$', '%1') ~= plate then
        print('[FW Glovebox] ❌ Falsches Fahrzeug')
        cb(nil)
        return
    end
    
    -- Hole Fahrzeug-Config basierend auf Modell-Name vom Client
    local vehicleConfig = FW.SecondaryInventory.GetVehicleConfig(vehicleModel)
    
    if not vehicleConfig.glovebox or not vehicleConfig.glovebox.enabled then
        print('[FW Glovebox] ❌ Dieses Fahrzeug hat kein Handschuhfach')
        cb(nil)
        return
    end
    
    -- Lade Handschuhfach aus DB
    MySQL.single('SELECT glovebox, vehicle_model FROM vehicle_storage WHERE plate = ?', { plate }, function(row)
        local gloveboxSlots = {}
        
        if row and row.glovebox and row.glovebox ~= '' then
            local ok, decoded = pcall(json.decode, row.glovebox)
            if ok and type(decoded) == 'table' then
                gloveboxSlots = decoded
            end
        end
        
        -- Falls Fahrzeug noch nicht in DB: Erstelle Eintrag mit echtem Modell
        if not row then
            MySQL.insert('INSERT INTO vehicle_storage (plate, vehicle_model, trunk, glovebox) VALUES (?, ?, ?, ?)', 
                { plate, vehicleModel, '{}', '{}' },
                function(insertId)
                    print(('[FW Glovebox] ✅ Neues Handschuhfach erstellt für %s (Plate: %s)'):format(vehicleModel, plate))
                end
            )
        end
        
        -- Konvertiere zu Object-Format mit unique keys
        local inventoryObject = {}
        local maxSlots = vehicleConfig.glovebox.maxSlots or Config.Inventory.GloveboxMaxSlots
        
        for i = 1, maxSlots do
            local item = gloveboxSlots[i]
            if item and type(item) == 'table' and item.name then
                local uniqueKey = item.name .. '_slot' .. (i - 1)
                inventoryObject[uniqueKey] = {
                    slot = i - 1,
                    name = item.name,
                    label = item.label or item.name,
                    emoji = item.emoji or '📦',
                    amount = item.quantity or item.amount or 1,
                    itemweight = item.itemweight or 0,
                    type = item.type or 'item',
                    canUse = item.canUse or false,
                    metadata = item.metadata or {}
                }
            end
        end
        
        local itemCount = 0
        for _ in pairs(inventoryObject) do itemCount = itemCount + 1 end
        print(('[FW Glovebox] Loaded %d items from glovebox %s'):format(itemCount, plate))
        
        cb({
            inventory = inventoryObject,
            maxSlots = maxSlots,
            maxWeight = vehicleConfig.glovebox.maxWeight or 15,
            plate = plate,
            model = 'DEFAULT'
        })
    end)
end)

RegisterNetEvent('fw:inventory:saveGloveboxInventory', function(plate, gloveboxInventory, mainInventory)
    local src = source
    
    if not plate or not gloveboxInventory then
        print('[FW Glovebox] ❌ Ungültige Daten zum Speichern')
        return
    end
    
    -- Convert frontend array to slot-based array
    -- Use pairs() instead of ipairs() to handle sparse arrays (with null values)
    local gloveboxSlots = {}
    for _, item in pairs(gloveboxInventory) do
        if type(item) == 'table' and item.slot ~= nil then
            gloveboxSlots[item.slot + 1] = {
                name = item.name,
                label = item.label,
                emoji = item.emoji,
                quantity = item.quantity or item.amount or 1,
                itemweight = item.itemweight or 0,
                type = item.type or 'item',
                canUse = item.canUse or false,
                metadata = item.metadata or {}
            }
        end
    end
    
    local gloveboxJSON = json.encode(gloveboxSlots)
    
    -- Speichere Handschuhfach (Upsert: Insert or Update)
    MySQL.query('INSERT INTO vehicle_storage (plate, trunk, glovebox, vehicle_model) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE glovebox = ?', 
        { plate, '[]', gloveboxJSON, 'DEFAULT', gloveboxJSON }, 
        function(affectedRows)
            print(('[FW Glovebox] ✅ Handschuhfach gespeichert für Plate: %s (Rows: %s)'):format(plate, affectedRows))
        end
    )
    
    -- Speichere Haupt-Inventar (Anti-Duping)
    if mainInventory then
        local player = FW.GetPlayer(src)
        if player then
            -- Convert main inventory array to slot-based array
            -- Use pairs() to handle sparse arrays with null values
            local mainSlots = {}
            for _, item in pairs(mainInventory) do
                if type(item) == 'table' and item.slot ~= nil then
                    mainSlots[item.slot + 1] = {
                        name = item.name,
                        label = item.label,
                        emoji = item.emoji,
                        quantity = item.quantity or item.amount or 1,
                        itemweight = item.itemweight or 0,
                        type = item.type or 'item',
                        canUse = item.canUse or false,
                        metadata = item.metadata or {}
                    }
                end
            end
            
            local mainJSON = json.encode(mainSlots)
            MySQL.update('UPDATE players SET inventory = ? WHERE identifier = ?', { mainJSON, player.identifier }, function(affected)
                if affected > 0 then
                    print(('[FW Glovebox] ✅ Spieler-Inventar gespeichert (Anti-Duping) für: %s'):format(player.identifier))
                    
                    -- Update player cache
                    if player and player.setInventory then
                        player.setInventory(mainSlots)
                    end
                end
            end)
        end
    end
end)

-- ============================================
-- 5. LAGER (Stash System)
-- ============================================

FW.RegisterServerCallback('fw:inventory:getStashInventory', function(source, cb, stashId)
    local src = source
    
    if not stashId or stashId == '' then
        print('[FW Stash] ❌ Keine Stash-ID angegeben')
        cb(nil)
        return
    end
    
    -- Lade Stash aus DB
    MySQL.single('SELECT * FROM stash_storage WHERE stash_id = ?', { stashId }, function(row)
        if not row then
            print(('[FW Stash] ❌ Stash "%s" existiert nicht'):format(stashId))
            cb(nil)
            return
        end
        
        -- Validierung: Job/Grade Requirements
        local Player = FW.GetPlayer(src)
        if Player then
            if row.job_restriction and row.job_restriction ~= '' then
                if Player.job.name ~= row.job_restriction then
                    TriggerClientEvent('fw:client:notify', src, 'Du hast nicht den richtigen Job.')
                    cb(nil)
                    return
                end
                
                if row.grade_restriction and Player.job.grade < row.grade_restriction then
                    TriggerClientEvent('fw:client:notify', src, 'Dein Job-Rang ist zu niedrig.')
                    cb(nil)
                    return
                end
            end
        end
        
        -- Validierung: Position (falls angegeben)
        if row.position_x and row.position_y and row.position_z then
            local playerPed = GetPlayerPed(src)
            local playerCoords = GetEntityCoords(playerPed)
            local stashCoords = vector3(row.position_x, row.position_y, row.position_z)
            local distance = #(playerCoords - stashCoords)
            local radius = row.radius or 2.5
            
            if distance > radius then
                print(('[FW Stash] ❌ Spieler zu weit von Stash "%s" entfernt (%.2fm)'):format(stashId, distance))
                cb(nil)
                return
            end
        end
        
        -- Parse Inventory
        local stashSlots = {}
        if row.inventory and row.inventory ~= '' then
            local ok, decoded = pcall(json.decode, row.inventory)
            if ok and type(decoded) == 'table' then
                stashSlots = decoded
            end
        end
        
        -- Konvertiere zu Object-Format mit unique keys
        local inventoryObject = {}
        local maxSlots = row.max_slots or Config.Inventory.StashMaxSlots
        
        for i = 1, maxSlots do
            local item = stashSlots[i]
            if item and type(item) == 'table' and item.name then
                local uniqueKey = item.name .. '_slot' .. (i - 1)
                inventoryObject[uniqueKey] = {
                    slot = i - 1,
                    name = item.name,
                    label = item.label or item.name,
                    emoji = item.emoji or '📦',
                    amount = item.quantity or item.amount or 1,
                    itemweight = item.itemweight or 0,
                    type = item.type or 'item',
                    canUse = item.canUse or false,
                    metadata = item.metadata or {}
                }
            end
        end
        
        local itemCount = 0
        for _ in pairs(inventoryObject) do itemCount = itemCount + 1 end
        print(('[FW Stash] Loaded %d items from stash %s'):format(itemCount, stashId))
        
        cb({
            inventory = inventoryObject,
            maxSlots = maxSlots,
            maxWeight = row.max_weight or 100,
            stashId = stashId,
            stashType = row.stash_type
        })
    end)
end)

RegisterNetEvent('fw:inventory:saveStashInventory', function(stashId, stashInventory, mainInventory)
    local src = source
    
    if not stashId or not stashInventory then
        print('[FW Stash] ❌ Ungültige Daten zum Speichern')
        return
    end
    
    -- Convert frontend array to slot-based array
    -- Use pairs() instead of ipairs() to handle sparse arrays (with null values)
    local stashSlots = {}
    for _, item in pairs(stashInventory) do
        if type(item) == 'table' and item.slot ~= nil then
            stashSlots[item.slot + 1] = {
                name = item.name,
                label = item.label,
                emoji = item.emoji,
                quantity = item.quantity or item.amount or 1,
                itemweight = item.itemweight or 0,
                type = item.type or 'item',
                canUse = item.canUse or false,
                metadata = item.metadata or {}
            }
        end
    end
    
    local stashJSON = json.encode(stashSlots)
    
    -- Speichere Lager (Upsert: Insert or Update)
    MySQL.query('INSERT INTO stash_storage (stash_id, inventory, owner_identifier) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE inventory = ?', 
        { stashId, stashJSON, 'system', stashJSON }, 
        function(affectedRows)
            print(('[FW Stash] ✅ Lager "%s" gespeichert (Rows: %s)'):format(stashId, affectedRows))
        end
    )
    
    -- Speichere Haupt-Inventar (Anti-Duping)
    if mainInventory then
        local player = FW.GetPlayer(src)
        if player then
            -- Convert main inventory array to slot-based array
            local mainSlots = {}
            for _, item in ipairs(mainInventory) do
                if item and item.slot then
                    mainSlots[item.slot + 1] = {
                        name = item.name,
                        label = item.label,
                        emoji = item.emoji,
                        quantity = item.quantity or item.amount or 1,
                        itemweight = item.itemweight or 0,
                        type = item.type or 'item',
                        canUse = item.canUse or false,
                        metadata = item.metadata or {}
                    }
                end
            end
            
            local mainJSON = json.encode(mainSlots)
            MySQL.update('UPDATE players SET inventory = ? WHERE identifier = ?', { mainJSON, player.identifier }, function(affected)
                if affected > 0 then
                    print(('[FW Stash] ✅ Spieler-Inventar gespeichert (Anti-Duping) für: %s'):format(player.identifier))
                    
                    -- Update player cache
                    if player and player.setInventory then
                        player.setInventory(mainSlots)
                    end
                end
            end)
        end
    end
end)

-- ============================================
-- INITIALIZATION
-- ============================================

AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    
    -- Lade Vehicle Config
    FW.SecondaryInventory.LoadVehicleConfig()
    
    print('[FW] ✅ Secondary Inventory System geladen')
end)

-- ============================================
-- ADMIN COMMANDS (für Testing)
-- ============================================

RegisterCommand('createstash', function(source, args)
    local src = source
    if not IsPlayerAceAllowed(src, 'admin') then return end
    
    local stashId = args[1]
    local maxSlots = tonumber(args[2]) or Config.Inventory.StashMaxSlots
    local maxWeight = tonumber(args[3]) or 100
    
    if not stashId then
        TriggerClientEvent('fw:client:notify', src, 'Verwendung: /createstash [id] [slots] [weight]')
        return
    end
    
    local playerPed = GetPlayerPed(src)
    local coords = GetEntityCoords(playerPed)
    
    MySQL.insert(
        'INSERT INTO stash_storage (stash_id, max_slots, max_weight, position_x, position_y, position_z) VALUES (?, ?, ?, ?, ?, ?)',
        { stashId, maxSlots, maxWeight, coords.x, coords.y, coords.z },
        function(insertId)
            if insertId then
                TriggerClientEvent('fw:client:notify', src, ('Stash "%s" erstellt (ID: %d)'):format(stashId, insertId))
                print(('[FW Admin] Stash erstellt: %s an %s'):format(stashId, coords))
            end
        end
    )
end, true)

print('[FW] 📦 Secondary Inventory Server Script loaded')
