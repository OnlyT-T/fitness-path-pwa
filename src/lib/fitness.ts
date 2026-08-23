export type Category = "running" | "calisthenics";
export type Metric = "distance" | "duration" | "pace" | "reps";

export type Goal = {
  id: string;
  user_id: string;
  category: Category;
  exercise: string | null;
  metric: Metric;
  target: number;
  unit: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

export type Workout = {
  id: string;
  user_id: string;
  category: Category;
  performed_at: string;
  distance_km: number;
  duration_seconds: number;
  calories: number;
  notes: string | null;
  created_at: string;
};

export type WorkoutSet = {
  id: string;
  workout_id: string;
  user_id: string;
  exercise: string;
  reps: number;
  set_number: number;
  created_at: string;
};

export const CALISTHENICS_EXERCISES = [
  "Pull Ups",
  "Push Ups",
  "Squats",
  "Dips",
  "Plank (sec)",
  "Burpees",
] as const;

export const METRIC_UNITS: Record<Metric, string> = {
  distance: "km",
  duration: "min",
  pace: "min/km",
  reps: "reps",
};

export function inRange(dateStr: string, start: string, end: string) {
  return dateStr >= start && dateStr <= end;
}

/** Achieved value for a goal, computed from recorded workouts. */
export function achievedForGoal(goal: Goal, workouts: Workout[], sets: WorkoutSet[]): number {
  const scoped = workouts.filter(
    (w) => w.category === goal.category && inRange(w.performed_at, goal.start_date, goal.end_date),
  );

  if (goal.category === "running") {
    if (goal.metric === "distance") {
      return scoped.reduce((sum, w) => sum + Number(w.distance_km), 0);
    }
    if (goal.metric === "duration") {
      return scoped.reduce((sum, w) => sum + w.duration_seconds, 0) / 60;
    }
    // pace: best (lowest) average pace across recorded runs
    const paces = scoped
      .filter((w) => Number(w.distance_km) > 0 && w.duration_seconds > 0)
      .map((w) => w.duration_seconds / 60 / Number(w.distance_km));
    return paces.length ? Math.min(...paces) : 0;
  }

  const workoutIds = new Set(scoped.map((w) => w.id));
  return sets
    .filter((s) => workoutIds.has(s.workout_id) && s.exercise === goal.exercise)
    .reduce((sum, s) => sum + s.reps, 0);
}

/** Progress toward a goal as a 0-100 percentage. Lower-is-better for pace. */
export function goalProgress(goal: Goal, achieved: number): number {
  if (goal.target <= 0) return 0;
  const ratio =
    goal.metric === "pace"
      ? achieved > 0
        ? Number(goal.target) / achieved
        : 0
      : achieved / Number(goal.target);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatPace(distanceKm: number, seconds: number) {
  if (!distanceKm || !seconds) return "--";
  const paceMin = seconds / 60 / distanceKm;
  const m = Math.floor(paceMin);
  const s = Math.round((paceMin - m) * 60);
  return `${m}'${s.toString().padStart(2, "0")}"`;
}

export function periodRange(period: "day" | "month" | "year", ref = new Date()) {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (period === "day") return { start: iso(ref), end: iso(ref) };
  if (period === "month") {
    return {
      start: iso(new Date(ref.getFullYear(), ref.getMonth(), 1)),
      end: iso(new Date(ref.getFullYear(), ref.getMonth() + 1, 0)),
    };
  }
  return {
    start: iso(new Date(ref.getFullYear(), 0, 1)),
    end: iso(new Date(ref.getFullYear(), 11, 31)),
  };
}
