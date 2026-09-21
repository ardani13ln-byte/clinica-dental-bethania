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
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (Date.now() < lockUntil.current) {
      const secs = Math.ceil((lockUntil.current - Date.now()) / 1000);
      throw new Error(`Demasiados intentos. Espera ${secs}s.`);
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      attempts.current++;
      if (attempts.current >= MAX_ATTEMPTS) {
        lockUntil.current = Date.now() + LOCKOUT_MS;
        attempts.current = 0;
      }
      throw error;
    }
    attempts.current = 0;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { user, loading, signIn, signOut };
}
