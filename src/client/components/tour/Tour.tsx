import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolverElemento, type EstadoTour } from "./uso-tour";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function rectDe(selector: string | undefined): Rect | null {
  if (!selector) return null;
  const el = resolverElemento(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function Tour({ tour }: { tour: EstadoTour }) {
  const { abierto, paso, total, pasoActual, siguiente, anterior, cerrar } = tour;
  const [rect, setRect] = useState<Rect | null>(null);

  // Lleva el elemento a la vista al cambiar de paso.
  useEffect(() => {
    if (!abierto || !pasoActual?.selector) return;
    const el = resolverElemento(pasoActual.selector);
    try {
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } catch {
      /* scroll opcional */
    }
  }, [abierto, pasoActual]);

  // Recalcula el recuadro al cambiar de paso y al mover/redimensionar.
  useEffect(() => {
    if (!abierto) {
      setRect(null);
      return;
    }
    const actualizar = () => setRect(rectDe(pasoActual?.selector));
    actualizar();
    const t = window.setTimeout(actualizar, 120); // tras el scroll suave
    window.addEventListener("resize", actualizar);
    window.addEventListener("scroll", actualizar, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", actualizar);
      window.removeEventListener("scroll", actualizar, true);
    };
  }, [abierto, pasoActual]);

  if (!abierto || !pasoActual) return null;

  const esUltimo = paso >= total - 1;
  const conElemento = rect !== null && pasoActual.selector !== undefined;

  // Tarjeta junto al elemento (debajo si cabe, si no encima), o centrada.
  let estiloTarjeta: React.CSSProperties;
  if (conElemento && rect) {
    const ancho = Math.min(340, window.innerWidth - 32);
    const izquierda = Math.min(Math.max(16, rect.left), window.innerWidth - ancho - 16);
    const cabeDebajo = rect.top + rect.height + 16 + 220 < window.innerHeight;
    estiloTarjeta = cabeDebajo
      ? { top: rect.top + rect.height + 12, left: izquierda, width: ancho }
      : { top: Math.max(16, rect.top - 12 - 220), left: izquierda, width: ancho };
  } else {
    estiloTarjeta = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: Math.min(360, window.innerWidth - 32),
    };
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" aria-live="polite">
      {conElemento && rect && (
        <div
          className="absolute rounded-lg ring-2 ring-primary transition-all duration-200"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.45)",
          }}
        />
      )}
      {!conElemento && <div className="absolute inset-0 bg-black/45" />}

      <div
        role="dialog"
        aria-label={pasoActual.titulo}
        className="pointer-events-auto absolute rounded-xl border bg-card p-4 text-card-foreground shadow-xl"
        style={estiloTarjeta}
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold">{pasoActual.titulo}</h3>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar tutorial"
            className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{pasoActual.texto}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            {paso + 1} de {total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={anterior}
              disabled={paso === 0}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium",
                paso === 0
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-accent",
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>
            <button
              type="button"
              onClick={siguiente}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              {esUltimo ? "Terminar" : "Siguiente"}
              {!esUltimo && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Botón ❔ fijo para reabrir el tour de la pantalla actual. */
export function BotonAyudaTour({ onAbrir }: { onAbrir: () => void }) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label="Ver tutorial de esta pantalla"
      title="Ver tutorial de esta pantalla"
      className="fixed bottom-6 left-6 z-[80] flex h-11 w-11 items-center justify-center rounded-full border bg-card text-lg shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      ❔
    </button>
  );
}
