"""ECAPA speaker-identification service for the AI scribe.

Runs on Cloud Run (--no-allow-unauthenticated), so Cloud Run validates the
caller's Google ID token at the platform layer BEFORE the request reaches this
app; there is no auth logic here. See docs/ecapa-cloud-run-setup.md.

Endpoints:
  GET  /healthz   -> readiness + model version
  POST /enroll    -> {audio_url} -> {embedding, model_version}   (single-speaker clip)
  POST /identify  -> {audio_url, utterances[], voiceprints[], threshold?}
                     -> {model_version, threshold, speakers: {label: match|null}}

Patient audio never leaves this (your own, BAA-covered) GCP project.
"""

import os
import subprocess
import tempfile
from typing import Optional

import httpx
import numpy as np
import soundfile as sf
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from speechbrain.inference.speaker import EncoderClassifier

# Bump this whenever the model changes. Embeddings are only comparable within the
# same MODEL_VERSION; /identify ignores voiceprints from other versions.
MODEL_VERSION = "speechbrain/spkrec-ecapa-voxceleb@1"

TARGET_SR = 16000
DEFAULT_THRESHOLD = float(os.environ.get("MATCH_THRESHOLD", "0.50"))
# Cap per-speaker audio fed to the encoder, to bound CPU on long encounters.
MAX_SECONDS_PER_SPEAKER = float(os.environ.get("MAX_SECONDS_PER_SPEAKER", "60"))
MIN_SECONDS = 0.5  # clips shorter than this are not reliably embeddable

app = FastAPI()
_classifier: Optional[EncoderClassifier] = None


def get_classifier() -> EncoderClassifier:
    global _classifier
    if _classifier is None:
        _classifier = EncoderClassifier.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            savedir="/models/ecapa",
            run_opts={"device": "cpu"},
        )
    return _classifier


@app.on_event("startup")
def _warm() -> None:
    get_classifier()


def _download(url: str) -> bytes:
    with httpx.Client(timeout=120, follow_redirects=True) as client:
        r = client.get(url)
        r.raise_for_status()
        return r.content


def _to_wav_16k_mono(data: bytes) -> torch.Tensor:
    """Decode arbitrary audio bytes (WebM/OGG/MP4/WAV) to a [1, N] 16 kHz mono tensor.

    ffmpeg does the decode + resample to 16 kHz mono; soundfile reads the WAV.
    This avoids needing a torchaudio audio backend in the slim image.
    """
    with tempfile.NamedTemporaryFile(suffix=".in") as fin, \
            tempfile.NamedTemporaryFile(suffix=".wav") as fout:
        fin.write(data)
        fin.flush()
        proc = subprocess.run(
            ["ffmpeg", "-y", "-i", fin.name, "-ac", "1", "-ar", str(TARGET_SR), "-f", "wav", fout.name],
            capture_output=True,
        )
        if proc.returncode != 0:
            raise HTTPException(status_code=400, detail="Could not decode audio")
        samples, _sr = sf.read(fout.name, dtype="float32")
    if samples.ndim > 1:
        samples = samples.mean(axis=1)
    return torch.from_numpy(samples).unsqueeze(0)  # [1, N], already 16 kHz mono


def _embed(wav: torch.Tensor) -> np.ndarray:
    """L2-normalized ECAPA embedding for a [1, N] 16 kHz mono waveform."""
    with torch.no_grad():
        emb = get_classifier().encode_batch(wav)  # [1, 1, 192]
    v = emb.squeeze().detach().cpu().numpy().astype(np.float32)
    n = float(np.linalg.norm(v))
    return v / n if n > 0 else v


def _normalize(vec) -> np.ndarray:
    a = np.asarray(vec, dtype=np.float32)
    n = float(np.linalg.norm(a))
    return a / n if n > 0 else a


class EnrollReq(BaseModel):
    audio_url: str


class Utterance(BaseModel):
    speaker: str
    start: int  # milliseconds
    end: int    # milliseconds


class Voiceprint(BaseModel):
    staff_user_id: str
    display_name: str
    embedding: list[float]
    model_version: str


class IdentifyReq(BaseModel):
    audio_url: str
    utterances: list[Utterance]
    voiceprints: list[Voiceprint]
    threshold: Optional[float] = None


@app.get("/healthz")
def healthz():
    return {"ok": True, "model_version": MODEL_VERSION}


@app.post("/enroll")
def enroll(req: EnrollReq):
    wav = _to_wav_16k_mono(_download(req.audio_url))
    if wav.shape[1] < int(MIN_SECONDS * TARGET_SR):
        raise HTTPException(status_code=400, detail="Enrollment clip too short")
    emb = _embed(wav)
    return {"embedding": emb.tolist(), "model_version": MODEL_VERSION}


@app.post("/identify")
def identify(req: IdentifyReq):
    threshold = req.threshold if req.threshold is not None else DEFAULT_THRESHOLD
    wav = _to_wav_16k_mono(_download(req.audio_url))
    total = wav.shape[1]
    max_samples = int(MAX_SECONDS_PER_SPEAKER * TARGET_SR)

    # Group each speaker's utterance audio (capped) into one clip.
    segs: dict[str, list[torch.Tensor]] = {}
    lengths: dict[str, int] = {}
    for u in req.utterances:
        s = max(0, int(u.start / 1000 * TARGET_SR))
        e = min(total, int(u.end / 1000 * TARGET_SR))
        if e <= s:
            continue
        if lengths.get(u.speaker, 0) >= max_samples:
            continue
        segs.setdefault(u.speaker, []).append(wav[:, s:e])
        lengths[u.speaker] = lengths.get(u.speaker, 0) + (e - s)

    # Only voiceprints from the same model version are comparable.
    refs = [
        (v.staff_user_id, v.display_name, _normalize(v.embedding))
        for v in req.voiceprints
        if v.model_version == MODEL_VERSION
    ]

    speakers: dict[str, Optional[dict]] = {}
    for spk, parts in segs.items():
        audio = torch.cat(parts, dim=1)[:, :max_samples]
        if audio.shape[1] < int(MIN_SECONDS * TARGET_SR):
            speakers[spk] = None
            continue
        emb = _embed(audio)
        best = None
        for staff_user_id, display_name, ref in refs:
            sim = float(np.dot(emb, ref))
            if best is None or sim > best["confidence"]:
                best = {
                    "staff_user_id": staff_user_id,
                    "display_name": display_name,
                    "confidence": round(sim, 4),
                }
        speakers[spk] = best if (best and best["confidence"] >= threshold) else None

    return {"model_version": MODEL_VERSION, "threshold": threshold, "speakers": speakers}
