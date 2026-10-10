import { useEffect, useMemo, useState } from "react";
import { Odontogram, type ToothConditionGroup, type ToothDetail } from "react-odontogram";
import "react-odontogram/style.css";
import { Plus, Trash2, Printer, Stethoscope } from "lucide-react";
import { api } from "@/api";
import { useApp } from "@/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ToothCondition, ToothConditionRow, TreatmentPlanItem, TreatmentPlanStatus } from "@/types";

// ── Nomenclatura FDI ─────────────────────────────────────────────

const TIPOS: Record<string, string> = {
  "1": "Incisivo central", "2": "Incisivo lateral", "3": "Canino",
  "4": "Primer premolar", "5": "Segundo premolar",
  "6": "Primer molar", "7": "Segundo molar", "8": "Tercer molar",
};
const ARCADAS: Record<string, string> = {
  "1": "superior derecha", "2": "superior izquierda",
  "3": "inferior izquierda", "4": "inferior derecha",
};

export function nombreDiente(fdi: string): string {
  if (!/^[1-4][1-8]$/.test(fdi)) return `Pieza ${fdi}`;
  return `${TIPOS[fdi[1]]} ${ARCADAS[fdi[0]]} (${fdi})`;
}

const SUPERFICIES = [
  { id: "O", label: "Oclusal / Incisal" },
  { id: "M", label: "Mesial" },
  { id: "D", label: "Distal" },
  { id: "V", label: "Vestibular" },
  { id: "L", label: "Lingual / Palatino" },
];

const CONDICION_META: Record<ToothCondition, { label: string; fill: string; outline: string }> = {
  caries:      { label: "Caries",       fill: "#fecaca", outline: "#dc2626" },
  restoration: { label: "Restauración",  fill: "#fde68a", outline: "#d97706" },
  crown:       { label: "Corona",        fill: "#ddd6fe", outline: "#7c3aed" },
  endo:        { label: "Endodoncia",    fill: "#fbcfe8", outline: "#db2777" },
  implant:     { label: "Implante",      fill: "#99f6e4", outline: "#0d9488" },
  missing:     { label: "Ausente",       fill: "#cbd5e1", outline: "#64748b" },
};
const ORDEN: ToothCondition[] = ["caries", "restoration", "crown", "endo", "implant", "missing"];

const ESTADOS: TreatmentPlanStatus[] = ["planned", "accepted", "completed", "declined"];
const ESTILO_ESTADO: Record<TreatmentPlanStatus, string> = {
  planned:   "bg-sky-100 text-sky-800 border-sky-200",
  accepted:  "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  declined:  "bg-rose-100 text-rose-800 border-rose-200",
};
const ETIQUETA_ESTADO: Record<TreatmentPlanStatus, string> = {
  planned: "Por realizar", accepted: "Aceptado", completed: "Realizado", declined: "Rechazado",
};

// ── Componente ───────────────────────────────────────────────────

