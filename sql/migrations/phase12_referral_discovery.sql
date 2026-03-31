-- Phase 12: Self-Reported Referrals + Discovery Source
-- Run once. All changes are backward-compatible.

BEGIN;

-- ============================================================
-- 1. locations: per-location toggles for check-in questions
-- ============================================================
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS ask_referral_source boolean DEFAULT false;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS ask_discovery_source boolean DEFAULT false;

-- ============================================================
-- 2. referrals: source column + nullable from_* for self-reported
-- ============================================================
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'hilt';

ALTER TABLE public.referrals ALTER COLUMN from_doctor_id DROP NOT NULL;
ALTER TABLE public.referrals ALTER COLUMN from_location_id DROP NOT NULL;
ALTER TABLE public.referrals ALTER COLUMN from_org_id DROP NOT NULL;

ALTER TABLE public.referrals ADD CONSTRAINT referrals_source_check
  CHECK (source IN ('hilt', 'self_reported'));

ALTER TABLE public.referrals ADD CONSTRAINT referrals_hilt_fields_check
  CHECK (source = 'self_reported' OR (
    from_doctor_id IS NOT NULL AND from_location_id IS NOT NULL AND from_org_id IS NOT NULL
  ));

-- ============================================================
-- 3. visits: self-reported referral flag + discovery source
-- ============================================================
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS self_reported_referral boolean DEFAULT false;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS self_reported_referrer text;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS discovery_source text;

-- ============================================================
-- 4. Demo location: enable both toggles
-- ============================================================
UPDATE public.locations SET ask_referral_source = true, ask_discovery_source = true
WHERE org_id = 'a24d1aa1-2ae0-4022-b242-9a7dc30fc4b0';

COMMIT;
