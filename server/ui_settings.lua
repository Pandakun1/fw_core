-- ============================================
-- FW Core: Server UI Settings Manager
-- Spielerabhängige UI-Einstellungen (Datenbank)
-- ============================================

print('======================================')
print('[FW UI Settings] 🚀 SERVER UI SETTINGS MODULE LOADING...')
print('[FW UI Settings] 📅 Version: 2024-12-02 - Database-based player settings')
print('======================================')

-- Default UI Settings (nur Design - alles andere unwichtig)
local defaultUISettings = {
    inventory_design = "forest"
}

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

local function mergeSettings(dbSettings, defaults)
    local merged = {}
    
    -- Copy defaults
    for k, v in pairs(defaults) do
        merged[k] = v
    end
    
    -- Override with DB values
    if dbSettings and type(dbSettings) == 'table' then
        for k, v in pairs(dbSettings) do
            merged[k] = v
        end
    end
    
    return merged
end

-- ============================================
-- SERVER CALLBACKS
-- ============================================

-- Client fordert UI-Settings an (beim Spawn/Reconnect)
FW.RegisterServerCallback('fw:ui:getSettings', function(source, cb)
    local player = FW.GetPlayer(source)
    
    if not player then
        print(('[FW UI Settings] ⚠️ Player not found for source %s'):format(source))
        cb(defaultUISettings)
        return
    end
    
    local identifier = player.identifier
    
    MySQL.single('SELECT ui_settings FROM players WHERE identifier = ?', {identifier}, function(result)
        if result and result.ui_settings then
            -- Parse JSON
            local success, parsed = pcall(json.decode, result.ui_settings)
            
            if success and type(parsed) == 'table' then
                local merged = mergeSettings(parsed, defaultUISettings)
                print(('[FW UI Settings] 📂 Loaded settings for %s'):format(identifier))
                cb(merged)
            else
                print(('[FW UI Settings] ⚠️ Failed to parse settings for %s, using defaults'):format(identifier))
                cb(defaultUISettings)
            end
        else
            print(('[FW UI Settings] 📋 No settings found for %s, using defaults'):format(identifier))
            cb(defaultUISettings)
        end
    end)
end)

-- Client speichert einzelne UI-Setting
RegisterNetEvent('fw:ui:saveSetting')
AddEventHandler('fw:ui:saveSetting', function(key, value)
    local source = source
    print(('[FW UI Settings] 📥 SERVER RECEIVED saveSetting event - key: %s, value: %s, source: %s'):format(tostring(key), tostring(value), tostring(source)))
    
    local player = FW.GetPlayer(source)
    
    if not player then
        print(('[FW UI Settings] ⚠️ Player not found for source %s'):format(source))
        return
    end
    
    local identifier = player.identifier
    
    -- Lade aktuelle Settings
    MySQL.single('SELECT ui_settings FROM players WHERE identifier = ?', {identifier}, function(result)
        local currentSettings = {}
        
        if result and result.ui_settings then
            local success, parsed = pcall(json.decode, result.ui_settings)
            if success and type(parsed) == 'table' then
                currentSettings = parsed
            end
        end
        
        -- Update Setting
        currentSettings[key] = value
        
        print(('[FW UI Settings] 📦 Current settings table after update:'):format())
        for k, v in pairs(currentSettings) do
            print(('  - %s: %s'):format(k, tostring(v)))
        end
        
        -- Speichere zurück
        local settingsJSON = json.encode(currentSettings)
        print(('[FW UI Settings] 💾 JSON to save: %s'):format(settingsJSON))
        
        -- UPDATE PLAYER OBJECT SOFORT (vor DB-Save)
        player.ui_settings = settingsJSON
        print(('[FW UI Settings] ✅ Player object updated: %s'):format(player.ui_settings))
        
        MySQL.update('UPDATE players SET ui_settings = ? WHERE identifier = ?', {settingsJSON, identifier}, function(affected)
            if affected > 0 then
                print(('[FW UI Settings] 💾 Saved %s = %s for %s'):format(key, tostring(value), identifier))
            else
                print(('[FW UI Settings] ❌ Failed to save setting for %s'):format(identifier))
            end
        end)
    end)
end)

