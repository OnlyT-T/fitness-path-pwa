import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { GoalProgressCard } from "@/components/GoalProgressCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { createGoal, createRun, deleteGoal, deleteWorkout } from "@/lib/data";
import { formatDuration, formatPace, METRIC_UNITS, type Metric } from "@/lib/fitness";
import { useFitness, useRefreshFitness } from "@/lib/useFitness";

export const Route = createFileRoute("/running")({
  head: () => ({
    meta: [
      { title: "Running Goals & Run Log — ProgressFit" },
      {
        name: "description",
        content:
          "Set running goals for distance, time or pace, record each run and watch your progress bar update automatically.",
      },
      { property: "og:title", content: "Running Goals & Run Log — ProgressFit" },
      {
        property: "og:description",
        content: "Record runs and track distance, duration and pace goals in ProgressFit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RunningPage,
});

const todayISO = () => new Date().toISOString().slice(0, 10);

function RunningPage() {
  useRequireAuth();
  const { user } = useAuth();
  const { goals, workouts, sets } = useFitness();
  const refresh = useRefreshFitness();

  const runningGoals = goals.filter((g) => g.category === "running");
  const runs = workouts.filter((w) => w.category === "running");

  const [metric, setMetric] = useState<Metric>("distance");
  const [target, setTarget] = useState("50");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());

  const [date, setDate] = useState(todayISO());
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");

  const saveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await createGoal(user.id, {
        category: "running",
        exercise: null,
        metric,
        target: Number(target),
        unit: METRIC_UNITS[metric],
        start_date: startDate,
        end_date: endDate,
      });
      refresh();
      toast.success("Running goal created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save goal");
    }
  };

  const saveRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await createRun(user.id, {
        performed_at: date,
        distance_km: Number(distance || 0),
        duration_seconds: Number(minutes || 0) * 60 + Number(seconds || 0),
        calories: Number(calories || 0),
        notes: notes || null,
      });
      setDistance("");
      setMinutes("");
      setSeconds("");
      setCalories("");
      setNotes("");
      refresh();
      toast.success("Run recorded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save run");
    }
  };

  return (
    <AppShell title="Running" subtitle="Set a KPI, record your runs, watch the progress bar fill">
      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="record">Record run</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="mt-6 space-y-6">
          <form onSubmit={saveGoal} className="card-surface grid gap-4 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>KPI</Label>
              <Select value={metric} onValueChange={(v) => setMetric(v as Metric)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance (km)</SelectItem>
                  <SelectItem value="duration">Time (min)</SelectItem>
                  <SelectItem value="pace">Pace (min/km)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target ({METRIC_UNITS[metric]})</Label>
              <Input
                id="target"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">From</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">To</Label>
              <Input
                id="end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button type="submit" className="sm:col-span-2">
              Create goal
            </Button>
          </form>

          <div className="grid gap-4 md:grid-cols-2">
            {runningGoals.map((goal) => (
              <GoalProgressCard
                key={goal.id}
                goal={goal}
                workouts={workouts}
                sets={sets}
                onDelete={async (id) => {
                  await deleteGoal(id);
                  refresh();
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="record" className="mt-6">
          <form onSubmit={saveRun} className="card-surface grid gap-4 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="distance">Distance (km)</Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                min="0"
                required
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seconds">Seconds</Label>
              <Input
                id="seconds"
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button type="submit" className="sm:col-span-2">
              Save run
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-3">
          {runs.length === 0 ? (
            <p className="card-surface p-6 text-sm text-muted-foreground">No runs recorded yet.</p>
          ) : (
            runs.map((run) => (
              <div key={run.id} className="card-surface flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{Number(run.distance_km).toFixed(2)} km</p>
                  <p className="text-xs text-muted-foreground">
                    {run.performed_at} · {formatDuration(run.duration_seconds)} ·{" "}
                    {formatPace(Number(run.distance_km), run.duration_seconds)}/km
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await deleteWorkout(run.id);
                    refresh();
                  }}
                >
                  Delete
                </Button>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
