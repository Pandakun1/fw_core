# FW Core - AI Coding Instructions

## Project Overview
FiveM roleplay server framework with Vue 3 NUI (browser UI) for GTA V multiplayer. Provides inventory, character creation, admin tools, HUD, and garage systems. Uses Lua server/client logic with JavaScript/Vue frontend.

## Architecture

### Three-Layer Communication
1. **Lua Server** (`server/*.lua`) - Game logic, database operations, player management
2. **Lua Client** (`client/*.lua`) - Game world interactions, NUI management, key bindings
3. **NUI/Browser** (`html/**/*.js`) - Vue 3 UI components, user interactions

**Critical Flow**: Client ↔ Server uses `FW.TriggerCallback()` pattern. Client ↔ NUI uses `SendNUIMessage()` (Lua→JS) and `RegisterNUICallback()` (JS→Lua).

### Core Systems

#### Custom Callback System (NOT ESX/QBCore!)
```lua
-- Server: Register callback
FW.RegisterServerCallback('fw:inventory:getInventoryData', function(source, cb)
    cb(inventoryData)
end)

-- Client: Trigger callback
FW.TriggerCallback('fw:inventory:getInventoryData', function(data)
    -- Handle response
end)
```
**Never use ESX/QBCore callback patterns** - this framework uses its own `FW` namespace.

#### NUI Bridge Pattern
- **Lua → NUI**: `SendNUIMessage({ action = 'openInventory', inventory = data })`
- **NUI → Lua**: `window.NUIBridge.send('closeInventory', {})`
- **NUI Listener**: `window.NUIBridge.on('openInventory', (data) => {...})`

#### Module Registration System
All NUI modules register via `UIManager` in `html/core/UIManager.js`:
```javascript
window.UIManager.register({
    name: 'inventory',
    component: InventoryModule,
    exclusive: true, // Close other modules when opening
    actions: ['openInventory'], // NUI events that trigger this module
    onOpen: (data) => {...},
    onClose: () => {...}
});
```

#### Focus Management
Centralized in `client/nui_manager.lua`:
- `exports['fw_core']:RegisterUIOpen('inventory', true)` - Request cursor focus
- `exports['fw_core']:RegisterUIClose('inventory')` - Release focus
- **Always use this pattern** - prevents multiple UIs from conflicting

## Key Files & Patterns

### Database Operations
Uses `oxmysql` library (loaded via `@oxmysql/lib/MySQL.lua`):
```lua
-- Single row query
MySQL.single('SELECT * FROM players WHERE identifier = ?', {identifier}, function(row)
    -- row is single object or nil
end)

-- Multiple rows
MySQL.query('SELECT * FROM players WHERE license = ?', {license}, function(results)
    -- results is array
end)

-- Insert with auto-increment ID
MySQL.insert('INSERT INTO players (...) VALUES (...)', {params}, function(insertId)
    -- insertId is the new row ID
end)

-- Update
MySQL.update('UPDATE players SET inventory = ? WHERE identifier = ?', {json, id}, function(affectedRows)
end)
```

### Inventory System
- **50 main slots** + **4 equipment slots** (vest, weapon, bag1, bag2)
- Items stored as JSON in `players.inventory` column
- Ground items tracked in `FW.GroundItems` server-side table (ephemeral, not persisted)
- **Item format**: `{ name, label, emoji, amount, slot, itemweight, type, canUse }`
- Load items from `configs/itemlist.json` on server start

**Inventory updates**: Server modifies inventory → triggers client callback → client sends to NUI

### Vue 3 Composables
- `useNUI()` in `html/shared/composables/useNUI.js` - Standard pattern for all modules
- Provides: `send()`, `listen()`, `useNUIState()`, `onClose()`
- **Always use this** instead of raw `NUIBridge` calls in Vue components

### Character System
- Multi-character support (max 5 per license, see `configs/main.lua`)
- Merged `players` table (no separate `characters` table)
- Uses `license` (Steam ID) + `identifier` (char-specific) pattern
- Active character marked with `is_active = 1` flag
- Character selection flow: `multichar` → `creator` → `appearance` → spawn

