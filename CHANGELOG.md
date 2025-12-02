# Changelog - FW Core Inventory System

## [1.2.0] - 2024 - Equipment Storage System

### 🎒 Added - Equipment Storage System
- **Equipment Slots**: 4 spezielle Ausrüstungsslots (vest, weapon, bag1, bag2)
- **Storage Items**: Rucksäcke, Taschen, Bauchtaschen mit eigenem Inventar
- **Type-Based Restrictions**: Nur passende Item-Typen pro Slot erlaubt
- **Visual Feedback**: Grün/Rot Animationen + Fehlermeldungen bei Drag-Drop
- **Persistent Storage**: Equipment-Inventare persistent in MySQL-DB

#### Neue Equipment-Items (15 Stück)
**Westen (vest Slot):**
- `vest_police` - Polizei Weste (50 Armor)
- `vest_kevlar` - Kevlar Weste (100 Armor)
- `vest_tactical` - Taktische Weste (75 Armor)

**Waffen (weapon Slot):**
- `weapon_pistol` - Pistole
- `weapon_smg` - MP
- `weapon_rifle` - Gewehr

**Rucksäcke (bag1 Slot, mit Storage):**
- `backpack_small` - Kleiner Rucksack (15 Slots, 30kg)
- `backpack_medium` - Rucksack (25 Slots, 50kg)
- `backpack_large` - Großer Rucksack (35 Slots, 70kg)
- `backpack_tactical` - Taktischer Rucksack (50 Slots, 100kg)

**Große Taschen (bag1 Slot, mit Storage):**
- `bag_duffel` - Reisetasche (30 Slots, 60kg)
- `bag_sports` - Sporttasche (20 Slots, 40kg)

**Bauchtaschen (bag2 Slot, mit Storage):**
- `hipbag_small` - Kleine Bauchtasche (5 Slots, 10kg)
- `hipbag_medium` - Bauchtasche (10 Slots, 20kg)
- `hipbag_tactical` - Taktische Bauchtasche (12 Slots, 25kg)

**Kleine Taschen (bag2 Slot, mit Storage):**
- `bag_messenger` - Umhängetasche (8 Slots, 15kg)

#### Neue Dateien
- `configs/equipment.json` - Equipment-Konfiguration (15+ Items)
- `server/inventory_equipment.lua` - Equipment Server-Handler (400+ Zeilen)
- `sql/dual_inventory_migration.sql` - Erweitert mit `equipment_storage` Tabelle
- `EQUIPMENT_QUICK_GUIDE.md` - Verwendungsanleitung
- `EQUIPMENT_INSTALLATION.md` - Installations- & Test-Guide
- `CHANGELOG.md` - Diese Datei

#### Modified Files
- `client/inventory.lua`:
  - `OpenEquipmentStorage(equipmentId, itemName)` Funktion
  - NUI Callbacks: `saveEquipment`, `openEquipmentStorage`
  - Server Events: `fw:equipment:equipped`, `equipRejected`, `equipAccepted`
  - Export: `exports['fw_core']:OpenEquipmentStorage()`

- `html/modules/inventory/InventoryModule.js`:
  - `equipmentConfig` ref mit Slot-Restrictions
  - `canEquipToSlot(item, targetSlot)` Validierungsfunktion
  - `handleMouseUp()` erweitert mit Equipment-Validation + Visual Feedback
  - `confirmDualInventory()` erweitert mit mode='equipment'
  - `loadInventoryData()` parst Equipment-Metadata (type, equipSlot, hasStorage, equipmentId)

- `configs/itemlist.json`:
  - 15+ Equipment-Items hinzugefügt mit korrektem `type` Feld

- `fxmanifest.lua`:
  - `server/inventory_equipment.lua` zu server_scripts hinzugefügt

#### New Admin Commands
- `/giveequipment <itemName> [amount]` - Equipment-Item geben
- `/listequipment` - Alle Equipment-Items auflisten

#### New Server Functions
- `FW.Equipment.LoadConfig()` - Lädt equipment.json
- `FW.Equipment.GetItemData(itemName)` - Equipment-Item-Info abrufen
- `FW.Equipment.IsEquipmentItem(itemName)` - Prüft ob Equipment
- `FW.Equipment.HasStorage(itemName)` - Prüft ob Storage vorhanden
- `FW.Equipment.GetStorageConfig(itemName)` - Storage-Specs abrufen
- `FW.Equipment.CanEquipToSlot(itemName, targetSlot)` - Server-Validation

