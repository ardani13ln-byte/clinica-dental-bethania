import { writeFileSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// ── Reimportar schemas de api.ts (sin el extendZodWithOpenApi) ──
const str = z.string().trim();
const optStr = z.string().trim().nullable().optional();
const optNum = z.number().nullable().optional();

const S = {
  Patient: z.object({
    first_name: str.min(1).max(100),
    last_name: str.min(1).max(100),
    date_of_birth: optStr, email: optStr, phone: optStr, address: optStr,
    medical_alerts: optStr, notes: optStr, referral_source: optStr,
  }),
  Appointment: z.object({
    patient_id: optNum, practitioner_id: optNum, operatory_id: z.number(),
    treatment_type_id: optNum, start_time: str.min(1), end_time: str.min(1),
    status: z.enum(["scheduled","confirmed","completed","cancelled","no_show","in_chair"]).optional(),
    kind: z.enum(["patient","block"]).optional(), title: optStr, notes: optStr,
  }),
  Practitioner: z.object({
    name: str.min(1).max(100),
    role: z.enum(["dentist","hygienist","assistant","receptionist"]).optional(),
    color: str.max(50).optional(), email: optStr, phone: optStr,
  }),
  TreatmentType: z.object({
    code: str.min(1).max(20), name: str.min(1).max(100),
    duration_minutes: z.number().int().min(1).max(600).optional(),
    default_fee: z.number().min(0).optional(), color: str.max(50).optional(),
  }),
  Operatory: z.object({ name: str.min(1).max(100), color: str.max(50).optional(), sort_order: z.number().int().optional() }),
  PlanItem: z.object({
    patient_id: z.number().int(), treatment_type_id: optNum, tooth: optStr, surface: optStr,
    fee: z.number().min(0).optional(),
    status: z.enum(["planned","approved","completed","cancelled"]).optional(),
    notes: optStr, sort_order: z.number().int().optional(),
  }),
  ClinicalNote: z.object({ patient_id: z.number().int(), practitioner_id: optNum, note_date: optStr, body: str.min(1) }),
  ToothCondition: z.object({ patient_id: z.number().int(), tooth: str.min(1).max(5), surface: optStr, condition: str.min(1).max(50) }),
  Invoice: z.object({
    patient_id: z.number().int(), appointment_id: optNum,
    status: z.enum(["open","paid","void","partial"]).optional(),
    total: z.number().min(0).optional(), amount_paid: z.number().min(0).optional(), notes: optStr,
  }),
  WaitingList: z.object({
    patient_id: z.number().int(), treatment_type_id: optNum, preferred_practitioner_id: optNum,
    duration_minutes: z.number().int().min(1).max(600).optional(), notes: optStr,
  }),
  ToMake: z.object({
    patient_id: z.number().int(), treatment_type_id: optNum, due_after: optStr,
    source: str.max(50).optional(), notes: optStr,
    status: z.enum(["open","done","cancelled"]).optional(),
  }),
  InsurancePlan: z.object({
    patient_id: z.number().int(),
    rank: z.enum(["primary","secondary","tertiary"]).optional(),
    carrier: str.min(1).max(100), member_id: optStr, group_id: optStr,
    subscriber_name: optStr, subscriber_dob: optStr, effective_date: optStr, term_date: optStr,
    copay: z.number().min(0).optional(), deductible_total: z.number().min(0).optional(),
    deductible_used: z.number().min(0).optional(), max_annual: z.number().min(0).optional(),
    max_used: z.number().min(0).optional(), notes: optStr,
  }),
  LabCase: z.object({
    patient_id: z.number().int(), practitioner_id: optNum, treatment_type_id: optNum,
    lab_name: str.min(1).max(100), case_type: str.min(1).max(100),
    tooth: optStr, shade: optStr, fee: z.number().min(0).optional(),
    sent_at: optStr, due_at: optStr, received_at: optStr, seated_at: optStr,
    status: z.enum(["sent","received","seated","cancelled"]).optional(), notes: optStr,
  }),
  LoginRequest: z.object({ email: str, password: str, turnstileToken: str.optional() }),
  CreateUserRequest: z.object({
    email: str, password: str.min(8), full_name: str.optional(),
    role: z.enum(["admin","dentist","hygienist","assistant","receptionist","user"]).optional(),
  }),
  Module: z.object({ id: z.number().int(), key: str, name: str, description: str.nullable(), icon: str.nullable(), enabled: z.boolean(), sort_order: z.number().int() }),
  Profile: z.object({ id: z.string().uuid(), email: str, role: z.enum(["superadmin","admin","dentist","hygienist","assistant","receptionist","user"]), full_name: str.nullable(), active: z.boolean() }),
  SystemLog: z.object({ id: z.number().int(), created_at: str, level: z.enum(["info","warning","error","critical"]), category: str, message: str, user_email: str.nullable() }),
};

// ── Convertir Zod → OpenAPI schema ──
function toSchema(zod: z.ZodType): Record<string, unknown> {
  return zodToJsonSchema(zod, { target: "openApi3" }) as Record<string, unknown>;
}

// ── Definición de rutas ──
type Method = "get" | "post" | "put" | "delete";
interface RouteDef {
  path: string; method: Method; tag: string; summary: string;
  description?: string; body?: z.ZodType; secure?: boolean;
  params?: Record<string, string>; query?: Record<string, string>;
}

const routes: RouteDef[] = [
  // Auth
  { path: "/api/auth/login", method: "post", tag: "Auth", summary: "Iniciar sesión", body: S.LoginRequest, description: "Autentica, setea cookies HttpOnly, devuelve access_token." },
  { path: "/api/auth/logout", method: "post", tag: "Auth", summary: "Cerrar sesión" },
  { path: "/api/auth/me", method: "get", tag: "Auth", summary: "Usuario actual" },
  { path: "/api/auth/create-user", method: "post", tag: "Auth", summary: "Crear usuario (superadmin)", body: S.CreateUserRequest, secure: true },

  // Pacientes
  { path: "/api/patients", method: "get", tag: "Pacientes", summary: "Listar pacientes", query: { q: "Buscar" } },
  { path: "/api/patients", method: "post", tag: "Pacientes", summary: "Crear paciente", body: S.Patient },
  { path: "/api/patients/{id}", method: "get", tag: "Pacientes", summary: "Obtener paciente", params: { id: "ID" } },
  { path: "/api/patients/{id}", method: "put", tag: "Pacientes", summary: "Actualizar paciente", params: { id: "ID" }, body: S.Patient },
  { path: "/api/patients/{id}", method: "delete", tag: "Pacientes", summary: "Eliminar paciente", params: { id: "ID" } },
  { path: "/api/patients/{id}/treatment-plan", method: "get", tag: "Plan", summary: "Plan del paciente", params: { id: "ID" } },
  { path: "/api/patients/{id}/notes", method: "get", tag: "Notas", summary: "Notas del paciente", params: { id: "ID" } },
  { path: "/api/patients/{id}/tooth-chart", method: "get", tag: "Carta dental", summary: "Carta dental", params: { id: "ID" } },
  { path: "/api/patients/{id}/invoices", method: "get", tag: "Facturación", summary: "Facturas del paciente", params: { id: "ID" } },
  { path: "/api/patients/{id}/insurance", method: "get", tag: "Facturación", summary: "Seguros del paciente", params: { id: "ID" } },

  // Citas
  { path: "/api/appointments", method: "get", tag: "Citas", summary: "Listar citas", query: { date: "Fecha", patient_id: "ID paciente" } },
  { path: "/api/appointments", method: "post", tag: "Citas", summary: "Crear cita", body: S.Appointment },
  { path: "/api/appointments/{id}", method: "put", tag: "Citas", summary: "Actualizar cita", params: { id: "ID" }, body: S.Appointment },
  { path: "/api/appointments/{id}", method: "delete", tag: "Citas", summary: "Eliminar cita", params: { id: "ID" } },

  // Practicantes
  { path: "/api/practitioners", method: "get", tag: "Practicantes", summary: "Listar" },
  { path: "/api/practitioners", method: "post", tag: "Practicantes", summary: "Crear", body: S.Practitioner },
  { path: "/api/practitioners/{id}", method: "put", tag: "Practicantes", summary: "Actualizar", params: { id: "ID" }, body: S.Practitioner },
  { path: "/api/practitioners/{id}", method: "delete", tag: "Practicantes", summary: "Eliminar", params: { id: "ID" } },

  // Tratamientos
  { path: "/api/treatment-types", method: "get", tag: "Tratamientos", summary: "Listar" },
  { path: "/api/treatment-types", method: "post", tag: "Tratamientos", summary: "Crear", body: S.TreatmentType },
  { path: "/api/treatment-types/{id}", method: "put", tag: "Tratamientos", summary: "Actualizar", params: { id: "ID" }, body: S.TreatmentType },
  { path: "/api/treatment-types/{id}", method: "delete", tag: "Tratamientos", summary: "Eliminar", params: { id: "ID" } },

  // Consultorios
  { path: "/api/operatories", method: "get", tag: "Consultorios", summary: "Listar" },
  { path: "/api/operatories", method: "post", tag: "Consultorios", summary: "Crear", body: S.Operatory },
  { path: "/api/operatories/{id}", method: "put", tag: "Consultorios", summary: "Actualizar", params: { id: "ID" }, body: S.Operatory },
  { path: "/api/operatories/{id}", method: "delete", tag: "Consultorios", summary: "Eliminar", params: { id: "ID" } },

  // Plan
  { path: "/api/treatment-plan-items", method: "post", tag: "Plan", summary: "Crear ítem", body: S.PlanItem },
  { path: "/api/treatment-plan-items/{id}", method: "put", tag: "Plan", summary: "Actualizar ítem", params: { id: "ID" }, body: S.PlanItem },
  { path: "/api/treatment-plan-items/{id}", method: "delete", tag: "Plan", summary: "Eliminar ítem", params: { id: "ID" } },

  // Notas
  { path: "/api/clinical-notes", method: "post", tag: "Notas", summary: "Crear nota", body: S.ClinicalNote },
  { path: "/api/clinical-notes/{id}", method: "delete", tag: "Notas", summary: "Eliminar nota", params: { id: "ID" } },

  // Carta dental
  { path: "/api/tooth-conditions", method: "post", tag: "Carta dental", summary: "Crear condición", body: S.ToothCondition },
  { path: "/api/tooth-conditions/{id}", method: "delete", tag: "Carta dental", summary: "Eliminar condición", params: { id: "ID" } },

  // Facturación
  { path: "/api/invoices", method: "post", tag: "Facturación", summary: "Crear factura", body: S.Invoice },
  { path: "/api/invoices/{id}", method: "put", tag: "Facturación", summary: "Actualizar", params: { id: "ID" }, body: S.Invoice },
  { path: "/api/invoices/{id}", method: "delete", tag: "Facturación", summary: "Eliminar", params: { id: "ID" } },
  { path: "/api/insurance-plans", method: "post", tag: "Facturación", summary: "Crear seguro", body: S.InsurancePlan },
  { path: "/api/insurance-plans/{id}", method: "put", tag: "Facturación", summary: "Actualizar seguro", params: { id: "ID" }, body: S.InsurancePlan },
  { path: "/api/insurance-plans/{id}", method: "delete", tag: "Facturación", summary: "Eliminar seguro", params: { id: "ID" } },

  // Laboratorio
  { path: "/api/lab-cases", method: "get", tag: "Laboratorio", summary: "Listar casos", query: { status: "Estado" } },
  { path: "/api/lab-cases", method: "post", tag: "Laboratorio", summary: "Crear caso", body: S.LabCase },
  { path: "/api/lab-cases/{id}", method: "put", tag: "Laboratorio", summary: "Actualizar", params: { id: "ID" }, body: S.LabCase },
  { path: "/api/lab-cases/{id}", method: "delete", tag: "Laboratorio", summary: "Eliminar", params: { id: "ID" } },

  // Lista de espera
  { path: "/api/waiting-list", method: "get", tag: "Lista de espera", summary: "Listar" },
  { path: "/api/waiting-list", method: "post", tag: "Lista de espera", summary: "Agregar", body: S.WaitingList },
  { path: "/api/waiting-list/{id}", method: "delete", tag: "Lista de espera", summary: "Eliminar", params: { id: "ID" } },

  // Citas por hacer
  { path: "/api/appointments-to-make", method: "get", tag: "Citas por hacer", summary: "Listar", query: { source: "Origen" } },
  { path: "/api/appointments-to-make", method: "post", tag: "Citas por hacer", summary: "Crear", body: S.ToMake },
  { path: "/api/appointments-to-make/{id}", method: "put", tag: "Citas por hacer", summary: "Actualizar", params: { id: "ID" }, body: S.ToMake },
  { path: "/api/appointments-to-make/{id}", method: "delete", tag: "Citas por hacer", summary: "Eliminar", params: { id: "ID" } },

  // Reportes
  { path: "/api/reports/summary", method: "get", tag: "Reportes", summary: "Resumen de producción" },

  // Configuración
  { path: "/api/settings", method: "get", tag: "Configuración", summary: "Obtener" },
  { path: "/api/settings", method: "put", tag: "Configuración", summary: "Actualizar" },

  // Administración
  { path: "/api/modules", method: "get", tag: "Admin", summary: "Listar módulos", secure: true },
  { path: "/api/modules/{id}", method: "put", tag: "Admin", summary: "Actualizar módulo", secure: true, params: { id: "ID" } },
  { path: "/api/user-modules", method: "get", tag: "Admin", summary: "Módulos del usuario actual", secure: true },
  { path: "/api/user-modules", method: "put", tag: "Admin", summary: "Actualizar visibilidad", secure: true },
  { path: "/api/user-modules/{userId}", method: "get", tag: "Admin", summary: "Módulos de un usuario", secure: true, params: { userId: "UUID" } },
  { path: "/api/profiles", method: "get", tag: "Admin", summary: "Listar usuarios", secure: true },
  { path: "/api/profiles/{id}", method: "put", tag: "Admin", summary: "Actualizar usuario", secure: true, params: { id: "UUID" } },
  { path: "/api/system-logs", method: "get", tag: "Admin", summary: "Listar logs", secure: true, query: { level: "Nivel", limit: "Límite" } },
  { path: "/api/system-logs", method: "post", tag: "Admin", summary: "Crear log", secure: true },
  { path: "/api/system-logs/{id}", method: "delete", tag: "Admin", summary: "Eliminar log", secure: true, params: { id: "ID" } },
];

// ── Construir spec ──
const schemaNames = ["Patient","Appointment","Practitioner","TreatmentType","Operatory","PlanItem","ClinicalNote","ToothCondition","Invoice","WaitingList","ToMake","InsurancePlan","LabCase","LoginRequest","CreateUserRequest","Module","Profile","SystemLog"] as const;

const components: Record<string, Record<string, unknown>> = {};
for (const name of schemaNames) {
  components[name] = toSchema(S[name as keyof typeof S]);
}

const paths: Record<string, Record<string, unknown>> = {};
for (const r of routes) {
  if (!paths[r.path]) paths[r.path] = {};
  const op: Record<string, unknown> = {
    tags: [r.tag],
    summary: r.summary,
    description: r.description || "",
    responses: {
      "200": { description: "OK" },
      "401": { description: "No autorizado" },
      "403": { description: "Prohibido" },
    },
  };
  if (r.secure) op.security = [{ cookieAuth: [] }];
  if (r.body) op.requestBody = { required: true, content: { "application/json": { schema: toSchema(r.body) } } };
  if (r.params) {
    op.parameters = Object.entries(r.params).map(([name, desc]) => ({ name, in: "path", required: true, description: desc, schema: { type: name.includes("id") && name !== "id" ? "string" : "integer" } }));
  }
  if (r.query) {
    const qp = Object.entries(r.query).map(([name, desc]) => ({ name, in: "query", description: desc, schema: { type: "string" } }));
    op.parameters = [...(op.parameters as unknown[] || []), ...qp];
  }
  paths[r.path][r.method] = op;
}

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Clínica Dental Bethania — API",
    description: "Generada automáticamente desde schemas de Zod.\n\n**Base URL:** https://clinica-dental-bethania.vercel.app",
    version: "1.0.0",
    contact: { email: "admin@clinicabethania.com" },
  },
  servers: [
    { url: "https://clinica-dental-bethania.vercel.app", description: "Producción" },
    { url: "http://localhost:5173", description: "Desarrollo" },
  ],
  tags: [
    { name: "Auth" }, { name: "Pacientes" }, { name: "Citas" }, { name: "Practicantes" },
    { name: "Tratamientos" }, { name: "Consultorios" }, { name: "Plan" }, { name: "Notas" },
    { name: "Carta dental" }, { name: "Facturación" }, { name: "Laboratorio" },
    { name: "Lista de espera" }, { name: "Citas por hacer" }, { name: "Reportes" },
    { name: "Configuración" }, { name: "Admin" },
  ],
  paths,
  components: {
    schemas: components,
    securitySchemes: { cookieAuth: { type: "apiKey", in: "cookie", name: "sb-access-token" } },
  },
};

const outPath = resolve(process.cwd(), "public/openapi.json");
writeFileSync(outPath, JSON.stringify(spec, null, 2), "utf-8");
console.log(`✓ OpenAPI spec generada: ${outPath}`);
console.log(`  ${Object.keys(paths).length} paths, ${schemaNames.length} schemas, ${routes.length} operations`);
