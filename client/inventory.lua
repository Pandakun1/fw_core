-- ============================================
-- FW Core: Inventory Client Logic
-- ============================================

local isInventoryOpen = false

-- === ÖFFNEN / SCHLIESSEN ===

function OpenInventory()
    if isInventoryOpen then return end
    -- Check beim Manager, ob z.B. Admin Menu schon offen ist
    if exports['fw_core']:IsAnyUIOpen() then return end 

    FW.Debug('Inventory', 'Opening...')
    
    if FW and FW.TriggerCallback then
        FW.TriggerCallback('fw:inventory:getInventoryData', function(response)
            FW.TriggerCallback('fw:inventory:getGroundItems', function(groundItems)
                
                -- Daten Aufbereiten
                local groundArray = {}
                for _, item in pairs(groundItems or {}) do table.insert(groundArray, item) end
                
                -- Server sends { inventory: {...}, equipment: {...} }
                local inventoryData = {}
                local equipmentData = {}
                
                if type(response) == 'table' then
                    if response.inventory then
                        inventoryData = response.inventory
                    else
                        inventoryData = response
                    end
                    
                    if response.equipment then
                        equipmentData = response.equipment
                        FW.Debug('Inventory', 'Loaded equipment', json.encode(equipmentData))
                    end
                end
                
                FW.Debug('Inventory', 'Received inventory', type(inventoryData))
                
                local playerPed = PlayerPedId()
                local health = (GetEntityHealth(playerPed) - 100) / (GetEntityMaxHealth(playerPed) - 100) * 100
                local armor = GetPedArmour(playerPed)
                
                -- NUI Nachricht with equipment
                SendNUIMessage({
                    action = 'openInventory',
                    inventory = inventoryData,
                    equipment = equipmentData,
                    maxSlots = Config.Inventory.MaxSlots,
                    maxWeight = Config.Inventory.MaxWeight, 
                    cash = 0,       
                    bank = 0,       
                    groundItems = groundArray,
                    health = math.max(0, math.min(100, health)),
                    armor = armor,
                    hunger = 100,
                    thirst = 100
                })
                
                -- State setzen & Manager informieren
                isInventoryOpen = true
                exports['fw_core']:RegisterUIOpen('inventory', true)
            end)
        end)
    end
end

-- Flag to prevent auto-save after dual-inventory close
local skipNextSave = false

function CloseInventory()
    if not isInventoryOpen then return end
    
    isInventoryOpen = false
    SendNUIMessage({ action = 'closeInventory' })
    
    -- Manager informieren
    exports['fw_core']:RegisterUIClose('inventory')
    
    -- Inventar nach 800ms speichern (nur wenn nicht gerade Dual-Inventar geschlossen wurde)
    Citizen.SetTimeout(800, function()
        if skipNextSave then
            print('[Inventory] Speichern übersprungen (Dual-Inventar gerade gespeichert)')
            skipNextSave = false
            return
        end
        
        FW.Debug('Inventory', 'Saving inventory after close')
        TriggerServerEvent('fw:inventory:saveInventory')
    end)
end

function ToggleInventory()
    if isInventoryOpen then CloseInventory() else OpenInventory() end
end

-- Commands & Keys
RegisterCommand('inventory', ToggleInventory, false)
RegisterKeyMapping('inventory', 'Inventar öffnen/schließen', 'keyboard', 'I')

-- Event Listener (Falls Manager "CloseAll" erzwingt)
RegisterNetEvent('fw:client:closeInventory', function()
    isInventoryOpen = false
    SendNUIMessage({ action = 'closeInventory' })
end)

-- === NUI CALLBACKS ===

RegisterNUICallback('closeInventory', function(data, cb)
    CloseInventory()
    cb('ok')
end)

RegisterNUICallback('useItem', function(data, cb)
    TriggerServerEvent('fw:inventory:useItem', data.name or data.item.name)
    cb('ok')
end)

RegisterNUICallback('dropItem', function(data, cb)
    TriggerServerEvent('fw:inventory:dropItem', data.name, data.amount or 1)
    cb('ok')
end)

