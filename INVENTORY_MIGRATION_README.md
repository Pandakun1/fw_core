# Slot-Based Inventory System - Migration Guide

## Übersicht
Das Inventar-System wurde von einem **Key-Value-Object** System auf ein **Slot-basiertes Array** System umgestellt.

### Alte Struktur (❌ Entfernt):
```json
{
  "apple": { "label": "Apfel", "amount": 5, "slot": 3 },
  "water": { "label": "Wasser", "amount": 2, "slot": 7 }
}
```
**Problem**: Automatisches Stacking beim Reload - 2 separate Apfel-Stacks wurden zu 1 Stack kombiniert.

### Neue Struktur (✅ Aktiv):
```json
[
  null,
  null,
  null,
  { "name": "apple", "label": "Apfel", "quantity": 3, "slot": 3 },
  null,
  { "name": "apple", "label": "Apfel", "quantity": 2, "slot": 5 },
  null,
  { "name": "water", "label": "Wasser", "quantity": 1, "slot": 7 }
]
```
**Vorteil**: Jeder Slot ist separat - kein automatisches Stacking!

---

## Datenbank-Änderungen

### 1. SQL Migration ausführen:
```bash
mysql -u root -p fivem < migration_inventory_slots.sql
```

### Neue Spalte:
- **`players.inventory_slots`** (LONGTEXT) - Speichert JSON Array mit 50 Slots
- **`players.inventory`** (LONGTEXT) - Bleibt für Backwards Compatibility

---

## Code-Änderungen

### `server/players.lua` (✅ Geändert):

#### Neue Properties:
```lua
self.inventorySlots = {}  -- Array mit 50 Slots (1-50 indexed)
```

#### Neue Funktionen:
```lua
self.getInventorySlots()           -- Gibt Slot-Array zurück
self.setInventorySlots(slots)      -- Setzt komplettes Inventar
self.getItemInSlot(slotIndex)      -- Holt Item aus Slot
self.setItemInSlot(slotIndex, item) -- Platziert Item in Slot
self.removeItemFromSlot(slotIndex) -- Entfernt Item aus Slot
self.hasItemInSlot(itemName, qty)  -- Sucht Item, returns (bool, slotIndex)
self.countItem(itemName)           -- Zählt Total Quantity über alle Slots
```

#### Caching:
- Inventar wird beim Player-Login geladen
- Alle Änderungen in `self.inventorySlots` gecached
- `self.unsaved = true` markiert dirty state
- Speicherung nur bei Änderungen (DB-Performance)

---

### `server/inventory.lua` (✅ Geändert):

#### GetInventory:
```lua
-- ALT: MySQL Query
MySQL.single('SELECT inventory FROM players ...')

-- NEU: Player-Cache
local Player = FW.GetPlayer(src)
local slots = Player.getInventorySlots()
```

#### SaveInventory:
```lua
-- NEU: Speichert in inventory_slots Spalte
MySQL.update('UPDATE players SET inventory_slots = ? WHERE identifier = ?', ...)
Player.setInventorySlots(slotsData) -- Update Cache
```

#### AddItem:
```lua
-- NEU: Arbeitet mit Slot-Indices
function FW.Inventory.AddItem(src, itemName, amount, metadata, slot)
    local slots = Player.getInventorySlots()
    
    if slot then
        -- Stack in specified slot
        slots[slot].quantity = slots[slot].quantity + amount
    else
        -- Find first free slot
        for i = 1, 50 do
            if not slots[i] then
                slots[i] = { name = itemName, quantity = amount, ... }
                break
            end
        end
    end
    
    SaveInventory(src, slots)
end
```

#### RemoveItem:
```lua
-- NEU: Optional fromSlot parameter
function FW.Inventory.RemoveItem(src, itemName, amount, fromSlot)
    local slots = Player.getInventorySlots()
    
    if fromSlot then
        slots[fromSlot].quantity = slots[fromSlot].quantity - amount
        if slots[fromSlot].quantity <= 0 then
            slots[fromSlot] = nil
        end
    else
        -- Find first slot with this item
        for slotIdx, item in pairs(slots) do
            if item and item.name == itemName then
                -- Remove from this slot
                break
            end
        end
    end
    
    SaveInventory(src, slots)
end
```

---

### `html/modules/inventory/InventoryModule.js` (✅ Kompatibel):

#### Frontend erwartet bereits Array-Format:
```javascript
// loadInventoryData() unterstützt bereits:
if (Array.isArray(props.data?.inventory)) {
    inventoryData = props.data.inventory;
}
```

