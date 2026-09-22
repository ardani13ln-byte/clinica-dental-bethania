import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || "";

export default async function handler(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").filter(c => c).map(c => {
      const [k, ...v] = c.split("=");
      return [k, v.join("=")];
    })
  );

  const accessToken = cookies["sb-access-token"];
  if (!accessToken) {
    return new Response(JSON.stringify({ user: null }), { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data } = await supabase.auth.getUser();
  return new Response(JSON.stringify({ user: data.user }), { status: 200 });
}
