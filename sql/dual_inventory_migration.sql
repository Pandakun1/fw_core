-- =====================================================
-- FW CORE - DUAL INVENTORY SYSTEM MIGRATION
-- =====================================================
-- Dieses SQL-Script erstellt alle notwendigen Tabellen
-- für das Secondary Inventory System (Vehicles, Stash)
-- =====================================================

-- 1. VEHICLE STORAGE TABELLE (Kofferraum & Handschuhfach)
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicle_storage (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    plate           VARCHAR(20) NOT NULL UNIQUE,          -- Nummernschild (UNIQUE!)
    vehicle_model   VARCHAR(50) NOT NULL,                  -- z.B. 'adder', 'police'
    trunk           LONGTEXT DEFAULT NULL,                 -- JSON: Kofferraum-Inventar
    glovebox        LONGTEXT DEFAULT NULL,                 -- JSON: Handschuhfach-Inventar
    owner           VARCHAR(64) DEFAULT NULL,              -- Identifier des Besitzers (optional)
    is_locked       TINYINT(1) DEFAULT 0,                  -- Inventory Lock (Anti-Duping)
    locked_by       INT DEFAULT NULL,                      -- Server ID des Spielers mit aktivem Lock
    locked_at       TIMESTAMP NULL DEFAULT NULL,           -- Zeitpunkt des Locks
    last_accessed   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_plate (plate),
    INDEX idx_owner (owner),
    INDEX idx_locked (is_locked, locked_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. STASH STORAGE TABELLE (Externe Lager, Jobs, Häuser)
-- =====================================================
CREATE TABLE IF NOT EXISTS stash_storage (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    stash_id        VARCHAR(64) NOT NULL UNIQUE,           -- Unique Name: 'policestation_locker1', 'house_123'
    stash_type      VARCHAR(50) NOT NULL DEFAULT 'generic',-- 'job', 'gang', 'house', 'generic'
    inventory       LONGTEXT DEFAULT NULL,                 -- JSON: Inventar-Daten
    max_slots       INT NOT NULL DEFAULT 50,               -- Maximale Slots (konfigurierbar)
    max_weight      INT NOT NULL DEFAULT 100,              -- Maximales Gewicht in kg
    owner           VARCHAR(64) DEFAULT NULL,              -- Besitzer (Identifier oder NULL für shared)
    job_restriction VARCHAR(50) DEFAULT NULL,              -- Job-Name falls restricted (z.B. 'police')
    grade_restriction INT DEFAULT NULL,                    -- Mindest-Grade falls restricted
    position_x      DOUBLE DEFAULT NULL,                   -- Zugriffs-Position X
    position_y      DOUBLE DEFAULT NULL,                   -- Zugriffs-Position Y
    position_z      DOUBLE DEFAULT NULL,                   -- Zugriffs-Position Z
    radius          DOUBLE DEFAULT 2.5,                    -- Zugriffs-Radius in Metern
    is_locked       TINYINT(1) DEFAULT 0,                  -- Inventory Lock (Anti-Duping)
    locked_by       INT DEFAULT NULL,                      -- Server ID des Spielers mit aktivem Lock
    locked_at       TIMESTAMP NULL DEFAULT NULL,           -- Zeitpunkt des Locks
    last_accessed   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_stash_id (stash_id),
    INDEX idx_type (stash_type),
    INDEX idx_owner (owner),
    INDEX idx_job (job_restriction),
    INDEX idx_locked (is_locked, locked_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. INVENTORY TRANSACTIONS LOG (Optional - für Debugging & Anti-Cheat)
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id  VARCHAR(64) NOT NULL,                  -- Unique Transaction ID
    source_type     VARCHAR(50) NOT NULL,                  -- 'player', 'vehicle_trunk', 'stash', 'ground'
    source_id       VARCHAR(100) NOT NULL,                 -- Identifier, Plate, StashID
    target_type     VARCHAR(50) NOT NULL,                  -- 'player', 'vehicle_trunk', 'stash', 'ground'
    target_id       VARCHAR(100) NOT NULL,                 -- Identifier, Plate, StashID
    item_name       VARCHAR(100) NOT NULL,
    amount          INT NOT NULL,
    metadata        LONGTEXT DEFAULT NULL,                 -- JSON: Item Metadata
    player_src      INT NOT NULL,                          -- Server ID des ausführenden Spielers
    player_identifier VARCHAR(64) NOT NULL,                -- Character Identifier
    status          VARCHAR(20) DEFAULT 'completed',       -- 'pending', 'completed', 'failed', 'rolled_back'
    error_message   TEXT DEFAULT NULL,
    timestamp       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_transaction (transaction_id),
    INDEX idx_player (player_identifier),
    INDEX idx_timestamp (timestamp),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4. PLAYER INVENTORY LOCK COLUMN (zu bestehender players Tabelle hinzufügen)
-- =====================================================
-- Fügt Anti-Duping Lock zur players Tabelle hinzu (safe wenn column schon existiert)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS inventory_locked TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS inventory_locked_by INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS inventory_locked_at TIMESTAMP NULL DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_lock ON players (inventory_locked, inventory_locked_by);


-- 5. EQUIPMENT STORAGE TABELLE (Rucksäcke, Taschen, Bauchtaschen)
-- =====================================================
CREATE TABLE IF NOT EXISTS equipment_storage (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id    VARCHAR(100) NOT NULL UNIQUE,          -- Format: backpack_medium_12345
    equipment_type  VARCHAR(50) NOT NULL,                  -- backpack, large_bag, hip_bag, small_bag
    item_name       VARCHAR(100) NOT NULL,                 -- z.B. 'backpack_medium'
    inventory       LONGTEXT DEFAULT NULL,                 -- JSON: Inventar im Equipment
    max_slots       INT NOT NULL DEFAULT 20,               -- Max Slots (aus equipment.json)
    max_weight      INT NOT NULL DEFAULT 40,               -- Max Gewicht (aus equipment.json)
    owner           VARCHAR(64) DEFAULT NULL,              -- Identifier des Besitzers
    durability      INT DEFAULT 100,                       -- Zustand des Equipment (optional)
    is_locked       TINYINT(1) DEFAULT 0,                  -- Inventory Lock (Anti-Duping)
    locked_by       INT DEFAULT NULL,                      -- Server ID des Spielers mit aktivem Lock
    locked_at       TIMESTAMP NULL DEFAULT NULL,           -- Zeitpunkt des Locks
    last_accessed   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_owner (owner),
    INDEX idx_locked (is_locked, locked_by),
    INDEX idx_type (equipment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- BEISPIEL-DATEN (Optional - für Testing)
-- =====================================================

-- Beispiel Stash: Polizeistation Waffenraum
INSERT INTO stash_storage (stash_id, stash_type, max_slots, max_weight, job_restriction, grade_restriction, position_x, position_y, position_z, radius)
VALUES ('mrpd_armory', 'job', 100, 500, 'police', 3, 452.6, -980.0, 30.68, 3.0)
ON DUPLICATE KEY UPDATE stash_id=stash_id;

-- Beispiel Stash: Mechaniker Werkzeugschrank
INSERT INTO stash_storage (stash_id, stash_type, max_slots, max_weight, job_restriction, grade_restriction, position_x, position_y, position_z, radius)
VALUES ('mechanic_toolstorage', 'job', 50, 200, 'mechanic', 0, -348.0, -133.0, 39.0, 2.5)
ON DUPLICATE KEY UPDATE stash_id=stash_id;

-- Beispiel Stash: Öffentlicher Lagerraum (kein Job)
INSERT INTO stash_storage (stash_id, stash_type, max_slots, max_weight, position_x, position_y, position_z, radius)
VALUES ('public_storage_1', 'generic', 25, 100, 215.9, -809.5, 30.7, 2.0)
ON DUPLICATE KEY UPDATE stash_id=stash_id;


-- =====================================================
-- CLEANUP QUERIES (für Wartung)
-- =====================================================

-- Entferne verwaiste Locks (älter als 5 Minuten)
-- UPDATE players SET inventory_locked = 0, inventory_locked_by = NULL WHERE inventory_locked = 1 AND inventory_locked_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE);
-- UPDATE vehicle_storage SET is_locked = 0, locked_by = NULL WHERE is_locked = 1 AND locked_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE);
-- UPDATE stash_storage SET is_locked = 0, locked_by = NULL WHERE is_locked = 1 AND locked_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE);

-- Lösche alte Transaction Logs (älter als 30 Tage)
-- DELETE FROM inventory_transactions WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);


-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Führe dieses Script einmalig aus, um die Tabellen zu erstellen.
-- Bestehende Daten werden NICHT gelöscht (CREATE IF NOT EXISTS).
-- =====================================================