RegisterNUICallback('moveItem', function(data, cb)
    local fromSlot = data.fromSlot or (data.from and data.from.slot)
    local toSlot = data.toSlot or (data.to and data.to.slot)
    TriggerServerEvent('fw:inventory:moveItem', fromSlot, toSlot)
    cb('ok')
end)

RegisterNUICallback('updateInventoryOrder', function(data, cb)
    print('[Inventory Client] 📦 Updating inventory order after mouse-wheel split')
    TriggerServerEvent('fw:inventory:updateInventoryOrder', data)
    cb('ok')
end)

RegisterNUICallback('giveItem', function(data, cb)
    local closestPlayer, closestDistance = FW.Functions.GetClosestPlayer()
    if closestPlayer ~= -1 and closestDistance < 3.0 then
        TriggerServerEvent('fw:inventory:giveItem', data.name, data.amount or 1, GetPlayerServerId(closestPlayer))
    else
        TriggerEvent('FW:Notify', 'Kein Spieler in der Nähe', 'error')
    end
    cb('ok')
end)

-- === SPECIAL FEATURES (Pickup & Give Mode) ===

RegisterNUICallback('pickupItem', function(data, cb)
    TriggerServerEvent('fw:inventory:pickupItem', data.name, data.amount or 1, data.toSlot)
    cb('ok')
end)

-- NPC Geben Modus
local giveMode = false
RegisterNUICallback('startGiveMode', function(data, cb)
    giveMode = true
    TriggerEvent('FW:Notify', 'Geben-Modus aktiviert (E bei NPC)', 'info')
    
    Citizen.CreateThread(function()
        while giveMode do
            -- ... (Hier deine NPC Logik einfügen oder kurz halten) ...
            if IsControlJustReleased(0, 200) then -- ESC
                giveMode = false
                TriggerEvent('FW:Notify', 'Beendet', 'error')
            end
            Wait(0)
        end
    end)
    cb('ok')
end)

