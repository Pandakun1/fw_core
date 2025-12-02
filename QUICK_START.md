# 🚀 DUAL INVENTORY - QUICK START GUIDE

## 📋 INSTALLATION (5 Minuten)

### Schritt 1: Datenbank Migration
```bash
# In MySQL/HeidiSQL/phpMyAdmin:
# 1. Öffne: fw_core/sql/dual_inventory_migration.sql
# 2. Führe komplettes Script aus (erstellt 3 Tabellen + Player Columns)
# 3. Prüfe: SELECT * FROM vehicle_storage; (sollte leer sein, kein Error)
```

### Schritt 2: Resource Restart
```bash
# In FXServer Console:
restart fw_core

# Erwartete Logs:
# [FW] ✅ 14 Fahrzeug-Konfigurationen geladen
# [FW] ✅ Secondary Inventory System geladen
# [FW] 📦 Secondary Inventory Server Script loaded
```

### Schritt 3: Testing
```bash
# Im Spiel (F8 Console):
1. Drücke I - Inventar sollte öffnen
2. Gehe zu einem Fahrzeug, drücke L - Kofferraum öffnet
3. Steige ein, drücke K - Handschuhfach öffnet
4. Drücke G - Boden-Inventar öffnet
```

---

## ✅ FUNKTIONS-TESTS

### Test 1: Geben-Modus
```
1. Spieler A öffnet Inventar (I)
2. Klickt auf "Geben"-Button (im NUI)
3. Zieht Items ins rechte Inventar
4. Spieler B steht < 3m entfernt
5. Spieler A klickt "Bestätigen"
6. ✅ Spieler B erhält Items
```

### Test 2: Kofferraum
```
1. Spawne ein Fahrzeug: /car adder
2. Gehe hinten zum Fahrzeug
3. Drücke L
4. ✅ Kofferraum öffnet (30 Slots, 50kg)
5. Lege Items rein, klicke Bestätigen
6. Schließe, gehe weg, komme zurück
7. Drücke L erneut
8. ✅ Items sind noch da (DB-persistent)
```

### Test 3: Handschuhfach
```
1. Sitze in einem Fahrzeug
2. Drücke K
3. ✅ Handschuhfach öffnet (10 Slots, 10kg)
4. Lege Items rein, bestätige
5. Steige aus, steige ein, drücke K
6. ✅ Items sind noch da
```

### Test 4: Lager (Stash)
```
# Admin Command (in F8):
/createstash testlager 50 100

# Dann:
/openstash testlager
✅ Lager öffnet, Items sind persistent
```

### Test 5: Boden
```
1. Öffne Inventar (I)
2. Rechtsklick auf Item → "Wegwerfen" ODER
3. Drücke G für Boden-Inventar
4. Ziehe Item vom Inventar auf Boden-Inventar
5. ✅ Item liegt auf Boden (nur für diese Session)
6. Gehe weg, komme zurück
7. Drücke G, ziehe Item zurück
8. ✅ Item aufgehoben
```

---

## 🔧 KONFIGURATION - BEISPIELE

### Neues Fahrzeug hinzufügen
```json
// In configs/vehicles.json:
{
  "model": "t20",  // Spawn-Name des Fahrzeugs
  "label": "Progen T20",
  "trunk": {
    "enabled": true,
    "maxSlots": 25,
    "maxWeight": 35,
    "accessPosition": "front",  // Frontmotor!
    "radius": 2.0
  },
  "glovebox": {
    "enabled": true,
    "maxSlots": 5,
    "maxWeight": 5
  }
}
```

### Polizei-Waffenraum erstellen
```sql
INSERT INTO stash_storage (
    stash_id, 
    stash_type, 
    max_slots, 
    max_weight, 
    job_restriction, 
    grade_restriction,
    position_x, 
    position_y, 
    position_z,
    radius
) VALUES (
    'mrpd_armory',      -- ID
    'job',              -- Typ
    100,                -- 100 Slots
    500,                -- 500kg Max
    'police',           -- Nur Police
    3,                  -- Mindest-Rang 3
    452.6,              -- X Koordinate
    -980.0,             -- Y Koordinate
    30.68,              -- Z Koordinate
    3.0                 -- 3m Radius
);
```

