import type { PasoTour } from "../tipos";

export const AGENDA: Record<string, PasoTour[]> = {
  agenda: [
    {
      titulo: "Bienvenido a la Agenda",
      texto: "Aquí se organiza el día de la clínica: citas por consultorio y pendientes por agendar.",
    },
    {
      selector: '[data-tour="agenda-barra"]',
      titulo: "Fecha y navegación",
      texto: "Cambia de día con las flechas, vuelve a hoy con el botón Hoy o salta a una fecha con el calendario.",
    },
    {
      selector: '[data-tour="agenda-nueva"]',
      titulo: "Nueva cita",
      texto: "Crea una cita eligiendo paciente, tratamiento, odontólogo y hora. También puedes hacer clic en un hueco del calendario.",
    },
    {
      selector: '[data-tour="agenda-calendario"]',
      titulo: "Calendario por consultorio",
      texto: "Cada columna es un consultorio con sus citas del día. Toca una cita para verla, editarla o cambiar su estado.",
    },
    {
      selector: '[data-tour="agenda-panel"]',
      titulo: "Lista de espera y por agendar",
      texto: "Pacientes en espera y citas pendientes de programar. Al asignarles horario salen de esta lista.",
    },
    {
      selector: '[data-tour="agenda-whatsapp"]',
      titulo: "Recordatorio por WhatsApp",
      texto: "Al abrir una cita verás el botón WhatsApp: envía al paciente su recordatorio con fecha y hora.",
      opcional: true,
    },
  ],
};
