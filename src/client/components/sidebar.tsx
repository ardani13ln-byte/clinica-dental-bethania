import { useState, useEffect } from "react";
import {
  Calendar, Users, Settings, FileBarChart2, FlaskConical,
  LogOut, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Route } from "@/hooks/use-router";
import { api } from "../api";

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2c-2 0-3.5 1-5 1S4 2.5 3 5c-.8 2-.5 4 .5 6 .8 1.5 1 3 1.5 5 .3 1.2 .8 3 2 3s1.5-1.5 2-3c.3-.8 .5-2 1-2s.7 1.2 1 2c.5 1.5 1 3 2 3s1.7-1.8 2-3c.5-2 .7-3.5 1.5-5 1-2 1.3-4 .5-6-1-2.5-2.5-4-4-4s-3 1-5 1z" />
    </svg>
  );
}

const iconMap: Record<string, typeof Calendar> = {
  calendar: Calendar, users: Users, "bar-chart": FileBarChart2,
  flask: FlaskConical, settings: Settings, shield: Shield,
};

interface NavItem {
  label: string;
  icon: typeof Calendar;
  path: string;
  match: (r: Route) => boolean;
}

const allItems: Record<string, NavItem> = {
  agenda:     { label: "Agenda",              icon: Calendar,       path: "/agenda",   match: (r) => r.name === "agenda" },
  patients:   { label: "Pacientes",           icon: Users,          path: "/patients", match: (r) => r.name === "patients" || r.name === "patient" },
  lab:        { label: "Casos de laboratorio",icon: FlaskConical,   path: "/lab",      match: (r) => r.name === "lab" },
  reports:    { label: "Reportes",            icon: FileBarChart2,  path: "/reports",  match: (r) => r.name === "reports" },
  settings:   { label: "Configuración",       icon: Settings,       path: "/settings", match: (r) => r.name === "settings" },
  admin:      { label: "Administración",      icon: Shield,         path: "/admin",    match: (r) => r.name === "admin" },
};

export function Sidebar({
  route,
  navigate,
  signOut,
  userEmail,
}: {
  route: Route;
  navigate: (to: string) => void;
  signOut: () => Promise<void>;
  userEmail: string;
}) {
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(new Set(Object.keys(allItems)));

  useEffect(() => {
    api<{ modules: { key: string; enabled: boolean }[] }>("GET", "/api/user-modules")
      .then((data) => {
        if (data.modules?.length) {
          setEnabledKeys(new Set(data.modules.filter(m => m.enabled).map(m => m.key)));
        }
      })
      .catch(() => {});
  }, []);

  const clinicKeys = ["agenda", "patients", "lab"];
  const adminKeys = ["reports", "settings", "admin"];

  const renderItem = (key: string) => {
    const item = allItems[key];
    if (!item || !enabledKeys.has(key)) return null;
    const active = item.match(route);
    return (
      <li key={key}>
        <button
          type="button"
          onClick={() => navigate(item.path)}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            active && "bg-sidebar-accent text-sidebar-accent-foreground",
            !active && "hover:bg-sidebar-accent/60",
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
        </button>
      </li>
    );
  };

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ToothIcon className="h-4 w-4" />
        </div>
        <span className="text-base font-semibold tracking-tight">Clínica Dental Bethania</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="mb-4">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Clínica</div>
          <ul className="space-y-0.5">
            {clinicKeys.map(renderItem)}
          </ul>
        </div>
        <div className="mb-4">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Administración</div>
          <ul className="space-y-0.5">
            {adminKeys.map(renderItem)}
          </ul>
        </div>
      </nav>

      <div className="border-t px-3 py-3">
        <div className="mb-2 truncate px-1 text-xs text-muted-foreground">{userEmail}</div>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
