import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { fetchProfile, updateProfile } from "@/lib/data";
import { useFitness } from "@/lib/useFitness";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile & Settings — ProgressFit" },
      {
        name: "description",
        content:
          "Edit your ProgressFit display name, review lifetime training totals and manage application settings.",
      },
      { property: "og:title", content: "Your Profile & Settings — ProgressFit" },
      {
        property: "og:description",
        content: "Manage your ProgressFit account, preferences and lifetime stats.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  useRequireAuth();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { workouts, sets, goals } = useFitness();
  const [displayName, setDisplayName] = useState("");
  const [metricUnits, setMetricUnits] = useState(true);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (profile.data?.display_name) setDisplayName(profile.data.display_name);
  }, [profile.data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateProfile(user.id, displayName);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile");
    }
  };

  const totalDistance = workouts.reduce((s, w) => s + Number(w.distance_km), 0);
  const totalReps = sets.reduce((s, r) => s + r.reps, 0);

  return (
    <AppShell title="Profile" subtitle={user?.email ?? ""}>
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="card-surface space-y-4 p-6">
          <h2 className="text-lg font-semibold">Edit profile</h2>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <Button type="submit">Save changes</Button>
        </form>

        <div className="card-surface space-y-4 p-6">
          <h2 className="text-lg font-semibold">Settings</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Metric units</p>
              <p className="text-xs text-muted-foreground">Kilometres and minutes per km</p>
            </div>
            <Switch checked={metricUnits} onCheckedChange={setMetricUnits} />
          </div>
          <Button
            variant="secondary"
            onClick={async () => {
              await signOut();
              void navigate({ to: "/auth" });
            }}
          >
            Sign out
          </Button>
        </div>

        <div className="card-surface grid grid-cols-3 gap-4 p-6 lg:col-span-2">
          <Stat label="Workouts" value={String(workouts.length)} />
          <Stat label="Total distance" value={`${totalDistance.toFixed(1)} km`} />
          <Stat label="Total reps" value={String(totalReps)} />
          <Stat label="Goals created" value={String(goals.length)} />
          <Stat label="Active goals" value={String(goals.filter((g) => g.is_active).length)} />
          <Stat label="Sets logged" value={String(sets.length)} />
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
