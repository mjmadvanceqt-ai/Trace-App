import type { LiveFix } from "./types";
import { liveChannelName } from "./share";

type LivePacket = {
  v: 1;
  runner: string;
  routeName?: string;
  points?: { lat: number; lng: number }[];
  pace?: number;
  fix: LiveFix;
};

const memory = new Map<string, LivePacket>();

export function publishLive(code: string, packet: LivePacket) {
  const key = code.toUpperCase();
  memory.set(key, packet);
  try {
    localStorage.setItem(liveChannelName(key), JSON.stringify(packet));
  } catch {
    /* quota */
  }
  try {
    const ch = new BroadcastChannel(liveChannelName(key));
    ch.postMessage(packet);
    ch.close();
  } catch {
    /* unsupported */
  }
}

export function readLive(code: string): LivePacket | null {
  const key = code.toUpperCase();
  const mem = memory.get(key);
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(liveChannelName(key));
    if (!raw) return null;
    return JSON.parse(raw) as LivePacket;
  } catch {
    return null;
  }
}

export function subscribeLive(code: string, onPacket: (p: LivePacket) => void): () => void {
  const key = code.toUpperCase();
  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(liveChannelName(key));
    ch.onmessage = (ev) => {
      if (ev.data?.v === 1) onPacket(ev.data as LivePacket);
    };
  } catch {
    ch = null;
  }
  const t = window.setInterval(() => {
    const p = readLive(key);
    if (p) onPacket(p);
  }, 1200);
  const first = readLive(key);
  if (first) onPacket(first);
  return () => {
    window.clearInterval(t);
    try {
      ch?.close();
    } catch {
      /* ignore */
    }
  };
}

export type { LivePacket };