## Development Workflows

### Adding New Items
1. Add to `configs/itemlist.json`: `{ "name": "sandwich", "label": "Sandwich", "emoji": "🥪", "itemweight": 0.2, "type": "item", "canUse": true }`
2. Server auto-loads on restart (see `server/main.lua` → `FW.Inventory.LoadItems()`)
3. Add use logic in `server/inventory_items.lua` if `canUse: true`

### Creating New NUI Modules
1. Create `html/modules/mymodule/MyModule.js` with Vue component
2. Import in `html/app.js` and add to `routes` object
3. Register with `UIManager` using `actions` array for NUI events
4. Add Lua client trigger: `SendNUIMessage({ action = 'openMyModule', data = {...} })`
5. Add NUI callback handlers: `RegisterNUICallback('myAction', function(data, cb) ... end)`

### Testing NUI Locally
- NUI files are served from `html/` via FiveM's internal web server
- For standalone testing: Check `GetParentResourceName()` existence in `NUIBridge.js`
- **Never use `file://` protocol** - NUI requires `http://` scheme provided by FiveM

### Debugging
- **Server**: Standard Lua `print()` shows in FXServer console
- **Client**: `print()` shows in F8 console (in-game)
- **NUI**: Browser DevTools via F12 (Chromium Embedded Framework)
- **Key insight**: `[FW]` prefix used for debug logs throughout codebase

## Project-Specific Conventions

### Naming
- Lua: `snake_case` for functions/variables, `PascalCase` for tables/modules
- JavaScript: `camelCase` for functions/variables, `PascalCase` for Vue components
- NUI Actions: `camelCase` (e.g., `openInventory`, `closeAdmin`)
- Callbacks: `namespace:category:action` (e.g., `fw:inventory:getInventoryData`)

### File Organization
- `client/` and `server/` subdirectories are **not** automatically organized by feature
- Related files: `client/inventory.lua` + `server/inventory.lua` + `html/modules/inventory/`
- Admin features in `client/admin/` subfolder (only client has subfolder)

### Config Pattern
- Main config in `configs/main.lua` (spawn points, limits)
- Item definitions in `configs/itemlist.json` (loaded at runtime)
- **Never hardcode** spawn locations - use `Config.Firstspawn` / `Config.Resetspawn`

## Critical Gotchas

1. **Manifest matters**: All HTML files must be listed in `fxmanifest.lua` → `files {}`
2. **Focus leaks**: Always pair `RegisterUIOpen()` with `RegisterUIClose()` or cursor won't release
3. **State desync**: Inventory UI doesn't update local state after moves - waits for server confirmation
4. **Callback timing**: `FW.TriggerCallback` is async - chain dependent callbacks, don't run in parallel
5. **JSON encoding**: Lua tables must be `json.encode()`'d before DB storage, `json.decode()`'d after retrieval
6. **Equipment slots**: Separate from main inventory, use string keys not indices (`'vest'`, `'weapon'`)

## External Dependencies
- `oxmysql` - Database (MySQL/MariaDB) operations
- Vue 3 - Loaded via CDN in `html/index.html`
- TailwindCSS - Utility classes (precompiled in `html/styles/tailwind.css`)

## Common Tasks

**Add server command**:
```lua
-- server/commands.lua
RegisterCommand('mycommand', function(source, args)
    local player = FW.GetPlayer(source)
    -- logic here
end, false) -- false = no admin restriction
```

**Trigger client event from server**:
```lua
TriggerClientEvent('fw:client:doSomething', source, param1, param2)
```

**Open NUI from client**:
```lua
SendNUIMessage({ action = 'openInventory', inventory = data })
exports['fw_core']:RegisterUIOpen('inventory', true)
```

**Close NUI and release focus**:
```lua
SendNUIMessage({ action = 'closeInventory' })
exports['fw_core']:RegisterUIClose('inventory')
```
