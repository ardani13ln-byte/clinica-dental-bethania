-- Schema para Clínica Dental Bethania en Supabase (PostgreSQL)

-- Practice settings (key/value)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- Operatories (consultorios)
CREATE TABLE IF NOT EXISTS operatories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'sky',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- Practitioners (dentistas, higienistas)
CREATE TABLE IF NOT EXISTS practitioners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'dentist',
  color TEXT NOT NULL DEFAULT 'teal',
  email TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- Treatment types (tipos de tratamiento)
CREATE TABLE IF NOT EXISTS treatment_types (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  default_fee REAL NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'sky',
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- Patients (pacientes)
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  medical_alerts TEXT,
  notes TEXT,
  referral_source TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);

-- Appointments (citas)
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  practitioner_id INTEGER REFERENCES practitioners(id) ON DELETE SET NULL,
  operatory_id INTEGER NOT NULL REFERENCES operatories(id) ON DELETE CASCADE,
  treatment_type_id INTEGER REFERENCES treatment_types(id) ON DELETE SET NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  kind TEXT NOT NULL DEFAULT 'patient',
  title TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_op_start ON appointments(operatory_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);

-- Treatment plan items
CREATE TABLE IF NOT EXISTS treatment_plan_items (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_type_id INTEGER REFERENCES treatment_types(id) ON DELETE SET NULL,
  tooth TEXT,
  surface TEXT,
  fee REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);
CREATE INDEX IF NOT EXISTS idx_plan_patient ON treatment_plan_items(patient_id);

-- Clinical notes
CREATE TABLE IF NOT EXISTS clinical_notes (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id INTEGER REFERENCES practitioners(id) ON DELETE SET NULL,
  note_date TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);
CREATE INDEX IF NOT EXISTS idx_notes_patient ON clinical_notes(patient_id, note_date DESC);

-- Tooth conditions
CREATE TABLE IF NOT EXISTS tooth_conditions (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth TEXT NOT NULL,
  surface TEXT,
  condition TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);
CREATE INDEX IF NOT EXISTS idx_tooth_patient ON tooth_conditions(patient_id);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  issued_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
  status TEXT NOT NULL DEFAULT 'open',
  total REAL NOT NULL DEFAULT 0,
  amount_paid REAL NOT NULL DEFAULT 0,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);

CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  treatment_type_id INTEGER REFERENCES treatment_types(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Waiting list
CREATE TABLE IF NOT EXISTS waiting_list (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_type_id INTEGER REFERENCES treatment_types(id) ON DELETE SET NULL,
  preferred_practitioner_id INTEGER REFERENCES practitioners(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- Insurance plans
CREATE TABLE IF NOT EXISTS insurance_plans (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  rank TEXT NOT NULL DEFAULT 'primary',
  carrier TEXT NOT NULL,
  member_id TEXT,
  group_id TEXT,
  subscriber_name TEXT,
  subscriber_dob TEXT,
  effective_date TEXT,
  term_date TEXT,
  copay REAL NOT NULL DEFAULT 0,
  deductible_total REAL NOT NULL DEFAULT 0,
  deductible_used REAL NOT NULL DEFAULT 0,
  max_annual REAL NOT NULL DEFAULT 0,
  max_used REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);
CREATE INDEX IF NOT EXISTS idx_insurance_patient ON insurance_plans(patient_id);

-- Lab cases
CREATE TABLE IF NOT EXISTS lab_cases (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id INTEGER REFERENCES practitioners(id) ON DELETE SET NULL,
  treatment_type_id INTEGER REFERENCES treatment_types(id) ON DELETE SET NULL,
  lab_name TEXT NOT NULL,
  case_type TEXT NOT NULL,
  tooth TEXT,
  shade TEXT,
  fee REAL NOT NULL DEFAULT 0,
  sent_at TEXT,
  due_at TEXT,
  received_at TEXT,
  seated_at TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);
CREATE INDEX IF NOT EXISTS idx_lab_patient ON lab_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_status ON lab_cases(status);

-- Appointments to make (recordatorios)
CREATE TABLE IF NOT EXISTS appointments_to_make (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_type_id INTEGER REFERENCES treatment_types(id) ON DELETE SET NULL,
  due_after TEXT,
  source TEXT NOT NULL DEFAULT 'reception',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

-- Habilitar RLS (Row Level Security) para acceso desde el cliente
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE operatories ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_to_make ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: permitir todo (sin auth por ahora)
CREATE POLICY "public_read_write" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON operatories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON practitioners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON treatment_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON treatment_plan_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON clinical_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON tooth_conditions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON waiting_list FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON insurance_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON lab_cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_read_write" ON appointments_to_make FOR ALL USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO settings (key, value) VALUES ('day_start_minute', '420'), ('day_end_minute', '1140'), ('slot_minutes', '15')
ON CONFLICT (key) DO NOTHING;

INSERT INTO operatories (name, color, sort_order) VALUES
  ('Consultorio 1', 'sky', 0),
  ('Consultorio 2', 'emerald', 1),
  ('Consultorio 3', 'amber', 2)
ON CONFLICT DO NOTHING;

INSERT INTO practitioners (name, role, color) VALUES
  ('Dr. Lee', 'dentist', 'teal'),
  ('Dr. Patel', 'dentist', 'violet'),
  ('Sarah Kim', 'hygienist', 'rose')
ON CONFLICT DO NOTHING;

INSERT INTO treatment_types (code, name, duration_minutes, default_fee, color) VALUES
  ('EXAM', 'Examen y limpieza', 30, 120, 'sky'),
  ('FILL', 'Restauración / Obturación', 45, 220, 'amber'),
  ('CROWN', 'Corona', 90, 1100, 'violet'),
  ('ENDO', 'Tratamiento de conducto', 90, 950, 'rose'),
  ('EXT', 'Extracción', 30, 250, 'orange'),
  ('CONS', 'Consulta', 20, 80, 'emerald')
ON CONFLICT DO NOTHING;
