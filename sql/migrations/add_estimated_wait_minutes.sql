ALTER TABLE locations ADD COLUMN IF NOT EXISTS estimated_wait_minutes numeric DEFAULT NULL;
