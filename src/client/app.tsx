import { useAuth } from "./hooks/use-auth";
import { useAppState } from "./hooks/use-app-state";
import { useRouter } from "./hooks/use-router";
import { AppContext } from "./context";
import { Sidebar } from "./components/sidebar";
import { ErrorBanner } from "./components/error-banner";
import { LoginPage } from "./components/login-page";
import { AgendaPage } from "./components/agenda/agenda-page";
import { PatientsList } from "./components/patients/patients-list";
import { PatientPage } from "./components/patients/patient-page";
import { ReportsPage } from "./components/reports/reports-page";
import { LabPage } from "./components/lab/lab-page";
import { SettingsPage } from "./components/settings/settings-page";
import { AdminPage } from "./components/admin/admin-page";
import { LegalPage } from "./components/legal-page";

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

  return <MainApp signOut={signOut} userEmail={user.email ?? ""} />;
}

function MainApp({ signOut, userEmail }: { signOut: () => Promise<void>; userEmail: string }) {
  const state = useAppState();
  const { route, navigate } = useRouter();

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
            <>
              {route.name === "dashboard" && <ReportsPage navigate={navigate} />}
              {route.name === "agenda" && <AgendaPage />}
              {route.name === "patients" && <PatientsList navigate={navigate} />}
              {route.name === "patient" && <PatientPage id={route.id} navigate={navigate} />}
              {route.name === "lab" && <LabPage navigate={navigate} />}
              {route.name === "settings" && <SettingsPage />}
              {route.name === "admin" && <AdminPage />}
              {route.name === "legal" && <LegalPage type={route.type} />}
              {route.name === "not-found" && (
                <Placeholder title="No encontrado" message="Esa página no existe." />
              )}
            </>
          )}
        </main>
        <ErrorBanner />
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
