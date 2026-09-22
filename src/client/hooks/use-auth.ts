import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../supabase-client";
import type { User } from "@supabase/supabase-js";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const attempts = useRef(0);
  const lockUntil = useRef(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (Date.now() < lockUntil.current) {
      const secs = Math.ceil((lockUntil.current - Date.now()) / 1000);
      throw new Error(`Demasiados intentos. Espera ${secs}s.`);
    }
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json() as { error?: string; user?: User; accessToken?: string; refreshToken?: string };
    if (!res.ok) {
      attempts.current++;
      if (attempts.current >= MAX_ATTEMPTS) {
        lockUntil.current = Date.now() + LOCKOUT_MS;
        attempts.current = 0;
      }
      throw new Error(data.error || "Error de autenticación");
    }
    attempts.current = 0;
    if (data.accessToken && data.refreshToken) {
      await supabase.auth.setSession({
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
      });
    }
    if (data.user) setUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, signIn, signOut };
}
