import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Bell, ShieldCheck, Search } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { Badge } from "@/components/ui/badge";

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  activeLabel: string;
  children: ReactNode;
}

export function AdminLayout({ title, subtitle, activeLabel, children }: AdminLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <span className="grid size-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Dna />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">PGx Registry</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">Administration</p>
          </div>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Management
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.label === activeLabel;
            return (
              <Link
                key={item.label}
                to={item.to}
                params={item.section ? { section: item.section } : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 mt-2 rounded-md border border-sidebar-border p-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <ShieldCheck className="size-4 text-sidebar-primary" />
            Phase 1 build
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/60">
            Dashboard is live. Remaining modules are navigation placeholders.
          </p>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur md:px-6">
          <button
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">{title}</h1>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground md:text-[13px]">{subtitle}</p>
            )}
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground md:flex">
            <Search className="size-4" />
            <span className="text-xs">Search records</span>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Admin
          </Badge>
          <Bell className="size-5 text-muted-foreground" />
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function Dna() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M4 3c0 8 16 10 16 18M20 3c0 8-16 10-16 18" strokeLinecap="round" />
      <path d="M7.5 5.5h4M12.5 18.5h4M6 10h5M13 14h5" strokeLinecap="round" />
    </svg>
  );
}