#### New Server Callbacks
- `fw:equipment:getStorage` - Equipment-Inventar abrufen
- `fw:equipment:saveStorage` - Equipment-Inventar speichern
- `fw:equipment:validateEquip` - Ausrüstung validieren

#### New Server Events
- `fw:inventory:equipItem` - Equipment ausrüsten mit Auto-Storage-Creation
- `fw:equipment:deleteStorage` - Equipment-Storage löschen

#### Database Changes
- Neue Tabelle: `equipment_storage`
  - `equipment_id` VARCHAR(128) UNIQUE - Unique Equipment-ID
  - `equipment_type` VARCHAR(64) - Item-Typ (backpack, vest, weapon, etc.)
  - `item_name` VARCHAR(64) - Item-Name aus itemlist.json
  - `inventory` LONGTEXT - JSON mit Equipment-Inventar
  - `max_slots` INT - Maximale Slot-Anzahl
  - `max_weight` DECIMAL(10,2) - Maximales Gewicht in kg
  - `owner` VARCHAR(64) - Character-Identifier des Besitzers
  - `durability` INT DEFAULT 100 - Item-Haltbarkeit (0-100)
  - Lock-System: `is_locked`, `locked_by`, `locked_at`

#### Features
- ✅ **Type-Based Slot Restrictions**: Nur passende Item-Typen pro Equipment-Slot
- ✅ **Visual Feedback**: Grüne Pulse bei Accept, Rote Shake bei Reject
- ✅ **Error Messages**: 2s Fehlermeldung an Mausposition bei ungültigem Drop
- ✅ **Item-Bound Storage**: Jedes Storage-Equipment hat unique ID
- ✅ **Persistent Storage**: Equipment-Inventare bleiben über Reconnects erhalten
- ✅ **Capacity Management**: Per-Item Limits (Slots + Gewicht)
- ✅ **Anti-Duping**: Lock-System für Equipment-Storage
- ✅ **Server-Side Security**: Alle Equip-Aktionen server-seitig validiert
- ✅ **JSON-Konfigurierbar**: Neue Equipment-Items via equipment.json hinzufügbar

---

## [1.1.0] - 2024 - Dual Inventory System (Secondary Inventory)

### 🚀 Added - Dual Inventory System
- **5 Modi**: Give, Ground, Trunk, Glovebox, Stash
- **Anti-Duping Lock-System**: Verhindert Disconnect-Duping
- **Vehicle Storage**: Kofferraum + Handschuhfach per Fahrzeug-Kennzeichen
- **Stash System**: Job/Grade/Position-restricted Lager
- **Ground Items**: RAM-basiert, 5 Minuten Despawn
- **Give-Mode**: Player-to-Player mit Distance-Check + Dual-Lock

#### New Files
- `server/inventory_secondary.lua` (650+ Zeilen) - Komplette Secondary-Inventory-Logic
- `configs/vehicles.json` - 14+ Fahrzeug-Configs (Trunk/Glovebox Specs)
- `sql/dual_inventory_migration.sql` - DB-Schema für alle Systeme
- `DUAL_INVENTORY_DOCUMENTATION.md` (2500+ Zeilen) - Vollständige API-Doku
- `QUICK_START.md` (1500+ Zeilen) - 5-Minuten Installation
- `IMPLEMENTATION_SUMMARY.md` (1000+ Zeilen) - Technische Details

#### Modified Files
- `client/inventory.lua`:
  - Keybindings: L (Trunk), K (Glovebox), G (Ground)
  - Commands: `/trunk`, `/glovebox`, `/ground`, `/openstash [id]`
  - NUI Callbacks: `saveTrunk`, `saveGlove box`, `saveStash`, `giveItems`

- `html/modules/inventory/InventoryModule.js`:
  - `dualInventoryMetadata` ref für Mode-spezifische Daten
  - `confirmDualInventory()` mit Mode-Detection (give, ground, trunk, glovebox, stash)
  - `handleOpenDualInventory()` Event-Listener für alle Modi
  - Session-Cache für Dual-Inventory (Client-seitig)

- `fxmanifest.lua`:
  - `server/inventory_secondary.lua` zu server_scripts hinzugefügt

