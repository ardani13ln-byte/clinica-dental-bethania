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
