# Queue Type Per Location — Design Spec
**Date:** 2026-03-23
**Status:** Approved

## Overview

Clinics operate differently. Some run strict walk in order, others want the AI to bump critical patients ahead. This feature adds a per-location `queue_type` setting with two modes, Priority and FCFS, and surfaces the choice during onboarding so owners configure it before their first patient walks in.

## Background

The current system has one queue model: priority-based. The AI conversation engine auto-assigns urgency (priority 1-3) based on keywords. `get_queue` orders by `priority DESC, created_at ASC` (where `created_at` is the alias for `entered_queue_at` inside the subquery). `get_patient_session` counts position using `priority > mine OR (equal priority AND earlier arrival)`.

FCFS mode works by keeping all visits at priority 1. Since the ordering SQL already breaks ties by arrival time, no queue SQL changes are needed. The behavior degrades naturally to pure FCFS when all priorities are equal.

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

All existing locations inherit `'priority'`. No data migration needed.

## SQL Functions

### `create_location`
Add parameter `p_queue_type text DEFAULT 'priority'`. Pass to INSERT. Invalid values are caught by the column CHECK constraint, which raises a Postgres exception, consistent with how other constraint violations surface in this function (no pre-validation guard needed).

**Important:** `create_location` has a public wrapper whose parameter list changes with every new parameter. Adding `p_queue_type` requires:
1. A `DROP FUNCTION IF EXISTS public.create_location(...)` for the current signature before the new `CREATE OR REPLACE`.
2. Updating the `REVOKE`/`GRANT` lines at the bottom to reference the new parameter-count signature.

### `update_location`
Add parameter `p_queue_type text DEFAULT NULL`. Include in UPDATE SET clause as `COALESCE(p_queue_type, queue_type)` to match the established null-means-no-change pattern used by all other optional parameters in this function.

**Important:** `update_location` has a public wrapper whose parameter list changes with every new parameter. Adding `p_queue_type` requires:
1. A `DROP FUNCTION IF EXISTS public.update_location(...)` for the current signature before the new `CREATE OR REPLACE`.
2. Updating the `REVOKE`/`GRANT` lines at the bottom to reference the new parameter-count signature.

Invalid values surface via the column CHECK constraint (same as `create_location`).

### `get_location_detail`
Include `queue_type` in the returned JSON object.

### `get_queue` — no change
Orders by `priority DESC, created_at ASC` (alias for `entered_queue_at`). In FCFS mode, all visits have priority 1, so this naturally becomes pure arrival order.

### `get_patient_session` — no change
Queue position counts visits where `priority > mine OR (equal priority AND earlier arrival)`. When all priorities are 1, the first branch never fires and position is determined purely by `entered_queue_at`. This is correct FCFS behavior.

## Edge Function: `ai-conversation`

The urgency keyword block currently calls `update_visit_priority` unconditionally. Change:

1. At session start, the function already queries the `locations` table (selecting `ai_model` and `ai_message_limit`). Add `queue_type` to that existing select — do not issue a second query.
2. Store the result in a local variable before the message loop.
3. Inside the urgency keyword block (which runs per-message), wrap the `update_visit_priority` calls in a guard: only execute if `queue_type === 'priority'`.
4. In FCFS mode, skip the call entirely. Priority stays at 1.

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
| `sql/update_location.core-sql` | Add `p_queue_type` param + DROP old signature + update REVOKE/GRANT |
| `sql/get_location_detail.core-sql` | Return `queue_type` in JSON |
| `supabase/functions/ai-conversation/index.ts` | Fetch `queue_type` at session start, gate priority update |
| `src/app/(dashboard)/d/_actions/locations.ts` | Add `queueType` to create + update |
| `src/components/onboarding/OnboardingWizard.tsx` | Queue type selector in Step 1 + note |
| `src/components/dashboard/LocationDetail.tsx` | Queue type selector in settings form |
| `src/lib/database.types.ts` | Regenerate after SQL deploy |

## Out of Scope

- Appointment-based queue (separate major feature)
- Provider-specific queues
- Manual priority override UI (priority is AI-only today)
- Changes to `get_queue` or `get_patient_session` SQL ordering logic
