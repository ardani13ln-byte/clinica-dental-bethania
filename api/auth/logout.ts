export default async function handler(req: Request): Promise<Response> {
  const res = new Response(JSON.stringify({ ok: true }), { status: 200 });
  res.headers.set("Set-Cookie", [
    "sb-access-token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    "sb-refresh-token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
  ].join(", "));
  return res;
}
