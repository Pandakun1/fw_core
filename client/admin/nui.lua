local isAdminOpen = false

-- Öffnen Event
RegisterNetEvent('fw:client:openAdmin')
AddEventHandler('fw:client:openAdmin', function()
    if isAdminOpen then return end
    if exports['fw_core']:IsAnyUIOpen() then return end

    isAdminOpen = true
    exports['fw_core']:RegisterUIOpen('admin', true)
    
    SendNUIMessage({
        action = 'openAdmin'
    })
end)

-- Schließen Funktion
function CloseAdminPanel()
    if not isAdminOpen then return end
    isAdminOpen = false
    SendNUIMessage({ action = 'closeAdmin' })
    exports['fw_core']:RegisterUIClose('admin')
end

-- Command
RegisterCommand('admin', function()
    if isAdminOpen then CloseAdminPanel() else TriggerEvent('fw:client:openAdmin') end
end)
RegisterKeyMapping('admin', 'Admin Menü', 'keyboard', 'F9')

-- Callbacks
RegisterNUICallback('closeAdmin', function(_, cb)
    CloseAdminPanel()
    cb('ok')
end)

-- Admin Aktionen Weiterleitung
RegisterNUICallback('adminAction', function(data, cb)
    -- Leitet Aktionen wie 'noclip', 'tp', 'ban' an Server oder Logik-Scripts weiter
    TriggerServerEvent('fw:admin:action', data) 
    -- ODER Client-Logik direkt aufrufen:
    if data.action == 'noclip' then TriggerEvent('fw:admin:toggleNoclip') end
    
    cb('ok')
end)