-- RLS por rol/activo: solo personal activo toca tablas clinicas.
-- Reemplaza las politicas auth-only (cualquier autenticado podia todo).

CREATE OR REPLACE FUNCTION public.is_active_staff(uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET row_security TO 'off' SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND COALESCE(active, true)
  );
$function$;

-- Tablas clinicas y catalogos operativos: staff activo (anon queda fuera).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'settings', 'operatories', 'practitioners', 'treatment_types',
    'patients', 'appointments', 'treatment_plan_items', 'clinical_notes',
    'tooth_conditions', 'invoices', 'invoice_items', 'waiting_list',
    'insurance_plans', 'lab_cases', 'appointments_to_make', 'fotos_tratamiento'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_read_write" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "staff_read_write" ON public.%I FOR ALL TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff())',
      t
    );
  END LOOP;
END $$;

-- Bitacora: insertar tambien queda reservado (el servidor usa service_role,
-- que salta RLS). Nadie puede inyectar logs con user_email arbitrario.
DROP POLICY IF EXISTS logs_insert ON public.system_logs;
CREATE POLICY logs_insert ON public.system_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin());
