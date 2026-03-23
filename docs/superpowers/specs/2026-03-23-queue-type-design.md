# Queue Type Per Location — Design Spec
**Date:** 2026-03-23
**Status:** Approved

## Overview

Clinics operate differently. Some run strict walk-in order; others want the AI to bump critical patients ahead. This feature adds a per-location `queue_type` setting with two modes — Priority and FCFS — and surfaces the choice during onboarding so owners configure it before their first patient walks in.

## Background

The current system has one queue model: priority-based. The AI conversation engine auto-assigns urgency (priority 1–3) based on keywords. `get_queue` orders by `priority DESC, entered_queue_at ASC`. `get_patient_session` counts position using the same logic.

FCFS mode works by keeping all visits at priority 1. Since the ordering SQL already breaks ties by arrival time, no queue SQL changes are needed — the behavior degrades naturally to pure FCFS when all priorities are equal.

## Modes

| Value | Label | Behavior |
|-------|-------|----------|
| `priority` | Priority Queue | AI detects urgency and bumps critical patients ahead. Ties broken by arrival time. Default for all locations. |
| `fcfs` | First Come, First Served | Strict arrival order. AI does not update priority. Every patient waits their turn regardless of condition. |

## Database

**Migration** (run once, then update `sql/tables/locations.core-sql`):
```sql
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS queue_type text NOT NULL DEFAULT 'priority'
  CHECK (queue_type IN ('priority', 'fcfs'));
```

All existing locations inherit `'priority'` — no data migration needed.

## SQL Functions

### `create_location`
Add parameter `p_queue_type text DEFAULT 'priority'`. Pass to INSERT.

### `update_location`
Add parameter `p_queue_type text`. Include in UPDATE SET clause.

### `get_location_detail`
Include `queue_type` in the returned JSON object.

### `get_queue` — no change
Orders by `priority DESC, created_at ASC`. In FCFS mode, all visits have priority 1, so this naturally becomes pure arrival order.

### `get_patient_session` — no change
Queue position counts visits where `priority > mine OR (equal priority AND earlier arrival)`. When all priorities are 1, this collapses to pure FCFS.

## Edge Function: `ai-conversation`

The urgency keyword block currently calls `update_visit_priority` unconditionally. Change:

1. After establishing the visit context (where `location_id` is already in scope), fetch `queue_type` from `locations`.
2. Wrap the `update_visit_priority` calls in a guard: only execute if `queue_type === 'priority'`.
3. In FCFS mode, skip the call entirely. Priority stays at 1.

One extra SELECT per conversation (location data is small and cacheable at the function level if needed).

## Onboarding — Step 1

Add `queueType` state (default `'priority'`) to `OnboardingWizard`.

Below the specialty selector, before the "Create Location" button, add two selectable option cards:

**Priority Queue** *(selected by default)*
> AI detects urgency and bumps critical patients ahead. Ties broken by arrival time.

**First Come, First Served**
> Strict arrival order. Every patient waits their turn regardless of condition.

Add a note directly above the "Create Location" button:
> "These settings apply to the location you are creating here. You can change them at any time in location settings."

Pass `queueType` into `createLocation()`.

## Server Actions

### `_actions/locations.ts — createLocation`
Add `queueType: 'priority' | 'fcfs'` (default `'priority'`) to form data input. Pass as `p_queue_type` to the `create_location` RPC.

### `_actions/locations.ts — updateLocation`
Add `queueType: 'priority' | 'fcfs'` to form data input. Pass as `p_queue_type` to the `update_location` RPC.

## Location Settings UI — `LocationDetail.tsx`

Add `queue_type: string` to the location interface.

Add a two-option selector to the settings form using the same labels as onboarding. Saving triggers the existing `updateLocation` server action with the new field included.

## Type Generation

After deploying SQL changes, regenerate `src/lib/database.types.ts`:
```bash
npx supabase gen types typescript --project-id sdzeoeturtpkqlagobwj > src/lib/database.types.ts
```

## Files Changed

| File | Change |
|------|--------|
| `sql/tables/locations.core-sql` | Add `queue_type` column |
| `sql/create_location.core-sql` | Add `p_queue_type` param |
| `sql/update_location.core-sql` | Add `p_queue_type` param |
| `sql/get_location_detail.core-sql` | Return `queue_type` in JSON |
| `supabase/functions/ai-conversation/index.ts` | Gate priority update on `queue_type` |
| `src/app/(dashboard)/d/_actions/locations.ts` | Add `queueType` to create + update |
| `src/components/onboarding/OnboardingWizard.tsx` | Queue type selector in Step 1 + note |
| `src/components/dashboard/LocationDetail.tsx` | Queue type selector in settings form |
| `src/lib/database.types.ts` | Regenerate after SQL deploy |

## Out of Scope

- Appointment-based queue (separate major feature)
- Provider-specific queues
- Manual priority override UI (priority is AI-only today)
- Changes to `get_queue` or `get_patient_session` SQL ordering logic
