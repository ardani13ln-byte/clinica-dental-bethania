import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2c-2 0-3.5 1-5 1S4 2.5 3 5c-.8 2-.5 4 .5 6 .8 1.5 1 3 1.5 5 .3 1.2 .8 3 2 3s1.5-1.5 2-3c.3-.8 .5-2 1-2s.7 1.2 1 2c.5 1.5 1 3 2 3s1.7-1.8 2-3c.5-2 .7-3.5 1.5-5 1-2 1.3-4 .5-6-1-2.5-2.5-4-4-4s-3 1-5 1z" />
    </svg>
  );
}

export function LoginPage({ onSignIn }: { onSignIn: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSignIn(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-teal-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <ToothIcon className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">Clínica Dental Bethania</h1>
            <p className="text-sm text-muted-foreground">Inicia sesión para continuar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@clinica.com"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Iniciando sesión…" : "Iniciar sesión"}
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <a href="/legal/terminos" className="hover:text-foreground">Términos</a>
          <span>·</span>
          <a href="/legal/privacidad" className="hover:text-foreground">Privacidad</a>
          <span>·</span>
          <a href="/legal/cookies" className="hover:text-foreground">Cookies</a>
          <span>·</span>
          <a href="/legal/arco" className="hover:text-foreground">Derechos ARCO</a>
        </div>
      </div>
    </div>
  );
}
