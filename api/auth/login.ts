import { createClient } from "@supabase/supabase-js";

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || "";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || "";

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: TURNSTILE_SECRET, response: token, remoteip: ip }),
  });
  const data = await res.json();
  return data.success === true;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const { email, password, turnstileToken } = await req.json();
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

  if (TURNSTILE_SECRET && !await verifyTurnstile(turnstileToken, ip)) {
    return new Response(JSON.stringify({ error: "Verificación antibot fallida" }), { status: 403 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 401 });
  }

  const res = new Response(JSON.stringify({ session: data.session, user: data.user }), { status: 200 });
  if (data.session) {
    res.headers.set("Set-Cookie", [
      `sb-access-token=${data.session.access_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
      `sb-refresh-token=${data.session.refresh_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
    ].join(", "));
  }
  return res;
}
