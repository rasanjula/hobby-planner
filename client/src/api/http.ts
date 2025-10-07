const BASE = import.meta.env.VITE_API_BASEURL ?? "";
export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`GET ${path} failed: ${r.status}`);
  return r.json() as Promise<T>;
}
export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`POST ${path} failed: ${r.status}`);
  return r.json() as Promise<T>;
}
