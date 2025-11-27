-- Client-side Inventory Management

local isInventoryOpen = false

-- Register Key Mapping für Inventar
RegisterCommand('inventory', function()
    print('[FW Client] Inventory command triggered, current state:', isInventoryOpen)
    ToggleInventory()
end, false)

RegisterKeyMapping('inventory', 'Inventar öffnen/schließen', 'keyboard', 'I')

function ToggleInventory()
    if isInventoryOpen then
        CloseInventory()
    else
        OpenInventory()
    end
end

function OpenInventory()
    isInventoryOpen = true
    print('[FW Client] Opening inventory...')
    print('[FW Client] Setting NUI Focus to true...')
    SetNuiFocus(true, true)
    
    -- Lade Inventardaten und Ground Items
    if FW and FW.TriggerCallback then
        FW.TriggerCallback('fw:inventory:getInventoryData', function(inventory)
            print('[FW Client] Received inventory data:', json.encode(inventory or {}))
            
            FW.TriggerCallback('fw:inventory:getGroundItems', function(groundItems)
                print('[FW Client] Received ground items:', json.encode(groundItems or {}))
                
                -- Konvertiere groundItems zu Array
                local groundArray = {}
                for _, item in pairs(groundItems or {}) do
                    table.insert(groundArray, item)
                end
                
                -- Hole Status-Werte
                local playerPed = PlayerPedId()
                local health = (GetEntityHealth(playerPed) - 100) / (GetEntityMaxHealth(playerPed) - 100) * 100
                local armor = GetPedArmour(playerPed)
                
                SendNUIMessage({
                    action = 'openInventory',
                    inventory = {
                        wallet = {},
                        keys = {},
                        main = inventory or {},
                        hotbar = {}
                    },
                    maxWeight = 50,
                    cash = 0,
                    bank = 0,
                    groundItems = groundArray,
                    health = math.max(0, math.min(100, health)),
                    armor = armor,
                    hunger = 100, -- TODO: Aus Framework holen
                    thirst = 100  -- TODO: Aus Framework holen
                })
                
                print('[FW Client] Modern inventory opened')
            end)
        end)
    else
        print('[FW Client] WARNING: FW.TriggerCallback not available')
        -- Fallback: Öffne ohne Daten
        SendNUIMessage({
            action = 'openInventory',
            inventory = { wallet = {}, keys = {}, main = {}, hotbar = {} },
            maxWeight = 50,
            cash = 0,
            bank = 0,
            groundItems = {}
        })
    end
end

function CloseInventory()
    print('[FW Client] Closing inventory...')
    SetNuiFocus(false, false)
    isInventoryOpen = false
    SendNUIMessage({
        action = 'closeInventory'
    })
    print('[FW Client] Inventory closed, NUI focus removed')
end

-- NUI Callbacks
RegisterNUICallback('close', function(data, cb)
    CloseInventory()
    cb('ok')
end)

RegisterNUICallback('closeInventory', function(data, cb)
    CloseInventory()
    cb('ok')
end)

RegisterNUICallback('useItem', function(data, cb)
    TriggerServerEvent('fw:inventory:useItem', data.name)
    cb('ok')
end)

RegisterNUICallback('dropItem', function(data, cb)
    TriggerServerEvent('fw:inventory:dropItem', data.name, data.amount or 1)
    cb('ok')
end)

RegisterNUICallback('giveItem', function(data, cb)
    local closestPlayer, closestDistance = GetClosestPlayer()
    if closestPlayer ~= -1 and closestDistance < 3.0 then
        local targetId = GetPlayerServerId(closestPlayer)
        TriggerServerEvent('fw:inventory:giveItem', data.name, data.amount or 1, targetId)
    else
        TriggerEvent('FW:Notify', 'Kein Spieler in der Nähe', 'error')
    end
    cb('ok')
end)

