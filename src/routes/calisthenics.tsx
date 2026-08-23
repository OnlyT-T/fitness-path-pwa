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
import { createCalisthenicsWorkout, createGoal, deleteGoal, deleteWorkout } from "@/lib/data";
import { CALISTHENICS_EXERCISES } from "@/lib/fitness";
import { useFitness, useRefreshFitness } from "@/lib/useFitness";

export const Route = createFileRoute("/calisthenics")({
  head: () => ({
    meta: [
      { title: "Calisthenics Goals & Reps Tracker — ProgressFit" },
      {
        name: "description",
        content:
          "Pick bodyweight exercises like pull ups and push ups, set target repetitions and track a progress bar for each exercise.",
      },
      { property: "og:title", content: "Calisthenics Goals & Reps Tracker — ProgressFit" },
      {
        property: "og:description",
        content: "Set rep targets per exercise and log every bodyweight session.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalisthenicsPage,
});

const todayISO = () => new Date().toISOString().slice(0, 10);

function CalisthenicsPage() {
  useRequireAuth();
  const { user } = useAuth();
  const { goals, workouts, sets } = useFitness();
  const refresh = useRefreshFitness();

  const calGoals = goals.filter((g) => g.category === "calisthenics");
  const calWorkouts = workouts.filter((w) => w.category === "calisthenics");

  const [exercise, setExercise] = useState<string>(CALISTHENICS_EXERCISES[0]);
  const [target, setTarget] = useState("100");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());

  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const saveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await createGoal(user.id, {
        category: "calisthenics",
        exercise,
        metric: "reps",
        target: Number(target),
        unit: "reps",
        start_date: startDate,
        end_date: endDate,
      });
      refresh();
      toast.success(`${exercise} goal created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save goal");
    }
  };

  const saveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const rows = Object.entries(entries)
      .map(([name, reps]) => ({ exercise: name, reps: Number(reps || 0) }))
      .filter((r) => r.reps > 0);
    if (rows.length < 1) {
      toast.error("Enter reps for at least one exercise");
      return;
    }
    try {
      await createCalisthenicsWorkout(user.id, date, rows, notes || null);
      setEntries({});
      setNotes("");
      refresh();
      toast.success("Workout recorded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save workout");
    }
  };

  return (
    <AppShell
      title="Calisthenics"
      subtitle="Choose exercises, set rep targets and record every session"
    >
      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="record">Record workout</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="mt-6 space-y-6">
          <form onSubmit={saveGoal} className="card-surface grid gap-4 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Exercise</Label>
              <Select value={exercise} onValueChange={setExercise}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALISTHENICS_EXERCISES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target reps</Label>
              <Input
                id="target"
                type="number"
                min="1"
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
              Add exercise goal
            </Button>
          </form>

          <div className="grid gap-4 md:grid-cols-2">
            {calGoals.map((goal) => (
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
          <form onSubmit={saveWorkout} className="card-surface grid gap-4 p-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            {CALISTHENICS_EXERCISES.map((name) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{name}</Label>
                <Input
                  id={name}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={entries[name] ?? ""}
                  onChange={(e) => setEntries({ ...entries, [name]: e.target.value })}
                />
              </div>
            ))}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button type="submit" className="sm:col-span-2">
              Save workout
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-3">
          {calWorkouts.length === 0 ? (
            <p className="card-surface p-6 text-sm text-muted-foreground">
              No workouts recorded yet.
            </p>
          ) : (
            calWorkouts.map((workout) => {
              const rows = sets.filter((s) => s.workout_id === workout.id);
              return (
                <div key={workout.id} className="card-surface p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{workout.performed_at}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await deleteWorkout(workout.id);
                        refresh();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {rows.map((r) => `${r.exercise}: ${r.reps}`).join(" · ") || "No sets"}
                  </p>
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
