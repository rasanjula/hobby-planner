// client/src/api/http.ts
const RAW_BASE = import.meta.env.VITE_API_BASEURL ?? "";
const BASE = RAW_BASE.replace(/\/+$/, ""); // normalize

async function parseMaybeJson(r: Response) {
  const text = await r.text();
  try { return text ? JSON.parse(text) : undefined; }
  catch { return text; }
}

function makeErr(method: string, path: string, r: Response, body: unknown) {
  const msg = typeof body === "string" ? body : (body as any)?.error || "";
  return new Error(`${method} ${path} failed: ${r.status}${msg ? ` — ${msg}` : ""}`);
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  const r = await fetch(url);
  const body = await parseMaybeJson(r);
  if (!r.ok) throw makeErr("GET", path, r, body);
  return body as T;
}

export async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  const url = `${BASE}${path}`;
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };
  if (data !== undefined) init.body = JSON.stringify(data); // add only when present
  const r = await fetch(url, init);
  const body = await parseMaybeJson(r);
  if (!r.ok) throw makeErr("POST", path, r, body);
  return body as T;
}

export async function apiPatch<T>(path: string, data?: unknown): Promise<T> {
  const url = `${BASE}${path}`;
  const init: RequestInit = {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  };
  if (data !== undefined) init.body = JSON.stringify(data);
  const r = await fetch(url, init);
  const body = await parseMaybeJson(r);
  if (!r.ok) throw makeErr("PATCH", path, r, body);
  return body as T;
}

export async function apiDelete(path: string): Promise<void> {
  const url = `${BASE}${path}`;
  const r = await fetch(url, { method: "DELETE" });
  const body = await parseMaybeJson(r);
  if (!r.ok) throw makeErr("DELETE", path, r, body);
}
