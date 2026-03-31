-- Phone-as-Identity Check-in Migration
-- Adds pending_phone to visits, drops collision_flag from patients,
-- drops 7 collision/phone-collection SQL functions

BEGIN;

-- 1. Add pending_phone column to visits (stores new phone during phone_change/add_phone until verified)
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS pending_phone text;

-- 2. Drop collision_flag column from patients (phone is now part of identity key)
ALTER TABLE public.patients DROP COLUMN IF EXISTS collision_flag;

-- 3. Drop collision and phone-collection functions (public wrappers first, then private)
DROP FUNCTION IF EXISTS public.handle_collision_result(uuid, boolean, boolean);
DROP FUNCTION IF EXISTS private.handle_collision_result(uuid, uuid, boolean, boolean);

DROP FUNCTION IF EXISTS public.handle_no_phone_existing(uuid);
DROP FUNCTION IF EXISTS private.handle_no_phone_existing(uuid, uuid);

DROP FUNCTION IF EXISTS public.handle_collision_verify(uuid);
DROP FUNCTION IF EXISTS private.handle_collision_verify(uuid, uuid);

DROP FUNCTION IF EXISTS public.handle_collision_returning(uuid);
DROP FUNCTION IF EXISTS private.handle_collision_returning(uuid, uuid);

DROP FUNCTION IF EXISTS public.get_collision_state(uuid);
DROP FUNCTION IF EXISTS private.get_collision_state(uuid, uuid);

DROP FUNCTION IF EXISTS public.decline_phone_verification(uuid, uuid);
DROP FUNCTION IF EXISTS private.decline_phone_verification(uuid, uuid);

DROP FUNCTION IF EXISTS public.collect_phone_post_ai(uuid, uuid, text);
DROP FUNCTION IF EXISTS private.collect_phone_post_ai(uuid, uuid, text);

COMMIT;
