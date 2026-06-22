import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsLayout,
});

const TABS = [
  { to: "/settings", label: "General", exact: true },
  { to: "/settings/captures", label: "Captures", exact: false },
  { to: "/settings/changelog", label: "Changelog", exact: false },
  { to: "/settings/about", label: "About", exact: false },
] as const;

function SettingsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure transcription, captures, and view release info."
      />

      <nav className="-mt-2 flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.to
            : pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-8">
        <Outlet />
      </div>
    </>
  );
}
