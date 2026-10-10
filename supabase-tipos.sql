-- Tipos correctos: dinero numeric(12,2), eventos timestamptz, fechas DATE.
-- Los textos existentes estan en hora local GT: se interpretan con TIME ZONE GT.
-- Traslapes: EXCLUDE impide doble reserva del mismo consultorio.
BEGIN;
SET LOCAL TIME ZONE 'America/Guatemala';

-- Los defaults en texto impiden el cambio de tipo: se quitan y se reponen.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_default LIKE 'to_char(%' LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT', r.table_name, r.column_name);
  END LOOP;
END $$;

-- Dinero exacto (REAL tenia error de punto flotante)
ALTER TABLE public.invoices
  ALTER COLUMN total TYPE numeric(12,2),
  ALTER COLUMN amount_paid TYPE numeric(12,2);
ALTER TABLE public.lab_cases ALTER COLUMN fee TYPE numeric(12,2);
ALTER TABLE public.treatment_plan_items ALTER COLUMN fee TYPE numeric(12,2);
ALTER TABLE public.treatment_types ALTER COLUMN default_fee TYPE numeric(12,2);

-- Eventos con instante real
ALTER TABLE public.appointments
  ALTER COLUMN start_time TYPE timestamptz USING start_time::timestamptz,
  ALTER COLUMN end_time TYPE timestamptz USING end_time::timestamptz;
ALTER TABLE public.invoices
  ALTER COLUMN issued_at TYPE timestamptz USING issued_at::timestamptz;
ALTER TABLE public.lab_cases
  ALTER COLUMN sent_at TYPE timestamptz USING NULLIF(sent_at,'')::timestamptz,
  ALTER COLUMN due_at TYPE timestamptz USING NULLIF(due_at,'')::timestamptz,
  ALTER COLUMN received_at TYPE timestamptz USING NULLIF(received_at,'')::timestamptz,
  ALTER COLUMN seated_at TYPE timestamptz USING NULLIF(seated_at,'')::timestamptz;
ALTER TABLE public.clinical_notes
  ALTER COLUMN note_date TYPE timestamptz USING note_date::timestamptz,
  ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;
ALTER TABLE public.tooth_conditions
  ALTER COLUMN recorded_at TYPE timestamptz USING recorded_at::timestamptz;

-- Fechas calendario (sin hora)
ALTER TABLE public.patients
  ALTER COLUMN date_of_birth TYPE date USING NULLIF(date_of_birth,'')::date,
  ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;
ALTER TABLE public.insurance_plans
  ALTER COLUMN effective_date TYPE date USING NULLIF(effective_date,'')::date,
  ALTER COLUMN term_date TYPE date USING NULLIF(term_date,'')::date,
  ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;

-- Auditorias restantes a timestamptz
ALTER TABLE public.operatories ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;
ALTER TABLE public.practitioners ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;
ALTER TABLE public.treatment_types ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;
ALTER TABLE public.treatment_plan_items ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;
ALTER TABLE public.appointments_to_make ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;
ALTER TABLE public.waiting_list ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;
ALTER TABLE public.appointments ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;
ALTER TABLE public.settings ALTER COLUMN updated_at TYPE timestamptz USING updated_at::timestamptz;

-- Sin doble reserva: mismo consultorio, rangos que se cruzan, cita no cancelada
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE public.appointments
  ADD CONSTRAINT no_traslape_consultorio EXCLUDE USING gist (
    operatory_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (kind = 'patient' AND status <> 'cancelled');

-- Defaults de auditoria como instante real
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type = 'timestamp with time zone'
      AND (column_name LIKE '%\_at' OR column_name IN ('issued_at', 'note_date')) LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT now()', r.table_name, r.column_name);
  END LOOP;
END $$;
COMMIT;
