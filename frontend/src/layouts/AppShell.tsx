import {
  Activity,
  Bell,
  BookOpen,
  Bot,
  ChevronDown,
  CircleUserRound,
  Database,
  LayoutDashboard,
  Network,
  Search,
  Settings,
  ServerCog,
  TicketCheck,
  Workflow,
} from "lucide-react";
import { NavLink, Outlet, Link } from "react-router-dom";

import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  group: "operate" | "build";
  hint?: string;
}

const NAV: NavItem[] = [
  { to: "/how-it-works", label: "How it works", icon: BookOpen, group: "operate" },
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, group: "operate" },
  { to: "/runs", label: "Runs", icon: Workflow, group: "operate" },
  { to: "/environments", label: "Environments", icon: ServerCog, group: "operate" },
  { to: "/agents", label: "Agents", icon: Bot, group: "build", hint: "7" },
  { to: "/knowledge", label: "Knowledge", icon: Database, group: "build", hint: "7" },
  { to: "/tickets", label: "Ready for QE Workflow", icon: TicketCheck, group: "build" },
  { to: "/settings", label: "Settings", icon: Settings, group: "build" },
];

export function AppShell() {
  return (
    <div className="flex h-full min-h-screen flex-col bg-background">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface-1/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface-1/60">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">agenticqa</span>
            <span className="text-[10px] font-mono text-muted-foreground -mt-0.5">
              autonomous QE · v0.1
            </span>
          </div>
        </Link>
        <button
          type="button"
          className="hidden md:flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />
          <span className="font-medium text-foreground">production</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search agents, runs, tickets, artifacts…"
            className="h-8 w-full rounded-md border border-border bg-muted/30 pl-8 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1 text-2xs font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-2xs font-mono uppercase tracking-wide text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />
          7 agents online
        </span>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Activity"
        >
          <Activity className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md pl-1 pr-2 py-1 text-xs text-foreground hover:bg-accent transition-colors"
        >
          <CircleUserRound className="h-5 w-5 text-muted-foreground" />
          <span className="hidden sm:inline">isha.dudeja</span>
        </button>
      </div>
    </header>
  );
}

function Sidebar() {
  const operate = NAV.filter((n) => n.group === "operate");
  const build = NAV.filter((n) => n.group === "build");
  return (
    <nav className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-border bg-surface-1/40 px-3 py-4">
      <SidebarGroup label="Operate" items={operate} />
      <SidebarGroup label="Build" items={build} className="mt-5" />

      <div className="mt-auto space-y-2">
        <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Network className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-medium">Orchestrator</p>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">langgraph @ 0.2.34</p>
          <p className="flex items-center gap-1.5 text-2xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />
            <span className="font-mono">human-in-loop</span>
          </p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-xs font-medium">Backend</p>
          <p className="mt-1 flex items-center gap-1.5 text-2xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />
            <span className="font-mono">localhost:8000</span>
          </p>
        </div>
      </div>
    </nav>
  );
}

function SidebarGroup({
  label,
  items,
  className,
}: {
  label: string;
  items: NavItem[];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "h-4 w-4",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.hint && (
                    <span className="rounded bg-muted/60 px-1.5 py-px font-mono text-[10px] text-muted-foreground">
                      {item.hint}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Logo() {
  return (
    <div className="relative grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-primary via-primary/80 to-info shadow-[0_0_24px_-4px_hsl(var(--primary)/0.7)]">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-primary-foreground">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <path
          d="M3 12h3M18 12h3M12 3v3M12 18v3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
