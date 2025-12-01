-- ============================================
-- FW Core: Inventory Client Logic
-- ============================================

local isInventoryOpen = false

-- === ÖFFNEN / SCHLIESSEN ===

function OpenInventory()
    if isInventoryOpen then return end
    -- Check beim Manager, ob z.B. Admin Menu schon offen ist
    if exports['fw_core']:IsAnyUIOpen() then return end 

    print('[Inventory] Opening...')
    
    if FW and FW.TriggerCallback then
        FW.TriggerCallback('fw:inventory:getInventoryData', function(inventory)
            FW.TriggerCallback('fw:inventory:getGroundItems', function(groundItems)
                
                -- Daten Aufbereiten
                local groundArray = {}
                for _, item in pairs(groundItems or {}) do table.insert(groundArray, item) end
                
                -- Konvertiere Inventory Object zu Array für Frontend
                local inventoryArray = {}
                for itemName, itemData in pairs(inventory or {}) do
                    if itemData and itemData.slot then
                        table.insert(inventoryArray, {
                            name = itemName,
                            label = itemData.label or itemName,
                            emoji = itemData.emoji or '📦',
                            amount = itemData.amount or 1,
                            slot = itemData.slot,
                            itemweight = itemData.itemweight,
                            type = itemData.type,
                            canUse = itemData.canUse
                        })
                    end
                end
                
                print('[Inventory] Converted inventory:', #inventoryArray, 'items')
                
                local playerPed = PlayerPedId()
                local health = (GetEntityHealth(playerPed) - 100) / (GetEntityMaxHealth(playerPed) - 100) * 100
                local armor = GetPedArmour(playerPed)
                
                -- NUI Nachricht
                SendNUIMessage({
                    action = 'openInventory',
                    inventory = inventoryArray,  -- Jetzt als Array
                    maxWeight = 50, 
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

function CloseInventory()
    if not isInventoryOpen then return end
    
    isInventoryOpen = false
    SendNUIMessage({ action = 'closeInventory' })
    
    -- Manager informieren
    exports['fw_core']:RegisterUIClose('inventory')
    
    -- Inventar nach 800ms speichern
    Citizen.SetTimeout(800, function()
        print('[Inventory] Speichere Inventar nach Schließen...')
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
        SendNUIMessage({ action = 'updateSlots', inventory = inventory or {} })
    end
end)