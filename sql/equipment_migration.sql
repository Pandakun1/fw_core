-- ============================================
-- EQUIPMENT SYSTEM MIGRATION
-- Fügt Equipment-Spalten zur players Tabelle hinzu
-- ============================================

-- Prüfe ob Spalten bereits existieren und füge sie hinzu falls nicht
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS equipment_vest LONGTEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS equipment_weapon LONGTEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS equipment_bag1 LONGTEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS equipment_bag2 LONGTEXT DEFAULT NULL;

-- Equipment Storage Tabelle für Taschen/Rucksäcke mit eigenem Inventar
CREATE TABLE IF NOT EXISTS equipment_storage (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id    VARCHAR(128) NOT NULL UNIQUE,
    equipment_type  VARCHAR(50) NOT NULL,
    item_name       VARCHAR(50) NOT NULL,
    max_slots       INT NOT NULL DEFAULT 20,
    max_weight      FLOAT NOT NULL DEFAULT 40.0,
    owner           VARCHAR(64) NOT NULL,
    inventory       LONGTEXT NOT NULL DEFAULT '{}',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_owner (owner),
    INDEX idx_item_name (item_name)
) ENGINE=InnoDB;

SELECT 'Equipment migration completed successfully!' AS status;
