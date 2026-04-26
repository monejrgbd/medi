-- Nurse-first workflow flag for locations.
-- When true, doctors at this location only see patients who have been
-- nurse-reviewed. Nurses see un-reviewed patients first, release to doctor.
-- When false (default), doctors see all queued patients regardless of nurse review state.
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS nurse_first_workflow boolean DEFAULT false;
