# Equipment Storage System - Quick Guide

## 🎒 Übersicht
Equipment-Items (Rucksäcke, Taschen, Westen, Waffen) können eigene Inventare haben und werden in spezielle Ausrüstungsslots ausgerüstet.

## 📦 Equipment-Slots

| Slot | Slot-Name | Erlaubte Typen | Beschreibung |
|------|-----------|----------------|--------------|
| 0 | `vest` | `vest`, `armor` | Westen und Rüstungen |
| 1 | `weapon` | `weapon`, `tool` | Waffen und Werkzeuge |
| 2 | `bag1` | `backpack`, `large_bag` | Rucksäcke und große Taschen |
| 3 | `bag2` | `hip_bag`, `small_bag` | Bauchtaschen und kleine Taschen |

## 🎒 Verfügbare Equipment-Items

### Westen (Slot: `vest`)
- `vest_police` - 🦺 Polizei Weste (50 Armor)
- `vest_kevlar` - 🛡️ Kevlar Weste (100 Armor, beste Schutz)
- `vest_tactical` - ⚔️ Taktische Weste (75 Armor)

### Waffen (Slot: `weapon`)
- `weapon_pistol` - 🔫 Pistole (Hash: WEAPON_PISTOL)
- `weapon_smg` - 🔫 MP (Hash: WEAPON_SMG)
- `weapon_rifle` - 🔫 Gewehr (Hash: WEAPON_ASSAULTRIFLE)

### Rucksäcke (Slot: `bag1`, haben Storage!)
- `backpack_small` - 🎒 Kleiner Rucksack (15 Slots, 30kg)
- `backpack_medium` - 🎒 Rucksack (25 Slots, 50kg)
- `backpack_large` - 🎒 Großer Rucksack (35 Slots, 70kg)
- `backpack_tactical` - 🎒 Taktischer Rucksack (50 Slots, 100kg, größte Kapazität)

### Große Taschen (Slot: `bag1`, haben Storage!)
- `bag_duffel` - 💼 Reisetasche (30 Slots, 60kg)
- `bag_sports` - 🏋️ Sporttasche (20 Slots, 40kg)

### Bauchtaschen (Slot: `bag2`, haben Storage!)
- `hipbag_small` - 👝 Kleine Bauchtasche (5 Slots, 10kg)
- `hipbag_medium` - 👝 Bauchtasche (10 Slots, 20kg)
- `hipbag_tactical` - 👝 Taktische Bauchtasche (12 Slots, 25kg)

### Kleine Taschen (Slot: `bag2`, haben Storage!)
- `bag_messenger` - 📫 Umhängetasche (8 Slots, 15kg)

## 🔧 Admin-Commands

### Equipment geben
```lua
/giveequipment <itemName> [amount]
```
**Beispiele:**
```lua
/giveequipment backpack_medium 1
/giveequipment vest_kevlar 1
/giveequipment hipbag_tactical 1
```

### Equipment auflisten
```lua
/listequipment
```
Zeigt alle verfügbaren Equipment-Items mit Storage-Informationen.

## 🎮 Verwendung

### 1. Equipment erhalten
1. Admin gibt Equipment mit `/giveequipment backpack_medium 1`
2. Item erscheint im Hauptinventar

### 2. Equipment ausrüsten (Drag & Drop)
1. Öffne Inventar (Taste `I`)
2. Ziehe Equipment-Item aus Hauptinventar
3. Lasse auf passendem Ausrüstungsslot los:
   - **Rucksack** → `bag1` Slot (rechts oben)
   - **Bauchtasche** → `bag2` Slot (rechts unten)
   - **Weste** → `vest` Slot (links oben)
   - **Waffe** → `weapon` Slot (links unten)

### 3. Equipment-Storage öffnen
- **Via NUI**: Klicke auf ausgerüstetes Item mit Storage
- **Via Export**: `exports['fw_core']:OpenEquipmentStorage(equipmentId, 'backpack_medium')`

### 4. Items in Equipment-Storage speichern
1. Equipment-Storage ist geöffnet (zweites Inventar)
2. Ziehe Items aus Hauptinventar ins Equipment-Storage
3. Speichern durch Schließen des Inventars (automatisch)

