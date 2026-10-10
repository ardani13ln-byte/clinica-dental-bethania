import { useEffect, useState } from "react";
import {
  CalendarDays, CalendarRange, TrendingUp, Wallet, AlertTriangle, FlaskConical, Users, ListChecks, Clock, MessageCircle,
} from "lucide-react";
import { api } from "@/api";
import { useApp } from "@/context";
import { setSeccionTour } from "@/components/tour/uso-tour";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReportsSummary, Appointment } from "@/types";

interface Aceptacion {
  total: number;
  por_estado: Record<string, number>;
  tasa: number;
  monto_total: number;
  monto_aceptado: number;
  por_tratamiento: { name: string; total: number; aceptados: number; monto: number; tasa: number }[];
}

export function ReportsPage({ navigate }: { navigate: (to: string) => void }) {
  const app = useApp();
  const [data, setData] = useState<ReportsSummary | null>(null);
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [mananaAppts, setMananaAppts] = useState<Appointment[]>([]);
  const [aceptacion, setAceptacion] = useState<Aceptacion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSeccionTour(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().slice(0, 10);
        const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        const [res, apptRes, mananaRes, acepRes] = await Promise.all([
          api<ReportsSummary>("GET", "/api/reports/summary"),
          api<{ appointments: Appointment[] }>("GET", `/api/appointments?date=${today}`),
          api<{ appointments: Appointment[] }>("GET", `/api/appointments?date=${manana}`),
          api<Aceptacion>("GET", "/api/reports/plan-acceptance"),
        ]);
        setData(res);
        setAceptacion(acepRes);
        setMananaAppts((mananaRes.appointments || []).filter(
          (a) => a.kind === "patient" && a.status !== "cancelled" && a.patient_id,
        ).sort((a, b) => a.start_time.localeCompare(b.start_time)));
        setTodayAppts((apptRes.appointments || []).filter(
          (a) => a.kind === "patient" && a.status !== "cancelled",
        ).sort((a, b) => a.start_time.localeCompare(b.start_time)));
      } catch (err) {
        app.setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [app]);

  if (loading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        {loading ? "Cargando…" : "Sin datos"}
      </div>
    );
  }

  const completedRate = data.month_appointments
    ? Math.round((data.month_completed / data.month_appointments) * 100)
    : 0;
  const noShowRate = data.month_appointments
    ? Math.round((data.month_no_shows / data.month_appointments) * 100)
    : 0;
  const collectionRate = data.month_production
    ? Math.round((data.month_collections / data.month_production) * 100)
    : 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="sticky top-0 z-20 border-b bg-card px-4 py-3" data-tour="dashboard-encabezado">
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Resumen operativo · mes a la fecha</p>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-tour="dashboard-indicadores">
          <KpiCard icon={CalendarDays}  label="Citas de hoy" value={data.today_appointments.toString()} tone="sky" />
          <KpiCard icon={CalendarRange} label="Esta semana"             value={data.week_appointments.toString()}  tone="emerald" />
          <KpiCard icon={TrendingUp}    label="Producción del mes"        value={`Q${data.month_production.toFixed(0)}`} sub={`${data.month_appointments} citas`} tone="violet" />
          <KpiCard icon={Wallet}        label="Cobros del mes"       value={`Q${data.month_collections.toFixed(0)}`} sub={`${collectionRate}% de la producción`} tone="amber" />
        </div>

        {/* Today's schedule + alerts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2" data-tour="dashboard-citas-hoy">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Citas de hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAppts.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No hay citas programadas para hoy</p>
              ) : (
                <div className="space-y-2">
                  {todayAppts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => navigate("/agenda")}
                      className="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors hover:bg-accent/50"
                    >
                      <span className="w-16 shrink-0 text-sm font-medium tabular-nums">
                        {new Date(a.start_time).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium">
                        {[a.patient_first_name, a.patient_last_name].filter(Boolean).join(" ") || a.title || "—"}
                      </span>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {a.treatment_name ?? ""}
                      </span>
                      <Badge className="shrink-0">{a.status}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-tour="dashboard-alertas">
            <CardHeader>
              <CardTitle className="text-base">Requiere atención</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Alert icon={ListChecks} label="En lista de espera" value={data.waiting_list_count} tone={data.waiting_list_count > 0 ? "sky" : "slate"} />
              <Alert icon={FlaskConical} label="Lab vencidos" value={data.overdue_lab_cases} tone={data.overdue_lab_cases > 0 ? "rose" : "slate"} />
              <Alert icon={AlertTriangle} label="Inasistencias (mes)" value={data.month_no_shows} tone={data.month_no_shows > 0 ? "amber" : "slate"} />
            </CardContent>
          </Card>
        </div>

        {/* Recordatorios mañana + Aceptación de planes */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2" data-tour="dashboard-recordatorios">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4" />
                Recordatorios para mañana
                <span className="ml-auto text-xs font-normal tabular-nums text-muted-foreground">
                  {mananaAppts.length} por enviar · sin costo
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">Toca WhatsApp en cada cita: abre el chat con el mensaje listo para enviar.</p>
            </CardHeader>
            <CardContent>
              {mananaAppts.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No hay citas mañana. Nada que recordar.</p>
              ) : (
                <div className="space-y-2">
                  {mananaAppts.map((a) => {
                    const nombre = [a.patient_first_name, a.patient_last_name].filter(Boolean).join(" ") || "—";
                    return (
                      <div key={a.id} className="flex w-full items-center gap-3 rounded-md border px-3 py-2">
                        <span className="w-16 shrink-0 text-sm font-medium tabular-nums">
                          {new Date(a.start_time).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </span>
                        <span className="flex-1 truncate text-sm font-medium">{nombre}</span>
                        <span className="hidden text-xs text-muted-foreground sm:inline">{a.treatment_name ?? ""}</span>
                        {a.patient_phone ? (
                          <a
                            href={buildWhatsAppUrl(a.patient_phone, a.start_time, nombre, a.treatment_name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/40"
                          >
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp
                          </a>
                        ) : (
                          <span className="shrink-0 text-xs text-muted-foreground">Sin teléfono</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-tour="dashboard-aceptacion">
            <CardHeader>
              <CardTitle className="text-base">Aceptación de planes</CardTitle>
              <p className="text-xs text-muted-foreground">Aceptados + realizados sobre propuestos</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {!aceptacion || aceptacion.total === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay planes propuestos.</p>
              ) : (
                <>
                  <div className="text-3xl font-bold tabular-nums">{aceptacion.tasa}%</div>
                  <Bar label="Aceptado" count={aceptacion.por_estado.accepted || 0} total={aceptacion.total} pct={Math.round(((aceptacion.por_estado.accepted || 0) / aceptacion.total) * 100)} tone="emerald" />
                  <Bar label="Realizado" count={aceptacion.por_estado.completed || 0} total={aceptacion.total} pct={Math.round(((aceptacion.por_estado.completed || 0) / aceptacion.total) * 100)} tone="sky" />
                  <Bar label="Rechazado" count={aceptacion.por_estado.declined || 0} total={aceptacion.total} pct={Math.round(((aceptacion.por_estado.declined || 0) / aceptacion.total) * 100)} tone="rose" />
                  <p className="text-xs tabular-nums text-muted-foreground">
                    Q{aceptacion.monto_aceptado.toFixed(0)} aceptados de Q{aceptacion.monto_total.toFixed(0)} propuestos
                  </p>
                  {aceptacion.por_tratamiento.slice(0, 4).map((t) => (
                    <div key={t.name} className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate font-medium">{t.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{t.tasa}% ({t.aceptados}/{t.total})</span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly results + Aged receivables */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card data-tour="dashboard-resultados">
            <CardHeader>
              <CardTitle className="text-base">Resultados de citas (mes)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Bar label="Completado" count={data.month_completed} total={data.month_appointments || 1} pct={completedRate} tone="emerald" />
              <Bar label="Inasistencias"  count={data.month_no_shows}  total={data.month_appointments || 1} pct={noShowRate}    tone="rose" />
              <Bar label="Cancelado" count={data.month_cancelled} total={data.month_appointments || 1} pct={Math.round((data.month_cancelled / (data.month_appointments || 1)) * 100)} tone="slate" />
            </CardContent>
          </Card>

          <Card data-tour="dashboard-cartera">
            <CardHeader>
              <CardTitle className="text-base">Cuentas por cobrar</CardTitle>
              <p className="text-xs text-muted-foreground">Saldos pendientes por días</p>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ARBucket label="0–30 días"  amount={data.aged_receivables["0-30"]}  tone="emerald" />
              <ARBucket label="31–60 días" amount={data.aged_receivables["31-60"]} tone="amber" />
              <ARBucket label="61–90 días" amount={data.aged_receivables["61-90"]} tone="orange" />
              <ARBucket label="90+ días"   amount={data.aged_receivables["90+"]}   tone="rose" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2" data-tour="dashboard-desglose">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tratamientos principales (mes)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.by_treatment.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay citas este mes.</p>
              ) : (
                data.by_treatment.slice(0, 8).map((row, i) => {
                  const max = data.by_treatment[0].n || 1;
                  return (
                    <Bar
                      key={`${row.name}-${i}`}
                      label={row.name}
                      count={row.n}
                      total={max}
                      pct={Math.round((row.n / max) * 100)}
                      tone="sky"
                    />
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* By marketing source */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> Pacientes por origen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.by_source.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay pacientes.</p>
              ) : (
                data.by_source.slice(0, 8).map((row, i) => {
                  const max = data.by_source[0].n || 1;
                  return (
                    <Bar
                      key={`${row.source}-${i}`}
                      label={row.source}
                      count={row.n}
                      total={max}
                      pct={Math.round((row.n / max) * 100)}
                      tone="violet"
                    />
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const TONE: Record<string, { bg: string; border: string; text: string; bar: string; dot: string }> = {
  sky:     { bg: "bg-sky-50",     border: "border-sky-200",     text: "text-sky-900",     bar: "bg-sky-500",     dot: "bg-sky-500" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-900",   bar: "bg-amber-500",   dot: "bg-amber-500" },
  rose:    { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-900",    bar: "bg-rose-500",    dot: "bg-rose-500" },
  violet:  { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-900",  bar: "bg-violet-500",  dot: "bg-violet-500" },
  orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-900",  bar: "bg-orange-500",  dot: "bg-orange-500" },
  slate:   { bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-700",   bar: "bg-slate-400",   dot: "bg-slate-400" },
};

function KpiCard({ icon: Icon, label, value, sub, tone }: {
  icon: typeof CalendarDays; label: string; value: string; sub?: string; tone: keyof typeof TONE;
}) {
  const t = TONE[tone];
  return (
    <div className={cn("rounded-lg border p-4", t.bg, t.border)}>
      <div className={cn("flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-80", t.text)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={cn("mt-1 text-2xl font-bold tabular-nums", t.text)}>{value}</div>
      {sub && <div className={cn("text-xs opacity-70", t.text)}>{sub}</div>}
    </div>
  );
}

function Bar({ label, count, total, pct, tone }: { label: string; count: number; total: number; pct: number; tone: keyof typeof TONE }) {
  const t = TONE[tone];
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{count} · {pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", t.bar)} style={{ width: `${Math.min(100, (count / Math.max(total, 1)) * 100)}%` }} />
      </div>
    </div>
  );
}

function Alert({ icon: Icon, label, value, tone }: { icon: typeof ListChecks; label: string; value: number; tone: keyof typeof TONE }) {
  const t = TONE[tone];
  return (
    <div className={cn("flex items-center justify-between rounded-md border px-3 py-2", t.bg, t.border)}>
      <span className={cn("flex items-center gap-2 text-sm font-medium", t.text)}>
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className={cn("tabular-nums text-lg font-bold", t.text)}>{value}</span>
    </div>
  );
}

function ARBucket({ label, amount, tone }: { label: string; amount: number; tone: keyof typeof TONE }) {
  const t = TONE[tone];
  return (
    <div className={cn("rounded-lg border p-3", t.bg, t.border)}>
      <div className={cn("text-xs font-semibold uppercase tracking-wider opacity-80", t.text)}>{label}</div>
      <div className={cn("mt-1 text-xl font-bold tabular-nums", t.text)}>Q{amount.toFixed(0)}</div>
    </div>
  );
}
