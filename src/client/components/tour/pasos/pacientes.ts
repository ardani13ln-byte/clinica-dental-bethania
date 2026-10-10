import type { PasoTour } from "../tipos";

const ENCABEZADO: PasoTour = {
  selector: '[data-tour="paciente-encabezado"]',
  titulo: "Datos del paciente",
  texto: "Nombre, contacto y alertas médicas. Desde aquí también puedes editar o eliminar la ficha.",
};

const PESTANAS: PasoTour = {
  selector: '[data-tour="paciente-pestanas"]',
  titulo: "Secciones de la ficha",
  texto: "Cada pestaña es una parte del expediente: resumen, seguro, carta dental, ficha, plan, notas, fotos y facturación.",
};

export const PACIENTES: Record<string, PasoTour[]> = {
  pacientes: [
    {
      titulo: "Bienvenido a Pacientes",
      texto: "Aquí están todas las fichas de la clínica. Busca, crea y abre expedientes.",
    },
    {
      selector: '[data-tour="pacientes-barra"]',
      titulo: "Encabezado",
      texto: "Título del módulo y acceso rápido a buscar y crear pacientes.",
    },
    {
      selector: '[data-tour="pacientes-buscar"]',
      titulo: "Buscar",
      texto: "Filtra por nombre, email o teléfono mientras escribes. Sin texto muestra todos.",
    },
    {
      selector: '[data-tour="pacientes-nuevo"]',
      titulo: "Nuevo paciente",
      texto: "Registra un paciente con sus datos de contacto y alertas médicas. Queda listo para agendar.",
    },
    {
      selector: '[data-tour="pacientes-tabla"]',
      titulo: "Lista de pacientes",
      texto: "Toca una fila para abrir su ficha completa: tratamientos, notas y facturas.",
    },
  ],
  paciente: [
    {
      titulo: "Ficha del paciente",
      texto: "Todo el expediente en un solo lugar, organizado por secciones.",
    },
    ENCABEZADO,
    PESTANAS,
    {
      selector: '[data-tour="paciente-contacto"]',
      titulo: "Contacto",
      texto: "Datos de contacto y botón de WhatsApp para escribirle directo al paciente.",
    },
  ],
  "paciente:resumen": [
    {
      titulo: "Resumen del paciente",
      texto: "Vista general: contacto y estado del expediente.",
    },
    ENCABEZADO,
    PESTANAS,
    {
      selector: '[data-tour="paciente-contacto"]',
      titulo: "Contacto",
      texto: "Teléfono, email y dirección, más el botón de WhatsApp para contactarlo.",
    },
  ],
  "paciente:seguro": [
    {
      titulo: "Seguro del paciente",
      texto: "Planes de seguro registrados en su expediente.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="paciente-seguro"]',
      titulo: "Planes de seguro",
      texto: "Agrega los seguros del paciente con cobertura y vigencia. Se usan al facturar.",
    },
    PESTANAS,
  ],
  "paciente:carta": [
    {
      titulo: "Carta dental",
      texto: "El mapa de la boca: estado de cada diente.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="paciente-carta"]',
      titulo: "Odontograma",
      texto: "Toca un diente para registrar su condición. Lo marcado aquí guía el plan de tratamiento.",
    },
    PESTANAS,
  ],
  "paciente:ficha": [
    {
      titulo: "Ficha de tratamiento",
      texto: "Piezas a tratar, tratamientos y observaciones en una vista.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="paciente-ficha-mapa"]',
      titulo: "Mapa dental",
      texto: "Toca una pieza para ver sus tratamientos y agregar nuevos. Lo azul ya está en plan.",
    },
    {
      selector: '[data-tour="paciente-ficha-lista"]',
      titulo: "Tratamientos y observaciones",
      texto: "La ficha agrupada por pieza con estados y montos, más las observaciones generales. Se puede imprimir.",
    },
    PESTANAS,
  ],
  "paciente:plan": [
    {
      titulo: "Plan de tratamiento",
      texto: "Los tratamientos propuestos y su avance.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="paciente-plan"]',
      titulo: "Tratamientos del plan",
      texto: "Agrega tratamientos con costo y ve el total planificado. Al completarlos se reflejan en facturación.",
    },
    PESTANAS,
  ],
  "paciente:notas": [
    {
      titulo: "Notas clínicas",
      texto: "Lo que el odontólogo registra en cada visita.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="paciente-notas"]',
      titulo: "Historial de notas",
      texto: "Cada nota queda con fecha y autor. Escribe una nueva después de cada atención.",
    },
    PESTANAS,
  ],
  "paciente:fotos": [
    {
      titulo: "Fotos del tratamiento",
      texto: "Evidencia visual del antes y después.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="paciente-fotos"]',
      titulo: "Galería de fotos",
      texto: "Sube fotos que se comprimen solas al guardar. Toca una para verla en grande.",
    },
    PESTANAS,
  ],
  "paciente:facturacion": [
    {
      titulo: "Facturación del paciente",
      texto: "Facturas, pagos y saldos pendientes.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="paciente-facturas"]',
      titulo: "Facturas y pagos",
      texto: "Crea facturas desde el plan, registra abonos y controla el saldo. Los pendientes alimentan las cuentas por cobrar.",
    },
    PESTANAS,
  ],
};
