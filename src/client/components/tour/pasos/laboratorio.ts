import type { PasoTour } from "../tipos";

export const LABORATORIO: Record<string, PasoTour[]> = {
  laboratorio: [
    {
      titulo: "Bienvenido a Laboratorio",
      texto: "Aquí se siguen los trabajos enviados al laboratorio: coronas, puentes y más.",
    },
    {
      selector: '[data-tour="laboratorio-barra"]',
      titulo: "Encabezado",
      texto: "Título del módulo, aviso de casos vencidos y accesos a filtrar y crear.",
    },
    {
      selector: '[data-tour="laboratorio-filtro"]',
      titulo: "Filtro por estado",
      texto: "Muestra solo los casos en un estado: enviados, en laboratorio, recibidos, colocados o cancelados.",
    },
    {
      selector: '[data-tour="laboratorio-nuevo"]',
      titulo: "Nuevo caso",
      texto: "Registra un trabajo con paciente, laboratorio, tipo de caso, diente, fechas y tarifa.",
    },
    {
      selector: '[data-tour="laboratorio-tabla"]',
      titulo: "Casos y estados",
      texto: "Cada fila es un trabajo. Cambia su estado en el selector y toca el paciente para abrir su ficha. Lo vencido sale en rojo.",
    },
  ],
};
