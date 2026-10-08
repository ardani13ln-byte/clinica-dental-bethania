import type { PasoTour } from "./tipos";
import { DASHBOARD } from "./pasos/dashboard";
import { AGENDA } from "./pasos/agenda";
import { PACIENTES } from "./pasos/pacientes";
import { LABORATORIO } from "./pasos/laboratorio";
import { CONFIGURACION } from "./pasos/configuracion";
import { ADMIN } from "./pasos/admin";

export const TOURS: Record<string, PasoTour[]> = {
  ...DASHBOARD,
  ...AGENDA,
  ...PACIENTES,
  ...LABORATORIO,
  ...CONFIGURACION,
  ...ADMIN,
};