#### New Commands
- `/trunk` (Keybind: L) - Kofferraum öffnen (3m Distanz, rear position)
- `/glovebox` (Keybind: K) - Handschuhfach öffnen (nur in Fahrzeug)
- `/ground` (Keybind: G) - Boden-Inventar öffnen (5m Radius)
- `/openstash [stashId]` - Job-Lager öffnen (mit Restrictions)

#### New Server Callbacks
- `fw:inventory:getTrunkInventory` - Trunk-Items abrufen
- `fw:inventory:getGloveboxInventory` - Glovebox-Items abrufen
- `fw:inventory:getStashInventory` - Stash-Items abrufen
- `fw:inventory:getGroundInventory` - Ground-Items abrufen (RAM)

#### New Server Events
- `fw:inventory:saveTrunkInventory` - Trunk in DB speichern
- `fw:inventory:saveGloveboxInventory` - Glovebox in DB speichern
- `fw:inventory:saveStashInventory` - Stash in DB speichern
- `fw:inventory:giveItems` - Player-to-Player Transfer mit Dual-Lock

#### Database Tables
- `vehicle_storage`: Trunk + Glovebox per Kennzeichen
- `stash_storage`: Job/Position-restricted Lager
- `inventory_transactions`: Audit-Log (optional)
- `players` Extensions: `inventory_locked`, `inventory_locked_by`, `inventory_locked_at`

#### Anti-Duping System
- **ActiveLocks Table**: RAM-basiert für Lock-Tracking
- **Lock-Types**: `inventory`, `trunk`, `glovebox`, `stash`, `give`
- **Auto-Cleanup**: Locks werden bei Disconnect automatisch released
- **Timeout**: 5 Minuten, dann automatischer Lock-Release
- **Dual-Lock**: Give-Mode lockt beide Spieler gleichzeitig

#### Vehicle System
- **14+ Fahrzeuge konfiguriert**: adder, police, ambulance, burrito, packer, etc.
- **DEFAULT Fallback**: Für nicht-konfigurierte Fahrzeuge
- **Vehicle Classes**: Defaults per Fahrzeugklasse (compacts, sedans, suvs, vans, etc.)
- **Access Positions**: rear (Kofferraum), front (Glovebox), side
- **Distanz-Check**: 3m für Trunk, Inside-Vehicle für Glovebox

#### Stash System
- **Job-Restriction**: `job_restriction = 'police'` nur für Polizei
- **Grade-Restriction**: `grade_restriction = 3` mindestens Rank 3
- **Position-Restriction**: `position_x/y/z` + `radius` für Location-Check
- **Kombinierbar**: Job + Grade + Position gleichzeitig möglich

#### Features
- ✅ **Anti-Duping**: Lock-System verhindert Disconnect-Duping komplett
- ✅ **Session-Persistence**: Dual-Inventory Cache bleibt clientseitig gespeichert
- ✅ **Distance-Validation**: 3m für Trunk/Give, 5m für Ground, Inside für Glovebox
- ✅ **Vehicle-Specific**: Per-Modell Trunk/Glovebox-Kapazität
- ✅ **Job/Grade/Position**: Granulare Stash-Zugriffsrechte
- ✅ **Ground Items**: RAM-basiert, kein DB-Overhead, Auto-Despawn
- ✅ **Audit-Log**: Optional Transaktions-Historie in DB

---

## [1.0.0] - 2024 - Initial Release (Core Inventory)

### 🎯 Initial Features
- **50-Slot Main Inventory**: Standard Hauptinventar
- **4 Equipment-Slots**: vest, weapon, bag1, bag2 (vor Equipment-System nur Platzhalter)
- **Item System**: itemlist.json mit 50+ Standard-Items
- **Use-Items**: Callback-System für nutzbare Items
- **Weight System**: Maximales Gewicht pro Inventar
- **MySQL Persistence**: Inventar in `players.inventory` JSON-Spalte
- **Vue 3 NUI**: Modernes Inventar-UI mit Drag & Drop
- **Multiple Designs**: BriefcaseDesign, TacticalBackpackDesign, RetroDrawerDesign, SciFiHudDesign

#### Core Files
- `server/inventory.lua` - Core Inventory Server-Handler
- `server/inventory_items.lua` - Use-Item Callbacks
- `client/inventory.lua` - Client-Side Inventory Management
- `html/modules/inventory/InventoryModule.js` - Vue 3 Inventar-Component
- `configs/itemlist.json` - 50+ Items (Food, Medical, Tools, Valuables, etc.)