#### Slot-Struktur im Frontend:
```javascript
{
    id: 0,                    // Slot Index (0-49)
    itemName: "apple",        // Internal Name
    name: "Apfel",            // Display Label
    emoji: "🍎",              // Visual Icon
    quantity: 5,              // Menge
    type: "item",             // Item Type
    canUse: true,             // Usable?
    itemweight: 0.2,          // Weight
    slot: 0                   // Redundant but kept for compat
}
```

---

## Vorteile

### 1. Kein Auto-Stacking:
- **Vorher**: 2x Apple (Slot 3) + 1x Apple (Slot 7) → Nach Reload: 3x Apple (Slot 3)
- **Jetzt**: 2x Apple (Slot 3) + 1x Apple (Slot 7) → Nach Reload: Bleibt getrennt!

### 2. Performance:
- **Caching**: Inventar wird im `Player` Object gecached, keine DB-Query bei jedem Get
- **Dirty Tracking**: `self.unsaved` flag reduziert unnötige DB-Writes
- **Batch Saves**: Nur bei tatsächlichen Änderungen

### 3. Flexibilität:
- Jeder Slot ist unabhängig
- Mouse-Wheel Stacking funktioniert perfekt
- Mehrere Stacks vom selben Item möglich

### 4. Backwards Compatible:
- Alte `inventory` Spalte bleibt erhalten
- Migration kann schrittweise erfolgen

---

## Testing

### 1. Neue Char erstellen:
```lua
-- Sollte leeres inventorySlots Array haben
[]
```

### 2. Items hinzufügen:
```lua
/giveitem apple 5
/giveitem apple 3
```
**Erwartet**: 2 separate Slots mit Apple (5x und 3x)

### 3. Server Restart:
**Erwartet**: Beide Stacks bleiben getrennt (kein Auto-Stack!)

### 4. Mouse-Wheel Stacking testen:
- Item draggen
- Scroll DOWN über Slot → +1 in Slot
- Scroll UP über Slot → -1 aus Slot
**Erwartet**: Visuelle Badges zeigen gestackte Mengen

---

## Migration für bestehende Spieler

### Option 1: Auto-Migration beim Login
```lua
-- In main.lua / player login event
if not data.inventory_slots or data.inventory_slots == '' then
    -- Convert old inventory to slots
    local oldInv = json.decode(data.inventory or '{}')
    local newSlots = {}
    
    for itemName, itemData in pairs(oldInv) do
        local slot = itemData.slot or 1
        newSlots[slot] = {
            name = itemName,
            label = itemData.label,
            quantity = itemData.amount or 1,
            itemweight = itemData.itemweight,
            type = itemData.type,
            canUse = itemData.canUse
        }
    end
    
    data.inventory_slots = json.encode(newSlots)
    MySQL.update('UPDATE players SET inventory_slots = ? WHERE identifier = ?', 
        { data.inventory_slots, data.identifier })
end
```

### Option 2: Manuelles SQL Update
```sql
-- Set alle players auf leeres Array (clean start)
UPDATE players SET inventory_slots = '[]';
```

---

## Debugging

### Check Player Inventory:
```lua
local Player = FW.GetPlayer(src)
local slots = Player.getInventorySlots()
print(json.encode(slots, { indent = true }))
```

### Check DB:
```sql
SELECT identifier, inventory_slots FROM players WHERE identifier = 'char-xxx';
```

### Frontend Console:
```javascript
// F12 Developer Console
console.log('[Inventar] inventoryItems:', inventoryItems.value);
```

---

## Offene TODOs

- [ ] Vehicle Storage (trunk/glovebox) auf Slot-System umstellen
- [ ] Stash/Storage System auf Slot-System umstellen
- [ ] Ground Items auf Slot-System umstellen (optional)
- [ ] Equipment Slots (vest/weapon/bag) auf Slot-System umstellen

---

## Support

Bei Problemen:
1. Check SQL Migration ausgeführt?
2. Check Player Object hat `getInventorySlots()` function?
3. Check DB Spalte `inventory_slots` existiert?
4. Check Frontend erhält Array statt Object?

Console Logs:
- `[FW Server] getInventoryData callback` - Server sendet Daten
- `[Inventar] ✅ Found inventory array` - Frontend empfängt Array
- `[FW] ✅ Inventory slots saved` - DB Save erfolgreich
