-- ============================================
-- FW Core - Zentrales Debug-System
-- ============================================
-- Verwendung:
--   FW.Debug('Inventory', 'Item added', itemName, amount)
--   FW.DebugTable('Player', 'Inventory state', inventoryTable)
-- ============================================

FW = FW or {}

-- Lade Debug-Config aus main.json
local function LoadDebugConfig()
    local resourceName = GetCurrentResourceName()
    local content = LoadResourceFile(resourceName, 'configs/main.json')
    
    if content then
        local ok, data = pcall(json.decode, content)
        if ok and data and data.debug ~= nil then
            Config.Debug = data.debug
            return
        end
    end
    
    -- Fallback
    Config.Debug = false
end

-- Beim Resource-Start laden
CreateThread(function()
    LoadDebugConfig()
    if Config.Debug then
        print('[FW Debug] 🐛 Debug-Modus aktiviert')
    end
end)

-- Debug Print mit Kategorie
function FW.Debug(category, message, ...)
    if not Config or not Config.Debug then return end
    
    local args = {...}
    local argsStr = ''
    
    if #args > 0 then
        local argParts = {}
        for i, v in ipairs(args) do
            if type(v) == 'table' then
                table.insert(argParts, json.encode(v))
            else
                table.insert(argParts, tostring(v))
            end
        end
        argsStr = ' | ' .. table.concat(argParts, ', ')
    end
    
    print(string.format('[FW:%s] %s%s', category, message, argsStr))
end

-- Debug Table Print (für komplexe Datenstrukturen)
function FW.DebugTable(category, message, tbl)
    if not Config or not Config.Debug then return end
    
    if type(tbl) == 'table' then
        print(string.format('[FW:%s] %s:', category, message))
        print(json.encode(tbl, {indent = true}))
    else
        FW.Debug(category, message, tbl)
    end
end

-- Export für Client/Server
if IsDuplicityVersion() then
    -- Server-Side
    print('[FW Debug] 📡 Server debug helper loaded')
else
    -- Client-Side
    print('[FW Debug] 💻 Client debug helper loaded')
end
