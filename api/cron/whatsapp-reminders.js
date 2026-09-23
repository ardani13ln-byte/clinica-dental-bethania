import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_KEY;

function formatPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 8 && !digits.startsWith("502")) {
    digits = "502" + digits;
  }
  return digits;
}

function formatDate(startTime: string): string {
  const d = new Date(startTime);
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const day = days[d.getDay()];
  const date = d.getDate();
  const month = months[d.getMonth()];
  const time = d.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${day} ${date} de ${month} a las ${time}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id, start_time, end_time, status, kind,
      patients:patient_id (first_name, last_name, phone ),
      treatment_types:treatment_type_id (name)
    `)
    .gte("start_time", tomorrow.toISOString())
    .lt("start_time", dayAfter.toISOString())
    .eq("kind", "patient")
    .neq("status", "cancelled");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const reminders = [];
  for (const appt of appointments || []) {
    const patient = appt.patients;
    if (!patient || !patient.phone) continue;

    const patientName = `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim();
    const treatmentName = appt.treatment_types?.name ?? null;
    const treatment = treatmentName ? ` para ${treatmentName}` : "";
    const dateStr = formatDate(appt.start_time);

    const message =
      `Hola ${patientName}, te recordamos tu cita en Clínica Dental Bethania${treatment}.\n\n` +
      `📅 ${dateStr}\n\n` +
      `Por favor confirma tu asistencia. Si necesitas reprogramar, avísanos con anticipación.\n\n` +
      `¡Gracias! 🦷`;

    const phone = formatPhone(patient.phone);
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    reminders.push({
      appointment_id: appt.id,
      patient_name: patientName,
      phone,
      wa_url: waUrl,
      message,
    });

    await supabase.from("system_logs").insert({
      level: "info",
      category: "whatsapp_reminder",
      message: `Recordatorio WhatsApp generado para ${patientName} — cita ${dateStr}`,
      metadata: { appointment_id: appt.id, phone },
    });
  }

  res.status(200).json({
    sent_at: now.toISOString(),
    target_date: tomorrow.toISOString().slice(0, 10),
    reminders_count: reminders.length,
    reminders,
  });
}
