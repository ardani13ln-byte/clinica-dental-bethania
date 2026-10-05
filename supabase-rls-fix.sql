-- Fix RLS: requerir autenticación para todas las tablas
-- Ejecutar en Supabase SQL Editor

-- Eliminar políticas públicas inseguras
DROP POLICY IF EXISTS "public_read_write" ON settings;
DROP POLICY IF EXISTS "public_read_write" ON operatories;
DROP POLICY IF EXISTS "public_read_write" ON practitioners;
DROP POLICY IF EXISTS "public_read_write" ON treatment_types;
DROP POLICY IF EXISTS "public_read_write" ON patients;
DROP POLICY IF EXISTS "public_read_write" ON appointments;
DROP POLICY IF EXISTS "public_read_write" ON treatment_plan_items;
DROP POLICY IF EXISTS "public_read_write" ON clinical_notes;
DROP POLICY IF EXISTS "public_read_write" ON tooth_conditions;
DROP POLICY IF EXISTS "public_read_write" ON invoices;
DROP POLICY IF EXISTS "public_read_write" ON invoice_items;
DROP POLICY IF EXISTS "public_read_write" ON waiting_list;
DROP POLICY IF EXISTS "public_read_write" ON insurance_plans;
DROP POLICY IF EXISTS "public_read_write" ON lab_cases;
DROP POLICY IF EXISTS "public_read_write" ON appointments_to_make;

-- Crear políticas que requieren autenticación (auth.uid() IS NOT NULL)
-- Cualquier usuario autenticado puede leer y escribir (single-tenant clinic)
CREATE POLICY "auth_read_write" ON settings FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON operatories FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON practitioners FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON treatment_types FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON patients FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON appointments FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON treatment_plan_items FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON clinical_notes FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON tooth_conditions FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON invoices FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON invoice_items FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON waiting_list FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON insurance_plans FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON lab_cases FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_write" ON appointments_to_make FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ── 2. Proteger columnas gestionadas por el servidor ──────────────
-- RLS filtra FILAS, no COLUMNAS: la política de arriba permite a cualquier
-- usuario autenticado escribir cualquier columna de estas tablas, incluidas
-- la clave primaria `id` y las marcas de tiempo `created_at` / `issued_at`.
-- El unico control de entrada (los schemas Zod) vive en el bundle del
-- navegador, que un atacante que llama a PostgREST directamente no ejecuta.
-- Estos triggers son el control real: rechazan la reescritura de la
-- identidad de la fila y de su linea de tiempo.

CREATE OR REPLACE FUNCTION guard_server_owned_columns() RETURNS TRIGGER AS $$
BEGIN
  -- UPDATE: la identidad de la fila no puede reescribirse.
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION '%.id is server-managed and cannot be changed', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION guard_created_at() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'created_at is server-managed and cannot be changed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION guard_issued_at() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.issued_at IS DISTINCT FROM OLD.issued_at THEN
    RAISE EXCEPTION 'issued_at is server-managed and cannot be changed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- En el INSERT la identidad y la linea de tiempo las fija el servidor. Un
-- cliente que envie `id` o `created_at` esta eligiendo la identidad de la fila
-- o su fecha de alta, y ninguna ruta de la app lo hace: se sobrescriben con
-- los valores que el servidor genera.
CREATE OR REPLACE FUNCTION guard_client_supplied_columns() RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'patients' THEN
    NEW.id := nextval(pg_get_serial_sequence(TG_TABLE_NAME, 'id'));
    NEW.created_at := to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guard_patients_id ON patients;
CREATE TRIGGER guard_patients_id BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION guard_server_owned_columns();

DROP TRIGGER IF EXISTS guard_patients_created_at ON patients;
CREATE TRIGGER guard_patients_created_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION guard_created_at();

DROP TRIGGER IF EXISTS guard_appointments_created_at ON appointments;
CREATE TRIGGER guard_appointments_created_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION guard_created_at();

DROP TRIGGER IF EXISTS guard_clinical_notes_created_at ON clinical_notes;
CREATE TRIGGER guard_clinical_notes_created_at BEFORE UPDATE ON clinical_notes
  FOR EACH ROW EXECUTE FUNCTION guard_created_at();

DROP TRIGGER IF EXISTS guard_treatment_plan_created_at ON treatment_plan_items;
CREATE TRIGGER guard_treatment_plan_created_at BEFORE UPDATE ON treatment_plan_items
  FOR EACH ROW EXECUTE FUNCTION guard_created_at();

DROP TRIGGER IF EXISTS guard_invoices_issued_at ON invoices;
CREATE TRIGGER guard_invoices_issued_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION guard_issued_at();

-- Settlement is monotonic: a payment already recorded against an invoice can
-- never be erased by an UPDATE, and a payment can never exceed the invoice
-- total. Without this the same work can be re-billed and re-collected.
CREATE OR REPLACE FUNCTION guard_invoice_settlement() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount_paid > NEW.total THEN
    RAISE EXCEPTION 'amount_paid (%) cannot exceed total (%)', NEW.amount_paid, NEW.total;
  END IF;
  IF NEW.amount_paid < OLD.amount_paid THEN
    RAISE EXCEPTION 'amount_paid cannot be reduced from % to %; post a reversing invoice instead',
      OLD.amount_paid, NEW.amount_paid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guard_invoices_settlement ON invoices;
CREATE TRIGGER guard_invoices_settlement BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION guard_invoice_settlement();

DROP TRIGGER IF EXISTS guard_patients_insert_id ON patients;
CREATE TRIGGER guard_patients_insert_id BEFORE INSERT ON patients
  FOR EACH ROW EXECUTE FUNCTION guard_client_supplied_columns();
