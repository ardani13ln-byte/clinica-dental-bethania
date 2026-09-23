import { useState, useEffect, useCallback } from "react";
import { api } from "../../api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Shield, Power, ScrollText, Users, Trash2, AlertTriangle,
  Info, XCircle, CheckCircle, Search, UserPlus, ChevronDown, ChevronRight,
} from "lucide-react";

type Module = { key: string; name: string; icon: string; enabled: boolean; sort_order: number };
type Log = { id: number; created_at: string; level: string; category: string; message: string; user_email: string | null; metadata: Record<string, unknown> };
type Profile = { id: string; email: string; role: string; full_name: string | null; active: boolean; created_at: string };

export function AdminPage() {
  const [tab, setTab] = useState<"modules" | "logs" | "users">("users");
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-6 py-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Administración del Sistema</h1>
        </div>
        <div className="mt-3 flex gap-1">
          <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="h-4 w-4" />} label="Usuarios" />
          <TabBtn active={tab === "modules"} onClick={() => setTab("modules")} icon={<Power className="h-4 w-4" />} label="Módulos" />
          <TabBtn active={tab === "logs"} onClick={() => setTab("logs")} icon={<ScrollText className="h-4 w-4" />} label="Logs" />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {tab === "users" && <UsersTab />}
        {tab === "modules" && <ModulesTab />}
        {tab === "logs" && <LogsTab />}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
      {icon}{label}
    </button>
  );
}

function ErrorBox({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
      <p className="font-semibold">Error</p>
      <p className="mt-1">{error}</p>
      <Button onClick={onRetry} variant="outline" className="mt-3">Reintentar</Button>
    </div>
  );
}

