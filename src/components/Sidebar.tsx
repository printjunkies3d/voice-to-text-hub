import { Link, useRouterState } from "@tanstack/react-router";
import { Mic, Upload, History, Settings, AudioLines, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dictate", icon: Mic },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/history", label: "History", icon: History },
  { to: "/models", label: "Models", icon: Boxes },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex h-full w-20 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar py-5">
      <Link
        to="/"
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30"
        aria-label="Voicebox STT home"
      >
        <AudioLines className="h-5 w-5" />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active =
            to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "group relative flex h-12 w-12 flex-col items-center justify-center rounded-xl text-sidebar-foreground/70 transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active &&
                  "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-0.5 text-[10px] font-medium tracking-wide">
                {label}
              </span>
              {active ? (
                <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r bg-primary" style={{ width: 3 }} />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto text-[10px] text-sidebar-foreground/40">
        v0.1
      </div>
    </aside>
  );
}
