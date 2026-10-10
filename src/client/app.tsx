import { Suspense, lazy, useEffect, useState } from "react";
import { useAuth } from "./hooks/use-auth";
import { useAppState } from "./hooks/use-app-state";
import { useRouter } from "./hooks/use-router";
import { supabase } from "./supabase-client";
import { AppContext } from "./context";
import { Sidebar } from "./components/sidebar";
import { ErrorBanner } from "./components/error-banner";
import { LoginPage } from "./components/login-page";
import { TourPagina } from "./components/tour/TourPagina";

const AgendaPage = lazy(() => import("./components/agenda/agenda-page").then((m) => ({ default: m.AgendaPage })));
const PatientsList = lazy(() => import("./components/patients/patients-list").then((m) => ({ default: m.PatientsList })));
const PatientPage = lazy(() => import("./components/patients/patient-page").then((m) => ({ default: m.PatientPage })));
const ReportsPage = lazy(() => import("./components/reports/reports-page").then((m) => ({ default: m.ReportsPage })));
const LabPage = lazy(() => import("./components/lab/lab-page").then((m) => ({ default: m.LabPage })));
const SettingsPage = lazy(() => import("./components/settings/settings-page").then((m) => ({ default: m.SettingsPage })));
const AdminPage = lazy(() => import("./components/admin/admin-page").then((m) => ({ default: m.AdminPage })));
const LegalPage = lazy(() => import("./components/legal-page").then((m) => ({ default: m.LegalPage })));

export function App() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSignIn={signIn} />;
  }

  return <MainApp signOut={signOut} userEmail={user.email ?? ""} userId={user.id} />;
}

function MainApp({ signOut, userEmail, userId }: { signOut: () => Promise<void>; userEmail: string; userId: string }) {
  const state = useAppState();
  const { route, path, navigate } = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Rol propio (la politica profiles_read permite la fila propia).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const { data } = await supabase.from("profiles").select("role, active").eq("id", userId).maybeSingle();
        if (!cancelado) {
          const r = data as { role?: string; active?: boolean } | null;
          setIsAdmin(!!r?.active && (r?.role === "admin" || r?.role === "superadmin"));
        }
      } catch {
        if (!cancelado) setIsAdmin(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [userId]);

  return (
    <AppContext.Provider value={state}>
      <div className="flex h-screen min-h-0 overflow-hidden">
        <Sidebar route={route} navigate={navigate} signOut={signOut} userEmail={userEmail} />
        <main className="flex flex-1 flex-col overflow-hidden">
          {state.loading ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              Cargando…
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center text-muted-foreground">
                  Cargando…
                </div>
              }
            >
            <>
              {route.name === "dashboard" && <ReportsPage navigate={navigate} />}
              {route.name === "agenda" && <AgendaPage />}
              {route.name === "patients" && <PatientsList navigate={navigate} />}
              {route.name === "patient" && <PatientPage id={route.id} navigate={navigate} />}
              {route.name === "lab" && <LabPage navigate={navigate} />}
              {route.name === "settings" && <SettingsPage />}
              {route.name === "admin" && (isAdmin === null
                ? <Placeholder title="Verificando acceso…" message="" />
                : isAdmin
                  ? <AdminPage />
                  : <Placeholder title="Sin acceso" message="Esta sección es solo para administradores." />)}
              {route.name === "legal" && <LegalPage type={route.type} />}
              {route.name === "not-found" && (
                <Placeholder title="No encontrado" message="Esa página no existe." />
              )}
            </>
            </Suspense>
          )}
        </main>
        <ErrorBanner />
        <TourPagina route={route} path={path} />
      </div>
    </AppContext.Provider>
  );
}

function Placeholder({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
