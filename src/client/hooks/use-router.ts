import { useState, useEffect, useCallback } from "react";

export type Route =
  | { name: "dashboard" }
  | { name: "agenda" }
  | { name: "patients" }
  | { name: "patient"; id: number }
  | { name: "reports" }
  | { name: "lab" }
  | { name: "settings" }
  | { name: "admin" }
  | { name: "legal"; type: "terminos" | "privacidad" | "cookies" | "arco" }
  | { name: "not-found" };

function parse(path: string): Route {
  if (path === "/" || path === "/dashboard") return { name: "dashboard" };
  if (path === "/agenda") return { name: "agenda" };
  if (path === "/patients") return { name: "patients" };
  const m = path.match(/^\/patients\/(\d+)$/);
  if (m) return { name: "patient", id: parseInt(m[1], 10) };
  if (path === "/reports") return { name: "reports" };
  if (path === "/lab") return { name: "lab" };
  if (path === "/settings") return { name: "settings" };
  if (path === "/admin") return { name: "admin" };
  if (path === "/legal/terminos") return { name: "legal", type: "terminos" };
  if (path === "/legal/privacidad") return { name: "legal", type: "privacidad" };
  if (path === "/legal/cookies") return { name: "legal", type: "cookies" };
  if (path === "/legal/arco") return { name: "legal", type: "arco" };
  return { name: "not-found" };
}

export function useRouter() {
  const [path, setPath] = useState<string>(() => window.location.pathname);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname) return;
    window.history.pushState(null, "", to);
    setPath(to);
  }, []);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return { path, route: parse(path), navigate };
}