// ── USUARIOS (con crear + modulos por usuario) ──
function UsersTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await api<{ profiles: Profile[] }>("GET", "/api/profiles");
      setProfiles(data.profiles || []);
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const updateRole = async (id: string, role: string) => {
    try {
      await api("PUT", `/api/profiles/${id}`, { role });
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, role } : p));
    } catch (e) { setError((e as Error).message); }
  };

  const toggleActive = async (p: Profile) => {
    try {
      await api("PUT", `/api/profiles/${p.id}`, { active: !p.active, role: p.role, full_name: p.full_name });
      setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x));
    } catch (e) { setError((e as Error).message); }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (error) return <ErrorBox error={error} onRetry={load} />;

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Gestiona usuarios, roles y módulos asignados a cada uno.</p>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <UserPlus className="h-4 w-4 mr-1" /> Crear usuario
        </Button>
      </div>

      {showCreate && (
        <CreateUserForm
          onDone={() => { setShowCreate(false); load(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {profiles.map(p => (
        <div key={p.id}>
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
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
              <select value={p.role} onChange={(e) => updateRole(p.id, e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">
                <option value="superadmin">Super Admin</option>
                <option value="admin">Administrador</option>
                <option value="dentist">Dentista</option>
                <option value="hygienist">Higienista</option>
                <option value="assistant">Asistente</option>
                <option value="receptionist">Recepcionista</option>
                <option value="user">Usuario</option>
              </select>
              <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="rounded-md border p-2 hover:bg-muted">
                {expanded === p.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <button onClick={() => toggleActive(p)} className={`relative h-6 w-11 rounded-full transition-colors ${p.active ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${p.active ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
          {expanded === p.id && <UserModules userId={p.id} userName={p.full_name || p.email} />}
        </div>
      ))}
    </div>
  );
}

function CreateUserForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("dentist");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || "Error");
      onDone();
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-card p-4 space-y-3 mb-4">
      <h3 className="font-semibold">Crear nuevo usuario</h3>
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input placeholder="correo@clinica.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="dentist">Dentista</option>
          <option value="admin">Administrador</option>
          <option value="hygienist">Higienista</option>
          <option value="assistant">Asistente</option>
          <option value="receptionist">Recepcionista</option>
          <option value="user">Usuario</option>
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Creando…" : "Crear"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

function UserModules({ userId, userName }: { userId: string; userName: string }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    api<{ modules: Module[] }>("GET", `/api/user-modules/${userId}`)
      .then(d => setModules(d.modules || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const toggle = async (mod: Module) => {
    setToggling(mod.key);
    try {
      await api("PUT", "/api/user-modules", { user_id: userId, module_key: mod.key, enabled: !mod.enabled });
      setModules(prev => prev.map(m => m.key === mod.key ? { ...m, enabled: !m.enabled } : m));
    } catch (e) { console.error(e); }
    setToggling(null);
  };

  if (loading) return <p className="text-xs text-muted-foreground py-2 pl-4">Cargando módulos…</p>;

  return (
    <div className="ml-4 mb-2 rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">Módulos de {userName}</p>
      <div className="grid grid-cols-2 gap-2">
        {modules.map(mod => (
          <div key={mod.key} className="flex items-center justify-between rounded-md bg-background px-3 py-2">
            <span className="text-sm">{mod.name}</span>
            <button onClick={() => toggle(mod)} disabled={toggling === mod.key} className={`relative h-5 w-9 rounded-full transition-colors ${mod.enabled ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${mod.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MÓDULOS (catálogo global) ──
function ModulesTab() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ modules: Module[] }>("GET", "/api/modules")
      .then(d => setModules(d.modules || []))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (error) return <ErrorBox error={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <p className="text-sm text-muted-foreground mb-4">Catálogo de módulos del sistema. Asigna módulos a cada usuario desde la pestaña "Usuarios".</p>
      {modules.map(mod => (
        <div key={mod.key} className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Power className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{mod.name}</p>
              <p className="text-xs text-muted-foreground">Clave: {mod.key}</p>
            </div>
          </div>
          <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Activo</span>
        </div>
      ))}
    </div>
  );
}

// ── LOGS ──
function LogsTab() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await api<{ logs: Log[] }>("GET", `/api/system-logs?level=${filter}&limit=200`);
      setLogs(data.logs || []);
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const filtered = search ? logs.filter(l => l.message.toLowerCase().includes(search.toLowerCase()) || (l.user_email || "").includes(search.toLowerCase())) : logs;
  const deleteLog = async (id: number) => {
    try { await api("DELETE", `/api/system-logs/${id}`); setLogs(prev => prev.filter(l => l.id !== id)); } catch (e) { setError((e as Error).message); }
  };

  const levelIcon = (lv: string) => {
    if (lv === "error" || lv === "critical") return <XCircle className="h-4 w-4 text-red-500" />;
    if (lv === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    if (lv === "info") return <Info className="h-4 w-4 text-blue-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };
  const levelColor = (lv: string) => lv === "error" || lv === "critical" ? "border-l-red-500" : lv === "warning" ? "border-l-amber-500" : "border-l-blue-500";

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" className="pl-9" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="all">Todos</option><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option><option value="critical">Crítico</option>
        </select>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Cargando…</p>
       : error ? <ErrorBox error={error} onRetry={load} />
       : filtered.length === 0 ? <p className="text-sm text-muted-foreground">Sin logs.</p>
       : <div className="space-y-2">{filtered.map(log => (
           <div key={log.id} className={`rounded-lg border border-l-4 ${levelColor(log.level)} bg-card p-3`}>
             <div className="flex items-start justify-between gap-3">
               <div className="flex items-start gap-2 flex-1">
                 {levelIcon(log.level)}
                 <div className="flex-1">
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-mono text-muted-foreground">{new Date(log.created_at).toLocaleString("es-GT")}</span>
                     <span className="rounded px-1.5 py-0.5 text-xs bg-muted">{log.category}</span>
                     {log.user_email && <span className="text-xs text-muted-foreground">{log.user_email}</span>}
                   </div>
                   <p className="mt-1 text-sm">{log.message}</p>
                 </div>
               </div>
               <button onClick={() => deleteLog(log.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
             </div>
           </div>
         ))}</div>}
    </div>
  );
}
