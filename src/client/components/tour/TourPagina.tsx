import { useMemo } from "react";
import type { Route } from "@/hooks/use-router";
import { TOURS } from "./tours";
import { useSeccionTour, useTour, abrirTourActual } from "./uso-tour";
import { Tour, BotonAyudaTour } from "./Tour";

/** Rutas con parámetro que se mapean a un id fijo de tour. */
const RUTAS_PARAMETRICAS: { patron: RegExp; id: string }[] = [
  { patron: /^\/patients\/\d+$/, id: "paciente" },
];

/** Id base del tour según la ruta (sin pestaña). Null = sin tour. */
export function idBaseTour(path: string): string | null {
  if (path === "/" || path === "/dashboard") return "dashboard";
  if (path === "/agenda") return "agenda";
  if (path === "/patients") return "pacientes";
  if (path === "/lab") return "laboratorio";
  if (path === "/settings") return "configuracion";
  if (path === "/admin") return "admin";
  for (const { patron, id } of RUTAS_PARAMETRICAS) {
    if (patron.test(path)) return id;
  }
  return null;
}

/**
 * Anfitrión del tour: resuelve el id desde la ruta (ruta:pestaña con
 * ?tab= o con la sección publicada vía useSeccionTour) y muestra el
 * Tour + el botón ❔. Si el id no tiene pasos, no muestra nada.
 */
export function TourPagina({ route, path }: { route: Route; path: string }) {
  const [seccion] = useSeccionTour();

  const id = useMemo(() => {
    const base = idBaseTour(path);
    if (!base) return null;
    let tab: string | null = null;
    try {
      tab = new URLSearchParams(window.location.search).get("tab");
    } catch {
      tab = null;
    }
    const seccionEfectiva = tab ?? seccion;
    if (seccionEfectiva) {
      const conSeccion = `${base}:${seccionEfectiva}`;
      if (TOURS[conSeccion]) return conSeccion;
    }
    return base;
  }, [path, seccion]);

  const pasos = id ? (TOURS[id] ?? []) : [];
  const tour = useTour(id, pasos, true);

  if (!id || pasos.length === 0) return null;
  return (
    <>
      <Tour tour={tour} />
      <BotonAyudaTour onAbrir={abrirTourActual} />
    </>
  );
}
