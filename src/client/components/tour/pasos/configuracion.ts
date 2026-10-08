import type { PasoTour } from "../tipos";

const ENCABEZADO: PasoTour = {
  selector: '[data-tour="configuracion-encabezado"]',
  titulo: "Configuración",
  texto: "Aquí se definen los catálogos que usa toda la clínica: consultorios, personal, tratamientos y horarios.",
};

const PESTANAS: PasoTour = {
  selector: '[data-tour="configuracion-pestanas"]',
  titulo: "Secciones",
  texto: "Cada pestaña es un catálogo. Lo que configures aquí aparece en la Agenda y en las fichas.",
};

export const CONFIGURACION: Record<string, PasoTour[]> = {
  configuracion: [
    {
      titulo: "Bienvenido a Configuración",
      texto: "Los catálogos base de la clínica, en un solo lugar.",
    },
    ENCABEZADO,
    PESTANAS,
    {
      selector: '[data-tour="configuracion-consultorios"]',
      titulo: "Consultorios",
      texto: "Cada consultorio es una columna de la Agenda. Crea los sillones disponibles con su color.",
    },
  ],
  "configuracion:consultorios": [
    {
      titulo: "Consultorios",
      texto: "Los espacios físicos donde se atiende.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="configuracion-consultorios"]',
      titulo: "Lista de consultorios",
      texto: "Agrega, renombra o elimina consultorios. Cada uno aparece como columna en la Agenda.",
    },
    PESTANAS,
  ],
  "configuracion:odontologos": [
    {
      titulo: "Odontólogos y personal",
      texto: "Quiénes atienden en la clínica.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="configuracion-odontologos"]',
      titulo: "Lista del personal",
      texto: "Registra odontólogos, higienistas y asistentes con su rol y color. Se asignan a las citas.",
    },
    PESTANAS,
  ],
  "configuracion:tratamientos": [
    {
      titulo: "Tipos de tratamiento",
      texto: "El catálogo de servicios con duración y tarifa.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="configuracion-tratamientos"]',
      titulo: "Lista de tratamientos",
      texto: "Define cada tratamiento con su duración y precio. Se usan al agendar, planificar y facturar.",
    },
    PESTANAS,
  ],
  "configuracion:horarios": [
    {
      titulo: "Horarios de la clínica",
      texto: "Hora de apertura, cierre y duración de cada bloque.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="configuracion-horarios"]',
      titulo: "Jornada y bloques",
      texto: "Define a qué hora abre y cierra, y de cuántos minutos es cada espacio. La Agenda se dibuja con estos valores.",
    },
    PESTANAS,
  ],
};
