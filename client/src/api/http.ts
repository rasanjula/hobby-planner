const API = import.meta.env.VITE_API_BASEURL || "http://localhost:4000";
export async function api<T = any>(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers||{}) }});
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}