### 5. Equipment abnehmen
1. Ziehe Equipment aus Ausrüstungsslot zurück ins Hauptinventar
2. Items im Equipment-Storage bleiben erhalten (beim nächsten Ausrüsten wieder verfügbar)

## ⚠️ Drag & Drop Validierung

### Erlaubt ✅
- Rucksack → `bag1` Slot
- Große Tasche → `bag1` Slot
- Bauchtasche → `bag2` Slot
- Kleine Tasche → `bag2` Slot
- Weste → `vest` Slot
- Waffe → `weapon` Slot

### Nicht erlaubt ❌ (mit visueller Fehlermeldung)
- Rucksack → `bag2` Slot ❌ *(Nur Bauchtaschen und kleine Taschen erlaubt)*
- Bauchtasche → `bag1` Slot ❌ *(Nur Rucksäcke und große Taschen erlaubt)*
- Waffe → `vest` Slot ❌ *(Nur Westen und Rüstungen erlaubt)*
- Weste → `weapon` Slot ❌ *(Nur Waffen und Werkzeuge erlaubt)*

**Visuelle Feedbacks:**
- ❌ **Rot + Shake Animation** bei ungültigem Drop
- ✅ **Grün + Pulse Animation** bei gültigem Drop
- 📝 **Fehlermeldung** für 2 Sekunden an Mausposition

## 🗄️ Storage-Kapazitäten

| Equipment | Max. Slots | Max. Gewicht | Empfohlen für |
|-----------|-----------|--------------|---------------|
| Kleiner Rucksack | 15 | 30kg | Anfänger |
| Rucksack | 25 | 50kg | Standard |
| Großer Rucksack | 35 | 70kg | Fortgeschritten |
| Taktischer Rucksack | 50 | 100kg | Profi/Militär |
| Reisetasche | 30 | 60kg | Reisen |
| Sporttasche | 20 | 40kg | Sport/Fitness |
| Kleine Bauchtasche | 5 | 10kg | Schneller Zugriff |
| Bauchtasche | 10 | 20kg | Standard |
| Taktische Bauchtasche | 12 | 25kg | Einsätze |
| Umhängetasche | 8 | 15kg | Alltag |

## 🔒 Persistenz

### Equipment-Inventare werden gespeichert:
- ✅ In `equipment_storage` Tabelle in MySQL-Datenbank
- ✅ Verknüpft mit unique Equipment-ID (Format: `itemName_timestamp_random`)
- ✅ Beim Ablegen des Equipments bleiben Items erhalten
- ✅ Beim erneuten Ausrüsten wird Storage wiederhergestellt

### Equipment-ID Vergabe:
- **Automatisch**: Beim ersten Ausrüsten eines Storage-Items
- **Format**: `backpack_medium_1234567890_abc123`
- **Persistenz**: Bleibt gleich über Disconnect/Reconnect
- **Tracking**: In `inventory[itemName].equipmentId` Feld gespeichert

## 📝 Beispiel-Workflow

### Szenario: Spieler bekommt Rucksack und füllt ihn
```lua
-- Admin gibt Rucksack
/giveequipment backpack_medium 1

-- Spieler:
1. Öffnet Inventar (I)
2. Zieht "🎒 Rucksack" aus Slot 5 (Hauptinventar)
3. Lässt auf bag1-Slot los (rechts oben)
4. ✅ Grüne Bestätigung, Rucksack ist ausgerüstet
5. Klickt auf ausgerüsteten Rucksack
6. Storage öffnet sich (25 Slots, 50kg max)
7. Zieht Items aus Hauptinventar in Rucksack-Storage
8. Schließt Inventar → Storage wird automatisch gespeichert
9. Bei nächstem Öffnen sind Items im Rucksack noch da
```

### Szenario: Fehlerhafter Drop
```lua
-- Spieler versucht Rucksack in bag2 zu ziehen:
1. Zieht "🎒 Rucksack" aus Hauptinventar
2. Lässt auf bag2-Slot los (rechts unten)
3. ❌ Rote Shake-Animation
4. 📝 Fehlermeldung: "Nur Bauchtaschen und kleine Taschen erlaubt in diesem Slot!"
5. Rucksack springt zurück ins Hauptinventar
```

