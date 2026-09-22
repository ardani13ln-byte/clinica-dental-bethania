import { useState, useEffect, useCallback } from "react";
import { api } from "../../api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Shield, Power, ScrollText, Users, Trash2, AlertTriangle,
  Info, XCircle, CheckCircle, Search,
} from "lucide-react";

type Module = {
  id: number; key: string; name: string; description: string;
  icon: string; enabled: boolean; sort_order: number;
};

type Log = {
  id: number; created_at: string; level: string; category: string;
  message: string; user_email: string | null; metadata: Record<string, unknown>;
};

type Profile = {
  id: string; email: string; role: string; full_name: string | null;
  active: boolean; created_at: string;
};

export function AdminPage() {
  const [tab, setTab] = useState<"modules" | "logs" | "users">("modules");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-6 py-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Administración del Sistema</h1>
        </div>
        <div className="mt-3 flex gap-1">
          <TabButton active={tab === "modules"} onClick={() => setTab("modules")} icon={<Power className="h-4 w-4" />} label="Módulos" />
          <TabButton active={tab === "logs"} onClick={() => setTab("logs")} icon={<ScrollText className="h-4 w-4" />} label="Logs del Sistema" />
          <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="h-4 w-4" />} label="Usuarios" />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {tab === "modules" && <ModulesTab />}
        {tab === "logs" && <LogsTab />}
        {tab === "users" && <UsersTab />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── MÓDULOS ──
function ModulesTab() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ modules: Module[] }>("GET", "/api/modules");
      setModules(data.modules || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (mod: Module) => {
    setToggling(mod.id);
    try {
      await api("PUT", `/api/modules/${mod.id}`, { enabled: !mod.enabled });
      setModules(prev => prev.map(m => m.id === mod.id ? { ...m, enabled: !m.enabled } : m));
    } catch (e) {
      console.error(e);
    }
    setToggling(null);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando módulos…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Habilita o deshabilita los módulos del sistema. Los módulos deshabilitados no aparecerán en el menú lateral.
      </p>
      {modules.map(mod => (
        <div key={mod.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${mod.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              <Power className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{mod.name}</p>
              <p className="text-xs text-muted-foreground">{mod.description}</p>
            </div>
          </div>
          <button
            onClick={() => toggle(mod)}
            disabled={toggling === mod.id}
            className={`relative h-6 w-11 rounded-full transition-colors ${mod.enabled ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${mod.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── LOGS ──
function LogsTab() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ logs: Log[] }>("GET", `/api/system-logs?level=${filter}&limit=200`);
      setLogs(data.logs || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? logs.filter(l => l.message.toLowerCase().includes(search.toLowerCase()) || (l.user_email || "").toLowerCase().includes(search.toLowerCase()))
    : logs;

  const deleteLog = async (id: number) => {
    try {
      await api("DELETE", `/api/system-logs/${id}`);
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (e) { console.error(e); }
  };

  const levelIcon = (level: string) => {
    switch (level) {
      case "error": case "critical": return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "info": return <Info className="h-4 w-4 text-blue-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const levelColor = (level: string) => {
    switch (level) {
      case "error": case "critical": return "border-l-red-500";
      case "warning": return "border-l-amber-500";
      case "info": return "border-l-blue-500";
      default: return "border-l-green-500";
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en logs…" className="pl-9" />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">Todos</option>
          <option value="info">Info</option>
          <option value="warning">Advertencia</option>
          <option value="error">Error</option>
          <option value="critical">Crítico</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando logs…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay logs para mostrar.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => (
            <div key={log.id} className={`rounded-lg border border-l-4 ${levelColor(log.level)} bg-card p-3`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                  {levelIcon(log.level)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{new Date(log.created_at).toLocaleString("es-GT")}</span>
                      <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-muted">{log.category}</span>
                      {log.user_email && <span className="text-xs text-muted-foreground">{log.user_email}</span>}
                    </div>
                    <p className="mt-1 text-sm">{log.message}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="mt-1 text-xs text-muted-foreground overflow-auto">{JSON.stringify(log.metadata, null, 2)}</pre>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteLog(log.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── USUARIOS ──
function UsersTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ profiles: Profile[] }>("GET", "/api/profiles");
      setProfiles(data.profiles || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateRole = async (id: string, role: string) => {
    try {
      await api("PUT", `/api/profiles/${id}`, { role });
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, role } : p));
    } catch (e) { console.error(e); }
  };

  const toggleActive = async (profile: Profile) => {
    try {
      await api("PUT", `/api/profiles/${profile.id}`, { active: !profile.active, role: profile.role, full_name: profile.full_name });
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, active: !p.active } : p));
    } catch (e) { console.error(e); }
  };

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      superadmin: "Super Admin", admin: "Administrador", dentist: "Dentista",
      hygienist: "Higienista", assistant: "Asistente", receptionist: "Recepcionista", user: "Usuario",
    };
    return labels[role] || role;
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando usuarios…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Gestiona los roles y permisos de los usuarios del sistema.
      </p>
      {profiles.map(p => (
        <div key={p.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${p.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{p.full_name || p.email}</p>
              <p className="text-xs text-muted-foreground">{p.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={p.role}
              onChange={(e) => updateRole(p.id, e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="superadmin">Super Admin</option>
              <option value="admin">Administrador</option>
              <option value="dentist">Dentista</option>
              <option value="hygienist">Higienista</option>
              <option value="assistant">Asistente</option>
              <option value="receptionist">Recepcionista</option>
              <option value="user">Usuario</option>
            </select>
            <button
              onClick={() => toggleActive(p)}
              className={`relative h-6 w-11 rounded-full transition-colors ${p.active ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${p.active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
