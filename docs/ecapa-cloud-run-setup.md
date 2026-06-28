# ECAPA Voice-ID Service, Google Cloud Run Setup

> **Google Cloud account: `business@veldhq.com`**
> Do everything below signed into that account. The script auto-fills the GCP
> project and service account from your Supabase Vault. If the access check warns
> that the project is not reachable, the Speech-to-Text project lives under a
> different account, see "Service account note" at the bottom.

This sets up the self-hosted **ECAPA speaker-identification service** (the AI
scribe's "which voice is which clinician" layer) as a scale-to-zero container on
Cloud Run. Free at typical volume; patient audio stays in your own BAA-covered
GCP project.

Legend: **[you]** = run in Cloud Shell / a terminal signed in as
`business@veldhq.com`. **[Claude]** = I do this once the code is ready.

---

## Part A. One-time GCP setup [you]

In **Cloud Shell you are already authenticated**, so do NOT run `gcloud auth
login`. Paste this whole block (it is paste-safe and idempotent, safe to re-run):

```bash
# ===== detected from your Supabase Vault; edit only if your project differs =====
PROJECT_ID="project-5eb37c3a-9eed-40b5-9a3"
REGION="us-central1"
SA_EMAIL="smlxjjss@project-5eb37c3a-9eed-40b5-9a3.iam.gserviceaccount.com"
# ================================================================================

gcloud config set project "$PROJECT_ID"
gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1 \
  && echo "OK: project accessible" \
  || echo ">>> WARNING: cannot access $PROJECT_ID with this login (different account?). Stop and reconcile before continuing."

gcloud services enable \
  run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com speech.googleapis.com

gcloud artifacts repositories describe scribe-identity --location="$REGION" >/dev/null 2>&1 \
  && echo "OK: Artifact Registry repo already exists" \
  || gcloud artifacts repositories create scribe-identity --repository-format=docker --location="$REGION"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" --role="roles/speech.client" --condition=None

echo "===== Part A complete: project=$PROJECT_ID region=$REGION sa=$SA_EMAIL ====="
```

This sets the project, enables the APIs, creates the Artifact Registry repo, and
grants `roles/speech.client` to the service account (which also unblocks the
Chirp 3 patient dictation). `roles/run.invoker` on the service itself is granted
in Part C, after the service exists.

**In the Cloud Console (one-time):** confirm your Google Cloud **BAA covers
Cloud Run + Artifact Registry + Speech-to-Text**. Encounter audio is processed
in this project.

When Part A finishes, tell me the printed `project / region / sa` line.

---

## Part B. The service files [Claude, done]

Already written under `services/ecapa-identity/`:
- `main.py` — FastAPI: `POST /enroll` (clip -> embedding + model version),
  `POST /identify` (audio URL + diarization timestamps + enrolled embeddings ->
  which speaker is which clinician + confidence), `GET /healthz`.
- `Dockerfile` — `python:3.11-slim` + CPU torch + speechbrain + ffmpeg, ECAPA
  model and a pinned `MODEL_VERSION` baked into the image.
- `requirements.txt`.

---

## Part C. Build + deploy [Claude, after Part A]

```bash
# From services/ecapa-identity/ — Cloud Build packages, pushes, and deploys
gcloud run deploy ecapa-identity \
  --source . \
  --region "$REGION" \
  --memory 4Gi --cpu 1 \
  --min-instances 0 --max-instances 3 \
  --concurrency 4 \
  --no-allow-unauthenticated

# Allow the Supabase edge function's service account to call the service
gcloud run services add-iam-policy-binding ecapa-identity \
  --region "$REGION" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.invoker"

# Print the service URL (used in Part D)
gcloud run services describe ecapa-identity \
  --region "$REGION" --format 'value(status.url)'
```

`--no-allow-unauthenticated` = no public access. `--min-instances 0` = scale to
zero, free when idle (~5 to 10 second cold start on the first call, fine for a
post-encounter batch job).

---

## Part D. Wire it into Supabase [Claude]

```bash
npx supabase secrets set ECAPA_SERVICE_URL="<service-url-from-part-C>" \
  --project-ref sdzeoeturtpkqlagobwj
```
The edge functions (`transcribe-encounter`, `enroll-voiceprint`) call
`ECAPA_SERVICE_URL`, authenticating with a Google-signed ID token minted from the
same service account (audience = the service URL). No public endpoint, no shared
password.

---

## Part E. Verify [Claude]

```bash
# Should return 403 with NO auth (proves it is locked down)
curl -s -o /dev/null -w "%{http_code}\n" "<service-url>/healthz"
```
Then an authenticated `/enroll` + `/identify` smoke test with a sample clip.

---

## Cost

Essentially **$0** at your volume: scale-to-zero plus the perpetual free tier
(~180k vCPU-seconds, 360k GiB-seconds, 2M requests per month) covers thousands of
encounters per month. Only very high volume incurs a few dollars.

## Model-version pinning

The image pins one ECAPA model version and returns it from `/enroll`. Stored
voiceprints record that version, and `/identify` only compares same-version
embeddings. Upgrading the model flags old voiceprints stale and clinicians
re-enroll (a quick 10 to 15 second re-record).

## Service account note

The grants assume the Speech-to-Text service account (`google_vertex_sa_json`,
project `project-5eb37c3a-9eed-40b5-9a3`) is reachable under
`business@veldhq.com`. If the Part A access check warns it is not, either: (a)
deploy the ECAPA service in that SA's project, or (b) create a new service
account in a `business@veldhq.com` project, store its JSON in Vault as
`google_vertex_sa_json`, and use it for both Speech-to-Text v2 and the Cloud Run
ID token. The edge functions mint the Cloud Run ID token from whichever SA is in
`google_vertex_sa_json`, so that SA must hold `roles/run.invoker` on
`ecapa-identity`.
