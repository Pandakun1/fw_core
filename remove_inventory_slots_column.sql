-- Migration: Remove inventory_slots column and migrate data to inventory column
-- This script merges inventory_slots data into the inventory column as slot-based array

USE spielplatz;

-- Step 1: Migrate data from inventory_slots to inventory (if inventory_slots has data)
UPDATE players 
SET inventory = COALESCE(inventory_slots, '[]')
WHERE inventory_slots IS NOT NULL 
  AND inventory_slots != '' 
  AND inventory_slots != '[]'
  AND (inventory IS NULL OR inventory = '' OR inventory = '{}');

-- Step 2: For rows where both have data, prefer inventory_slots (newer slot-based format)
UPDATE players 
SET inventory = inventory_slots
WHERE inventory_slots IS NOT NULL 
  AND inventory_slots != '' 
  AND inventory_slots != '[]'
  AND inventory_slots != '{}';

-- Step 3: Set empty inventories to proper array format
UPDATE players 
SET inventory = '[]'
WHERE inventory IS NULL OR inventory = '' OR inventory = '{}';

-- Step 4: Drop the inventory_slots column
ALTER TABLE players DROP COLUMN inventory_slots;

-- Verify migration
SELECT 
    COUNT(*) as total_players,
    SUM(CASE WHEN inventory IS NOT NULL AND inventory != '[]' THEN 1 ELSE 0 END) as players_with_items
FROM players;

SELECT '✅ Migration complete: inventory_slots column removed, data merged into inventory column' as status;
