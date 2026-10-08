import type { PasoTour } from "../tipos";

const ENCABEZADO: PasoTour = {
  selector: '[data-tour="admin-encabezado"]',
  titulo: "Administración",
  texto: "Gestión del sistema: usuarios, módulos y bitácora. También enlaza la documentación de la API.",
};

const PESTANAS: PasoTour = {
  selector: '[data-tour="admin-pestanas"]',
  titulo: "Secciones",
  texto: "Usuarios para cuentas y permisos, Módulos para el catálogo y Logs para la actividad del sistema.",
};

export const ADMIN: Record<string, PasoTour[]> = {
  admin: [
    {
      titulo: "Bienvenido a Administración",
      texto: "Control del sistema y de quién puede usar cada parte.",
    },
    ENCABEZADO,
    PESTANAS,
    {
      selector: '[data-tour="admin-usuarios"]',
      titulo: "Usuarios y permisos",
      texto: "Crea cuentas, asigna roles y activa o desactiva accesos. Expande un usuario para elegir sus módulos.",
      opcional: true,
    },
  ],
  "admin:usuarios": [
    {
      titulo: "Usuarios del sistema",
      texto: "Cuentas, roles y accesos de la clínica.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="admin-usuarios"]',
      titulo: "Lista de usuarios",
      texto: "Cambia el rol, activa o desactiva cuentas. Al expandir un usuario eliges qué módulos puede ver.",
      opcional: true,
    },
    PESTANAS,
  ],
  "admin:modulos": [
    {
      titulo: "Catálogo de módulos",
      texto: "Las partes del sistema que se pueden asignar.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="admin-modulos"]',
      titulo: "Módulos disponibles",
      texto: "Lista de módulos como Agenda o Laboratorio. La asignación por usuario se hace en la pestaña Usuarios.",
      opcional: true,
    },
    PESTANAS,
  ],
  "admin:logs": [
    {
      titulo: "Bitácora del sistema",
      texto: "Registro de lo que pasa en la clínica digital.",
    },
    ENCABEZADO,
    {
      selector: '[data-tour="admin-logs"]',
      titulo: "Buscar y filtrar",
      texto: "Filtra por nivel y busca por texto para auditar accesos, cambios y errores. También puedes borrar entradas viejas.",
      opcional: true,
    },
    PESTANAS,
  ],
};
