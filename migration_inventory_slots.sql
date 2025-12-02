-- Migration: Add inventory_slots column to players table
-- This adds the new slot-based inventory system

-- Check if column exists, if not add it
SET @dbname = DATABASE();
SET @tablename = 'players';
SET @columnname = 'inventory_slots';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists, skipping...' AS message;",
  "ALTER TABLE players ADD COLUMN inventory_slots LONGTEXT NULL DEFAULT NULL AFTER inventory;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Optional: Initialize empty slots for existing players
UPDATE `players` 
SET `inventory_slots` = '[]' 
WHERE `inventory_slots` IS NULL OR `inventory_slots` = '';

-- Note: Auto-migration happens on player login in db.lua LoadPlayer()
SELECT 'Migration complete! Players will be auto-migrated on next login.' AS status;
