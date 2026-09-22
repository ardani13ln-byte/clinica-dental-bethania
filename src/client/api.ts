import { supabase } from "./supabase-client";
import { z } from "zod";

// ── Zod Schemas ───────────────────────────────────────────────────

const str = z.string().trim();
const optStr = z.string().trim().nullable().optional();
const optNum = z.number().nullable().optional();

const PatientSchema = z.object({
  first_name: str.min(1).max(100),
  last_name: str.min(1).max(100),
  date_of_birth: optStr,
  email: optStr,
  phone: optStr,
  address: optStr,
  medical_alerts: optStr,
  notes: optStr,
  referral_source: optStr,
});

const AppointmentSchema = z.object({
  patient_id: optNum,
  practitioner_id: optNum,
  operatory_id: z.number(),
  treatment_type_id: optNum,
  start_time: str.min(1),
  end_time: str.min(1),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show", "in_chair"]).optional(),
  kind: z.enum(["patient", "block"]).optional(),
  title: optStr,
  notes: optStr,
});

const TreatmentTypeSchema = z.object({
  code: str.min(1).max(20),
  name: str.min(1).max(100),
  duration_minutes: z.number().int().min(1).max(600).optional(),
  default_fee: z.number().min(0).optional(),
  color: str.max(50).optional(),
});

const PractitionerSchema = z.object({
  name: str.min(1).max(100),
  role: z.enum(["dentist", "hygienist", "assistant", "receptionist"]).optional(),
  color: str.max(50).optional(),
  email: optStr,
  phone: optStr,
});

const OperatorySchema = z.object({
  name: str.min(1).max(100),
  color: str.max(50).optional(),
  sort_order: z.number().int().optional(),
});

const PlanItemSchema = z.object({
  patient_id: z.number().int(),
  treatment_type_id: optNum,
  tooth: optStr,
  surface: optStr,
  fee: z.number().min(0).optional(),
  status: z.enum(["planned", "approved", "completed", "cancelled"]).optional(),
  notes: optStr,
  sort_order: z.number().int().optional(),
});

const NoteSchema = z.object({
  patient_id: z.number().int(),
  practitioner_id: optNum,
  note_date: optStr,
  body: str.min(1),
});

const ToothConditionSchema = z.object({
  patient_id: z.number().int(),
  tooth: str.min(1).max(5),
  surface: optStr,
  condition: str.min(1).max(50),
});

const InvoiceSchema = z.object({
  patient_id: z.number().int(),
  appointment_id: optNum,
  status: z.enum(["open", "paid", "void", "partial"]).optional(),
  total: z.number().min(0).optional(),
  amount_paid: z.number().min(0).optional(),
  notes: optStr,
});

const WaitingListSchema = z.object({
  patient_id: z.number().int(),
  treatment_type_id: optNum,
  preferred_practitioner_id: optNum,
  duration_minutes: z.number().int().min(1).max(600).optional(),
  notes: optStr,
});

const ToMakeSchema = z.object({
  patient_id: z.number().int(),
  treatment_type_id: optNum,
  due_after: optStr,
  source: str.max(50).optional(),
  notes: optStr,
  status: z.enum(["open", "done", "cancelled"]).optional(),
});

const InsuranceSchema = z.object({
  patient_id: z.number().int(),
  rank: z.enum(["primary", "secondary", "tertiary"]).optional(),
  carrier: str.min(1).max(100),
  member_id: optStr,
  group_id: optStr,
  subscriber_name: optStr,
  subscriber_dob: optStr,
  effective_date: optStr,
  term_date: optStr,
  copay: z.number().min(0).optional(),
  deductible_total: z.number().min(0).optional(),
  deductible_used: z.number().min(0).optional(),
  max_annual: z.number().min(0).optional(),
  max_used: z.number().min(0).optional(),
  notes: optStr,
});

const LabCaseSchema = z.object({
  patient_id: z.number().int(),
  practitioner_id: optNum,
  treatment_type_id: optNum,
  lab_name: str.min(1).max(100),
  case_type: str.min(1).max(100),
  tooth: optStr,
  shade: optStr,
  fee: z.number().min(0).optional(),
  sent_at: optStr,
  due_at: optStr,
  received_at: optStr,
  seated_at: optStr,
  status: z.enum(["sent", "received", "seated", "cancelled"]).optional(),
  notes: optStr,
});

function validate<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error(`Validación ${label}: ${first.path.join(".")} — ${first.message}`);
  }
  return result.data;
}

// ── Helpers ───────────────────────────────────────────────────────

function checkError(result: { error: unknown | null }, label: string) {
  if (result.error) {
    const e = result.error as { message?: string };
    throw new Error(e.message || label);
  }
}

