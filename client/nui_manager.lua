-- ============================================
-- FW Core: NUI Focus Manager
-- Verwaltet den Fokus zentral für ALLE UIs
-- ============================================

local openModules = {} -- Speichert: { inventory = true, admin = true }

-- Export: Prüfen, ob irgendwas offen ist
function IsAnyUIOpen()
    return next(openModules) ~= nil
end
exports('IsAnyUIOpen', IsAnyUIOpen)

-- Export: Modul registrieren (Öffnen)
function RegisterUIOpen(moduleName, hasCursor)
    openModules[moduleName] = true
    SetNuiFocus(true, hasCursor)
    -- Debug
    print('[NUI Manager] Module opened:', moduleName)
end
exports('RegisterUIOpen', RegisterUIOpen)

-- Export: Modul deregistrieren (Schließen)
function RegisterUIClose(moduleName)
    openModules[moduleName] = nil
    
    -- Nur wenn KEIN anderes Modul mehr offen ist, Fokus entfernen
    if not IsAnyUIOpen() then
        SetNuiFocus(false, false)
        print('[NUI Manager] All modules closed, Focus removed')
    else
        print('[NUI Manager] Module closed:', moduleName, '- Focus remains active')
    end
end
exports('RegisterUIClose', RegisterUIClose)

-- NUI Callback: Globales Schließen (Sicherheitsnetz)
RegisterNUICallback('closeAll', function(data, cb)
    openModules = {}
    SetNuiFocus(false, false)
    
    -- Events an alle Module senden, damit sie ihren internen State resetten
    TriggerEvent('fw:client:closeInventory')
    TriggerEvent('fw:client:closeAdmin')
    
    cb('ok')
end)