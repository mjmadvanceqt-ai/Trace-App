import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarCheck, Footprints, House, Play, Route } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: House },
  { to: "/trace", label: "Trace", icon: Route },
  { to: "/run", label: "Run", icon: Play },
  { to: "/steps", label: "Steps", icon: Footprints },
  { to: "/plan", label: "Plan", icon: CalendarCheck },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideNav = pathname === "/run";

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col bg-bg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-sage)_8%,transparent),transparent)]" />
      <div className={cn("relative flex-1", hideNav ? "pb-0" : "pb-24")}>{children}</div>
      {!hideNav && (
        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
          <ul className="grid grid-cols-5 px-1 pt-1">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              const isRun = item.to === "/run";
              return (
                <li key={item.to} className="flex justify-center">
                  <Link
                    to={item.to}
                    className={cn(
                      "flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 px-2 py-2 text-[10px] tracking-wide",
                      active ? "text-fg" : "text-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-md transition-[background-color,color] duration-150",
                        isRun && "bg-primary text-primary-fg",
                        !isRun && active && "bg-surface-2",
                      )}
                    >
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className={cn(isRun && "text-fg")}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
