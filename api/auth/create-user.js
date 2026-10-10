import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email, password, full_name, role } = req.body;

  // Roles asignables (cerrado): 'user' queda fuera porque ya no es staff.
  const ROLES = ["admin", "dentist", "hygienist", "assistant", "receptionist", "superadmin"];
  const finalRole = role || "receptionist";
  if (!ROLES.includes(finalRole)) {
    res.status(400).json({ error: "Rol inválido" });
    return;
  }

  // Verificar que quien llama es superadmin
  const token = (req.headers.cookie || "").split("; ").find(c => c.startsWith("sb-access-token="))?.split("=")[1];
  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  const clientAuth = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: profile } = await clientAuth.from("profiles").select("role, active").eq("id", (await clientAuth.auth.getUser()).data.user?.id).single();
  if (!profile || profile.role !== "superadmin" || !profile.active) {
    res.status(403).json({ error: "Solo el superadmin puede crear usuarios" });
    return;
  }

  // Crear usuario con service_role
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  // Crear profile (activo: el trigger lo crea inactivo; la creacion por
  // superadmin activa de una vez). Todo error se devuelve: nunca 200 falso.
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    email,
    role: finalRole,
    full_name: full_name || null,
    active: true,
  });
  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id).catch(() => {});
    res.status(500).json({ error: "Usuario creado pero perfil falló: " + profileError.message });
    return;
  }

  // Darle todos los modulos habilitados por defecto
  const { data: mods } = await supabase.from("modules").select("key");
  if (mods?.length) {
    const { error: modError } = await supabase.from("user_modules").insert(
      mods.map(m => ({ user_id: data.user.id, module_key: m.key, enabled: true }))
    );
    if (modError) {
      res.status(500).json({ error: "Usuario creado pero módulos fallaron: " + modError.message });
      return;
    }
  }

  // Log
  await supabase.from("system_logs").insert({
    level: "info",
    category: "auth",
    message: `Usuario creado: ${email} (rol: ${finalRole})`,
    user_email: email,
  });

  res.status(200).json({ user: { id: data.user.id, email, role: finalRole, full_name: full_name || null, active: true } });
}
