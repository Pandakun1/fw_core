# 📦 FW CORE - DUAL INVENTORY SYSTEM
## Vollständige Implementierung mit Anti-Duping-Schutz

---

## 🎯 FEATURES

### 5 Modi
1. **GEBEN** - Spieler zu Spieler Transfer (3m Reichweite)
2. **BODEN** - Items auf Boden legen/aufheben (RAM-basiert)
3. **KOFFERRAUM** - Fahrzeug-Storage (Plate-gebunden, DB-persistent)
4. **HANDSCHUHFACH** - Fahrzeug-Innenraum Storage (nur von innen)
5. **LAGER (STASH)** - Externe Lager (Job/Position-restricted)

### 🔒 Anti-Duping System
- **Inventory Locks**: Transaktionale Sperren während Transfers
- **Auto-Release**: Locks werden bei Disconnect automatisch freigegeben
- **Timeout Protection**: Verwaiste Locks nach 5 Minuten auto-gelöscht
- **Rollback-fähig**: Fehlgeschlagene Transaktionen werden rückgängig gemacht

---

## 📊 DATENBANK-STRUKTUR

### 1. Migration ausführen
```sql
-- In MySQL ausführen:
source fw_core/sql/dual_inventory_migration.sql
```

### 2. Neue Tabellen
- `vehicle_storage` - Kofferraum & Handschuhfach Daten
- `stash_storage` - Lager-System mit Job/Position-Restrictions
- `inventory_transactions` - Optional: Audit-Log für Debugging
- `players.inventory_locked` - Neue Columns für Player-Lock

---

## 🚗 FAHRZEUG-KONFIGURATION

### Datei: `configs/vehicles.json`

**Beispiel-Konfiguration:**
```json
{
  "model": "police",
  "trunk": {
    "enabled": true,
    "maxSlots": 50,
    "maxWeight": 100,
    "accessPosition": "rear",
    "radius": 2.5
  },
  "glovebox": {
    "enabled": true,
    "maxSlots": 15,
    "maxWeight": 15,
    "requireInside": true
  }
}
```

**Eigene Fahrzeuge hinzufügen:**
1. Öffne `configs/vehicles.json`
2. Kopiere einen bestehenden Eintrag
3. Ändere `"model"` zum Spawn-Namen deines Fahrzeugs
4. Passe `maxSlots` und `maxWeight` an
5. Speichern & Resource restart

**DEFAULT-Fallback**: Alle nicht konfigurierten Fahrzeuge nutzen den DEFAULT-Eintrag.

---

## 🎮 USAGE - KEYBINDINGS

### Standard-Tasten
- **I** - Inventar öffnen/schließen
- **L** - Kofferraum öffnen (nahe Fahrzeug)
- **K** - Handschuhfach öffnen (im Fahrzeug)
- **G** - Boden-Inventar öffnen

### Keybindings ändern
```lua
-- In FiveM F8 Console:
bind keyboard L "trunk"
bind keyboard K "glovebox"
bind keyboard G "ground"
```

---

## 💻 DEVELOPER API

### Client-Seite

#### Lager öffnen (von anderem Script)
```lua
-- Exportiere OpenStash Funktion
exports['fw_core']:OpenStash('mrpd_armory')
exports['fw_core']:OpenStash('mechanic_toolstorage')
exports['fw_core']:OpenStash('house_123')
```

#### Eigenes Dual-Inventar öffnen
```lua
SendNUIMessage({
    action = 'openDualInventory',
    mode = 'custom',
    title = '🎁 Mein Custom Inventar',
    secondaryInventory = {
        ['itemname'] = {
            label = 'Item Label',
            amount = 5,
            slot = 0,
            itemweight = 1.0,
            type = 'item',
            canUse = true
        }
    },
    maxSlots = 30,
    maxWeight = 50,
    metadata = { customData = 'value' }
})
```

### Server-Seite

#### Neues Lager erstellen (Command)
```
/createstash [id] [slots] [weight]

Beispiel:
/createstash gang_hideout_1 100 200
```

#### Neues Lager per Code erstellen
```lua
MySQL.insert(
    'INSERT INTO stash_storage (stash_id, max_slots, max_weight, job_restriction, grade_restriction, position_x, position_y, position_z) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    { 'custom_stash', 50, 100, 'police', 2, 123.45, 456.78, 90.12 },
    function(insertId)
        print('Stash created with ID:', insertId)
    end
)
```

#### Item-Transfer validieren (Anti-Duping)
```lua
-- Lock erwerben
local success = FW.SecondaryInventory.AcquireLock(src, 'player', identifier)
if not success then
    TriggerClientEvent('fw:client:notify', src, 'Inventar ist gesperrt')
    return
end

-- Transaktion durchführen
FW.Inventory.RemoveItem(src, 'itemname', 5)
FW.Inventory.AddItem(target, 'itemname', 5)

-- Lock freigeben
FW.SecondaryInventory.ReleaseLock(src, 'player', identifier)
```

---

## 🔧 KONFIGURATION

### Fahrzeug-Klassen
In `configs/vehicles.json` unter `vehicleClasses`:
```json
"vehicleClasses": {
  "super": { "defaultTrunkSlots": 25, "defaultTrunkWeight": 50 },
  "vans": { "defaultTrunkSlots": 80, "defaultTrunkWeight": 160 }
}
```

### Zugriffs-Positionen
```json
"accessPositions": {
  "rear": "Hinten (Standard Kofferraum)",
  "front": "Vorne (Frontmotor Supersportwagen)",
  "side": "Seitlich (Lieferwagen)"
}
```

