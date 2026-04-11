BEGIN;

UPDATE public.locations
SET vaccines_enabled = true
WHERE vaccines_enabled IS DISTINCT FROM true;

UPDATE public.locations
SET vitals_enabled = true
WHERE vitals_enabled IS DISTINCT FROM true;

ALTER TABLE public.locations
  ALTER COLUMN vaccines_enabled SET DEFAULT true;

COMMIT;

NOTIFY pgrst, 'reload schema';
