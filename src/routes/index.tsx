import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Dumbbell, Flame, Timer } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { GoalProgressCard } from "@/components/GoalProgressCard";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { formatDuration, periodRange } from "@/lib/fitness";
import { useFitness } from "@/lib/useFitness";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProgressFit — Running & Calisthenics Goal Tracker" },
      {
        name: "description",
        content:
          "ProgressFit helps you set running and calisthenics goals, log workouts and watch your progress bars fill up with daily, monthly and yearly analytics.",
      },
      { property: "og:title", content: "ProgressFit — Running & Calisthenics Goal Tracker" },
      {
        property: "og:description",
        content: "Set fitness goals, record workouts and track your progress over time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  useRequireAuth();
  const { user } = useAuth();
  const { goals, workouts, sets } = useFitness();

  const { start, end } = periodRange("day");
  const today = workouts.filter((w) => w.performed_at >= start && w.performed_at <= end);
  const todayDistance = today.reduce((s, w) => s + Number(w.distance_km), 0);
  const todayTime = today.reduce((s, w) => s + w.duration_seconds, 0);
  const todayCalories = today.reduce((s, w) => s + w.calories, 0);
  const activeGoals = goals.filter((g) => g.is_active);

  const name = user?.user_metadata?.["display_name"] ?? user?.email?.split("@")[0] ?? "athlete";

  return (
    <AppShell title={`Hello, ${name}`} subtitle="Ready to move?">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={Activity} label="Distance today" value={`${todayDistance.toFixed(2)} km`} />
        <StatTile icon={Timer} label="Active time" value={formatDuration(todayTime)} />
        <StatTile icon={Flame} label="Calories" value={`${todayCalories} kcal`} />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          to="/running"
          className="card-surface flex items-center justify-between p-6 transition-colors hover:border-primary"
        >
          <div>
            <p className="text-lg font-bold">Running</p>
            <p className="text-sm text-muted-foreground">Log a run, set a distance goal</p>
          </div>
          <Activity className="size-8 text-primary" />
        </Link>
        <Link
          to="/calisthenics"
          className="card-surface flex items-center justify-between p-6 transition-colors hover:border-accent"
        >
          <div>
            <p className="text-lg font-bold">Calisthenics</p>
            <p className="text-sm text-muted-foreground">Pull ups, push ups and more</p>
          </div>
          <Dumbbell className="size-8 text-accent" />
        </Link>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Active goals</h2>
        {activeGoals.length === 0 ? (
          <p className="card-surface p-6 text-sm text-muted-foreground">
            No goals yet. Start with a running or calisthenics goal.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeGoals.map((goal) => (
              <GoalProgressCard key={goal.id} goal={goal} workouts={workouts} sets={sets} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="card-surface p-5">
      <Icon className="size-5 text-primary" />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
