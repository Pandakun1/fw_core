-- ============================================
-- FW Core: Admin NUI Integration
-- Verbindet Vue Frontend mit Lua Admin Logik
-- ============================================

local isAdminOpen = false

function OpenAdminPanel()
    if isAdminOpen then return end
    if exports['fw_core']:IsAnyUIOpen() then return end

    -- Optional: Permission Check hier oder im Frontend
    SendNUIMessage({ action = 'openAdmin' })
    
    isAdminOpen = true
    exports['fw_core']:RegisterUIOpen('admin', true)
end

function CloseAdminPanel()
    if not isAdminOpen then return end
    
    isAdminOpen = false
    SendNUIMessage({ action = 'closeAdmin' })
    
    exports['fw_core']:RegisterUIClose('admin')
end

-- Command
RegisterCommand('admin', function()
    if isAdminOpen then CloseAdminPanel() else OpenAdminPanel() end
end, false)
RegisterKeyMapping('admin', 'Admin Menü öffnen', 'keyboard', 'F9')

-- Event Listener (Reset)
RegisterNetEvent('fw:client:closeAdmin', function()
    isAdminOpen = false
    SendNUIMessage({ action = 'closeAdmin' })
end)

-- === NUI CALLBACKS & ACTION HANDLER ===

RegisterNUICallback('closeAdmin', function(data, cb)
    CloseAdminPanel()
    cb('ok')
end)

-- Haupt-Handler für alle Admin Aktionen aus dem UI
RegisterNUICallback('adminAction', function(data, cb)
    local category = data.category
    local action = data.action
    local input = data.input -- z.B. ID oder Car Model
    
    print('[Admin NUI] Action:', category, action, input)

    -- Weiterleitung an Logik (Client oder Server)
    if action == 'noclip' then
        -- Ruft Logik in client/admin/noclip.lua auf (Event triggern)
        TriggerEvent('fw:admin:toggleNoclip') 
    
    elseif action == 'godmode' then
        -- Ruft Logik in client/admin/godmode.lua auf (falls vorhanden)
        TriggerServerEvent('fw:admin:toggleGodmode') 

    elseif action == 'spawnVehicle' or action == 'dv' then
        -- Fahrzeuge
        TriggerServerEvent('fw:admin:vehicleAction', action, input)

    elseif category == 'players' then
        -- Spieler Interaktionen (Kick, Ban, Heal, Revive)
        TriggerServerEvent('fw:admin:playerAction', action, input)
        
    else
        -- Fallback: Alles unbekannte an Server senden
        TriggerServerEvent('fw:admin:genericAction', category, action, input)
    end

    cb('ok')
end)