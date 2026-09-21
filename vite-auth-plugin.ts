import type { Plugin } from "vite";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || "";

export function authMiddlewarePlugin(): Plugin {
  return {
    name: "auth-middleware",
    configureServer(server) {
      server.middlewares.use("/api/auth/login", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const { email, password } = JSON.parse(Buffer.concat(chunks).toString());

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          res.statusCode = 401;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error.message }));
          return;
        }

        res.setHeader("Set-Cookie", [
          `sb-access-token=${data.session!.access_token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600`,
          `sb-refresh-token=${data.session!.refresh_token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`,
        ]);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ user: data.user }));
      });

      server.middlewares.use("/api/auth/logout", (_req, res) => {
        res.setHeader("Set-Cookie", [
          "sb-access-token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
          "sb-refresh-token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
        ]);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true }));
      });

      server.middlewares.use("/api/auth/me", async (req, res) => {
        const cookies = (req.headers.cookie || "").split("; ").reduce<Record<string, string>>((acc, c) => {
          const [k, v] = c.split("=");
          if (k && v) acc[k] = v;
          return acc;
        }, {});

        const accessToken = cookies["sb-access-token"];
        if (!accessToken) {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ user: null }));
          return;
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
          global: { headers: { Authorization: `Bearer ${accessToken}` } },
        });
        const { data } = await supabase.auth.getUser();
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ user: data.user }));
      });
    },
  };
}
