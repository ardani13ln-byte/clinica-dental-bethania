-- Seguridad tanda 2: cierra registro autonomo, storage, roles admin, soft-delete.
-- Aplicar despues de supabase-rls-roles.sql.

-- 1. El rol 'user' (autocreado) NO es staff: sin cuenta asignada no hay acceso.
CREATE OR REPLACE FUNCTION public.is_active_staff(uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET row_security TO 'off' SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND COALESCE(active, false) AND role <> 'user'
  );
$function$;

-- 2. Los nuevos registros nacen inactivos: un superadmin los activa y asigna rol.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET row_security TO 'off' SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role, active)
  VALUES (NEW.id, NEW.email, 'user', false);
  RETURN NEW;
END;
$function$;

-- 3. Admin (no solo superadmin) puede administrar: usuarios, modulos, logs.
CREATE OR REPLACE FUNCTION public.is_admin_or_above(uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET row_security TO 'off' SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND COALESCE(active, false) AND role IN ('admin', 'superadmin')
  );
$function$;

DROP POLICY IF EXISTS profiles_write ON public.profiles;
CREATE POLICY profiles_write ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin_or_above()) WITH CHECK (public.is_admin_or_above());

DROP POLICY IF EXISTS user_modules_write ON public.user_modules;
CREATE POLICY user_modules_write ON public.user_modules FOR ALL TO authenticated
  USING (public.is_admin_or_above()) WITH CHECK (public.is_admin_or_above());

DROP POLICY IF EXISTS modules_write ON public.modules;
CREATE POLICY modules_write ON public.modules FOR ALL TO authenticated
  USING (public.is_admin_or_above()) WITH CHECK (public.is_admin_or_above());

DROP POLICY IF EXISTS logs_read ON public.system_logs;
CREATE POLICY logs_read ON public.system_logs FOR SELECT TO authenticated
  USING (public.is_admin_or_above());
DROP POLICY IF EXISTS logs_delete ON public.system_logs;
CREATE POLICY logs_delete ON public.system_logs FOR DELETE TO authenticated
  USING (public.is_admin_or_above());
DROP POLICY IF EXISTS logs_insert ON public.system_logs;
CREATE POLICY logs_insert ON public.system_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_above());

-- 4. Fotos clinicas: solo staff (estaban abiertas a cualquier autenticado).
DROP POLICY IF EXISTS auth_manage_expedientes ON storage.objects;
DROP POLICY IF EXISTS staff_manage_expedientes ON storage.objects;
CREATE POLICY staff_manage_expedientes ON storage.objects FOR ALL
  USING (bucket_id = 'expedientes' AND public.is_active_staff())
  WITH CHECK (bucket_id = 'expedientes' AND public.is_active_staff());

-- 5. Soft-delete de pacientes: se desactivan, no se borran (cascada contable).
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

-- 6. Anti-escalacion: ni siquiera un admin puede tocar superadmins (el guard
-- de ultimo-superadmin del cliente no frena llamadas directas a la API).
CREATE OR REPLACE FUNCTION public.guard_profiles_escalation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_superadmin() THEN RETURN NEW; END IF;
  IF NEW.role = 'superadmin' OR OLD.role = 'superadmin' THEN
    RAISE EXCEPTION 'Solo un superadmin puede asignar o modificar superadmins';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_profiles_escalation ON public.profiles;
CREATE TRIGGER guard_profiles_escalation BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_escalation();