RegisterNUICallback('pickupItem', function(data, cb)
    print('[FW Client] Picking up item from ground:', data.name)
    TriggerServerEvent('fw:inventory:pickupItem', data.name, data.amount or 1, data.toSlot)
    cb('ok')
end)

RegisterNUICallback('moveItem', function(data, cb)
    local fromSlot = data.fromSlot or (data.from and data.from.slot)
    local toSlot = data.toSlot or (data.to and data.to.slot)
    print('[FW Client] Moving item from slot', fromSlot, 'to slot', toSlot)
    TriggerServerEvent('fw:inventory:moveItem', fromSlot, toSlot)
    cb('ok')
end)

RegisterNUICallback('updateInventoryOrder', function(data, cb)
    print('[FW Client] Updating inventory order')
    TriggerServerEvent('fw:inventory:updateOrder', data.slots)
    cb('ok')
end)

RegisterNUICallback('stackItems', function(data, cb)
    print('[FW Client] Stacking items from slot', data.fromSlot, 'to slot', data.toSlot)
    TriggerServerEvent('fw:inventory:stackItems', data.fromSlot, data.toSlot, data.itemName)
    cb('ok')
end)

-- Geben-Modus mit NPC-Auswahl
local giveMode = false
local giveItemsBuffer = {}
local nearbyPeds = {}

local showMode = false
local showDocumentData = {}

RegisterNUICallback('startGiveMode', function(data, cb)
    print('[FW Client] Starting give mode with items:', json.encode(data.items))
    giveMode = true
    giveItemsBuffer = data.items or {}
    
    -- Starte NPC-Auswahl Thread
    Citizen.CreateThread(function()
        while giveMode do
            local playerPed = PlayerPedId()
            local playerCoords = GetEntityCoords(playerPed)
            nearbyPeds = {}
            
            -- Finde NPCs in der Nähe
            local handle, ped = FindFirstPed()
            local success
            repeat
                if DoesEntityExist(ped) and not IsPedAPlayer(ped) and not IsPedDeadOrDying(ped, true) then
                    local pedCoords = GetEntityCoords(ped)
                    local distance = #(playerCoords - pedCoords)
                    
                    if distance < 5.0 then
                        table.insert(nearbyPeds, {
                            handle = ped,
                            coords = pedCoords,
                            distance = distance
                        })
                        
                        -- Zeichne Marker über NPC
                        DrawMarker(
                            2, -- Typ: Pfeil nach unten
                            pedCoords.x, pedCoords.y, pedCoords.z + 1.2,
                            0.0, 0.0, 0.0,
                            180.0, 0.0, 0.0,
                            0.3, 0.3, 0.3,
                            99, 102, 241, 200,
                            true, true, 2, false, nil, nil, false
                        )
                        
                        -- Text anzeigen
                        if distance < 2.0 then
                            local onScreen, _x, _y = World3dToScreen2d(pedCoords.x, pedCoords.y, pedCoords.z + 1.5)
                            if onScreen then
                                SetTextScale(0.35, 0.35)
                                SetTextFont(4)
                                SetTextProportional(1)
                                SetTextColour(255, 255, 255, 215)
                                SetTextEntry("STRING")
                                SetTextCentre(true)
                                AddTextComponentString("[E] Items übergeben")
                                DrawText(_x, _y)
                            end
                        end
                    end
                end
                success, ped = FindNextPed(handle)
            until not success
            EndFindPed(handle)
            
            -- E-Taste zum Übergeben
            if IsControlJustReleased(0, 38) then -- E
                local closestPed = nil
                local closestDist = 999999
                
                for _, pedData in ipairs(nearbyPeds) do
                    if pedData.distance < closestDist then
                        closestDist = pedData.distance
                        closestPed = pedData
                    end
                end
                
                if closestPed and closestDist < 2.0 then
                    print('[FW Client] Giving items to NPC:', closestPed.handle)
                    
                    -- Simuliere Übergabe
                    for _, item in ipairs(giveItemsBuffer) do
                        TriggerServerEvent('fw:inventory:giveToNPC', item.name, item.amount)
                    end
                    
                    -- Zeige Animation
                    TaskTurnPedToFaceEntity(playerPed, closestPed.handle, 1000)
                    Wait(500)
                    RequestAnimDict("mp_common")
                    while not HasAnimDictLoaded("mp_common") do Wait(10) end
                    TaskPlayAnim(playerPed, "mp_common", "givetake1_a", 8.0, -8.0, 2000, 0, 0, false, false, false)
                    
                    Wait(1000)
                    TriggerEvent('FW:Notify', 'Items an NPC übergeben', 'success')
                    
                    giveMode = false
                    giveItemsBuffer = {}
                end
            end
            
            -- ESC zum Abbrechen
            if IsControlJustReleased(0, 200) then -- ESC
                TriggerEvent('FW:Notify', 'Übergabe abgebrochen', 'error')
                giveMode = false
                giveItemsBuffer = {}
            end
            
            Wait(0)
        end
    end)
    
    cb('ok')
end)

