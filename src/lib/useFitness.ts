import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./auth";
import { fetchGoals, fetchSets, fetchWorkouts } from "./data";

export function useFitness() {
  const { user } = useAuth();
  const enabled = !!user;

  const goals = useQuery({ queryKey: ["goals", user?.id], queryFn: fetchGoals, enabled });
  const workouts = useQuery({ queryKey: ["workouts", user?.id], queryFn: fetchWorkouts, enabled });
  const sets = useQuery({ queryKey: ["sets", user?.id], queryFn: fetchSets, enabled });

  return {
    goals: goals.data ?? [],
    workouts: workouts.data ?? [],
    sets: sets.data ?? [],
    isLoading: goals.isLoading || workouts.isLoading || sets.isLoading,
  };
}

export function useRefreshFitness() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["goals"] });
    void queryClient.invalidateQueries({ queryKey: ["workouts"] });
    void queryClient.invalidateQueries({ queryKey: ["sets"] });
  };
}
