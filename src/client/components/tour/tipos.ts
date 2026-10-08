export interface PasoTour {
  /** Selector CSS del elemento a resaltar (normalmente `[data-tour="..."]`).
   *  Sin selector, la tarjeta se muestra centrada como bienvenida. */
  selector?: string;
  titulo: string;
  /** 1–2 frases: qué es y para qué sirve, sin jerga. */
  texto: string;
  /** Pasos que solo ven algunos roles. Si el elemento no existe, se salta. */
  opcional?: boolean;
}
