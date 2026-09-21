import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/api";
import { useApp } from "@/context";
import type { Patient } from "@/types";

const REFERRAL_SOURCES = ["Google", "Facebook", "Yelp", "Amigo / familiar", "Directorio de seguros", "Caminando", "Otro"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** When provided, the dialog edits this patient. Otherwise it creates a new one. */
  patient: Patient | null;
  onSaved?: (patient: Patient) => void;
}

export function PatientDialog({ open, onOpenChange, patient, onSaved }: Props) {
  const app = useApp();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [alerts, setAlerts] = useState("");
  const [referralSource, setReferralSource] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFirst(patient?.first_name ?? "");
    setLast(patient?.last_name ?? "");
    setDob(patient?.date_of_birth ?? "");
    setEmail(patient?.email ?? "");
    setPhone(patient?.phone ?? "");
    setAddress(patient?.address ?? "");
    setAlerts(patient?.medical_alerts ?? "");
    setReferralSource(patient?.referral_source ?? "none");
    setNotes(patient?.notes ?? "");
  }, [open, patient]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!first.trim() || !last.trim()) {
      app.setError("Nombre y apellido son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const body = {
        first_name: first.trim(),
        last_name: last.trim(),
        date_of_birth: dob.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        medical_alerts: alerts.trim() || null,
        referral_source: referralSource === "none" ? null : referralSource,
        notes: notes.trim() || null,
      };
      const res = patient
        ? await api<{ patient: Patient }>("PUT", `/api/patients/${patient.id}`, body)
        : await api<{ patient: Patient }>("POST", "/api/patients", body);
      onSaved?.(res.patient);
      onOpenChange(false);
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{patient ? "Editar paciente" : "Nuevo paciente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre *">
              <Input value={first} onChange={(e) => setFirst(e.target.value)} required />
            </Field>
            <Field label="Apellido *">
              <Input value={last} onChange={(e) => setLast(e.target.value)} required />
            </Field>
            <Field label="Fecha de nacimiento">
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Teléfono">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Dirección">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
          </div>
          <Field label="Alertas médicas (separadas por comas)">
            <Input
              value={alerts}
              onChange={(e) => setAlerts(e.target.value)}
              placeholder="ej. alergia:penicilina, diabetes, anticoagulante"
            />
          </Field>
          <Field label="¿Cómo se enteró de nosotros?">
            <Select value={referralSource} onValueChange={setReferralSource}>
              <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Desconocido —</SelectItem>
                {REFERRAL_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notas">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : patient ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
