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

export function buildWhatsAppUrl(
  phone: string,
  startTime: string,
  patientName: string,
  treatmentName?: string | null,
): string {
  const digits = formatPhone(phone);
  const dateStr = formatDate(startTime);
  const treatment = treatmentName ? ` para ${treatmentName}` : "";
  const message =
    `Hola ${patientName}, te recordamos tu cita en Clínica Dental Bethania${treatment}.\n\n` +
    `📅 ${dateStr}\n\n` +
    `Por favor confirma tu asistencia. Si necesitas reprogramar, avísanos con anticipación.\n\n` +
    `¡Gracias! 🦷`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
