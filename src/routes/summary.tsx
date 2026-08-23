import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/AppShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from "@/lib/auth";
import {
  achievedForGoal,
  formatDuration,
  goalProgress,
  periodRange,
  type Workout,
} from "@/lib/fitness";
import { useFitness } from "@/lib/useFitness";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Progress Summary & Analytics — ProgressFit" },
      {
        name: "description",
        content:
          "Daily, monthly and yearly workout analytics: total distance, repetitions, most active day, best performances and goal achievement rate.",
      },
      { property: "og:title", content: "Progress Summary & Analytics — ProgressFit" },
      {
        property: "og:description",
        content: "See your workout trends and achievement rate across day, month and year.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  useRequireAuth();
  const { goals, workouts, sets } = useFitness();
  const [period, setPeriod] = useState<"day" | "month" | "year">("month");

  const { start, end } = periodRange(period);
  const scoped = workouts.filter((w) => w.performed_at >= start && w.performed_at <= end);
  const scopedIds = new Set(scoped.map((w) => w.id));
  const scopedSets = sets.filter((s) => scopedIds.has(s.workout_id));

  const totalDistance = scoped.reduce((s, w) => s + Number(w.distance_km), 0);
  const totalTime = scoped.reduce((s, w) => s + w.duration_seconds, 0);
  const totalCalories = scoped.reduce((s, w) => s + w.calories, 0);
  const totalReps = scopedSets.reduce((s, r) => s + r.reps, 0);

  const mostActiveDay = useMemo(() => byDay(scoped), [scoped]);

  const bestPerExercise = useMemo(() => {
    const best: Record<string, number> = {};
    for (const row of scopedSets) {
      best[row.exercise] = Math.max(best[row.exercise] ?? 0, row.reps);
    }
    return Object.entries(best);
  }, [scopedSets]);

  const achievementRate = useMemo(() => {
    const active = goals.filter((g) => g.is_active);
    if (!active.length) return 0;
    const sum = active.reduce(
      (acc, goal) => acc + goalProgress(goal, achievedForGoal(goal, workouts, sets)),
      0,
    );
    return Math.round(sum / active.length);
  }, [goals, workouts, sets]);

  const chartData = useMemo(() => {
    const map = new Map<string, { day: string; distance: number; reps: number }>();
    for (const workout of scoped) {
      const entry = map.get(workout.performed_at) ?? {
        day: workout.performed_at.slice(5),
        distance: 0,
        reps: 0,
      };
      entry.distance += Number(workout.distance_km);
      entry.reps += sets
        .filter((s) => s.workout_id === workout.id)
        .reduce((sum, s) => sum + s.reps, 0);
      map.set(workout.performed_at, entry);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [scoped, sets]);

  return (
    <AppShell title="Summary" subtitle="Statistics, trends and highlights across your training">
      <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
        <TabsList>
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total workouts" value={String(scoped.length)} />
        <Metric label="Total distance" value={`${totalDistance.toFixed(2)} km`} />
        <Metric label="Total reps" value={String(totalReps)} />
        <Metric label="Total time" value={formatDuration(totalTime)} />
        <Metric label="Calories" value={`${totalCalories} kcal`} />
        <Metric label="Most active day" value={mostActiveDay ?? "--"} />
        <Metric label="Goal achievement" value={`${achievementRate}%`} />
        <Metric
          label="Best performance"
          value={
            bestPerExercise.length
              ? bestPerExercise
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 1)
                  .map(([name, reps]) => `${name} · ${reps}`)[0]!
              : "--"
          }
        />
      </section>

      <section className="card-surface mt-6 p-5">
        <h2 className="mb-4 text-sm font-semibold">Distance per day (km)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                }}
              />
              <Bar dataKey="distance" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card-surface mt-6 p-5">
        <h2 className="mb-4 text-sm font-semibold">Repetitions trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="reps"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {bestPerExercise.length ? (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Best set per exercise</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {bestPerExercise.map(([name, reps]) => (
              <div key={name} className="card-surface p-4">
                <p className="text-xs text-muted-foreground">{name}</p>
                <p className="text-xl font-bold text-primary">{reps} reps</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

function byDay(workouts: Workout[]) {
  const counts = new Map<string, number>();
  for (const w of workouts) counts.set(w.performed_at, (counts.get(w.performed_at) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0]![0] : null;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-bold">{value}</p>
    </div>
  );
}
