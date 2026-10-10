import type { PasoTour } from "../tipos";

export const DASHBOARD: Record<string, PasoTour[]> = {
  dashboard: [
    {
      titulo: "Bienvenido al Dashboard",
      texto: "Aquí ves el pulso de la clínica de un vistazo: citas, producción y pendientes.",
    },
    {
      selector: '[data-tour="dashboard-indicadores"]',
      titulo: "Indicadores",
      texto: "Citas de hoy, de la semana, producción y cobros del mes. Sirven para saber cómo va el día y el mes.",
    },
    {
      selector: '[data-tour="dashboard-citas-hoy"]',
      titulo: "Citas de hoy",
      texto: "La agenda del día ordenada por hora, con paciente, tratamiento y estado. Toca una cita para ir a la Agenda.",
    },
    {
      selector: '[data-tour="dashboard-recordatorios"]',
      titulo: "Recordatorios para mañana",
      texto: "Las citas de mañana con botón de WhatsApp cada una. Tócalo y el chat abre con el mensaje listo, sin costo.",
    },
    {
      selector: '[data-tour="dashboard-alertas"]',
      titulo: "Requiere atención",
      texto: "Pendientes que no debes dejar pasar: lista de espera, casos de laboratorio vencidos e inasistencias del mes.",
    },
    {
      selector: '[data-tour="dashboard-aceptacion"]',
      titulo: "Aceptación de planes",
      texto: "Qué porcentaje de tratamientos propuestos aceptan los pacientes, y cuáles se rechazan más.",
    },
    {
      selector: '[data-tour="dashboard-resultados"]',
      titulo: "Resultados del mes",
      texto: "Qué pasó con las citas del mes: completadas, inasistencias y canceladas. Útil para medir asistencia.",
    },
    {
      selector: '[data-tour="dashboard-cartera"]',
      titulo: "Cuentas por cobrar",
      texto: "Saldos pendientes de los pacientes agrupados por antigüedad. Los de 90+ días necesitan seguimiento.",
    },
  ],
};