#### Base System
- **FW.Inventory.LoadItems()** - Lädt Items aus itemlist.json
- **FW.Inventory.AddItem()** - Item hinzufügen mit Weight-Check
- **FW.Inventory.RemoveItem()** - Item entfernen
- **FW.Inventory.GetItem()** - Item-Info abrufen
- **FW.Inventory.UseItem()** - Item verwenden mit Callback

#### NUI Features
- **Drag & Drop**: Maus-basiert mit dragGhost
- **Design Templates**: 4+ verschiedene Design-Stile
- **Reactive**: Vue 3 mit Composition API
- **NUIBridge**: Lua ↔ JavaScript Kommunikation
- **UIManager**: Zentrale NUI-Verwaltung mit Focus-Management

---

## Versionsübersicht

| Version | Release | Features |
|---------|---------|----------|
| **1.2.0** | 2024 | Equipment Storage System (Rucksäcke, Taschen, Westen) |
| **1.1.0** | 2024 | Dual Inventory System (5 Modi + Anti-Duping) |
| **1.0.0** | 2024 | Core Inventory (50 Slots + Basic Items) |

---

## Migration Guide

### Von 1.1.0 auf 1.2.0 (Equipment System)
1. **SQL Migration ausführen**: 
   - `equipment_storage` Tabelle wird hinzugefügt
   - Bestehende Tabellen bleiben unberührt

2. **Server neu starten**: `restart fw_core`

3. **Equipment-Items testen**: `/giveequipment backpack_medium 1`

**Breaking Changes**: Keine - Vollständig abwärtskompatibel

### Von 1.0.0 auf 1.1.0 (Dual Inventory)
1. **SQL Migration ausführen**:
   - `vehicle_storage`, `stash_storage`, `inventory_transactions` Tabellen
   - `players` Extensions (`inventory_locked` Spalten)

2. **Config hinzufügen**: `configs/vehicles.json` erstellen

3. **Server neu starten**: `restart fw_core`

4. **Keybindings testen**: L (Trunk), K (Glovebox), G (Ground)

**Breaking Changes**: Keine - Equipment-Slots bleiben kompatibel

---

## Bekannte Issues

### 1.2.0
- [ ] Equipment-Storage UI-Button noch nicht implementiert (aktuell nur via Export)
- [ ] Durability-System für Equipment noch nicht aktiv
- [ ] Armor/Weapon Stats-Application noch nicht implementiert

### 1.1.0
- [x] ~~Ground-Items despawnen nach 5 Minuten~~ ✅ Gewollt (RAM-basiert)
- [x] ~~Session-Cache wird bei zu langen Sessions groß~~ ✅ Auto-Cleanup implementiert

### 1.0.0
- [x] ~~Equipment-Slots waren nur Platzhalter~~ ✅ Gelöst in 1.2.0

---

## Geplante Features (Roadmap)

### 1.3.0 - Equipment Advanced
- [ ] Equipment Durability System (0-100%, Repair-Items)
- [ ] Armor Stats Application (Damage-Reduction bei Westen)
- [ ] Weapon Stats Application (Ammo-Capacity, Fire-Rate Mods)
- [ ] Equipment Crafting (z.B. Tactical Backpack aus Materials)
- [ ] Equipment Trading (Player-to-Player via Give-Mode)

### 1.4.0 - Inventory UI v2
- [ ] Equipment-Storage Open-Button in NUI
- [ ] Hotkey-Slots (1-5) für Quick-Use Items
- [ ] Inventory-Search (Filter nach Name/Type)
- [ ] Sorting (Sort by Name, Weight, Type)
- [ ] Item-Tooltips mit Hover-Info

### 1.5.0 - Advanced Features
- [ ] Container-System (Kisten, Safes mit Code-Lock)
- [ ] Shop-Inventories (NPC-Shops mit Buy/Sell)
- [ ] Loot-Tables (Random Items aus Loot-Pools)
- [ ] Item-Metadata (Durability, Serial-Numbers, Custom-Data)
- [ ] Weight-Überlastung (Slow-Walk wenn zu schwer)

---

## Contributors

- **Pandakun** - Initial Development, Dual-Inventory, Equipment-System

---

## License

Proprietary - PandaSpielplatz Server  
Alle Rechte vorbehalten.

---

**Letzte Aktualisierung**: 2024  
**Aktuelle Version**: 1.2.0  
**Status**: ✅ Production-Ready
