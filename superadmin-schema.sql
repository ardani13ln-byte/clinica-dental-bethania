-- ═══════════════════════════════════════════════════════════════
-- SUPERADMIN: profiles, modules, system_logs
-- ═══════════════════════════════════════════════════════════════

-- ── 1. PROFILES (roles de usuario) ──
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'dentist', 'hygienist', 'assistant', 'receptionist', 'user')),
  full_name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Solo superadmin puede ver todos los perfiles; cada usuario ve el suyo
CREATE POLICY profiles_read ON profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
  );

-- Solo superadmin puede modificar perfiles
CREATE POLICY profiles_write ON profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin'));

-- ── 2. MODULES (habilitar/deshabilitar modulos del sistema) ──
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede ver que modulos estan activos
CREATE POLICY modules_read ON modules FOR SELECT TO authenticated
  USING (true);

-- Solo superadmin puede modificar modulos
CREATE POLICY modules_write ON modules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin'));

-- ── 3. SYSTEM_LOGS (logs del sistema) ──
CREATE TABLE IF NOT EXISTS system_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error', 'critical')),
  category TEXT NOT NULL DEFAULT 'system',
  message TEXT NOT NULL,
  user_email TEXT,
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Solo superadmin puede leer logs
CREATE POLICY logs_read ON system_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin'));

-- Cualquier usuario autenticado puede escribir logs (para registrar acciones)
CREATE POLICY logs_insert ON system_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Solo superadmin puede borrar logs
CREATE POLICY logs_delete ON system_logs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin'));

-- ── 4. SEED: modulos default ──
INSERT INTO modules (key, name, description, icon, enabled, sort_order) VALUES
  ('agenda', 'Agenda', 'Calendario de citas y programación', 'calendar', true, 1),
  ('patients', 'Pacientes', 'Expedientes clínicos y datos de pacientes', 'users', true, 2),
  ('reports', 'Reportes', 'Estadísticas y reportes de producción', 'bar-chart', true, 3),
  ('lab', 'Laboratorio', 'Casos de laboratorio dental', 'flask', true, 4),
  ('settings', 'Configuración', 'Configuración del sistema', 'settings', true, 5),
  ('admin', 'Administración', 'Gestión de módulos, usuarios y logs del sistema', 'shield', true, 6)
ON CONFLICT (key) DO NOTHING;

-- ── 5. Función helper: es_superadmin ──
CREATE OR REPLACE FUNCTION is_superadmin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid AND role = 'superadmin' AND active = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ── 6. Trigger: crear profile automaticamente al registrar usuario ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

SELECT 'Superadmin schema created' as status;
