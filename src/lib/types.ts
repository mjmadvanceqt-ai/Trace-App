export type LatLng = { lat: number; lng: number };

export type RouteDraft = {
  id: string;
  name: string;
  points: LatLng[];
  distanceM: number;
  targetPaceMinPerKm: number;
  createdAt: number;
  notes?: string;
};

export type ActivityKind = "run" | "walk";

export type CompletedActivity = {
  id: string;
  routeId?: string;
  name: string;
  kind: ActivityKind;
  startedAt: number;
  durationSec: number;
  distanceM: number;
  avgPaceMinPerKm: number;
  targetPaceMinPerKm?: number;
  hitTarget: boolean;
  points: LatLng[];
  splits: number[];
};

export type PlanKind = "run" | "task" | "goal";

export type PlanItem = {
  id: string;
  kind: PlanKind;
  title: string;
  date: string;
  time?: string;
  notes?: string;
  done: boolean;
  routeId?: string;
  targetPaceMinPerKm?: number;
  targetSteps?: number;
  targetDistanceM?: number;
};

export type LiveFix = {
  lat: number;
  lng: number;
  heading?: number;
  speedMps?: number;
  at: number;
  distanceM: number;
  elapsedSec: number;
};

export type PaceStatus = "on_pace" | "ahead" | "behind" | "warmup" | "finished";

export type PaceEval = {
  status: PaceStatus;
  currentPace: number;
  requiredPace: number;
  targetPace: number;
  projectedFinishSec: number;
  targetDurationSec: number;
  remainingM: number;
  remainingSec: number;
  ghostDistanceM: number;
  message: string;
};
