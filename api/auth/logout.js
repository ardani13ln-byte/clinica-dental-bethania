import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Revoca el refresh token en el servidor para que no sobreviva al logout.
  // Si no viene o falla, igual se limpian las cookies (defensa en profundidad).
  try {
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    const refreshToken = body.refreshToken;
    if (refreshToken && SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
      await supabase.auth.admin.signOut(refreshToken);
    }
  } catch {
    // No bloquear el logout por un fallo de revocacion.
  }

  res.setHeader("Set-Cookie", [
    "sb-access-token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    "sb-refresh-token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
  ]);
  res.status(200).json({ ok: true });
}
