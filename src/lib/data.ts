import { supabase } from "@/integrations/supabase/client";
import type { Category, Goal, Metric, Workout, WorkoutSet } from "./fitness";

export async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function fetchWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .order("performed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Workout[];
}

export async function fetchSets(): Promise<WorkoutSet[]> {
  const { data, error } = await supabase.from("workout_sets").select("*");
  if (error) throw error;
  return (data ?? []) as WorkoutSet[];
}

export type NewGoal = {
  category: Category;
  exercise: string | null;
  metric: Metric;
  target: number;
  unit: string;
  start_date: string;
  end_date: string;
};

export async function createGoal(userId: string, goal: NewGoal) {
  const { error } = await supabase.from("goals").insert({ ...goal, user_id: userId });
  if (error) throw error;
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}

export async function createRun(
  userId: string,
  run: { performed_at: string; distance_km: number; duration_seconds: number; calories: number; notes: string | null },
) {
  const { error } = await supabase
    .from("workouts")
    .insert({ ...run, user_id: userId, category: "running" });
  if (error) throw error;
}

export async function createCalisthenicsWorkout(
  userId: string,
  performedAt: string,
  entries: { exercise: string; reps: number }[],
  notes: string | null,
) {
  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      category: "calisthenics",
      performed_at: performedAt,
      notes,
    })
    .select("id")
    .single();
  if (error) throw error;

  const rows = entries
    .filter((e) => e.reps > 0)
    .map((e, i) => ({
      workout_id: data.id,
      user_id: userId,
      exercise: e.exercise,
      reps: e.reps,
      set_number: i + 1,
    }));

  if (rows.length) {
    const { error: setError } = await supabase.from("workout_sets").insert(rows);
    if (setError) throw setError;
  }
}

export async function deleteWorkout(id: string) {
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, displayName: string) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, display_name: displayName, updated_at: new Date().toISOString() });
  if (error) throw error;
}
