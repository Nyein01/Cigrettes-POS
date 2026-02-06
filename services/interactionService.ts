let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  return audioCtx;
};

export const interact = () => {
  // 1. Haptic Feedback (Vibration)
  // Short 8ms tick for a crisp feel on mobile devices
  if (navigator.vibrate) {
    navigator.vibrate(8);
  }

  // 2. Audio Feedback (Synthesized Click)
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Sound Design: A subtle "thock" sound
    // Start at 500Hz and drop rapidly to 100Hz
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
    
    // Volume envelope: sharp attack, quick decay
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.start(t);
    osc.stop(t + 0.1);
  } catch (e) {
    // Fail silently if audio is blocked or unsupported
  }
};
