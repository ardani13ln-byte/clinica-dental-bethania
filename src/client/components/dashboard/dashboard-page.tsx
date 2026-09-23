import { useEffect, useState } from "react";
import {
  Calendar, DollarSign, Clock, TrendingUp, Users, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api";
import type { Appointment } from "@/types";

interface Summary {
  appointments_today: Appointment[];
  production_today: number;
  accounts_receivable: number;
  upcoming: Appointment[];
  total_patients: number;
  pending_lab_cases: number;
}

function formatQ(amount: number): string {
  return `Q ${amount.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-GT", { weekday: "short", day: "numeric", month: "short" });
}

const statusColors: Record<string, string> = {
  scheduled: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  arrived: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  completed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  no_show: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  in_chair: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

export function DashboardPage({ navigate }: { navigate: (to: string) => void }) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [apptRes, reportRes, upcomingRes] = await Promise.all([
          api<{ appointments: Appointment[] }>("GET", `/api/appointments?date=${today}`),
          api<Record<string, unknown>>("GET", "/api/reports/summary"),
          api<{ appointments: Appointment[] }>("GET", "/api/appointments?date=${today}"),
        ]);

        const todayAppts = (apptRes.appointments || []).filter(
          (a) => a.kind === "patient" && a.status !== "cancelled",
        );

        const report = reportRes as {
          production_today?: number;
          accounts_receivable?: number;
          total_patients?: number;
          pending_lab_cases?: number;
        };

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const upcoming = (upcomingRes.appointments || [])
          .filter((a) => a.kind === "patient" && a.status === "scheduled")
          .slice(0, 6);

        setData({
          appointments_today: todayAppts,
          production_today: report.production_today ?? 0,
          accounts_receivable: report.accounts_receivable ?? 0,
          upcoming,
          total_patients: report.total_patients ?? 0,
          pending_lab_cases: report.pending_lab_cases ?? 0,
        });
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-muted-foreground">Cargando…</div>;
  }
  if (!data) {
    return <div className="flex flex-1 items-center justify-center text-muted-foreground">Sin datos</div>;
  }

  const completed = data.appointments_today.filter((a) => a.status === "completed").length;
  const pending = data.appointments_today.filter((a) => a.status === "scheduled").length;

  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Calendar}
          label="Citas de hoy"
          value={String(data.appointments_today.length)}
          sub={`${completed} completadas · ${pending} pendientes`}
          color="text-sky-600 dark:text-sky-400"
        />
        <KpiCard
          icon={DollarSign}
          label="Producción de hoy"
          value={formatQ(data.production_today)}
          color="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={AlertCircle}
          label="Cuentas por cobrar"
          value={formatQ(data.accounts_receivable)}
          color="text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          icon={Users}
          label="Pacientes totales"
          value={String(data.total_patients)}
          sub={`${data.pending_lab_cases} casos de lab pendientes`}
          color="text-violet-600 dark:text-violet-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Citas de hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.appointments_today.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No hay citas programadas para hoy</p>
            ) : (
              <div className="space-y-2">
                {data.appointments_today
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((a) => (
                    <button
                      key={a.id}
                      onClick={() => navigate("/agenda")}
                      className="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors hover:bg-accent/50"
                    >
                      <span className="w-16 shrink-0 text-sm font-medium tabular-nums">
                        {formatTime(a.start_time)}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium">
                        {[a.patient_first_name, a.patient_last_name].filter(Boolean).join(" ") || a.title || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {a.treatment_name ?? ""}
                      </span>
                      <Badge className={`shrink-0 ${statusColors[a.status] ?? ""}`}>
                        {a.status}
                      </Badge>
                    </button>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Próximas citas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcoming.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No hay citas próximas</p>
            ) : (
              <div className="space-y-2">
                {data.upcoming.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigate("/agenda")}
                    className="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors hover:bg-accent/50"
                  >
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">
                      {formatDate(a.start_time)}
                    </span>
                    <span className="w-14 shrink-0 text-sm font-medium tabular-nums">
                      {formatTime(a.start_time)}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium">
                      {[a.patient_first_name, a.patient_last_name].filter(Boolean).join(" ") || a.title || "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {a.practitioner_name ?? ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