**Script Integration:**
```lua
-- In deinem Police Script:
RegisterCommand('armory', function()
    local Player = FW.GetPlayer(source)
    if Player.job.name == 'police' and Player.job.grade >= 3 then
        exports['fw_core']:OpenStash('mrpd_armory')
    end
end)
```

### Mechaniker-Werkstatt Lager
```sql
INSERT INTO stash_storage (
    stash_id, 
    stash_type, 
    max_slots, 
    max_weight, 
    job_restriction,
    position_x, 
    position_y, 
    position_z
) VALUES (
    'mechanic_storage',
    'job',
    80,
    200,
    'mechanic',
    -348.0,
    -133.0,
    39.0
);
```

### Öffentliches Lager (kein Job)
```sql
INSERT INTO stash_storage (
    stash_id, 
    max_slots, 
    max_weight, 
    position_x, 
    position_y, 
    position_z
) VALUES (
    'public_storage_1',
    30,
    75,
    215.9,
    -809.5,
    30.7
);
```

---

## 🎯 HÄUFIGE USE-CASES

### Use-Case 1: Job-basiertes Lager
**Ziel**: Nur Police hat Zugriff auf Waffenraum

```sql
INSERT INTO stash_storage (stash_id, job_restriction, grade_restriction, position_x, position_y, position_z)
VALUES ('mrpd_armory', 'police', 2, 452.6, -980.0, 30.68);
```

### Use-Case 2: Haus-Lager (Owner-basiert)
**Ziel**: Nur Hausbesitzer hat Zugriff

```sql
INSERT INTO stash_storage (stash_id, owner, position_x, position_y, position_z)
VALUES ('house_123', 'char_abc123', 123.45, 456.78, 90.12);
```

**Script:**
```lua
-- In deinem Housing Script:
RegisterCommand('hauslagern', function(source)
    local Player = FW.GetPlayer(source)
    local houseId = GetPlayerHouseId(source) -- Deine Funktion
    
    if houseId then
        exports['fw_core']:OpenStash('house_' .. houseId)
    end
end)
```

### Use-Case 3: Gang-Versteck
**Ziel**: Gang-Mitglieder können Items lagern

```sql
INSERT INTO stash_storage (stash_id, max_slots, max_weight, position_x, position_y, position_z)
VALUES ('gang_bloods_hideout', 200, 500, -1000.0, -2000.0, 15.0);
```

**Script:**
```lua
-- Gang Check
RegisterCommand('gangstash', function(source)
    local Player = FW.GetPlayer(source)
    local gang = GetPlayerGang(source) -- Deine Funktion
    
    if gang == 'bloods' then
        exports['fw_core']:OpenStash('gang_bloods_hideout')
    end
end)
```

---

## 🐛 TROUBLESHOOTING SCHNELLHILFE

### Problem: "Kein Fahrzeug in der Nähe"
```
✓ Bist du < 5m vom Fahrzeug entfernt?
✓ Drückst du L (nicht K)?
✓ Ist das Fahrzeug gespawnt (nicht despawned)?
```

### Problem: "Inventar ist gesperrt"
```bash
# Lösung 1: Warte 5 Minuten (Auto-Unlock)
# Lösung 2: Admin-Fix via SQL:
UPDATE players SET inventory_locked = 0;
```

### Problem: Items verschwinden
```bash
# Check 1: Sind Items in der DB?
SELECT inventory FROM players WHERE identifier = 'char_xxxxx';

# Check 2: Transaction Log
SELECT * FROM inventory_transactions ORDER BY timestamp DESC LIMIT 20;

# Check 3: Logs prüfen
# Server Console: Suche nach [FW] Fehler-Logs
```

### Problem: Stash öffnet nicht
```sql
-- Check 1: Existiert Stash?
SELECT * FROM stash_storage WHERE stash_id = 'xxx';

-- Check 2: Job richtig?
-- Wenn job_restriction = 'police' gesetzt ist, musst du Police sein

-- Check 3: Position richtig?
-- Koordinaten müssen stimmen, Spieler muss nahe sein
```

---

## 📞 SUPPORT CHECKLIST

Wenn etwas nicht funktioniert, sammle diese Infos:

