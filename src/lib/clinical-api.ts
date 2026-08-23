/**
 * Admin doctor & patient management service (Phase 3).
 *
 * Uses the same single API base as Phase 1/2 (VITE_ADMIN_API_URL) and the same
 * transport helpers as users-api. No mock data: every getter reflects the live
 * MySQL database. Rows are treated as open records because the backend returns
 * exactly the columns that exist in the schema.
 */

import { request, unwrap } from "./users-api";

/** A database row with an unknown-but-real column set. */
export type Row = Record<string, unknown>;

export interface DoctorRow extends Row {
  doctorId?: number | string;
  userId?: number | string | null;
  email?: string | null;
  status?: string | null;
}

export interface PatientRow extends Row {
  patientId?: number | string;
  patientCode?: string | null;
  email?: string | null;
}

export interface PatientDetail {
  patient: PatientRow | null;
  genotypes: Row[];
  prescriptions: Row[];
  recommendations: Row[];
  /** Relationships the backend reported as unavailable in the current schema. */
  unavailable?: string[];
}

export interface DoctorDetail {
  doctor: DoctorRow | null;
  user: Row | null;
  unavailable?: string[];
}

export const doctorsApi = {
  list: async (): Promise<DoctorRow[]> =>
    unwrap<DoctorRow>(await request<unknown>("/admin/doctors")),
  get: (id: number | string) => request<DoctorDetail>(`/admin/doctors/${id}`),
  update: (id: number | string, payload: Row) =>
    request<DoctorRow>(`/admin/doctors/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  setStatus: (id: number | string, accountStatus: string) =>
    request<DoctorRow>(`/admin/doctors/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ accountStatus }),
    }),
};

export const patientsApi = {
  list: async (): Promise<PatientRow[]> =>
    unwrap<PatientRow>(await request<unknown>("/admin/patients")),
  get: (id: number | string) => request<PatientDetail>(`/admin/patients/${id}`),
};

/* ------------------------------------------------------------------ */
/* Display helpers (schema-agnostic)                                  */
/* ------------------------------------------------------------------ */

export function label(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bId\b/g, "ID");
}

export function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  }
  return s;
}

/** Column keys present across rows, in first-seen order, minus sensitive ones. */
const SENSITIVE = /password|hash|token|secret|salt/i;

export function columnsOf(rows: Row[], limit?: number): string[] {
  const keys: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!keys.includes(key) && !SENSITIVE.test(key)) keys.push(key);
    }
  }
  return limit ? keys.slice(0, limit) : keys;
}

export function matches(row: Row, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return Object.entries(row)
    .filter(([k]) => !SENSITIVE.test(k))
    .map(([, v]) => (v === null || v === undefined ? "" : String(v)))
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function statusOf(row: Row): string | null {
  for (const key of ["status", "accountStatus", "account_status"]) {
    const v = row[key];
    if (typeof v === "string" && v) return v;
  }
  return null;
}

export function idOf(row: Row, candidates: string[]): string | number | null {
  for (const key of candidates) {
    const v = row[key];
    if (typeof v === "number" || (typeof v === "string" && v)) return v;
  }
  return null;
}
