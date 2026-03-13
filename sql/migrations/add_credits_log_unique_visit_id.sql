-- Add UNIQUE constraint on credits_log.visit_id to prevent double-deduction at DB level
ALTER TABLE public.credits_log
ADD CONSTRAINT credits_log_visit_id_unique UNIQUE (visit_id);
