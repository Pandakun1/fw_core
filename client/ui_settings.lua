-- ============================================
-- FW Core: Client UI Settings Manager (Server-basiert)
-- Spielerabhängige UI-Einstellungen mit Datenbank
-- ============================================

print('[FW UI Settings] 🚀 Client UI Settings module loading...')

local isNUIReady = false
local isPlayerSpawned = false
local currentSettings = {}

-- Default Settings (nur Design - alles andere unwichtig)
local defaultSettings = {
    inventory_design = "forest"
}

-- ============================================
-- SEND SETTINGS TO NUI
-- ============================================

local function sendSettingsToNUI()
    if not isNUIReady then
        print('[FW UI Settings] ⏳ NUI not ready yet, deferring settings sync...')
        return
    end
    
    print('[FW UI Settings] 📤 Sending settings to NUI:')
    for key, value in pairs(currentSettings) do
        print(('  - %s: %s'):format(key, tostring(value)))
    end
    
    SendNUIMessage({
        action = 'loadSettings',
        settings = currentSettings
    })
end

-- ============================================
-- LOAD SETTINGS FROM SERVER
-- ============================================

local function loadSettingsFromServer()
    print('[FW UI Settings] 📂 Requesting settings from server...')
    
    FW.TriggerCallback('fw:ui:getSettings', function(settings)
        if settings and type(settings) == 'table' then
            currentSettings = settings
            print('[FW UI Settings] ✅ Settings loaded from server')
            
            -- Debug output
            for key, value in pairs(currentSettings) do
                print(('  - %s: %s'):format(key, tostring(value)))
            end
            
            -- Send to NUI if ready
            if isNUIReady then
                sendSettingsToNUI()
            end
        else
            print('[FW UI Settings] ⚠️ Failed to load from server, using defaults')
            currentSettings = defaultSettings
        end
    end)
end

-- ============================================
-- PLAYER SPAWN EVENT
-- ============================================

-- Warte bis Spieler gespawnt ist
RegisterNetEvent('fw:spawnPlayer')
AddEventHandler('fw:spawnPlayer', function(spawnData)
    print('[FW UI Settings] 🎮 Player spawned, loading UI settings...')
    isPlayerSpawned = true
    
    -- Sofort laden, keine Verzögerung
    loadSettingsFromServer()
end)

-- Alternative: Lade Settings beim Character-Select
RegisterNetEvent('fw:playerReady')
AddEventHandler('fw:playerReady', function()
    print('[FW UI Settings] 👤 Player ready, pre-loading UI settings...')
    isPlayerSpawned = true
    
    -- Warte kurz bis FW.TriggerCallback verfügbar ist
    Citizen.SetTimeout(500, function()
        loadSettingsFromServer()
    end)
end)

-- ============================================
-- NUI CALLBACKS
-- ============================================

-- NUI signalisiert Bereitschaft
RegisterNUICallback('nuiReady', function(data, cb)
    print('[FW UI Settings] 🟢 NUI is ready')
    isNUIReady = true
    
    -- Sende Settings wenn bereits geladen
    if isPlayerSpawned and currentSettings and next(currentSettings) then
        sendSettingsToNUI()
    end
    
    cb('ok')
end)

-- NUI fordert Settings an
RegisterNUICallback('requestSettings', function(data, cb)
    print('[FW UI Settings] 📨 NUI requested settings')
    
    if next(currentSettings) then
        cb(currentSettings)
    else
        -- Lade von Server wenn noch nicht vorhanden
        FW.TriggerCallback('fw:ui:getSettings', function(settings)
            currentSettings = settings or defaultSettings
            cb(currentSettings)
        end)
    end
end)

-- NUI speichert einzelne Setting
RegisterNUICallback('saveSetting', function(data, cb)
    local key = data.key
    local value = data.value
    
    if not key then
        print('[FW UI Settings] ❌ No key provided')
        cb({ success = false, error = 'No key' })
        return
    end
    
    print(('[FW UI Settings] 💾 NUI requests save: %s = %s (type: %s)'):format(key, tostring(value), type(value)))
    
    -- Update lokal
    currentSettings[key] = value
    
    -- Sende an Server
    TriggerServerEvent('fw:ui:saveSetting', key, value)
    
    -- Fire Event für andere Scripts
    TriggerEvent('fw:ui:settingChanged', key, value)
    
    cb({ success = true })
end)

-- NUI speichert alle Settings
RegisterNUICallback('saveSettings', function(data, cb)
    local newSettings = data.settings
    
    if not newSettings or type(newSettings) ~= 'table' then
        print('[FW UI Settings] ❌ Invalid settings data')
        cb({ success = false, error = 'Invalid data' })
        return
    end
    
    print(('[FW UI Settings] 💾 Saving %d settings'):format(
        type(newSettings) == 'table' and #newSettings or 0
    ))
    
    -- Update lokal
    for key, value in pairs(newSettings) do
        currentSettings[key] = value
    end
    
    -- Sende an Server
    TriggerServerEvent('fw:ui:saveAllSettings', currentSettings)
    
    -- Fire Event
    TriggerEvent('fw:ui:settingsChanged', currentSettings)
    
    cb({ success = true })
end)

-- NUI setzt Settings zurück
RegisterNUICallback('resetSettings', function(data, cb)
    print('[FW UI Settings] 🔄 Resetting settings to defaults')
    
    -- Sende Reset an Server
    TriggerServerEvent('fw:ui:resetSettings')
    
    cb({ success = true })
end)

-- Server bestätigt Reset
RegisterNetEvent('fw:ui:settingsReset')
AddEventHandler('fw:ui:settingsReset', function(defaultSettingsFromServer)
    print('[FW UI Settings] ✅ Settings reset confirmed by server')
    
    currentSettings = defaultSettingsFromServer or defaultSettings
    
    -- Update NUI
    if isNUIReady then
        sendSettingsToNUI()
    end
    
    -- Fire Event
    TriggerEvent('fw:ui:settingsChanged', currentSettings)
end)

-- ============================================
-- EXPORTS
-- ============================================

-- Hole einzelnes Setting
exports('GetUISetting', function(key)
    return currentSettings[key] or defaultSettings[key]
end)

-- Setze einzelnes Setting (speichert sofort)
exports('SetUISetting', function(key, value)
    currentSettings[key] = value
    TriggerServerEvent('fw:ui:saveSetting', key, value)
    return true
end)

-- Hole alle Settings
exports('GetAllUISettings', function()
    return currentSettings
end)

-- Prüfe ob Setting existiert
exports('HasUISetting', function(key)
    return currentSettings[key] ~= nil or defaultSettings[key] ~= nil
end)

-- Lade Settings manuell neu (z.B. nach Character-Wechsel)
exports('ReloadUISettings', function()
    loadSettingsFromServer()
end)

print('[FW UI Settings] ✅ Client UI Settings module loaded')
print('[FW UI Settings] 📋 Exports: GetUISetting, SetUISetting, GetAllUISettings, HasUISetting, ReloadUISettings')
print('[FW UI Settings] 📋 Events: fw:ui:settingChanged, fw:ui:settingsChanged')