function flattenAppointment(a: Record<string, unknown>) {
  const p = a.patients as Record<string, unknown> | null;
  const pr = a.practitioners as Record<string, unknown> | null;
  const o = a.operatories as Record<string, unknown> | null;
  const tt = a.treatment_types as Record<string, unknown> | null;
  delete a.patients; delete a.practitioners; delete a.operatories; delete a.treatment_types;
  return {
    ...a,
    patient_first_name: p?.first_name ?? null,
    patient_last_name: p?.last_name ?? null,
    patient_date_of_birth: p?.date_of_birth ?? null,
    practitioner_name: pr?.name ?? null,
    practitioner_color: pr?.color ?? null,
    operatory_name: o?.name ?? null,
    treatment_code: tt?.code ?? null,
    treatment_name: tt?.name ?? null,
    treatment_color: tt?.color ?? null,
  };
}

function flattenPlanItem(r: Record<string, unknown>) {
  const tt = r.treatment_types as Record<string, unknown> | null;
  delete r.treatment_types;
  return {
    ...r,
    treatment_code: tt?.code ?? null,
    treatment_name: tt?.name ?? null,
    treatment_color: tt?.color ?? null,
  };
}

function flattenNote(r: Record<string, unknown>) {
  const pr = r.practitioners as Record<string, unknown> | null;
  delete r.practitioners;
  return { ...r, practitioner_name: pr?.name ?? null };
}

function flattenWaiting(r: Record<string, unknown>) {
  const p = r.patients as Record<string, unknown> | null;
  const tt = r.treatment_types as Record<string, unknown> | null;
  const pr = r.practitioners as Record<string, unknown> | null;
  delete r.patients; delete r.treatment_types; delete r.practitioners;
  return {
    ...r,
    first_name: p?.first_name ?? null,
    last_name: p?.last_name ?? null,
    date_of_birth: p?.date_of_birth ?? null,
    treatment_name: tt?.name ?? null,
    treatment_color: tt?.color ?? null,
    practitioner_name: pr?.name ?? null,
  };
}

function flattenToMake(r: Record<string, unknown>) {
  const p = r.patients as Record<string, unknown> | null;
  const tt = r.treatment_types as Record<string, unknown> | null;
  delete r.patients; delete r.treatment_types;
  return {
    ...r,
    first_name: p?.first_name ?? null,
    last_name: p?.last_name ?? null,
    date_of_birth: p?.date_of_birth ?? null,
    treatment_name: tt?.name ?? null,
    treatment_color: tt?.color ?? null,
  };
}

function flattenLabCase(r: Record<string, unknown>) {
  const p = r.patients as Record<string, unknown> | null;
  const pr = r.practitioners as Record<string, unknown> | null;
  const tt = r.treatment_types as Record<string, unknown> | null;
  delete r.patients; delete r.practitioners; delete r.treatment_types;
  return {
    ...r,
    first_name: p?.first_name ?? null,
    last_name: p?.last_name ?? null,
    practitioner_name: pr?.name ?? null,
    treatment_code: tt?.code ?? null,
    treatment_name: tt?.name ?? null,
  };
}

const APPT_SELECT = "*, patients(first_name,last_name,date_of_birth), practitioners(name,color), operatories(name), treatment_types(code,name,color)";
const PLAN_SELECT = "*, treatment_types(code,name,color)";
const NOTE_SELECT = "*, practitioners(name)";
const WAITING_SELECT = "*, patients(first_name,last_name,date_of_birth), treatment_types(name,color), practitioners(name)";
const TOMAKE_SELECT = "*, patients(first_name,last_name,date_of_birth), treatment_types(name,color)";
const LAB_SELECT = "*, patients(first_name,last_name), practitioners(name), treatment_types(code,name)";

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