-- Start Show Mode (für Lizenzen, ID Card, etc.)
RegisterNUICallback('startShowMode', function(data, cb)
    print('[FW Client] Starting show mode:', json.encode(data))
    showMode = true
    showDocumentData = data or {}
    
    -- Starte NPC-Auswahl Thread
    Citizen.CreateThread(function()
        while showMode do
            local playerPed = PlayerPedId()
            local playerCoords = GetEntityCoords(playerPed)
            nearbyPeds = {}
            
            -- Finde NPCs in der Nähe
            local handle, ped = FindFirstPed()
            local success
            repeat
                if DoesEntityExist(ped) and not IsPedAPlayer(ped) and not IsPedDeadOrDying(ped, true) then
                    local pedCoords = GetEntityCoords(ped)
                    local distance = #(playerCoords - pedCoords)
                    
                    if distance < 5.0 then
                        table.insert(nearbyPeds, {
                            handle = ped,
                            coords = pedCoords,
                            distance = distance
                        })
                        
                        -- Zeichne Marker über NPC
                        DrawMarker(
                            2, -- Typ: Pfeil nach unten
                            pedCoords.x, pedCoords.y, pedCoords.z + 1.2,
                            0.0, 0.0, 0.0,
                            180.0, 0.0, 0.0,
                            0.3, 0.3, 0.3,
                            99, 241, 102, 200,
                            true, true, 2, false, nil, nil, false
                        )
                        
                        -- Text anzeigen
                        if distance < 3.0 then
                            local onScreen, _x, _y = World3dToScreen2d(pedCoords.x, pedCoords.y, pedCoords.z + 1.5)
                            if onScreen then
                                SetTextScale(0.35, 0.35)
                                SetTextFont(4)
                                SetTextProportional(1)
                                SetTextColour(255, 255, 255, 215)
                                SetTextEntry("STRING")
                                SetTextCentre(true)
                                AddTextComponentString("[E] " .. (showDocumentData.label or "Dokument") .. " zeigen")
                                DrawText(_x, _y)
                            end
                        end
                    end
                end
                success, ped = FindNextPed(handle)
            until not success
            EndFindPed(handle)
            
            -- E-Taste zum Zeigen
            if IsControlJustReleased(0, 38) then -- E
                local closestPed = nil
                local closestDist = 999999
                
                for _, pedData in ipairs(nearbyPeds) do
                    if pedData.distance < closestDist then
                        closestDist = pedData.distance
                        closestPed = pedData
                    end
                end
                
                if closestPed and closestDist < 3.0 then
                    print('[FW Client] Showing document to NPC:', closestPed.handle)
                    
                    -- Animation
                    TaskTurnPedToFaceEntity(playerPed, closestPed.handle, 1000)
                    Wait(500)
                    RequestAnimDict("mp_common")
                    while not HasAnimDictLoaded("mp_common") do Wait(10) end
                    TaskPlayAnim(playerPed, "mp_common", "givetake1_a", 8.0, -8.0, 2000, 0, 0, false, false, false)
                    
                    -- Simuliere Zeigen an NPC (keine Server-Events nötig)
                    Wait(500)
                    TriggerEvent('FW:Notify', showDocumentData.label .. ' an NPC gezeigt', 'success')
                    
                    showMode = false
                    showDocumentData = {}
                end
            end
            
            -- ESC zum Abbrechen
            if IsControlJustReleased(0, 200) then -- ESC
                TriggerEvent('FW:Notify', 'Abgebrochen', 'error')
                showMode = false
                showDocumentData = {}
            end
            
            Wait(0)
        end
    end)
    
    cb('ok')
end)

