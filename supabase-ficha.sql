-- Observaciones generales de la ficha de tratamiento del paciente
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ficha_observaciones TEXT;
