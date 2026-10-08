import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { PasoTour } from "./tipos";

// ── Store de sección (pestaña activa) ────────────────────────────────
// Las páginas con pestañas en estado local publican aquí la activa para
// que el id del tour sea ruta:pestaña (p. ej. `paciente:plan`).

let seccionActual: string | null = null;
const seccionListeners = new Set<() => void>();

export function setSeccionTour(seccion: string | null): void {
  if (seccionActual === seccion) return;
  seccionActual = seccion;
  seccionListeners.forEach((l) => l());
}

export function useSeccionTour(): [string | null, (s: string | null) => void] {
  const seccion = useSyncExternalStore(
    (cb) => {
      seccionListeners.add(cb);
      return () => {
        seccionListeners.delete(cb);
      };
    },
    () => seccionActual,
  );
  return [seccion, setSeccionTour];
}

// ── Señal global de apertura ─────────────────────────────────────────

let openToken = 0;
const openListeners = new Set<() => void>();

/** Reabre el tour de la pantalla actual (botón ❔). */
export function abrirTourActual(): void {
  openToken++;
  openListeners.forEach((l) => l());
}

function useOpenSignal(): number {
  return useSyncExternalStore(
    (cb) => {
      openListeners.add(cb);
      return () => {
        openListeners.delete(cb);
      };
    },
    () => openToken,
  );
}

// ── Resolución de elementos ──────────────────────────────────────────

function leerClave(id: string): string {
  return `tour_${id}_v1`;
}

function yaVisto(id: string): boolean {
  try {
    return localStorage.getItem(leerClave(id)) === "1";
  } catch {
    return true; // Sin storage no se insiste.
  }
}

function marcarVisto(id: string): void {
  try {
    localStorage.setItem(leerClave(id), "1");
  } catch {
    /* Sin storage no pasa nada. */
  }
}

/** Primer elemento visible que coincida (el mismo data-tour puede estar en
 *  menú de escritorio y en cajón móvil a la vez). */
export function resolverElemento(selector: string): HTMLElement | null {
  let nodos: NodeListOf<HTMLElement>;
  try {
    nodos = document.querySelectorAll<HTMLElement>(selector);
  } catch {
    return null; // Selector inválido: nunca debe romper la página.
  }
  for (const el of nodos) {
    let r: DOMRect;
    try {
      r = el.getBoundingClientRect();
    } catch {
      continue;
    }
    if (r.width <= 0 || r.height <= 0) continue;
    let estilo: CSSStyleDeclaration;
    try {
      estilo = window.getComputedStyle(el);
    } catch {
      continue;
    }
    if (estilo.visibility === "hidden" || estilo.display === "none" || estilo.opacity === "0") continue;
    return el;
  }
  return null;
}

// ── Hook useTour ─────────────────────────────────────────────────────

export interface EstadoTour {
  abierto: boolean;
  paso: number;
  total: number;
  pasoActual: PasoTour | null;
  siguiente: () => void;
  anterior: () => void;
  cerrar: () => void;
}

export function useTour(id: string | null, pasos: PasoTour[], auto = true): EstadoTour {
  const [abierto, setAbierto] = useState(false);
  const [indice, setIndice] = useState(0);
  const openSignal = useOpenSignal();

  // Pasos con elemento visible (o sin selector). Obligatorios u opcionales:
  // lo que no está en pantalla se omite con seguridad.
  const visibles = useMemo(() => {
    if (!abierto) return [];
    return pasos.filter((p) => !p.selector || resolverElemento(p.selector) !== null);
  }, [abierto, pasos]);

  const total = visibles.length;
  const pasoActual = total > 0 ? visibles[Math.min(indice, total - 1)] : null;

  const cerrar = useCallback(() => {
    if (id) marcarVisto(id);
    setAbierto(false);
    setIndice(0);
  }, [id]);

  const siguiente = useCallback(() => {
    setIndice((i) => {
      if (i + 1 >= total) {
        if (id) marcarVisto(id);
        setAbierto(false);
        return 0;
      }
      return i + 1;
    });
  }, [id, total]);

  const anterior = useCallback(() => {
    setIndice((i) => (i > 0 ? i - 1 : i));
  }, []);

  // Apertura automática solo la primera vez por usuario/dispositivo.
  useEffect(() => {
    if (!auto || !id || pasos.length === 0) return;
    if (yaVisto(id)) return;
    const hayAlgo = pasos.some((p) => !p.selector || resolverElemento(p.selector) !== null);
    if (!hayAlgo) return;
    setIndice(0);
    setAbierto(true);
  }, [id, auto, pasos]);

  // Reapertura manual con ❔ (aunque ya se haya visto).
  const yaManejada = useMemo(() => ({ valor: openSignal }), [openSignal]);
  useEffect(() => {
    if (yaManejada.valor === 0) return;
    if (!id || pasos.length === 0) return;
    const hayAlgo = pasos.some((p) => !p.selector || resolverElemento(p.selector) !== null);
    if (!hayAlgo) return;
    setIndice(0);
    setAbierto(true);
  }, [yaManejada, id, pasos]);

  // Escape cierra.
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, cerrar]);

  return { abierto, paso: Math.min(indice, Math.max(total - 1, 0)), total, pasoActual, siguiente, anterior, cerrar };
}
