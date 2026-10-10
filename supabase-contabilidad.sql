-- Contabilidad: las facturas se anulan (status void), nunca se borran.
CREATE OR REPLACE FUNCTION guard_no_delete_contable() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '%.% no se puede borrar: anula el documento (status void) en su lugar', TG_TABLE_SCHEMA, TG_TABLE_NAME;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guard_invoices_no_delete ON invoices;
CREATE TRIGGER guard_invoices_no_delete BEFORE DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION guard_no_delete_contable();

DROP TRIGGER IF EXISTS guard_invoice_items_no_delete ON invoice_items;
CREATE TRIGGER guard_invoice_items_no_delete BEFORE DELETE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION guard_no_delete_contable();

-- Pacientes con historial no se borran: se desactivan (PUT activo=false).
DROP TRIGGER IF EXISTS guard_patients_no_delete ON patients;
CREATE TRIGGER guard_patients_no_delete BEFORE DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION guard_no_delete_contable();