## 🔧 Server-Side Validierung

Alle Equipment-Aktionen werden server-seitig validiert:
- ✅ Item-Typ passt zu Ziel-Slot
- ✅ Equipment-Item existiert in `equipment.json`
- ✅ Storage-Kapazität nicht überschritten
- ✅ Player besitzt das Item
- ✅ Equipment-Storage gehört dem Player

**Security**: Client-NUI sendet nur Requests, Server entscheidet final.

## 🗂️ Konfiguration

### Equipment-Items definieren
**Datei**: `configs/equipment.json`

```json
{
  "equipmentItems": {
    "backpack_custom": {
      "label": "🎒 Eigener Rucksack",
      "emoji": "🎒",
      "type": "backpack",
      "itemweight": 1.5,
      "equipSlot": 2,
      "hasStorage": true,
      "storage": {
        "maxSlots": 40,
        "maxWeight": 80
      }
    }
  }
}
```

### Drag-Drop Regeln anpassen
**Datei**: `configs/equipment.json` → `dragDropRules`

```json
{
  "dragDropRules": {
    "vest": {
      "allowedTypes": ["vest", "armor"],
      "rejectMessage": "Nur Westen und Rüstungen erlaubt in diesem Slot!"
    }
  }
}
```

## 🔍 Debugging

### NUI Console (F12)
```javascript
// Equipment-Config prüfen
console.log(equipmentConfig.value);

// Ausgerüstetes Item prüfen
console.log(equipmentSlots.value.bag1);

// Validierung testen
canEquipToSlot(item, 'bag1');
```

### Server Console
```lua
-- Equipment-Config ausgeben
print(json.encode(FW.EquipmentConfig.equipmentItems['backpack_medium']))

-- Storage abrufen
local storage = MySQL.single.await('SELECT * FROM equipment_storage WHERE equipment_id = ?', {equipmentId})
print(json.encode(storage))
```

### Client Console (F8)
```lua
-- Equipment-Storage öffnen
exports['fw_core']:OpenEquipmentStorage('backpack_medium_1234567890_abc', 'backpack_medium')
```

## 🚨 Häufige Fehler

### 1. Equipment lässt sich nicht ausrüsten
- ✅ Prüfen: Item in `equipment.json` definiert?
- ✅ Prüfen: Item in `itemlist.json` mit richtigem `type`?
- ✅ Prüfen: `server/inventory_equipment.lua` in fxmanifest.lua geladen?

### 2. Storage öffnet sich nicht
- ✅ Prüfen: `hasStorage: true` in `equipment.json`?
- ✅ Prüfen: Equipment hat `equipmentId` Feld?
- ✅ Prüfen: `equipment_storage` Tabelle existiert in DB?

### 3. Drag-Drop wird nicht validiert
- ✅ Prüfen: `equipmentConfig` ref in InventoryModule.js definiert?
- ✅ Prüfen: Item hat `type` Feld in loadInventoryData()?
- ✅ Prüfen: handleMouseUp() validiert Equipment-Slots?

### 4. Items verschwinden nach Reconnect
- ✅ Prüfen: `equipmentId` wird in Datenbank gespeichert?
- ✅ Prüfen: `equipment_storage` Tabelle hat Eintrag?
- ✅ Prüfen: Server lädt Equipment-Storage bei Spawn?

## 📚 Weitere Dokumentation

- **Dual Inventory System**: `DUAL_INVENTORY_DOCUMENTATION.md`
- **Quick Start**: `QUICK_START.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Equipment Config**: `configs/equipment.json`
- **Item List**: `configs/itemlist.json`

## 🎯 Nächste Schritte

1. ✅ SQL-Migration ausführen: `sql/dual_inventory_migration.sql`
2. ✅ Server neu starten: `restart fw_core`
3. ✅ Admin-Item geben: `/giveequipment backpack_medium 1`
4. ✅ Equipment ausrüsten (Drag & Drop)
5. ✅ Storage öffnen und Items hinzufügen
6. ✅ Reconnect testen (Items bleiben erhalten)

---
**Version**: 1.0.0  
**Autor**: Pandakun  
**Letzte Aktualisierung**: 2024
