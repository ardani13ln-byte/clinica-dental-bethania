import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export function LegalPage({ type }: { type: "terminos" | "privacidad" | "cookies" | "arco" }) {
  const [arcoType, setArcoType] = useState("acceso");
  const [arcoEmail, setArcoEmail] = useState("");
  const [arcoDetails, setArcoDetails] = useState("");
  const [arcoSent, setArcoSent] = useState(false);

  if (type === "arco") {
    return (
      <div className="flex flex-1 flex-col overflow-auto p-6">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight">Derechos ARCO</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Solicita el acceso, rectificación, cancelación u oposición de tus datos personales.
          </p>

          {arcoSent ? (
            <div className="mt-6 rounded-lg border bg-emerald-50 p-4 text-sm text-emerald-900">
              Solicitud enviada. Te contactaremos en un máximo de 30 días hábiles a {arcoEmail}.
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); setArcoSent(true); }}
              className="mt-6 space-y-4 rounded-xl border bg-card p-6"
            >
              <div className="space-y-2">
                <Label>Tipo de solicitud</Label>
                <select
                  value={arcoType}
                  onChange={(e) => setArcoType(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="acceso">Acceso — Ver mis datos</option>
                  <option value="rectificacion">Rectificación — Corregir datos</option>
                  <option value="cancelacion">Cancelación — Eliminar mis datos</option>
                  <option value="oposicion">Oposición — No procesar mis datos</option>
                  <option value="portabilidad">Portabilidad — Exportar mis datos (JSON)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="arco-email">Correo electrónico</Label>
                <Input id="arco-email" type="email" value={arcoEmail} onChange={(e) => setArcoEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arco-details">Detalles de la solicitud</Label>
                <Textarea id="arco-details" value={arcoDetails} onChange={(e) => setArcoDetails(e.target.value)} rows={4} placeholder="Describe qué datos quieres acceder, corregir o eliminar…" />
              </div>
              <Button type="submit">Enviar solicitud</Button>
              <p className="text-xs text-muted-foreground">
                Tu solicitud será procesada en un máximo de 30 días hábiles conforme al GDPR y leyes de protección de datos de Guatemala.
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  const titles = {
    terminos: "Términos y Condiciones",
    privacidad: "Política de Privacidad",
    cookies: "Consentimiento de Cookies",
  };

  const content = {
    terminos: TERMINOS,
    privacidad: PRIVACIDAD,
    cookies: COOKIES,
  };

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">{titles[type]}</h1>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {content[type]}
        </div>
      </div>
    </div>
  );
}

const TERMINOS = `Clínica Dental Bethania — Sistema de Gestión Dental
Última actualización: 21 de septiembre de 2026

1. ACEPTACIÓN DE LOS TÉRMINOS
Al acceder y utilizar esta aplicación, usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo, no debe usar la aplicación.

2. DESCRIPCIÓN DEL SERVICIO
Sistema de gestión para la Clínica Dental Bethania que permite administrar citas, pacientes, tratamientos, facturación, casos de laboratorio y reportes clínicos.

3. ELEGIBILIDAD
Uso restringido al personal autorizado. Cada usuario debe tener credenciales propias.

4. RESPONSABILIDADES DEL USUARIO
- Mantener confidencialidad de credenciales
- No compartir cuenta con terceros
- Registrar información veraz y precisa
- Reportar accesos no autorizados

5. LIMITACIÓN DE RESPONSABILIDAD
La clínica no será responsable por pérdida de datos por fallas técnicas, daños indirectos, o decisiones clínicas tomadas con base en la información del sistema.

6. PROPIEDAD INTELECTUAL
La aplicación y su código son propiedad de la Clínica Dental Bethania.

7. JURISDICCIÓN
Leyes de la República de Guatemala. Tribunales de Guatemala City.

8. CONTACTO
admin@clinicabethania.com`;

const PRIVACIDAD = `Clínica Dental Bethania — Política de Privacidad
Última actualización: 21 de septiembre de 2026

1. DATOS QUE RECOPILAMOS
- Identidad: Nombre, apellidos, fecha de nacimiento
- Contacto: Email, teléfono, dirección
- Médicos: Alertas, notas clínicas, carta dental, plan de tratamiento
- Financieros: Facturas, seguros, historial de pagos
- Sesión: Token de autenticación en el navegador

2. BASE LEGAL
- Consentimiento del paciente
- Obligación legal (facturación)
- Interés legítimo (relación clínica-paciente)
- Contrato (prestación del servicio)

3. TERCEROS
- Supabase (hosting de datos) — Estados Unidos
- Laboratorios dentales — Elaboración de prótesis
- Aseguradoras — Reembolso de tratamientos
- SAT — Cumplimiento tributario

4. DERECHOS ARCO
Acceso, Rectificación, Cancelación, Oposición, Portabilidad, Limitación.
Contacto: admin@clinicabethania.com

5. SEGURIDAD
- Encriptación HTTPS/TLS
- Row Level Security (RLS)
- Contraseñas hasheadas (bcrypt)
- Auditoría de accesos

6. RETENCIÓN
- Datos clínicos: 10 años
- Datos financieros: 7 años
- Datos de sesión: se eliminan al cerrar sesión

7. TRANSFERENCIAS INTERNACIONALES
Datos almacenados en Supabase (us-east-1, EE.UU.). Cláusulas contractuales estándar (SCC) aplicables.

8. COOKIES
Únicamente cookies de sesión. Sin seguimiento ni publicidad.`;

const COOKIES = `Clínica Dental Bethania — Consentimiento de Cookies
Última actualización: 21 de septiembre de 2026

COOKIES ESENCIALES (obligatorias)
- sb-access-token: Token de autenticación (sesión)
- sb-refresh-token: Renovación del token (7 días)

Estas cookies son necesarias para el funcionamiento. Sin ellas no puede iniciar sesión.

COOKIES ANALÍTICAS
Esta aplicación NO utiliza cookies de análisis, seguimiento ni publicidad.

COOKIES DE TERCEROS
Ninguna.

GESTIÓN
Puede eliminar cookies cerrando sesión o desde la configuración de su navegador.`;
