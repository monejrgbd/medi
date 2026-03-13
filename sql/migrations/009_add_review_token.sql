-- Add review_token column to visits table
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS review_token uuid UNIQUE;
CREATE INDEX IF NOT EXISTS idx_visits_review_token ON public.visits (review_token) WHERE review_token IS NOT NULL;
