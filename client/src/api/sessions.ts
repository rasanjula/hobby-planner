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