// ── Main router ───────────────────────────────────────────────────

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  // ── Operatories ──
  if (path === "/api/operatories" && method === "GET") {
    const { data, error } = await supabase.from("operatories").select("*").order("sort_order").order("id");
    checkError({ error }, "operatories");
    return { operatories: data } as T;
  }
  if (path === "/api/operatories" && method === "POST") {
    const d = validate(OperatorySchema, body, "operatory");
    let sortOrder = d.sort_order as number | undefined;
    if (sortOrder === undefined) {
      const { data: max } = await supabase.from("operatories").select("sort_order").order("sort_order", { ascending: false }).limit(1);
      sortOrder = (max?.[0]?.sort_order ?? -1) + 1;
    }
    const { data, error } = await supabase.from("operatories").insert({
      name: d.name,
      color: d.color ?? "sky",
      sort_order: sortOrder,
    }).select("*").single();
    checkError({ error }, "operatory insert");
    return { operatory: data } as T;
  }
  if (path.startsWith("/api/operatories/") && method === "PUT") {
    const id = parseInt(path.split("/")[3], 10);
    const { data, error } = await supabase.from("operatories").update(body as Record<string, unknown>).eq("id", id).select("*").single();
    checkError({ error }, "operatory update");
    return { operatory: data } as T;
  }
  if (path.startsWith("/api/operatories/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("operatories").delete().eq("id", id);
    checkError({ error }, "operatory delete");
    return { ok: true } as T;
  }

  // ── Practitioners ──
  if (path === "/api/practitioners" && method === "GET") {
    const { data, error } = await supabase.from("practitioners").select("*").order("name");
    checkError({ error }, "practitioners");
    return { practitioners: data } as T;
  }
  if (path === "/api/practitioners" && method === "POST") {
    const d = validate(PractitionerSchema, body, "practitioner");
    const { data, error } = await supabase.from("practitioners").insert({
      name: d.name,
      role: d.role ?? "dentist",
      color: d.color ?? "teal",
      email: d.email ?? null,
      phone: d.phone ?? null,
    }).select("*").single();
    checkError({ error }, "practitioner insert");
    return { practitioner: data } as T;
  }
  if (path.startsWith("/api/practitioners/") && method === "PUT") {
    const id = parseInt(path.split("/")[3], 10);
    const { data, error } = await supabase.from("practitioners").update(body as Record<string, unknown>).eq("id", id).select("*").single();
    checkError({ error }, "practitioner update");
    return { practitioner: data } as T;
  }
  if (path.startsWith("/api/practitioners/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("practitioners").delete().eq("id", id);
    checkError({ error }, "practitioner delete");
    return { ok: true } as T;
  }

  // ── Treatment types ──
  if (path === "/api/treatment-types" && method === "GET") {
    const { data, error } = await supabase.from("treatment_types").select("*").order("code");
    checkError({ error }, "treatment_types");
    return { treatment_types: data } as T;
  }
  if (path === "/api/treatment-types" && method === "POST") {
    const d = validate(TreatmentTypeSchema, body, "treatment type");
    const { data, error } = await supabase.from("treatment_types").insert({
      code: d.code,
      name: d.name,
      duration_minutes: d.duration_minutes ?? 30,
      default_fee: d.default_fee ?? 0,
      color: d.color ?? "sky",
    }).select("*").single();
    checkError({ error }, "treatment_type insert");
    return { treatment_type: data } as T;
  }
  if (path.startsWith("/api/treatment-types/") && method === "PUT") {
    const id = parseInt(path.split("/")[3], 10);
    const { data, error } = await supabase.from("treatment_types").update(body as Record<string, unknown>).eq("id", id).select("*").single();
    checkError({ error }, "treatment_type update");
    return { treatment_type: data } as T;
  }
  if (path.startsWith("/api/treatment-types/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("treatment_types").delete().eq("id", id);
    checkError({ error }, "treatment_type delete");
    return { ok: true } as T;
  }

  // ── Patients ──
  if (path.startsWith("/api/patients") && !path.startsWith("/api/patients/") && method === "GET") {
    const q = new URLSearchParams(path.split("?")[1] || "").get("q")?.trim();
    let queryBuilder = supabase.from("patients").select("*");
    if (q) {
      const like = `%${q}%`;
      queryBuilder = queryBuilder.or(`last_name.like.${like},first_name.like.${like},email.like.${like},phone.like.${like}`);
    }
    const { data, error } = await queryBuilder.order("last_name").order("first_name").limit(q ? 200 : 500);
    checkError({ error }, "patients");
    return { patients: data } as T;
  }
  if (path.startsWith("/api/patients/") && method === "GET") {
    // Handle /api/patients/:id, /api/patients/:id/treatment-plan, etc.
    const parts = path.split("/");
    const id = parseInt(parts[3], 10);

    if (parts.length === 5 && parts[4] === "treatment-plan") {
      const { data, error } = await supabase.from("treatment_plan_items").select(PLAN_SELECT).eq("patient_id", id).order("sort_order").order("id");
      checkError({ error }, "treatment plan");
      return { items: (data || []).map(flattenPlanItem) } as T;
    }
    if (parts.length === 5 && parts[4] === "notes") {
      const { data, error } = await supabase.from("clinical_notes").select(NOTE_SELECT).eq("patient_id", id).order("note_date", { ascending: false });
      checkError({ error }, "notes");
      return { notes: (data || []).map(flattenNote) } as T;
    }
    if (parts.length === 5 && parts[4] === "tooth-chart") {
      const { data, error } = await supabase.from("tooth_conditions").select("*").eq("patient_id", id).order("tooth").order("surface");
      checkError({ error }, "tooth chart");
      return { conditions: data } as T;
    }
    if (parts.length === 5 && parts[4] === "invoices") {
      const { data, error } = await supabase.from("invoices").select("*").eq("patient_id", id).order("issued_at", { ascending: false });
      checkError({ error }, "invoices");
      return { invoices: data } as T;
    }
    if (parts.length === 5 && parts[4] === "insurance") {
      const { data, error } = await supabase.from("insurance_plans").select("*").eq("patient_id", id).order("rank");
      checkError({ error }, "insurance");
      return { plans: data || [] } as T;
    }
    // Just /api/patients/:id
    if (parts.length === 4) {
      const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
      checkError({ error }, "patient");
      return { patient: data } as T;
    }
  }
  if (path === "/api/patients" && method === "POST") {
    const d = validate(PatientSchema, body, "patient");
    const { data, error } = await supabase.from("patients").insert({
      first_name: d.first_name,
      last_name: d.last_name,
      date_of_birth: d.date_of_birth ?? null,
      email: d.email ?? null,
      phone: d.phone ?? null,
      address: d.address ?? null,
      medical_alerts: d.medical_alerts ?? null,
      notes: d.notes ?? null,
      referral_source: d.referral_source ?? null,
    }).select("*").single();
    checkError({ error }, "patient insert");
    return { patient: data } as T;
  }
  if (path.startsWith("/api/patients/") && method === "PUT") {
    const id = parseInt(path.split("/")[3], 10);
    const { data, error } = await supabase.from("patients").update(body as Record<string, unknown>).eq("id", id).select("*").single();
    checkError({ error }, "patient update");
    return { patient: data } as T;
  }
  if (path.startsWith("/api/patients/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("patients").delete().eq("id", id);
    checkError({ error }, "patient delete");
    return { ok: true } as T;
  }

  // ── Appointments ──
  if (path.startsWith("/api/appointments") && method === "GET") {
    const qs = path.split("?")[1] || "";
    const params = new URLSearchParams(qs);
    const date = params.get("date");
    const patientId = params.get("patient_id");

    let queryBuilder = supabase.from("appointments").select(APPT_SELECT);

    if (patientId) {
      queryBuilder = queryBuilder.eq("patient_id", parseInt(patientId, 10)).order("start_time", { ascending: false }).limit(200);
    } else if (date) {
      const dayStart = `${date}T00:00:00`;
      const dayEnd = `${date}T23:59:59`;
      queryBuilder = queryBuilder.lt("start_time", dayEnd).gt("end_time", dayStart).order("start_time");
    } else {
      queryBuilder = queryBuilder.order("start_time", { ascending: false }).limit(200);
    }

    const { data, error } = await queryBuilder;
    checkError({ error }, "appointments");
    return { appointments: (data || []).map(flattenAppointment) } as T;
  }
  if (path === "/api/appointments" && method === "POST") {
    const d = validate(AppointmentSchema, body, "appointment");
    const { data, error } = await supabase.from("appointments").insert({
      patient_id: d.patient_id ?? null,
      practitioner_id: d.practitioner_id ?? null,
      operatory_id: d.operatory_id,
      treatment_type_id: d.treatment_type_id ?? null,
      start_time: d.start_time,
      end_time: d.end_time,
      status: d.status ?? "scheduled",
      kind: d.kind ?? "patient",
      title: d.title ?? null,
      notes: d.notes ?? null,
    }).select(APPT_SELECT).single();
    checkError({ error }, "appointment insert");
    return { appointment: flattenAppointment(data) } as T;
  }
  if (path.startsWith("/api/appointments/") && method === "PUT") {
    const id = parseInt(path.split("/")[3], 10);
    const { data, error } = await supabase.from("appointments").update(body as Record<string, unknown>).eq("id", id).select(APPT_SELECT).single();
    checkError({ error }, "appointment update");
    return { appointment: flattenAppointment(data) } as T;
  }
  if (path.startsWith("/api/appointments/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    checkError({ error }, "appointment delete");
    return { ok: true } as T;
  }

  // ── Treatment plan items ──
  if (path === "/api/treatment-plan-items" && method === "POST") {
    const d = validate(PlanItemSchema, body, "plan item");
    let sortOrder = d.sort_order as number | undefined;
    if (sortOrder === undefined) {
      const { data: max } = await supabase.from("treatment_plan_items").select("sort_order").eq("patient_id", d.patient_id as number).order("sort_order", { ascending: false }).limit(1);
      sortOrder = (max?.[0]?.sort_order ?? -1) + 1;
    }
    const { data, error } = await supabase.from("treatment_plan_items").insert({
      patient_id: d.patient_id,
      treatment_type_id: d.treatment_type_id ?? null,
      tooth: d.tooth ?? null,
      surface: d.surface ?? null,
      fee: d.fee ?? 0,
      status: d.status ?? "planned",
      notes: d.notes ?? null,
      sort_order: sortOrder,
    }).select(PLAN_SELECT).single();
    checkError({ error }, "plan item insert");
    return { item: flattenPlanItem(data) } as T;
  }
  if (path.startsWith("/api/treatment-plan-items/") && method === "PUT") {
    const id = parseInt(path.split("/")[3], 10);
    const { data, error } = await supabase.from("treatment_plan_items").update(body as Record<string, unknown>).eq("id", id).select(PLAN_SELECT).single();
    checkError({ error }, "plan item update");
    return { item: flattenPlanItem(data) } as T;
  }
  if (path.startsWith("/api/treatment-plan-items/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("treatment_plan_items").delete().eq("id", id);
    checkError({ error }, "plan item delete");
    return { ok: true } as T;
  }

  // ── Clinical notes ──
  if (path === "/api/clinical-notes" && method === "POST") {
    const d = validate(NoteSchema, body, "clinical note");
    const { data, error } = await supabase.from("clinical_notes").insert({
      patient_id: d.patient_id,
      practitioner_id: d.practitioner_id ?? null,
      note_date: d.note_date ?? nowStr(),
      body: d.body,
    }).select(NOTE_SELECT).single();
    checkError({ error }, "note insert");
    return { note: flattenNote(data) } as T;
  }
  if (path.startsWith("/api/clinical-notes/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("clinical_notes").delete().eq("id", id);
    checkError({ error }, "note delete");
    return { ok: true } as T;
  }

  // ── Tooth conditions ──
  if (path === "/api/tooth-conditions" && method === "POST") {
    const d = validate(ToothConditionSchema, body, "tooth condition");
    const { data, error } = await supabase.from("tooth_conditions").insert({
      patient_id: d.patient_id,
      tooth: d.tooth,
      surface: d.surface ?? null,
      condition: d.condition,
    }).select("*").single();
    checkError({ error }, "tooth condition insert");
    return { condition: data } as T;
  }
  if (path.startsWith("/api/tooth-conditions/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("tooth_conditions").delete().eq("id", id);
    checkError({ error }, "tooth condition delete");
    return { ok: true } as T;
  }

  // ── Invoices ──
  if (path === "/api/invoices" && method === "POST") {
    const d = validate(InvoiceSchema, body, "invoice");
    const { data, error } = await supabase.from("invoices").insert({
      patient_id: d.patient_id,
      appointment_id: d.appointment_id ?? null,
      status: d.status ?? "open",
      total: d.total ?? 0,
      amount_paid: d.amount_paid ?? 0,
      notes: d.notes ?? null,
    }).select("*").single();
    checkError({ error }, "invoice insert");
    return { invoice: data } as T;
  }
  if (path.startsWith("/api/invoices/") && method === "PUT") {
    const id = parseInt(path.split("/")[3], 10);
    const { data, error } = await supabase.from("invoices").update(body as Record<string, unknown>).eq("id", id).select("*").single();
    checkError({ error }, "invoice update");
    return { invoice: data } as T;
  }
  if (path.startsWith("/api/invoices/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    checkError({ error }, "invoice delete");
    return { ok: true } as T;
  }

  // ── Waiting list ──
  if (path === "/api/waiting-list" && method === "GET") {
    const { data, error } = await supabase.from("waiting_list").select(WAITING_SELECT).order("created_at", { ascending: false });
    checkError({ error }, "waiting list");
    return { waiting: (data || []).map(flattenWaiting) } as T;
  }
  if (path === "/api/waiting-list" && method === "POST") {
    const d = validate(WaitingListSchema, body, "waiting list");
    const { data, error } = await supabase.from("waiting_list").insert({
      patient_id: d.patient_id,
      treatment_type_id: d.treatment_type_id ?? null,
      preferred_practitioner_id: d.preferred_practitioner_id ?? null,
      duration_minutes: d.duration_minutes ?? 30,
      notes: d.notes ?? null,
    }).select(WAITING_SELECT).single();
    checkError({ error }, "waiting list insert");
    return { entry: flattenWaiting(data) } as T;
  }
  if (path.startsWith("/api/waiting-list/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("waiting_list").delete().eq("id", id);
    checkError({ error }, "waiting list delete");
    return { ok: true } as T;
  }

  // ── Appointments to make ──
  if (path.startsWith("/api/appointments-to-make") && method === "GET") {
    const qs = path.split("?")[1] || "";
    const source = new URLSearchParams(qs).get("source");
    let queryBuilder = supabase.from("appointments_to_make").select(TOMAKE_SELECT).eq("status", "open");
    if (source) queryBuilder = queryBuilder.eq("source", source);
    const { data, error } = await queryBuilder.order("created_at", { ascending: false });
    checkError({ error }, "appointments to make");
    return { to_make: (data || []).map(flattenToMake) } as T;
  }
  if (path === "/api/appointments-to-make" && method === "POST") {
    const d = validate(ToMakeSchema, body, "appointment to make");
    const { data, error } = await supabase.from("appointments_to_make").insert({
      patient_id: d.patient_id,
      treatment_type_id: d.treatment_type_id ?? null,
      due_after: d.due_after ?? null,
      source: d.source ?? "reception",
      notes: d.notes ?? null,
      status: d.status ?? "open",
    }).select(TOMAKE_SELECT).single();
    checkError({ error }, "to make insert");
    return { entry: flattenToMake(data) } as T;
  }
  if (path.startsWith("/api/appointments-to-make/") && method === "PUT") {
    const id = parseInt(path.split("/")[3], 10);
    const { data, error } = await supabase.from("appointments_to_make").update(body as Record<string, unknown>).eq("id", id).select(TOMAKE_SELECT).single();
    checkError({ error }, "to make update");
    return { entry: flattenToMake(data) } as T;
  }
  if (path.startsWith("/api/appointments-to-make/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("appointments_to_make").delete().eq("id", id);
    checkError({ error }, "to make delete");
    return { ok: true } as T;
  }

  // ── Insurance plans ──
  if (path === "/api/insurance-plans" && method === "POST") {
    const d = validate(InsuranceSchema, body, "insurance plan");
    const { data, error } = await supabase.from("insurance_plans").insert({
      patient_id: d.patient_id,
      rank: d.rank ?? "primary",
      carrier: d.carrier,
      member_id: d.member_id ?? null,
      group_id: d.group_id ?? null,
      subscriber_name: d.subscriber_name ?? null,
      subscriber_dob: d.subscriber_dob ?? null,
      effective_date: d.effective_date ?? null,
      term_date: d.term_date ?? null,
      copay: d.copay ?? 0,
      deductible_total: d.deductible_total ?? 0,
      deductible_used: d.deductible_used ?? 0,
      max_annual: d.max_annual ?? 0,
      max_used: d.max_used ?? 0,
      notes: d.notes ?? null,
    }).select("*").single();
    checkError({ error }, "insurance insert");
    return { plan: data } as T;
  }
  if (path.startsWith("/api/insurance-plans/") && method === "PUT") {
    const id = parseInt(path.split("/")[3], 10);
    const { data, error } = await supabase.from("insurance_plans").update(body as Record<string, unknown>).eq("id", id).select("*").single();
    checkError({ error }, "insurance update");
    return { plan: data } as T;
  }
  if (path.startsWith("/api/insurance-plans/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("insurance_plans").delete().eq("id", id);
    checkError({ error }, "insurance delete");
    return { ok: true } as T;
  }

  // ── Lab cases ──
  if (path.startsWith("/api/lab-cases") && method === "GET") {
    const qs = path.split("?")[1] || "";
    const status = new URLSearchParams(qs).get("status");
    let queryBuilder = supabase.from("lab_cases").select(LAB_SELECT);
    if (status) queryBuilder = queryBuilder.eq("status", status);
    const { data, error } = await queryBuilder.order("due_at", { ascending: true }).order("id", { ascending: false });
    checkError({ error }, "lab cases");
    return { cases: (data || []).map(flattenLabCase) } as T;
  }
  if (path === "/api/lab-cases" && method === "POST") {
    const d = validate(LabCaseSchema, body, "lab case");
    const { data, error } = await supabase.from("lab_cases").insert({
      patient_id: d.patient_id,
      practitioner_id: d.practitioner_id ?? null,
      treatment_type_id: d.treatment_type_id ?? null,
      lab_name: d.lab_name,
      case_type: d.case_type,
      tooth: d.tooth ?? null,
      shade: d.shade ?? null,
      fee: d.fee ?? 0,
      sent_at: d.sent_at ?? null,
      due_at: d.due_at ?? null,
      received_at: d.received_at ?? null,
      seated_at: d.seated_at ?? null,
      status: d.status ?? "sent",
      notes: d.notes ?? null,
    }).select(LAB_SELECT).single();
    checkError({ error }, "lab case insert");
    return { case: flattenLabCase(data) } as T;
  }
  if (path.startsWith("/api/lab-cases/") && method === "PUT") {
    const id = parseInt(path.split("/")[3], 10);
    const { data, error } = await supabase.from("lab_cases").update(body as Record<string, unknown>).eq("id", id).select(LAB_SELECT).single();
    checkError({ error }, "lab case update");
    return { case: flattenLabCase(data) } as T;
  }
  if (path.startsWith("/api/lab-cases/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("lab_cases").delete().eq("id", id);
    checkError({ error }, "lab case delete");
    return { ok: true } as T;
  }

  // ── Reports ──
  if (path === "/api/reports/summary" && method === "GET") {
    const today = new Date().toISOString().slice(0, 10);
    const startOfMonth = `${today.slice(0, 8)}01`;
    const startOfWeek = (() => {
      const d = new Date(`${today}T00:00:00`);
      const dow = d.getDay();
      const diff = (dow + 6) % 7;
      d.setDate(d.getDate() - diff);
      return d.toISOString().slice(0, 10);
    })();

    const [todayR, weekR, monthR, completedR, noShowR, cancelledR, byTreatR, bySourceR, prodR, paidR, labR, waitR] = await Promise.all([
      supabase.from("appointments").select("*", { count: "exact", head: true }).filter("start_time", "like", `${today}%`).eq("kind", "patient"),
      supabase.from("appointments").select("*", { count: "exact", head: true }).gte("start_time", startOfWeek).eq("kind", "patient"),
      supabase.from("appointments").select("*", { count: "exact", head: true }).gte("start_time", startOfMonth).eq("kind", "patient"),
      supabase.from("appointments").select("*", { count: "exact", head: true }).gte("start_time", startOfMonth).eq("status", "completed"),
      supabase.from("appointments").select("*", { count: "exact", head: true }).gte("start_time", startOfMonth).eq("status", "no_show"),
      supabase.from("appointments").select("*", { count: "exact", head: true }).gte("start_time", startOfMonth).eq("status", "cancelled"),
      supabase.from("appointments").select("treatment_type_id, treatment_types(name, default_fee)").gte("start_time", startOfMonth).eq("kind", "patient"),
      supabase.from("patients").select("referral_source"),
      supabase.from("invoices").select("total").gte("issued_at", startOfMonth).neq("status", "void"),
      supabase.from("invoices").select("amount_paid").gte("issued_at", startOfMonth).neq("status", "void"),
      supabase.from("lab_cases").select("*", { count: "exact", head: true }).lt("due_at", nowStr()).is("received_at", null).not("status", "in", '("cancelled","received","seated")'),
      supabase.from("waiting_list").select("*", { count: "exact", head: true }),
    ]);

    // Aggregate by treatment
    const byTreatmentMap = new Map<string, { name: string; n: number; total: number }>();
    for (const a of (byTreatR.data || [])) {
      const tt = (a as Record<string, unknown>).treatment_types as Record<string, unknown> | null;
      const name = (tt?.name as string) || "Unspecified";
      const fee = (tt?.default_fee as number) || 0;
      const existing = byTreatmentMap.get(name) || { name, n: 0, total: 0 };
      existing.n++;
      existing.total += fee;
      byTreatmentMap.set(name, existing);
    }
    const by_treatment = Array.from(byTreatmentMap.values()).sort((a, b) => b.n - a.n);

    // Aggregate by source
    const bySourceMap = new Map<string, { source: string; n: number }>();
    for (const p of (bySourceR.data || [])) {
      const src = ((p as Record<string, unknown>).referral_source as string) || "Unknown";
      const existing = bySourceMap.get(src) || { source: src, n: 0 };
      existing.n++;
      bySourceMap.set(src, existing);
    }
    const by_source = Array.from(bySourceMap.values()).sort((a, b) => b.n - a.n);

    // Production & collections
    const month_production = (prodR.data || []).reduce((s, r) => s + ((r as Record<string, unknown>).total as number) || 0, 0);
    const month_collections = (paidR.data || []).reduce((s, r) => s + ((r as Record<string, unknown>).amount_paid as number) || 0, 0);

    // Aged receivables
    const now = Date.now();
    const dayMs = 86400000;
    const allInvoices = await supabase.from("invoices").select("total, amount_paid, issued_at").eq("status", "open");
    let aged0_30 = 0, aged31_60 = 0, aged61_90 = 0, aged90 = 0;
    for (const inv of (allInvoices.data || [])) {
      const r = inv as Record<string, unknown>;
      const outstanding = ((r.total as number) || 0) - ((r.amount_paid as number) || 0);
      const issued = new Date((r.issued_at as string) || now).getTime();
      const age = (now - issued) / dayMs;
      if (age <= 30) aged0_30 += outstanding;
      else if (age <= 60) aged31_60 += outstanding;
      else if (age <= 90) aged61_90 += outstanding;
      else aged90 += outstanding;
    }

    return {
      today_appointments: todayR.count ?? 0,
      week_appointments: weekR.count ?? 0,
      month_appointments: monthR.count ?? 0,
      month_completed: completedR.count ?? 0,
      month_no_shows: noShowR.count ?? 0,
      month_cancelled: cancelledR.count ?? 0,
      month_production,
      month_collections,
      by_treatment,
      by_source,
      aged_receivables: { "0-30": aged0_30, "31-60": aged31_60, "61-90": aged61_90, "90+": aged90 },
      overdue_lab_cases: labR.count ?? 0,
      waiting_list_count: waitR.count ?? 0,
    } as T;
  }

  // ── Settings ──
  if (path === "/api/settings" && method === "GET") {
    const { data, error } = await supabase.from("settings").select("key, value");
    checkError({ error }, "settings");
    const out: Record<string, string> = {};
    for (const r of (data || [])) out[(r as Record<string, unknown>).key as string] = (r as Record<string, unknown>).value as string;
    return { settings: out } as T;
  }
  if (path === "/api/settings" && method === "PUT") {
    const entries = Object.entries(body as Record<string, unknown>).filter(([, v]) => v !== undefined && v !== null);
    const rows = entries.map(([key, value]) => ({ key, value: String(value), updated_at: nowStr() }));
    if (rows.length) {
      const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
      checkError({ error }, "settings upsert");
    }
    const { data } = await supabase.from("settings").select("key, value");
    const out: Record<string, string> = {};
    for (const r of (data || [])) out[(r as Record<string, unknown>).key as string] = (r as Record<string, unknown>).value as string;
    return { settings: out } as T;
  }

  // ── Health ──
  if (path === "/api/health" && method === "GET") {
    return { ok: true } as T;
  }

  // ── Modules (superadmin) ──
  if (path === "/api/modules" && method === "GET") {
    const { data, error } = await supabase.from("modules").select("*").order("sort_order");
    checkError({ error }, "modules");
    return { modules: data } as T;
  }
  if (path.startsWith("/api/modules/") && method === "PUT") {
    const id = parseInt(path.split("/")[3], 10);
    const d = body as Record<string, unknown>;
    const { data, error } = await supabase.from("modules").update({
      enabled: d.enabled,
      updated_at: nowStr(),
    }).eq("id", id).select("*").single();
    checkError({ error }, "module update");
    return { module: data } as T;
  }

  // ── System logs (superadmin) ──
  if (path === "/api/system-logs" && method === "GET") {
    const qs = path.split("?")[1] || "";
    const params = new URLSearchParams(qs);
    const level = params.get("level");
    const limit = parseInt(params.get("limit") || "200", 10);
    let q = supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(limit);
    if (level && level !== "all") q = q.eq("level", level);
    const { data, error } = await q;
    checkError({ error }, "system logs");
    return { logs: data } as T;
  }
  if (path === "/api/system-logs" && method === "POST") {
    const d = body as Record<string, unknown>;
    const { data, error } = await supabase.from("system_logs").insert({
      level: d.level ?? "info",
      category: d.category ?? "system",
      message: d.message,
      user_email: d.user_email ?? null,
      metadata: d.metadata ?? {},
    }).select("*").single();
    checkError({ error }, "log insert");
    return { log: data } as T;
  }
  if (path.startsWith("/api/system-logs/") && method === "DELETE") {
    const id = parseInt(path.split("/")[3], 10);
    const { error } = await supabase.from("system_logs").delete().eq("id", id);
    checkError({ error }, "log delete");
    return { ok: true } as T;
  }

  // ── Profiles (superadmin) ──
  if (path === "/api/profiles" && method === "GET") {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    checkError({ error }, "profiles");
    return { profiles: data } as T;
  }
  if (path.startsWith("/api/profiles/") && method === "PUT") {
    const id = path.split("/")[3];
    const d = body as Record<string, unknown>;
    const { data, error } = await supabase.from("profiles").update({
      role: d.role,
      active: d.active,
      full_name: d.full_name,
      updated_at: nowStr(),
    }).eq("id", id).select("*").single();
    checkError({ error }, "profile update");
    return { profile: data } as T;
  }

  throw new Error(`Unhandled API route: ${method} ${path}`);
}
