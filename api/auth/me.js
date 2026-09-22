import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || "";

export default async function handler(req, res) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").filter(c => c).map(c => {
      const [k, ...v] = c.split("=");
      return [k, v.join("=")];
    })
  );

  const accessToken = cookies["sb-access-token"];
  if (!accessToken) {
    res.status(200).json({ user: null });
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data } = await supabase.auth.getUser();
  res.status(200).json({ user: data.user });
}