-- Update Inventory from Server
RegisterNetEvent('fw:inventory:refresh')
AddEventHandler('fw:inventory:refresh', function(inventory)
    print('[FW Client] Inventory refresh received:', json.encode(inventory or {}))
    if isInventoryOpen then
        SendNUIMessage({
            action = 'updateSlots',
            inventory = inventory or {}
        })
        print('[FW Client] Sent updateSlots to NUI')
    end
end)

-- Update Ground Items from Server
RegisterNetEvent('fw:inventory:updateGroundItems')
AddEventHandler('fw:inventory:updateGroundItems', function(groundItems)
    print('[FW Client] Ground items update received:', json.encode(groundItems or {}))
    if isInventoryOpen then
        SendNUIMessage({
            action = 'updateGroundItems',
            groundItems = groundItems or {}
        })
        print('[FW Client] Sent updateGroundItems to NUI')
    end
end)

-- Notify Event Handler (falls noch nicht in main.lua)
RegisterNetEvent('fw:client:notify')
AddEventHandler('fw:client:notify', function(message, type)
    type = type or 'info'
    TriggerEvent('FW:Notify', message, type)
end)

-- Helper: Find closest player
function GetClosestPlayer()
    local players = GetActivePlayers()
    local closestDistance = -1
    local closestPlayer = -1
    local ply = PlayerPedId()
    local plyCoords = GetEntityCoords(ply, false)

    for _, player in ipairs(players) do
        local target = GetPlayerPed(player)
        if target ~= ply then
            local targetCoords = GetEntityCoords(target, false)
            local distance = #(plyCoords - targetCoords)
            if closestDistance == -1 or distance < closestDistance then
                closestPlayer = player
                closestDistance = distance
            end
        end
    end

    return closestPlayer, closestDistance
end

-- Lizenzen-Callback
RegisterNUICallback('getPlayerLicenses', function(data, cb)
    print('[FW Client] Requesting player licenses...')
    TriggerServerEvent('fw:licenses:requestLicenses')
    cb('ok')
end)

-- ID Card Callback
RegisterNUICallback('getIDCardData', function(data, cb)
    print('[FW Client] Requesting ID Card data...')
    -- TODO: Implementiere ID Card Modal mit Spieler-Daten
    TriggerEvent('FW:Notify', 'ID Card Funktion wird noch implementiert', 'info')
    cb('ok')
end)



-- Empfange Lizenzen vom Server
RegisterNetEvent('fw:licenses:sendLicenses', function(licenses)
    print('[FW Client] Received licenses from server:', json.encode(licenses or {}))
    SendNUIMessage({
        action = 'receiveLicenses',
        licenses = licenses or {}
    })
end)


RegisterNUICallback('closeInventory', function(data, cb)
    -- Inventar schließen
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('saveBackpack', function(data, cb)
    -- data.items = backpackItems Array
    -- Speichere auf Server (z.B. MySQL)
    TriggerServerEvent('fw_core:saveBackpack', data.items)
    cb('ok')
end)

RegisterNUICallback('useItem', function(data, cb)
    -- data.name = itemName
    -- data.fromHotbar = true/false
    TriggerServerEvent('fw_core:useItem', data.name, data.fromHotbar)
    cb('ok')
end)