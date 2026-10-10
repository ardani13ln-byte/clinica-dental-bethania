/** Comprime una imagen en el navegador: máx 1600px por lado, JPEG 80%.
 *  Una foto de celular (~3-5 MB) queda en ~200-400 KB. */

const MAX_LADO = 1600;
const CALIDAD = 0.8;
const MAX_ENTRADA_BYTES = 15 * 1024 * 1024;

export async function comprimirImagen(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }
  if (file.size > MAX_ENTRADA_BYTES) {
    throw new Error("La imagen supera 15 MB.");
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("No se pudo leer la imagen.");

  const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("No se pudo procesar la imagen.");
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", CALIDAD),
  );
  if (!blob) throw new Error("No se pudo comprimir la imagen.");
  return blob;
}