-- Server Events (Refresh)
RegisterNetEvent('fw:inventory:refresh', function(inventory)
    if isInventoryOpen then
        -- Count object keys properly (can't use # on object)
        local count = 0
        if inventory and type(inventory) == 'table' then
            for _ in pairs(inventory) do count = count + 1 end
        end
        FW.Debug('Inventory', 'Refresh', count, 'items')
        SendNUIMessage({ action = 'updateInventory', inventory = inventory or {} })
    end
end)

RegisterNetEvent('fw:inventory:refreshWithEquipment', function(inventory, equipment)
    if isInventoryOpen then
        local count = 0
        if inventory and type(inventory) == 'table' then
            for _ in pairs(inventory) do count = count + 1 end
        end
        FW.Debug('Inventory', 'Refresh with equipment', count, 'items')
        SendNUIMessage({ 
            action = 'updateInventory', 
            inventory = inventory or {},
            equipment = equipment or {}
        })
    end
end)

-- ============================================
-- SECONDARY INVENTORY SYSTEM (DUAL-INVENTAR)
-- ============================================

-- NUI Callback: Geben-Modus (Items von NUI an Server schicken)
RegisterNUICallback('giveItems', function(data, cb)
    local mode = data.mode
    local items = data.items or {}
    
    if mode == 'give' then
        -- Spieler zu Spieler: Hole nächsten Spieler
        local closestPlayer, closestDistance = FW.Functions.GetClosestPlayer()
        
        if closestPlayer ~= -1 and closestDistance < 3.0 then
            local targetId = GetPlayerServerId(closestPlayer)
            TriggerServerEvent('fw:inventory:giveItems', targetId, items)
        else
            TriggerEvent('FW:Notify', 'Kein Spieler in der Nähe (< 3m)', 'error')
        end
    elseif mode == 'ground' then
        -- Items auf Boden legen
        for _, item in ipairs(items) do
            if item and item.name and item.quantity then
                TriggerServerEvent('fw:inventory:dropItem', item.name, item.quantity)
            end
        end
    end
    
    cb('ok')
end)

-- === KOFFERRAUM (TRUNK) ===

RegisterCommand('trunk', function()
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    local vehicle = GetClosestVehicle(coords.x, coords.y, coords.z, 5.0, 0, 71)
    
    if vehicle == 0 then
        TriggerEvent('FW:Notify', 'Kein Fahrzeug in der Nähe', 'error')
        return
    end
    
    local vehicleModel = GetDisplayNameFromVehicleModel(GetEntityModel(vehicle))
    
    -- Prüfe ob Kofferraum vorne ist (z.B. Supersportwagen)
    -- Bei Front-Kofferraum muss Spieler VORNE am Fahrzeug sein
    local trunkBone = GetEntityBoneIndexByName(vehicle, 'boot')
    local frontBone = GetEntityBoneIndexByName(vehicle, 'bonnet')
    local vehCoords = GetEntityCoords(vehicle)
    local vehForward = GetEntityForwardVector(vehicle)
    local toPlayer = coords - vehCoords
    local dotProduct = toPlayer.x * vehForward.x + toPlayer.y * vehForward.y
    
    -- Supersportwagen wie Adder, Zentorno haben Kofferraum vorne
    local frontTrunkVehicles = { 'ADDER', 'ZENTORNO', 'T20', 'OSIRIS', 'TURISMOR', 'REAPER' }
    local isFrontTrunk = false
    for _, model in ipairs(frontTrunkVehicles) do
        if vehicleModel == model then
            isFrontTrunk = true
            break
        end
    end
    
    -- Validiere Position: Vorne für Front-Trunk, Hinten für normalen Trunk
    if isFrontTrunk and dotProduct < 0.5 then
        TriggerEvent('FW:Notify', 'Du musst VORNE am Fahrzeug stehen', 'error')
        return
    elseif not isFrontTrunk and dotProduct > -0.5 then
        TriggerEvent('FW:Notify', 'Du musst HINTEN am Fahrzeug stehen', 'error')
        return
    end
    
    local plate = GetVehicleNumberPlateText(vehicle)
    plate = string.gsub(plate, '^%s*(.-)%s*$', '%1') -- Trim whitespace
    
    -- Öffne richtige Tür (Kofferraum hinten=5 oder Motorhaube vorne=4)
    local doorIndex = 5 -- Standard: Kofferraum hinten
    if isFrontTrunk then
        doorIndex = 4 -- Motorhaube vorne
    end
    
    local trunkOpen = GetVehicleDoorAngleRatio(vehicle, doorIndex) > 0.0
    if not trunkOpen then
        SetVehicleDoorOpen(vehicle, doorIndex, false, false)
    end
    
    -- Request Trunk Inventory vom Server (mit Fahrzeugmodell)
    FW.TriggerCallback('fw:inventory:getTrunkInventory', function(trunkData)
        if not trunkData then
            TriggerEvent('FW:Notify', 'Kofferraum kann nicht geöffnet werden', 'error')
            return
        end
        
        print('[Inventory Client] Opening Trunk:', plate)
        
        -- ERST Haupt-Inventar laden und öffnen
        FW.TriggerCallback('fw:inventory:getInventoryData', function(mainInventory)
            local mainInv = (mainInventory and mainInventory.inventory) or {}
            SendNUIMessage({
                action = 'openInventory',
                inventory = mainInv,
                maxSlots = Config.Inventory.MaxSlots
            })
            
            -- Warte kurz damit UI geladen ist
            Citizen.Wait(100)
            
            -- JETZT Dual-Inventory öffnen
            SendNUIMessage({
                action = 'openDualInventory',
                mode = 'trunk',
                title = '🚗 Kofferraum - ' .. plate,
                secondaryInventory = trunkData.inventory,
                maxSlots = trunkData.maxSlots,
                maxWeight = trunkData.maxWeight,
                metadata = {
                    plate = plate,
                    model = trunkData.model
                }
            })
            
            isInventoryOpen = true
            exports['fw_core']:RegisterUIOpen('inventory', true)
        end)
    end, plate, vehicleModel)
end)

RegisterKeyMapping('trunk', 'Kofferraum öffnen', 'keyboard', 'L')

-- NUI Callback: Kofferraum speichern
RegisterNUICallback('saveTrunk', function(data, cb)
    local plate = data.plate
    local trunkInventory = data.inventory
    local mainInventory = data.mainInventory
    
    if plate and trunkInventory then
        TriggerServerEvent('fw:inventory:saveTrunkInventory', plate, trunkInventory, mainInventory)
        skipNextSave = true -- Verhindere doppeltes Speichern beim nächsten Close
    end
    
    cb('ok')
end)

-- === HANDSCHUHFACH (GLOVEBOX) ===

RegisterCommand('glovebox', function()
    local playerPed = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(playerPed, false)
    
    if vehicle == 0 then
        TriggerEvent('FW:Notify', 'Du musst in einem Fahrzeug sitzen', 'error')
        return
    end
    
    local plate = GetVehicleNumberPlateText(vehicle)
    plate = string.gsub(plate, '^%s*(.-)%s*$', '%1')
    
    local vehicleModel = GetDisplayNameFromVehicleModel(GetEntityModel(vehicle))
    
    -- Request Glovebox Inventory vom Server
    FW.TriggerCallback('fw:inventory:getGloveboxInventory', function(gloveboxData)
        if not gloveboxData then
            TriggerEvent('FW:Notify', 'Handschuhfach kann nicht geöffnet werden', 'error')
            return
        end
        
        print('[Inventory Client] Opening Glovebox:', plate)
        
        -- ERST Haupt-Inventar laden und öffnen
        FW.TriggerCallback('fw:inventory:getInventoryData', function(mainInventory)
            local mainInv = (mainInventory and mainInventory.inventory) or {}
            SendNUIMessage({
                action = 'openInventory',
                inventory = mainInv,
                maxSlots = 50
            })
            
            Citizen.Wait(100)
            
            -- DANN Dual-Inventory
            SendNUIMessage({
                action = 'openDualInventory',
                mode = 'glovebox',
                title = '🧤 Handschuhfach - ' .. plate,
                secondaryInventory = gloveboxData.inventory,
                maxSlots = gloveboxData.maxSlots,
                maxWeight = gloveboxData.maxWeight,
                metadata = {
                    plate = plate,
                    model = gloveboxData.model
                }
            })
            
            isInventoryOpen = true
            exports['fw_core']:RegisterUIOpen('inventory', true)
        end)
    end, plate, vehicleModel)
end)

RegisterKeyMapping('glovebox', 'Handschuhfach öffnen', 'keyboard', 'K')

-- NUI Callback: Handschuhfach speichern
RegisterNUICallback('saveGlovebox', function(data, cb)
    local plate = data.plate
    local gloveboxInventory = data.inventory
    local mainInventory = data.mainInventory
    
    if plate and gloveboxInventory then
        TriggerServerEvent('fw:inventory:saveGloveboxInventory', plate, gloveboxInventory, mainInventory)
        skipNextSave = true -- Verhindere doppeltes Speichern
    end
    
    cb('ok')
end)

-- === LAGER (STASH) ===

function OpenStash(stashId)
    if not stashId then
        TriggerEvent('FW:Notify', 'Ungültige Lager-ID', 'error')
        return
    end
    
    FW.TriggerCallback('fw:inventory:getStashInventory', function(stashData)
        if not stashData then
            TriggerEvent('FW:Notify', 'Lager kann nicht geöffnet werden', 'error')
            return
        end
        
        print('[Inventory Client] Opening Stash:', stashId)
        
        -- ERST Haupt-Inventar laden und öffnen
        FW.TriggerCallback('fw:inventory:getInventoryData', function(mainInventory)
            local mainInv = (mainInventory and mainInventory.inventory) or {}
            SendNUIMessage({
                action = 'openInventory',
                inventory = mainInv,
                maxSlots = Config.Inventory.MaxSlots
            })
            
            Citizen.Wait(100)
            
            -- DANN Dual-Inventory
            SendNUIMessage({
                action = 'openDualInventory',
                mode = 'stash',
                title = '🏢 Lager - ' .. stashId,
                secondaryInventory = stashData.inventory or {},
                maxSlots = stashData.maxSlots or Config.Inventory.StashMaxSlots,
                maxWeight = stashData.maxWeight or 100,
                metadata = {
                    stashId = stashId,
                    stashType = stashData.stashType
                }
            })
            
            isInventoryOpen = true
            exports['fw_core']:RegisterUIOpen('inventory', true)
        end)
    end, stashId)
end

-- Export für andere Scripts
exports('OpenStash', OpenStash)

-- NUI Callback: Lager speichern
RegisterNUICallback('saveStash', function(data, cb)
    local stashId = data.stashId
    local stashInventory = data.inventory
    local mainInventory = data.mainInventory
    
    if stashId and stashInventory then
        TriggerServerEvent('fw:inventory:saveStashInventory', stashId, stashInventory, mainInventory)
        skipNextSave = true -- Verhindere doppeltes Speichern
    end
    
    cb('ok')
end)

-- Beispiel Command für Testing
RegisterCommand('openstash', function(source, args)
    local stashId = args[1]
    if stashId then
        OpenStash(stashId)
    else
        TriggerEvent('FW:Notify', 'Verwendung: /openstash [id]', 'error')
    end
end)

-- === BODEN-MODUS (GROUND) ===

RegisterCommand('ground', function()
    FW.TriggerCallback('fw:inventory:getGroundInventory', function(groundData)
        print('[Inventory Client] Opening Ground Inventory')
        
        -- Wenn Inventar bereits offen, öffne nur Dual-Inventory
        if isInventoryOpen then
            print('[Inventory Client] Inventory already open, opening dual only')
            SendNUIMessage({
                action = 'openDualInventory',
                mode = 'ground',
                title = '🌍 Boden',
                secondaryInventory = groundData or {},
                maxSlots = Config.Inventory.MaxSlots,
                maxWeight = 999,
                metadata = {}
            })
        else
            -- ERST Haupt-Inventar laden und öffnen
            FW.TriggerCallback('fw:inventory:getInventoryData', function(mainInventory)
                local mainInv = (mainInventory and mainInventory.inventory) or {}
                SendNUIMessage({
                    action = 'openInventory',
                    inventory = mainInv,
                    maxSlots = Config.Inventory.MaxSlots
                })
                
                Citizen.Wait(150) -- Warte länger für fade-in (100ms load + 200ms fade = 300ms gesamt)
                
                -- DANN Dual-Inventory
                SendNUIMessage({
                    action = 'openDualInventory',
                    mode = 'ground',
                    title = '🌍 Boden',
                    secondaryInventory = groundData or {},
                    maxSlots = Config.Inventory.MaxSlots,
                    maxWeight = 999,
                    metadata = {}
                })
                
                isInventoryOpen = true
                exports['fw_core']:RegisterUIOpen('inventory', true)
            end)
        end
    end)
end)

RegisterKeyMapping('ground', 'Boden-Inventar öffnen', 'keyboard', 'G')

-- NUI Callback: Ground öffnen (von Button im UI)
RegisterNUICallback('requestGroundInventory', function(data, cb)
    FW.TriggerCallback('fw:inventory:getGroundInventory', function(groundData)
        print('[Inventory Client] Opening Ground Inventory via Button')
        
        -- Dual-Inventory öffnen (Hauptinventar ist bereits offen)
        SendNUIMessage({
            action = 'openDualInventory',
            mode = 'ground',
            title = '🌍 Boden',
            secondaryInventory = groundData or {},
            maxSlots = Config.Inventory.MaxSlots,
            maxWeight = 999,
            metadata = {}
        })
    end)
    
    cb('ok')
end)

-- NUI Callback: Ground speichern
RegisterNUICallback('saveGround', function(data, cb)
    local groundInventory = data.inventory or {}
    local mainInventory = data.mainInventory or {}
    
    print('[Inventory Client] 💾 Saving Ground Inventory:', #groundInventory, 'items')
    print('[Inventory Client] 💾 Saving Main Inventory:', #mainInventory, 'items')
    
    -- Sende BEIDE Inventare zum Server (mit Anti-Duping wie beim Kofferraum)
    TriggerServerEvent('fw:inventory:saveGroundInventory', groundInventory, mainInventory)
    
    skipNextSave = true -- Verhindere doppeltes Speichern
    cb('ok')
end)

-- ============================================
-- EQUIPMENT STORAGE SYSTEM
-- ============================================

-- Equipment Storage öffnen (Rucksäck, Taschen)
function OpenEquipmentStorage(equipmentId, itemName)
    if not equipmentId or not itemName then
        TriggerEvent('FW:Notify', 'Ungültige Equipment-Daten', 'error')
        return
    end
    
    FW.TriggerCallback('fw:equipment:getStorage', function(equipmentData)
        if not equipmentData then
            TriggerEvent('FW:Notify', 'Equipment-Storage kann nicht geöffnet werden', 'error')
            return
        end
        
        print('[Inventory Client] Opening Equipment Storage:', equipmentId)
        
        -- Hole Equipment-Info aus Config
        local label = itemName
        local emoji = '🎒'
        
        -- Map bekannter Items
        local equipmentLabels = {
            backpack_small = '🎒 Kleiner Rucksack',
            backpack_medium = '🎒 Rucksack',
            backpack_large = '🎒 Großer Rucksack',
            backpack_tactical = '🎒 Taktischer Rucksack',
            bag_duffel = '👜 Seesack',
            bag_sports = '👜 Sporttasche',
            hipbag_small = '👝 Kleine Bauchtasche',
            hipbag_medium = '👝 Bauchtasche',
            hipbag_tactical = '👝 Taktische Bauchtasche',
            bag_messenger = '👜 Umhängetasche'
        }
        
        label = equipmentLabels[itemName] or ('🎒 ' .. itemName)
        
        SendNUIMessage({
            action = 'openDualInventory',
            mode = 'equipment',
            title = label,
            secondaryInventory = equipmentData.inventory,
            maxSlots = equipmentData.maxSlots,
            maxWeight = equipmentData.maxWeight,
            metadata = {
                equipmentId = equipmentId,
                itemName = itemName,
                equipmentType = equipmentData.equipmentType,
                durability = equipmentData.durability
            }
        })
        
        isInventoryOpen = true
        exports['fw_core']:RegisterUIOpen('inventory', true)
    end, equipmentId)
end

-- Export für NUI/andere Scripts
exports('OpenEquipmentStorage', OpenEquipmentStorage)

-- NUI Callback: Equipment Storage speichern
RegisterNUICallback('saveEquipment', function(data, cb)
    local equipmentId = data.equipmentId
    local inventory = data.inventory
    
    if equipmentId and inventory then
        TriggerServerEvent('fw:equipment:saveStorage', equipmentId, inventory)
    end
    
    cb('ok')
end)

-- NUI Callback: Equipment öffnen (wenn in Equipment-Slot geklickt)
RegisterNUICallback('openEquipmentStorage', function(data, cb)
    local equipmentId = data.equipmentId
    local itemName = data.itemName
    
    if equipmentId and itemName then
        OpenEquipmentStorage(equipmentId, itemName)
    else
        TriggerEvent('FW:Notify', 'Equipment hat kein Lager', 'error')
    end
    
    cb('ok')
end)

-- Server Event: Equipment wurde equipped
RegisterNetEvent('fw:equipment:equipped', function(itemName, equipmentId, slot)
    print('[Inventory Client] Equipment equipped:', itemName, 'ID:', equipmentId, 'Slot:', slot)
    
    -- Optional: Visual Feedback
    TriggerEvent('FW:Notify', ('Equipment ausgerüstet: %s'):format(itemName), 'success')
end)

-- Server Event: Equip wurde abgelehnt (falscher Slot)
RegisterNetEvent('fw:equipment:equipRejected', function(itemName, targetSlot)
    print('[Inventory Client] Equip rejected:', itemName, 'to', targetSlot)
    
    -- Visual Feedback: Shake Animation, Sound, etc.
    TriggerEvent('FW:Notify', 'Dieses Item kann nicht hier ausgerüstet werden', 'error')
end)

-- Server Event: Equip wurde akzeptiert
RegisterNetEvent('fw:equipment:equipAccepted', function(itemName, targetSlot)
    print('[Inventory Client] Equip accepted:', itemName, 'to', targetSlot)
end)