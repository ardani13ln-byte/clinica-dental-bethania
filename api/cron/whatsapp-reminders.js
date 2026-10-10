import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";

function formatPhone(phone) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 8 && !digits.startsWith("502")) {
    digits = "502" + digits;
  }
  return digits;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// Las citas se guardan como texto en hora local GT sin zona ("2026-10-11T09:00:00").
// Formatear directo del texto: new Date() en servidor UTC desplazaria 6 horas.
function partesGT(iso) {
  const m = String(iso).match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, hh, mm] = m.map(Number);
  const dia = DIAS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
  const h12 = hh % 12 || 12;
  const ampm = hh < 12 ? "a. m." : "p. m.";
  return { dia, fecha: d, mes: MESES[mo - 1], hora: `${h12}:${String(mm).padStart(2, "0")} ${ampm}` };
}

function formatDate(startTime) {
  const p = partesGT(startTime);
  if (!p) return String(startTime);
  return `${p.dia} ${p.fecha} de ${p.mes} a las ${p.hora}`;
}

// Fecha YYYY-MM-DD en America/Guatemala.
function hoyGT() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guatemala", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t) => partes.find((p) => p.type === t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST" && req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const authHeader = req.headers["authorization"];
    // Fail-closed: sin secreto configurado nadie entra (antes "Bearer undefined" abría).
    if (!process.env.CRON_SECRET) {
      res.status(500).json({ error: "Cron no configurado" });
      return;
    }
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Sin service key no hay acceso elevado: fallar en vez de degradar a anon.
    if (!SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      res.status(500).json({ error: "Cron no configurado" });
      return;
    }

    const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Ventana de "manana" en America/Guatemala (columna timestamptz: limites UTC explicitos).
  const [y, m, dd] = hoyGT().split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, dd, 12)); // mediodia UTC: fecha segura
  const f = (d) => d.toISOString().slice(0, 10);
  const mananaGT = f(new Date(base.getTime() + 86400000));
  const pasadaGT = f(new Date(base.getTime() + 2 * 86400000));
  const iniUTC = new Date(base.getTime() + 86400000 - 6 * 3600 * 1000).toISOString();
  const finUTC = new Date(base.getTime() + 2 * 86400000 - 6 * 3600 * 1000).toISOString();

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("id, start_time, end_time, status, kind, patient_id, treatment_type_id")
    .gte("start_time", iniUTC)
    .lt("start_time", finUTC)
    .eq("kind", "patient")
    .neq("status", "cancelled");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const reminders = [];
  for (const appt of appointments || []) {
    if (!appt.patient_id) continue;

    const { data: patient } = await supabase
      .from("patients")
      .select("first_name, last_name, phone")
      .eq("id", appt.patient_id)
      .single();

    if (!patient || !patient.phone) continue;

    let treatmentName = null;
    if (appt.treatment_type_id) {
      const { data: tt } = await supabase
        .from("treatment_types")
        .select("name")
        .eq("id", appt.treatment_type_id)
        .single();
      treatmentName = tt?.name ?? null;
    }

    const patientName = `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim();
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
      sent_at: new Date().toISOString(),
      target_date: mananaGT,
      reminders_count: reminders.length,
      reminders,
    });
  } catch (err) {
    console.error("cron whatsapp:", err);
    res.status(500).json({ error: "Error interno" });
  }
}
