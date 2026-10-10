-- Fotos de tratamientos por paciente (Storage privado + metadata)
-- Uso estimado: 2 fotos x 300KB = 600KB por paciente

CREATE TABLE IF NOT EXISTS fotos_tratamiento (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_plan_item_id INTEGER REFERENCES treatment_plan_items(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fotos_patient ON fotos_tratamiento(patient_id);

ALTER TABLE fotos_tratamiento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_write" ON fotos_tratamiento;
CREATE POLICY "auth_read_write" ON fotos_tratamiento FOR ALL
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Bucket privado (las fotos solo se sirven con URL firmada temporal)
INSERT INTO storage.buckets (id, name, public)
VALUES ('expedientes', 'expedientes', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "auth_manage_expedientes" ON storage.objects;
CREATE POLICY "auth_manage_expedientes" ON storage.objects FOR ALL
  USING (bucket_id = 'expedientes' AND auth.uid() IS NOT NULL)
  WITH CHECK (bucket_id = 'expedientes' AND auth.uid() IS NOT NULL);
