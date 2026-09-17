import type { PaceEval, PaceStatus } from "./types";

const WARMUP_M = 80;
const BEHIND_BUFFER_SEC = 8;
const AHEAD_BUFFER_SEC = 25;

export function targetDurationSec(distanceM: number, paceMinPerKm: number): number {
  return (distanceM / 1000) * paceMinPerKm * 60;
}

export function paceFrom(distanceM: number, elapsedSec: number): number {
  if (distanceM < 8 || elapsedSec <= 0) return 0;
  return elapsedSec / 60 / (distanceM / 1000);
}

export function evaluatePace(opts: {
  distanceM: number;
  elapsedSec: number;
  routeDistanceM: number;
  targetPaceMinPerKm: number;
}): PaceEval {
  const { distanceM, elapsedSec, routeDistanceM, targetPaceMinPerKm } = opts;
  const targetDuration = targetDurationSec(routeDistanceM, targetPaceMinPerKm);
  const remainingM = Math.max(0, routeDistanceM - distanceM);
  const remainingSec = targetDuration - elapsedSec;
  const currentPace = paceFrom(distanceM, elapsedSec);
  const ghostDistanceM = Math.min(
    routeDistanceM,
    (elapsedSec / 60 / targetPaceMinPerKm) * 1000,
  );

  if (routeDistanceM > 0 && remainingM < 8) {
    const hit = elapsedSec <= targetDuration + BEHIND_BUFFER_SEC;
    return {
      status: "finished",
      currentPace,
      requiredPace: 0,
      targetPace: targetPaceMinPerKm,
      projectedFinishSec: elapsedSec,
      targetDurationSec: targetDuration,
      remainingM: 0,
      remainingSec: Math.max(0, remainingSec),
      ghostDistanceM,
      message: hit
        ? "Target locked. You held the pace."
        : "Finished — you missed the time target.",
    };
  }

  if (distanceM < WARMUP_M) {
    return {
      status: "warmup",
      currentPace,
      requiredPace: targetPaceMinPerKm,
      targetPace: targetPaceMinPerKm,
      projectedFinishSec: targetDuration,
      targetDurationSec: targetDuration,
      remainingM,
      remainingSec,
      ghostDistanceM,
      message: `Settle in. Target ${formatInternal(targetPaceMinPerKm)} /km.`,
    };
  }

  const requiredPace =
    remainingSec > 0 && remainingM > 0 ? remainingSec / 60 / (remainingM / 1000) : 0;

  const projectedFinishSec =
    currentPace > 0 ? currentPace * (routeDistanceM / 1000) * 60 : targetDuration;

  let status: PaceStatus = "on_pace";
  let message = "On pace. Hold this effort.";

  if (remainingSec <= 0 && remainingM > 0) {
    status = "behind";
    message = "Time is gone and distance remains. Lift the pace now.";
  } else if (projectedFinishSec > targetDuration + BEHIND_BUFFER_SEC) {
    status = "behind";
    message = `Increase pace to ${formatInternal(requiredPace)} /km to hit your goal.`;
  } else if (projectedFinishSec + AHEAD_BUFFER_SEC < targetDuration) {
    status = "ahead";
    message = "Ahead of schedule. Keep it honest.";
  }

  return {
    status,
    currentPace,
    requiredPace,
    targetPace: targetPaceMinPerKm,
    projectedFinishSec,
    targetDurationSec: targetDuration,
    remainingM,
    remainingSec,
    ghostDistanceM,
    message,
  };
}

function formatInternal(minPerKm: number): string {
  if (!Number.isFinite(minPerKm) || minPerKm <= 0 || minPerKm > 60) return "—";
  const totalSec = Math.round(minPerKm * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
