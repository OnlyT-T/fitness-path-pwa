import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { achievedForGoal, goalProgress, type Goal, type Workout, type WorkoutSet } from "@/lib/fitness";

export function GoalProgressCard({
  goal,
  workouts,
  sets,
  onDelete,
}: {
  goal: Goal;
  workouts: Workout[];
  sets: WorkoutSet[];
  onDelete?: (id: string) => void;
}) {
  const achieved = achievedForGoal(goal, workouts, sets);
  const percent = goalProgress(goal, achieved);
  const label = goal.exercise ?? `${goal.category === "running" ? "Running" : "Workout"} · ${goal.metric}`;

  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold capitalize">{label}</p>
          <p className="text-xs text-muted-foreground">
            {goal.start_date} → {goal.end_date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">{percent}%</span>
          {onDelete ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete goal"
              onClick={() => onDelete(goal.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <Progress value={percent} className="mt-4 h-2.5" />

      <p className="mt-2 text-xs text-muted-foreground">
        {achieved.toFixed(goal.metric === "reps" ? 0 : 2)} / {Number(goal.target)} {goal.unit}
      </p>
    </div>
  );
}