-- Client speichert alle UI-Settings auf einmal
RegisterNetEvent('fw:ui:saveAllSettings')
AddEventHandler('fw:ui:saveAllSettings', function(settings)
    local source = source
    local player = FW.GetPlayer(source)
    
    if not player then
        print(('[FW UI Settings] ⚠️ Player not found for source %s'):format(source))
        return
    end
    
    local identifier = player.identifier
    
    if not settings or type(settings) ~= 'table' then
        print(('[FW UI Settings] ❌ Invalid settings data from %s'):format(identifier))
        return
    end
    
    local settingsJSON = json.encode(settings)
    
    -- UPDATE PLAYER OBJECT SOFORT
    player.ui_settings = settingsJSON
    print(('[FW UI Settings] ✅ Player object updated with all settings'))
    
    MySQL.update('UPDATE players SET ui_settings = ? WHERE identifier = ?', {settingsJSON, identifier}, function(affected)
        if affected > 0 then
            print(('[FW UI Settings] 💾 Saved %d settings for %s'):format(
                type(settings) == 'table' and #settings or 0,
                identifier
            ))
        else
            print(('[FW UI Settings] ❌ Failed to save settings for %s'):format(identifier))
        end
    end)
end)

-- Client setzt UI-Settings zurück
RegisterNetEvent('fw:ui:resetSettings')
AddEventHandler('fw:ui:resetSettings', function()
    local source = source
    local player = FW.GetPlayer(source)
    
    if not player then
        print(('[FW UI Settings] ⚠️ Player not found for source %s'):format(source))
        return
    end
    
    local identifier = player.identifier
    local defaultJSON = json.encode(defaultUISettings)
    
    -- UPDATE PLAYER OBJECT
    player.ui_settings = defaultJSON
    print(('[FW UI Settings] ✅ Player object reset to defaults'))
    
    MySQL.update('UPDATE players SET ui_settings = ? WHERE identifier = ?', {defaultJSON, identifier}, function(affected)
        if affected > 0 then
            print(('[FW UI Settings] 🔄 Reset settings to defaults for %s'):format(identifier))
            TriggerClientEvent('fw:ui:settingsReset', source, defaultUISettings)
        else
            print(('[FW UI Settings] ❌ Failed to reset settings for %s'):format(identifier))
        end
    end)
end)

-- ============================================
-- EXPORTS für direkten Zugriff
-- ============================================

-- Hole UI Settings für einen Spieler (parsed als Table)
exports('GetPlayerUISettings', function(source)
    local player = FW.GetPlayer(source)
    if not player then return nil end
    
    if not player.ui_settings or player.ui_settings == '{}' then
        return defaultUISettings
    end
    
    local success, parsed = pcall(json.decode, player.ui_settings)
    if success and type(parsed) == 'table' then
        return parsed
    end
    
    return defaultUISettings
end)

-- Hole spezifische UI Setting für einen Spieler
exports('GetPlayerUISetting', function(source, key)
    local settings = exports['fw_core']:GetPlayerUISettings(source)
    return settings and settings[key] or nil
end)

print('======================================')
print('[FW UI Settings] ✅ SERVER UI SETTINGS MODULE LOADED')
print('[FW UI Settings] 📋 Callbacks: fw:ui:getSettings')
print('[FW UI Settings] 📋 Events: fw:ui:saveSetting, fw:ui:saveAllSettings, fw:ui:resetSettings')
print('[FW UI Settings] 📋 Exports: GetPlayerUISettings, GetPlayerUISetting')
print('======================================')

-- Test command to verify server module is loaded
RegisterCommand('testui', function(source, args)
    print('[FW UI Settings] 🧪 Test command executed - Server module is LOADED and WORKING')
    
    if source > 0 then
        local player = FW.GetPlayer(source)
        if player then
            print('[FW UI Settings] 📊 Player object ui_settings:', player.ui_settings)
            local settings = exports['fw_core']:GetPlayerUISettings(source)
            print('[FW UI Settings] 📊 Parsed settings:', json.encode(settings))
        end
        
        TriggerClientEvent('chat:addMessage', source, {
            args = {'[FW UI Settings]', 'Server module is loaded and working! ✅'}
        })
    end
end, false)
