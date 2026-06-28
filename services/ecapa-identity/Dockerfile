# ECAPA speaker-identification service for the AI scribe.
# Deploys to Cloud Run under business@veldhq.com (see docs/ecapa-cloud-run-setup.md).
# CPU-only; the SpeechBrain ECAPA model is baked into the image so there is no
# cold-start download.
FROM python:3.11-slim

# ffmpeg is used to decode WebM/OGG/MP4 audio to 16 kHz mono WAV.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# CPU wheels for torch/torchaudio keep the image small (no CUDA).
COPY requirements.txt .
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Pre-download the ECAPA model into the image (no runtime download / cold-start hit).
RUN python -c "from speechbrain.inference.speaker import EncoderClassifier; EncoderClassifier.from_hparams(source='speechbrain/spkrec-ecapa-voxceleb', savedir='/models/ecapa', run_opts={'device':'cpu'})"

COPY main.py .

ENV PORT=8080
# Shell form so ${PORT} (set by Cloud Run) is substituted.
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
