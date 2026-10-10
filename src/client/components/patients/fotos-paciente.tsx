import { useEffect, useState } from "react";
import { Plus, Trash2, X, ImagePlus } from "lucide-react";
import { api } from "@/api";
import { useApp } from "@/context";
import { supabase } from "@/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { comprimirImagen } from "@/lib/imagenes";
import type { FotoTratamiento } from "@/types";

function rutaFoto(patientId: number, nombre: string): string {
  const limpio = nombre.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(0, 60);
  return `pacientes/${patientId}/${Date.now()}-${limpio || "foto"}.jpg`;
}

export function FotosPaciente({ patientId }: { patientId: number }) {
  const app = useApp();
  const [fotos, setFotos] = useState<FotoTratamiento[]>([]);
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [ampliada, setAmpliada] = useState<FotoTratamiento | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api<{ fotos: FotoTratamiento[] }>("GET", `/api/patients/${patientId}/fotos`);
        setFotos(data.fotos || []);
      } catch (err) {
        app.setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, app]);

  // URLs firmadas (1 hora) para el bucket privado.
  useEffect(() => {
    if (fotos.length === 0) return;
    let cancelado = false;
    (async () => {
      const entradas: Record<number, string> = {};
      await Promise.all(
        fotos.map(async (f) => {
          const { data } = await supabase.storage.from("expedientes").createSignedUrl(f.storage_path, 3600);
          if (data?.signedUrl) entradas[f.id] = data.signedUrl;
        }),
      );
      if (!cancelado) setUrls(entradas);
    })();
    return () => {
      cancelado = true;
    };
  }, [fotos]);

  async function subir(e: React.FormEvent) {
    e.preventDefault();
    const input = document.getElementById("foto-input") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const blob = await comprimirImagen(file);
      const path = rutaFoto(patientId, file.name);
      const { error: upError } = await supabase.storage.from("expedientes").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (upError) throw new Error(upError.message);
      const res = await api<{ foto: FotoTratamiento }>("POST", "/api/fotos-tratamiento", {
        patient_id: patientId,
        storage_path: path,
        descripcion: descripcion.trim() || null,
      });
      setFotos((prev) => [res.foto, ...prev]);
      setDescripcion("");
      if (input) input.value = "";
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setSubiendo(false);
    }
  }

  async function remove(f: FotoTratamiento) {
    if (!confirm("¿Eliminar esta foto?")) return;
    try {
      await api("DELETE", `/api/fotos-tratamiento/${f.id}`);
      setFotos((prev) => prev.filter((x) => x.id !== f.id));
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-4" data-tour="paciente-fotos">
      <Card>
        <CardHeader>
          <CardTitle>Agregar foto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={subir} className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="foto-input">Imagen (se comprime automáticamente)</Label>
              <Input id="foto-input" type="file" accept="image/*" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="foto-desc">Descripción</Label>
              <Input
                id="foto-desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Corona molar superior, antes del tratamiento"
              />
            </div>
            <Button type="submit" disabled={subiendo}>
              <ImagePlus className="h-4 w-4" />
              {subiendo ? "Subiendo…" : "Subir foto"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : fotos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aún no hay fotos de tratamientos.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((f) => (
            <Card key={f.id} className="overflow-hidden">
              <button type="button" onClick={() => setAmpliada(f)} className="block w-full">
                {urls[f.id] ? (
                  <img src={urls[f.id]} alt={f.descripcion || "Foto de tratamiento"} className="aspect-square w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">
                    Cargando…
                  </div>
                )}
              </button>
              <div className="flex items-start gap-2 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{f.descripcion || "Sin descripción"}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(f.created_at)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(f)} aria-label="Eliminar">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={ampliada !== null} onOpenChange={(o) => !o && setAmpliada(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{ampliada?.descripcion || "Foto de tratamiento"}</span>
              <Button variant="ghost" size="icon" onClick={() => setAmpliada(null)} aria-label="Cerrar">
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {ampliada && urls[ampliada.id] && (
            <img src={urls[ampliada.id]} alt={ampliada.descripcion || "Foto de tratamiento"} className="max-h-[70vh] w-full rounded-md object-contain" />
          )}
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        <Plus className="mr-1 inline h-3 w-3" />
        Promedio estimado: 2 fotos por paciente (~600 KB). Revisa el espacio del proyecto en Supabase → Storage.
      </p>
    </div>
  );
}
