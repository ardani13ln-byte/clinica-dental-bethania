import { createClient } from "@supabase/supabase-js";

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || "";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || "";

async function verifyTurnstile(token, ip) {
  if (!TURNSTILE_SECRET) return true;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: TURNSTILE_SECRET, response: token, remoteip: ip }),
  });
  const data = await res.json();
  return data.success === true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email, password, turnstileToken } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "";

  if (TURNSTILE_SECRET && turnstileToken && !await verifyTurnstile(turnstileToken, ip)) {
    res.status(403).json({ error: "Verificación antibot fallida" });
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  res.setHeader("Set-Cookie", [
    `sb-access-token=${data.session.access_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
    `sb-refresh-token=${data.session.refresh_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
  ]);
  res.status(200).json({ user: data.user });
}
