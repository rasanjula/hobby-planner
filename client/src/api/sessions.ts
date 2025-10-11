// client/src/api/sessions.ts
import { apiGet, apiPost, apiPatch, apiDelete } from "./http";

/* ---- Types ---- */

export interface Session {
  id: string;
  hobby: string;
  title: string;
  description?: string | null;
  date_time: string; // ISO
  max_participants: number;
  type: "public" | "private";
  location_text?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
}

export type CreateSessionInput = Omit<Session, "id">;

export interface CreateSessionOutput {
  id: string;
  managementCode: string;
  privateUrlCode?: string;
  manageUrl: string;
}

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
export type UpdateSessionInput = PatchSessionInput;

/* ---- Sessions list / read ---- */

export function getPublicSessions() {
  return apiGet<Session[]>("/api/sessions");
}

export function getSessionById(id: string) {
  return apiGet<Session>(`/api/sessions/${id}`);
}

export function getSessionByCode(code: string) {
  return apiGet<Session>(`/api/sessions/code/${code}`);
}

/* ---- Create ---- */

export function createSession(data: CreateSessionInput) {
  return apiPost<CreateSessionOutput>("/api/sessions", data);
}

/* ---- Attendance helpers ---- */

export type CountDTO = { count: number; max: number };
export const getAttendeeCount = (sessionId: string) =>
  apiGet<CountDTO>(`/api/sessions/${sessionId}/attendees/count`);

export type JoinDTO = { attendeeId: string; attendanceCode: string };
export const joinSession = (sessionId: string, display_name?: string) =>
  apiPost<JoinDTO>(`/api/sessions/${sessionId}/attendees`, { display_name });

export async function leaveSessionSelf(sessionId: string, attendeeId: string, attendanceCode: string) {
  return apiDelete(`/api/sessions/${sessionId}/attendees/${attendeeId}?attendance=${encodeURIComponent(attendanceCode)}`);
}

/* ---- Attendee listing (names only) ---- */

export type Attendee = {
  id: string;
  display_name: string | null; // allow null if user didn’t provide a name
  created_at: string;
};

export function listAttendees(sessionId: string, manageCode?: string) {
  const q = manageCode ? `?manage=${encodeURIComponent(manageCode)}` : "";
  return apiGet<Attendee[]>(`/api/sessions/${sessionId}/attendees${q}`);
}

/* ---- Creator removal helper ---- */

export function removeAttendeeManage(sessionId: string, attendeeId: string, manageCode: string) {
  return apiDelete(`/api/sessions/${sessionId}/attendees/${attendeeId}?manage=${encodeURIComponent(manageCode)}`);
}

/* ---- Manage (edit/delete) ---- */

export function patchSession(id: string, manage: string, data: PatchSessionInput) {
  return apiPatch<Session>(`/api/sessions/${id}?manage=${encodeURIComponent(manage)}`, data);
}

export function deleteSession(id: string, manage: string) {
  return apiDelete(`/api/sessions/${id}?manage=${encodeURIComponent(manage)}`);
}
