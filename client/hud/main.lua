FW = FW or {}
FW.Hud = FW.Hud or {}

-- ============================================
-- FW Core: HUD & Notify Logic
-- ============================================

local showHUD = true

-- === NOTIFY SYSTEM ===

RegisterNetEvent('fw:client:notify')
AddEventHandler('fw:client:notify', function(message, type, duration)
    SendNUIMessage({
        action = 'notify',
        data = {
            message = message,
            type = type or 'info',
            duration = duration or 3000
        }
    })
end)

-- Legacy Support für Framework
RegisterNetEvent('FW:Notify')
AddEventHandler('FW:Notify', function(msg, type, duration)
    if not duration then duration = 3000 end
    TriggerEvent('fw:client:notify', msg, type, duration)
end)

-- === HUD SYSTEM ===

Citizen.CreateThread(function()
    while true do
        if showHUD then
            local playerPed = PlayerPedId()
            
            -- Daten sammeln
            local hudData = {
                health = (GetEntityHealth(playerPed) - 100),
                armor = GetPedArmour(playerPed),
                hunger = 100, -- TODO: Aus FW holen
                thirst = 100, -- TODO: Aus FW holen
                inVehicle = false
            }

            if IsPedInAnyVehicle(playerPed, false) then
                local vehicle = GetVehiclePedIsIn(playerPed, false)
                hudData.inVehicle = true
                hudData.speed = GetEntitySpeed(vehicle) * 3.6 -- km/h
                hudData.fuel = GetVehicleFuelLevel(vehicle)
            end

            -- An NUI senden (action: 'updateHUD')
            SendNUIMessage({
                action = 'updateHUD',
                data = hudData
            })
        end
        Wait(500) -- Aktualisierungsrate (nicht zu schnell für Performance)
    end
end)

-- HUD Toggle Command
RegisterCommand('togglehud', function()
    showHUD = not showHUD
    SendNUIMessage({
        action = 'toggleHUD',
        data = { visible = showHUD }
    })
end)