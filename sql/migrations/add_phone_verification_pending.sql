ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS phone_verification_pending boolean DEFAULT false;
