-- ============================================
-- FW Core: Client UI Settings Manager (Server-basiert)
-- Spielerabhängige UI-Einstellungen mit Datenbank
-- ============================================

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
        FW.Debug('UI Settings', 'NUI not ready, deferring sync')
        return
    end
    
    FW.Debug('UI Settings', 'Sending settings to NUI', currentSettings)
    
    SendNUIMessage({
        action = 'loadSettings',
        settings = currentSettings
    })
end

-- ============================================
-- LOAD SETTINGS FROM SERVER
-- ============================================

local function loadSettingsFromServer()
    FW.Debug('UI Settings', 'Requesting settings from server')
    
    FW.TriggerCallback('fw:ui:getSettings', function(settings)
        if settings and type(settings) == 'table' then
            currentSettings = settings
            FW.Debug('UI Settings', 'Settings loaded', currentSettings)
            
            -- Send to NUI if ready
            if isNUIReady then
                sendSettingsToNUI()
            end
        else
            FW.Debug('UI Settings', 'Failed to load, using defaults')
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
    FW.Debug('UI Settings', 'Player spawned, loading settings')
    isPlayerSpawned = true
    
    -- Sofort laden, keine Verzögerung
    loadSettingsFromServer()
end)

-- Alternative: Lade Settings beim Character-Select
RegisterNetEvent('fw:playerReady')
AddEventHandler('fw:playerReady', function()
    FW.Debug('UI Settings', 'Player ready, pre-loading')
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
    FW.Debug('UI Settings', 'NUI is ready')
    isNUIReady = true
    
    -- Sende Settings wenn bereits geladen
    if isPlayerSpawned and currentSettings and next(currentSettings) then
        sendSettingsToNUI()
    end
    
    cb('ok')
end)

-- NUI fordert Settings an
RegisterNUICallback('requestSettings', function(data, cb)
    FW.Debug('UI Settings', 'NUI requested settings')
    
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
        FW.Debug('UI Settings', 'No key provided')
        cb({ success = false, error = 'No key' })
        return
    end
    
    FW.Debug('UI Settings', 'Saving setting', key, '=', value)
    
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
        FW.Debug('UI Settings', 'Invalid settings data')
        cb({ success = false, error = 'Invalid data' })
        return
    end
    
    FW.Debug('UI Settings', 'Saving all settings')
    
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
    FW.Debug('UI Settings', 'Resetting to defaults')
    
    -- Sende Reset an Server
    TriggerServerEvent('fw:ui:resetSettings')
    
    cb({ success = true })
end)

-- Server bestätigt Reset
RegisterNetEvent('fw:ui:settingsReset')
AddEventHandler('fw:ui:settingsReset', function(defaultSettingsFromServer)
    FW.Debug('UI Settings', 'Reset confirmed by server')
    
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

FW.Debug('UI Settings', 'Module loaded with exports')