export function FichaPaciente({ patientId }: { patientId: number }) {
  const app = useApp();
  const [conditions, setConditions] = useState<ToothConditionRow[]>([]);
  const [items, setItems] = useState<TreatmentPlanItem[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(true);
  const [diente, setDiente] = useState<string | null>(null);

  // Formulario de tratamiento para la pieza seleccionada.
  const [treatmentTypeId, setTreatmentTypeId] = useState("none");
  const [sups, setSups] = useState<string[]>([]);
  const [notas, setNotas] = useState("");
  const [fee, setFee] = useState("");
  const [adding, setAdding] = useState(false);
  const [guardandoObs, setGuardandoObs] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [c, p, pac] = await Promise.all([
          api<{ conditions: ToothConditionRow[] }>("GET", `/api/patients/${patientId}/tooth-chart`),
          api<{ items: TreatmentPlanItem[] }>("GET", `/api/patients/${patientId}/treatment-plan`),
          api<{ patient: { ficha_observaciones?: string | null } }>("GET", `/api/patients/${patientId}`),
        ]);
        setConditions(c.conditions || []);
        setItems(p.items || []);
        setObservaciones(pac.patient.ficha_observaciones || "");
      } catch (err) {
        app.setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, app]);

  useEffect(() => {
    if (treatmentTypeId === "none") return;
    const tt = app.treatmentTypes.find((t) => t.id === parseInt(treatmentTypeId, 10));
    if (tt && !fee) setFee(String(tt.default_fee));
  }, [treatmentTypeId, app.treatmentTypes, fee]);

  const grupos: ToothConditionGroup[] = useMemo(() => {
    const base = ORDEN.map((c) => ({
      label: CONDICION_META[c].label,
      fillColor: CONDICION_META[c].fill,
      outlineColor: CONDICION_META[c].outline,
      teeth: conditions.filter((r) => r.condition === c && !r.surface).map((r) => `teeth-${r.tooth}`),
    })).filter((g) => g.teeth.length > 0);
    const enPlan = [...new Set(items.filter((i) => i.tooth && i.status !== "declined").map((i) => `teeth-${i.tooth}`))];
    if (enPlan.length > 0) {
      base.push({ label: "En plan", fillColor: "#dbeafe", outlineColor: "#2563eb", teeth: enPlan });
    }
    return base;
  }, [conditions, items]);

  const itemsDiente = useMemo(
    () => (diente ? items.filter((i) => i.tooth === diente) : []),
    [items, diente],
  );
  const condsDiente = useMemo(
    () => (diente ? conditions.filter((c) => c.tooth === diente && !c.surface) : []),
    [conditions, diente],
  );

  const porDiente = useMemo(() => {
    const mapa = new Map<string, TreatmentPlanItem[]>();
    for (const i of items) {
      const clave = i.tooth || "General";
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave)!.push(i);
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const totalPendiente = items
    .filter((i) => i.status === "planned" || i.status === "accepted")
    .reduce((acc, i) => acc + i.fee, 0);

  function alElegirDiente(sel: ToothDetail[]) {
    if (!sel.length) return;
    const fdi = sel[0].notations.fdi;
    setDiente(fdi);
    setSups([]);
    setNotas("");
    setFee("");
    setTreatmentTypeId("none");
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!diente) return;
    setAdding(true);
    try {
      const res = await api<{ item: TreatmentPlanItem }>("POST", "/api/treatment-plan-items", {
        patient_id: patientId,
        treatment_type_id: treatmentTypeId === "none" ? null : parseInt(treatmentTypeId, 10),
        tooth: diente,
        surface: sups.length ? sups.join(",") : null,
        fee: parseFloat(fee || "0") || 0,
        notes: notas.trim() || null,
      });
      setItems((prev) => [...prev, res.item]);
      setSups([]);
      setNotas("");
      setFee("");
      setTreatmentTypeId("none");
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function cambiarEstado(id: number, status: TreatmentPlanStatus) {
    try {
      const res = await api<{ item: TreatmentPlanItem }>("PUT", `/api/treatment-plan-items/${id}`, { status });
      setItems((prev) => prev.map((i) => (i.id === id ? res.item : i)));
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  async function quitar(id: number) {
    if (!confirm("¿Quitar este tratamiento de la ficha?")) return;
    try {
      await api("DELETE", `/api/treatment-plan-items/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  async function guardarObservaciones() {
    setGuardandoObs(true);
    try {
      await api("PUT", `/api/patients/${patientId}`, { ficha_observaciones: observaciones.trim() || null });
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setGuardandoObs(false);
    }
  }

  return (
    <div className="space-y-4" data-tour="paciente-ficha">
      {/* Odontograma */}
      <Card data-tour="paciente-ficha-mapa">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span>Mapa dental — toca una pieza</span>
            <span className="ml-auto text-xs font-normal text-muted-foreground">Numeración FDI</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <>
              <div className="odontogram-host mx-auto w-full max-w-md rounded-md bg-muted/30 p-2">
                <Odontogram
                  singleSelect
                  notation="FDI"
                  showTooltip
                  teethConditions={grupos}
                  onChange={alElegirDiente}
                  styles={{ width: "100%", height: "auto" }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {ORDEN.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CONDICION_META[c].fill, border: `1px solid ${CONDICION_META[c].outline}` }} />
                    {CONDICION_META[c].label}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#dbeafe", border: "1px solid #2563eb" }} />
                  En plan
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pieza seleccionada */}
      {diente && (
        <Card data-tour="paciente-ficha-pieza">
          <CardHeader>
            <CardTitle className="text-base">{nombreDiente(diente)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {condsDiente.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {condsDiente.map((c) => (
                  <Badge key={c.id} variant="outline">{CONDICION_META[c.condition].label}</Badge>
                ))}
              </div>
            )}
            {itemsDiente.length > 0 && (
              <div className="space-y-2">
                {itemsDiente.map((i) => (
                  <div key={i.id} className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <span className="font-medium">{i.treatment_name ?? "Tratamiento"}</span>
                    {i.surface && <span className="text-xs text-muted-foreground">sup. {i.surface}</span>}
                    <span className="ml-auto text-sm tabular-nums">Q{i.fee.toFixed(2)}</span>
                    <Select value={i.status} onValueChange={(v) => cambiarEstado(i.id, v as TreatmentPlanStatus)}>
                      <SelectTrigger className={cn("h-7 w-[130px] text-xs", ESTILO_ESTADO[i.status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((s) => <SelectItem key={s} value={s}>{ETIQUETA_ESTADO[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => quitar(i.id)} aria-label="Eliminar">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {i.notes && <p className="w-full text-xs text-muted-foreground">Obs: {i.notes}</p>}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={agregar} className="space-y-3 rounded-md border bg-muted/30 p-3">
              <p className="text-sm font-medium">Agregar tratamiento a la pieza {diente}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tratamiento</Label>
                  <Select value={treatmentTypeId} onValueChange={setTreatmentTypeId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Ninguno —</SelectItem>
                      {app.treatmentTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.code} · {t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tarifa (Q)</Label>
                  <Input type="number" step="0.01" min="0" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Caras a tratar</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SUPERFICIES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSups((prev) => prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id])}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        sups.includes(s.id) ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent",
                      )}
                      title={s.label}
                    >
                      {s.id}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Observaciones de la pieza</Label>
                <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Ej. Dolor al frío, fractura mesial…" />
              </div>
              <Button type="submit" disabled={adding}>
                <Plus className="h-4 w-4" />
                {adding ? "Agregando…" : "Agregar a la ficha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Ficha completa */}
      <Card data-tour="paciente-ficha-lista">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <span>Ficha de tratamientos</span>
            <span className="ml-auto text-sm font-normal tabular-nums">
              Pendiente: <strong>Q{totalPendiente.toFixed(2)}</strong>
            </span>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {porDiente.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin tratamientos en la ficha. Toca una pieza del mapa para agregar el primero.
            </p>
          ) : (
            porDiente.map(([pieza, lista]) => (
              <div key={pieza} className="rounded-md border">
                <button
                  type="button"
                  onClick={() => setDiente(pieza === "General" ? null : pieza)}
                  className="flex w-full items-center gap-2 bg-muted/40 px-3 py-2 text-left text-sm font-semibold hover:bg-muted/60"
                >
                  {pieza === "General" ? "Sin pieza asignada" : nombreDiente(pieza)}
                  <Badge variant="outline" className="ml-auto">{lista.length}</Badge>
                </button>
                <div className="divide-y">
                  {lista.map((i) => (
                    <div key={i.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                      <span className="font-medium">{i.treatment_name ?? "—"}</span>
                      {i.surface && <span className="text-xs text-muted-foreground">sup. {i.surface}</span>}
                      <span className="text-xs tabular-nums text-muted-foreground">Q{i.fee.toFixed(2)}</span>
                      <span className={cn("ml-auto rounded border px-1.5 py-0.5 text-[11px]", ESTILO_ESTADO[i.status])}>
                        {ETIQUETA_ESTADO[i.status]}
                      </span>
                      {i.notes && <p className="w-full text-xs text-muted-foreground">Obs: {i.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          <div className="space-y-2" data-tour="paciente-ficha-obs">
            <Label>Observaciones generales de la ficha</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              placeholder="Alergias a anestesia, contraindicaciones, acuerdos de pago, etc."
            />
            <Button variant="outline" size="sm" onClick={guardarObservaciones} disabled={guardandoObs}>
              {guardandoObs ? "Guardando…" : "Guardar observaciones"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