---

## 🐛 TROUBLESHOOTING

### Problem: "Inventar ist gesperrt"
**Ursache**: Spieler hat noch einen aktiven Lock von vorheriger Transaktion
**Lösung**: Warte 5 Minuten oder führe aus:
```sql
UPDATE players SET inventory_locked = 0 WHERE identifier = 'char_xxxxx';
```

### Problem: Kofferraum wird nicht geöffnet
**Checkliste**:
1. Ist Fahrzeug in Reichweite (< 5m)?
2. Ist Fahrzeug in `configs/vehicles.json` konfiguriert?
3. Existiert `vehicle_storage` Tabelle?
4. Ist `server/inventory_secondary.lua` in `fxmanifest.lua` geladen?

### Problem: Items verschwinden
**Debugging**:
```lua
-- Prüfe Transactions Log
SELECT * FROM inventory_transactions WHERE player_identifier = 'char_xxxxx' ORDER BY timestamp DESC LIMIT 50;

-- Prüfe Ground Items (RAM)
print(json.encode(FW.GroundItems))

-- Prüfe Active Locks
print(json.encode(ActiveLocks))
```

### Problem: Stash öffnet nicht
**Checkliste**:
1. Existiert Stash in DB? `SELECT * FROM stash_storage WHERE stash_id = 'xxx';`
2. Hat Spieler den richtigen Job? (Wenn `job_restriction` gesetzt)
3. Hat Spieler den richtigen Grade? (Wenn `grade_restriction` gesetzt)
4. Ist Spieler nahe genug? (Distanz < `radius`)

---

## 📝 BEISPIELE

### Beispiel 1: Polizei-Waffenraum
```sql
INSERT INTO stash_storage (stash_id, stash_type, max_slots, max_weight, job_restriction, grade_restriction, position_x, position_y, position_z, radius)
VALUES ('mrpd_armory', 'job', 100, 500, 'police', 3, 452.6, -980.0, 30.68, 3.0);
```

**Usage im Script:**
```lua
-- In deinem Police Script
RegisterCommand('armory', function()
    exports['fw_core']:OpenStash('mrpd_armory')
end)
```

### Beispiel 2: Haus-Lager
```sql
INSERT INTO stash_storage (stash_id, stash_type, max_slots, max_weight, owner, position_x, position_y, position_z)
VALUES ('house_123', 'house', 150, 300, 'char_abc123', 123.45, 456.78, 90.12);
```

### Beispiel 3: Gang-Versteck
```sql
INSERT INTO stash_storage (stash_id, stash_type, max_slots, max_weight, position_x, position_y, position_z)
VALUES ('gang_hideout_bloods', 'gang', 200, 500, -1000.0, -2000.0, 15.0);
```

---

## 🔐 SICHERHEIT

### Anti-Duping Maßnahmen
1. **Inventory Locks**: Verhindert gleichzeitige Zugriffe
2. **Distanz-Validierung**: Server prüft Spieler-Position
3. **Item-Count Check**: Sender muss Items besitzen vor Transfer
4. **Atomic Transactions**: Entfernen + Hinzufügen in einer Transaktion
5. **Transaction Logging**: Optional für Audit-Trail

### Best Practices
- **Immer Server-Validierung**: Nie dem Client vertrauen
- **Locks verwenden**: Bei jedem Item-Transfer
- **Distanz prüfen**: Server-seitig Koordinaten vergleichen
- **Timeouts setzen**: Locks nach max. 5 Minuten freigeben
- **Logs aktivieren**: Für Debugging und Anti-Cheat

---

## 📈 PERFORMANCE

### RAM-Usage
- **Ground Items**: ~1KB pro Item (gelöscht bei Restart)
- **Active Locks**: ~200 Bytes pro Lock
- **Vehicle Storage**: DB-persistent (kein RAM außer bei Zugriff)
- **Stash Storage**: DB-persistent (kein RAM außer bei Zugriff)

### Optimierungen
1. Ground Items werden nach Server-Restart gelöscht (by design)
2. Alte Locks werden automatisch bereinigt
3. Transaction Log kann via SQL-Job bereinigt werden
4. Fahrzeug-Config wird einmalig beim Start geladen

---

## 🆘 SUPPORT

### Logs prüfen
**Server Console:**
- `[FW Lock]` - Lock-System
- `[FW Trunk]` - Kofferraum
- `[FW Glovebox]` - Handschuhfach
- `[FW Stash]` - Lager
- `[FW Give]` - Geben-Modus

**Client F8 Console:**
- `[Inventory Client]` - Client-seitige Events
- `[Inventar]` - NUI/Vue Frontend

### Debug Commands
```lua
-- Client
/trunk
/glovebox
/ground
/openstash [id]

-- Server (Admin)
/createstash [id] [slots] [weight]
```

---

## 📜 CHANGELOG

### Version 1.0.0
- ✅ Dual-Inventar System implementiert
- ✅ Anti-Duping Locks
- ✅ 5 Modi: Give, Ground, Trunk, Glovebox, Stash
- ✅ Vehicle Config System
- ✅ Position & Job Restrictions
- ✅ Transaction Logging
- ✅ Auto-Lock Cleanup
- ✅ Session-Persistence (Clientseitig)

---

## 🤝 CREDITS
Entwickelt für PandaSpielplatz FiveM Server
Framework: FW Core (Custom)
UI: Vue 3 + Tailwind CSS
