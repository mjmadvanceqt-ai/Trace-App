import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { sampleRoutes } from "./samples";
import { todayKey, uid } from "./utils";
import type { CompletedActivity, PlanItem, RouteDraft } from "./types";

type TraceState = {
  displayName: string;
  stepGoal: number;
  stepsByDay: Record<string, number>;
  trackingSteps: boolean;
  notificationsOn: boolean;
  routes: RouteDraft[];
  activities: CompletedActivity[];
  plans: PlanItem[];
  liveCode: string | null;
  setDisplayName: (name: string) => void;
  setStepGoal: (n: number) => void;
  addSteps: (n: number, day?: string) => void;
  setTrackingSteps: (on: boolean) => void;
  setNotificationsOn: (on: boolean) => void;
  saveRoute: (route: RouteDraft) => void;
  deleteRoute: (id: string) => void;
  logActivity: (activity: CompletedActivity) => void;
  addPlan: (item: Omit<PlanItem, "id" | "done"> & { done?: boolean }) => void;
  togglePlan: (id: string) => void;
  deletePlan: (id: string) => void;
  setLiveCode: (code: string | null) => void;
  todaySteps: () => number;
};

const seedPlans = (): PlanItem[] => {
  const today = todayKey();
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const tomorrow = todayKey(d);
  return [
    {
      id: "plan_seed_run",
      kind: "run",
      title: "Marina 2k at 5:00",
      date: today,
      time: "18:30",
      notes: "Hold 5:00 /km. Ghost will tell you if you drift.",
      done: false,
      routeId: "sample_marina",
      targetPaceMinPerKm: 5,
      targetDistanceM: 2000,
    },
    {
      id: "plan_seed_steps",
      kind: "goal",
      title: "Hit 10,000 steps",
      date: today,
      done: false,
      targetSteps: 10000,
    },
    {
      id: "plan_seed_mobility",
      kind: "task",
      title: "Evening hip mobility, 12 min",
      date: today,
      time: "21:00",
      done: false,
    },
    {
      id: "plan_seed_tmr",
      kind: "run",
      title: "Admiralty Loop",
      date: tomorrow,
      time: "06:15",
      notes: "Easy aerobic. Do not chase the ghost.",
      done: false,
      routeId: "sample_lekki",
      targetPaceMinPerKm: 6,
    },
  ];
};

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useTraceStore = create<TraceState>()(
  persist(
    (set, get) => ({
      displayName: "Runner",
      stepGoal: 10000,
      stepsByDay: { [todayKey()]: 3180 },
      trackingSteps: true,
      notificationsOn: true,
      routes: sampleRoutes(),
      activities: [
        {
          id: "act_seed",
          routeId: "sample_marina",
          name: "Marina Stretch",
          kind: "run",
          startedAt: Date.now() - 86400000 * 1.2,
          durationSec: 612,
          distanceM: 2014,
          avgPaceMinPerKm: 5.06,
          targetPaceMinPerKm: 5,
          hitTarget: false,
          points: sampleRoutes()[0]!.points,
          splits: [],
        },
      ],
      plans: seedPlans(),
      liveCode: null,
      setDisplayName: (displayName) => set({ displayName }),
      setStepGoal: (stepGoal) => set({ stepGoal }),
      addSteps: (n, day = todayKey()) =>
        set((s) => ({
          stepsByDay: {
            ...s.stepsByDay,
            [day]: Math.max(0, (s.stepsByDay[day] ?? 0) + n),
          },
        })),
      setTrackingSteps: (trackingSteps) => set({ trackingSteps }),
      setNotificationsOn: (notificationsOn) => set({ notificationsOn }),
      saveRoute: (route) =>
        set((s) => ({
          routes: [route, ...s.routes.filter((r) => r.id !== route.id)],
        })),
      deleteRoute: (id) =>
        set((s) => ({ routes: s.routes.filter((r) => r.id !== id) })),
      logActivity: (activity) =>
        set((s) => ({ activities: [activity, ...s.activities] })),
      addPlan: (item) =>
        set((s) => ({
          plans: [{ ...item, id: uid("plan"), done: item.done ?? false }, ...s.plans],
        })),
      togglePlan: (id) =>
        set((s) => ({
          plans: s.plans.map((p) => (p.id === id ? { ...p, done: !p.done } : p)),
        })),
      deletePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
      setLiveCode: (liveCode) => set({ liveCode }),
      todaySteps: () => get().stepsByDay[todayKey()] ?? 0,
    }),
    {
      name: "the-trace-app",
      storage: createJSONStorage(() => (typeof window === "undefined" ? noopStorage : localStorage)),
    },
  ),
);

export function routeById(id: string | undefined): RouteDraft | undefined {
  if (!id) return undefined;
  return useTraceStore.getState().routes.find((r) => r.id === id);
}
