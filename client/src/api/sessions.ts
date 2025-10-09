import { apiGet, apiPost } from "./http";

export interface Session {
  id: string;
  hobby: string;
  title: string;
  description?: string | null;
  date_time: string;
  max_participants: number;
  type: "public" | "private";
  location_text?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
}

export function getPublicSessions() {
  return apiGet<Session[]>("/api/sessions");
}

export function getSessionById(id: string) {
  return apiGet<Session>(`/api/sessions/${id}`);
}

export function getSessionByCode(code: string) {
  return apiGet<Session>(`/api/sessions/code/${code}`);
}

export type CreateSessionInput = Omit<Session, "id">;

export interface CreateSessionOutput {
  id: string;
  managementCode: string;
  privateUrlCode?: string;
  manageUrl: string;
}

export function createSession(data: CreateSessionInput) {
  return apiPost<CreateSessionOutput>("/api/sessions", data);
}

/* ---- Attendance helpers ---- */

export interface CountOut { count: number; max: number; }

export async function getAttendeeCount(sessionId: string) {
  return apiGet<CountOut>(`/api/sessions/${sessionId}/attendees/count`);
}

export interface JoinOut { attendeeId: string; attendanceCode: string; }

export async function joinSession(sessionId: string, display_name?: string) {
  return apiPost<JoinOut>(`/api/sessions/${sessionId}/attendees`, { display_name });
}

export async function leaveSessionSelf(sessionId: string, attendeeId: string, attendanceCode: string) {
  const url = `/api/sessions/${sessionId}/attendees/${attendeeId}?attendance=${encodeURIComponent(attendanceCode)}`;
  const r = await fetch(import.meta.env.VITE_API_BASEURL + url, { method: "DELETE" });
  if (!r.ok) throw new Error(`Leave failed: ${r.status}`);
}

/* ---- Manage helpers ---- */

export type PatchSessionInput = Partial<{
  hobby: string;
  title: string;
  description: string | null;
  date_time: string; // ISO
  max_participants: number;
  type: "public" | "private";
  location_text: string | null;
  lat: number | string | null;
  lng: number | string | null;
}>;

export async function patchSession(id: string, manage: string, data: PatchSessionInput) {
  const url = `${import.meta.env.VITE_API_BASEURL}/api/sessions/${id}?manage=${encodeURIComponent(manage)}`;
  const r = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!r.ok) throw new Error(`PATCH failed: ${r.status}`);
  return r.json();
}

export async function deleteSession(id: string, manage: string) {
  const url = `${import.meta.env.VITE_API_BASEURL}/api/sessions/${id}?manage=${encodeURIComponent(manage)}`;
  const r = await fetch(url, { method: "DELETE" });
  if (!r.ok) throw new Error(`DELETE failed: ${r.status}`);
}