```
1. Server Console Logs (letzte 50 Zeilen)
2. Client F8 Console Logs
3. FXServer Version: _______
4. oxmysql Version: _______
5. Was hast du genau gemacht?
6. Was sollte passieren?
7. Was ist stattdessen passiert?
8. SQL Query Result von:
   SELECT * FROM vehicle_storage LIMIT 5;
   SELECT * FROM stash_storage LIMIT 5;
```

---

## ✨ TIPPS & TRICKS

### Tipp 1: Custom Keybinds
```lua
-- In deinem Script:
RegisterKeyMapping('trunk', 'Kofferraum', 'keyboard', 'L')
RegisterKeyMapping('glovebox', 'Handschuhfach', 'keyboard', 'K')
```

### Tipp 2: Auto-Open Kofferraum
```lua
-- Kofferraum öffnet automatisch wenn du nahe kommst
Citizen.CreateThread(function()
    while true do
        local ped = PlayerPedId()
        local coords = GetEntityCoords(ped)
        local vehicle = GetClosestVehicle(coords.x, coords.y, coords.z, 3.0, 0, 71)
        
        if vehicle ~= 0 then
            -- Zeige Hinweis
            DrawText3D(coords.x, coords.y, coords.z, "~g~[L]~w~ Kofferraum")
        end
        
        Wait(0)
    end
end)
```

### Tipp 3: Lager mit Marker
```lua
-- Erstelle 3D Marker für Stash
local StashLocations = {
    { stashId = 'mrpd_armory', coords = vector3(452.6, -980.0, 30.68) }
}

Citizen.CreateThread(function()
    while true do
        local ped = PlayerPedId()
        local coords = GetEntityCoords(ped)
        
        for _, stash in ipairs(StashLocations) do
            local dist = #(coords - stash.coords)
            if dist < 10.0 then
                DrawMarker(1, stash.coords.x, stash.coords.y, stash.coords.z - 1.0, 0, 0, 0, 0, 0, 0, 1.0, 1.0, 1.0, 0, 255, 0, 100, false, true, 2, false, nil, nil, false)
                
                if dist < 2.0 then
                    DrawText3D(stash.coords.x, stash.coords.y, stash.coords.z, "~g~[E]~w~ Lager öffnen")
                    
                    if IsControlJustReleased(0, 38) then -- E
                        exports['fw_core']:OpenStash(stash.stashId)
                    end
                end
            end
        end
        
        Wait(0)
    end
end)

function DrawText3D(x, y, z, text)
    local onScreen, _x, _y = World3dToScreen2d(x, y, z)
    if onScreen then
        SetTextScale(0.35, 0.35)
        SetTextFont(4)
        SetTextProportional(1)
        SetTextEntry("STRING")
        SetTextCentre(1)
        AddTextComponentString(text)
        DrawText(_x, _y)
    end
end
```

---

## 🎓 WEITERFÜHREND

### Erweiterte Anti-Duping Mechanismen
```lua
-- Transaction-ID System
local transactionId = 'txn_' .. os.time() .. '_' .. math.random(10000, 99999)

-- Log Transaction
MySQL.insert(
    'INSERT INTO inventory_transactions (transaction_id, source_type, source_id, target_type, target_id, item_name, amount, player_src, player_identifier, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    { transactionId, 'player', srcId, 'player', targetId, itemName, amount, src, identifier, 'pending' },
    function()
        -- Führe Transfer durch
        -- Bei Erfolg: Status = 'completed'
        -- Bei Fehler: Status = 'failed' + Rollback
    end
)
```

### Custom Secondary Inventory Modi
```lua
-- Definiere eigenen Modus
RegisterNetEvent('myresource:openCustomInventory', function()
    local customData = { ... }
    
    SendNUIMessage({
        action = 'openDualInventory',
        mode = 'custom_safe',
        title = '🔐 Tresor',
        secondaryInventory = customData,
        maxSlots = 20,
        maxWeight = 100,
        metadata = { safeId = '123' }
    })
end)

-- Handle Save
RegisterNUICallback('saveCustom', function(data, cb)
    TriggerServerEvent('myresource:saveCustomInventory', data)
    cb('ok')
end)
```

---

**Viel Erfolg! 🚀**
