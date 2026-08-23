import { Link } from "@tanstack/react-router";
import { Activity, BarChart3, Dumbbell, Home, User } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/running", label: "Running", icon: Activity },
  { to: "/calisthenics", label: "Calisthenics", icon: Dumbbell },
  { to: "/summary", label: "Summary", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10 md:pl-64">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-sidebar px-4 py-6 md:flex">
        <Link to="/" className="mb-8 px-2 text-2xl font-black tracking-tight">
          <span className="text-gradient-energy">PROGRESS</span>FIT
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground [&.active]:bg-sidebar-accent [&.active]:text-primary"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <header className="px-5 pt-8 md:px-10">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </header>

      <main className="px-5 py-6 md:px-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-border bg-sidebar/95 px-2 py-2 backdrop-blur md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] text-muted-foreground transition-colors [&.active]:text-primary"
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
