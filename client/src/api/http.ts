class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const BASE: string = import.meta.env.VITE_API_BASEURL ?? "";

export async function apiGet<T>(path: string): Promise<T> {
  const url: string = `${BASE}${path}`; // ← template string with path
  const r: Response = await fetch(url);
  if (!r.ok) {
    throw new HttpError(`GET ${path} failed: ${r.status}`, r.status);
  }
  const data: unknown = await r.json();
  return data as T;
}