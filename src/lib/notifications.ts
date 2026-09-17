const APP = "The Trace App";

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function notify(title: string, body: string, tag?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(`${APP} · ${title}`, {
      body,
      tag: tag ?? "trace",
      silent: false,
    });
  } catch {
    /* ignore — some browsers require a service worker for Notification */
  }
}

export function pulseDevice() {
  try {
    navigator.vibrate?.([180, 80, 180]);
  } catch {
    /* ignore */
  }
}

let audioCtx: AudioContext | null = null;

export function alertTone() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    audioCtx ??= new AC();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    /* ignore */
  }
}
