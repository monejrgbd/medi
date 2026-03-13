let audioUnlocked = false;
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }
  return audioContext;
}

export function unlockAudio() {
  if (audioUnlocked) return;

  const handler = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
    audioUnlocked = true;
    document.removeEventListener("click", handler);
    document.removeEventListener("touchstart", handler);
  };

  document.addEventListener("click", handler);
  document.addEventListener("touchstart", handler);
}

function playTone(frequencies: number[], durationMs: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const durationSec = durationMs / 1000;

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.15;
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + (i + 1) * durationSec
    );
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * durationSec);
    osc.stop(now + (i + 1) * durationSec);
  });
}

export function playNotificationChime(soundEnabled: boolean) {
  if (!soundEnabled) return;
  playTone([440, 880], 100);
}

export function playUrgentChime(soundEnabled: boolean) {
  if (!soundEnabled) return;
  playTone([660, 880, 1100], 120);
}
