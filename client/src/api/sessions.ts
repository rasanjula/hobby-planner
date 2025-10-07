import { apiGet } from "./http";
export interface Session {
  id: string;
  hobby: string;
  title: string;
  description?: string | null;
  date_time: string;                // ISO from server
  max_participants: number;
  type: "public" | "private";
  location_text?: string | null;
  lat?: number | string | null;     // PG DECIMAL comes as string
  lng?: number | string | null;
}
export function getPublicSessions() {
  return apiGet<Session[]>("/api/sessions");
}
