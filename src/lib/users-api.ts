/**
 * Admin user-management service.
 *
 * All calls go through the single existing API base (VITE_ADMIN_API_URL).
 * No mock data: user management always reflects the real MySQL database.
 */

import { BASE_URL, isApiConfigured } from "./admin-api";

export type AccountStatus = "Active" | "Inactive" | "Pending";

export const ACCOUNT_STATUSES: AccountStatus[] = ["Active", "Inactive", "Pending"];

export interface AdminUser {
  id: number;
  studentId: string | null;
  email: string;
  role: string;
  roleId?: number;
  status: AccountStatus | string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Role {
  roleId: number;
  roleName: string;
  description?: string | null;
}

export interface UserPayload {
  studentId?: string | null;
  email: string;
  password?: string;
  roleId: number;
  accountStatus: AccountStatus | string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isApiConfigured()) {
    throw new ApiError(
      "Admin API is not configured. Set VITE_ADMIN_API_URL to your backend URL.",
      0,
    );
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      (typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : typeof body === "object" && body !== null && "message" in body
          ? String((body as { message: unknown }).message)
          : typeof body === "string" && body
            ? body
            : `${res.status} ${res.statusText}`) || "Request failed";
    throw new ApiError(message, res.status);
  }

  return body as T;
}

export function unwrap<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
}

export const usersApi = {
  list: async (): Promise<AdminUser[]> => unwrap<AdminUser>(await request<unknown>("/admin/users")),
  get: (id: number) => request<AdminUser>(`/admin/users/${id}`),
  create: (payload: UserPayload) =>
    request<AdminUser>("/admin/users", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<UserPayload>) =>
    request<AdminUser>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  setStatus: (id: number, accountStatus: AccountStatus) =>
    request<AdminUser>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ accountStatus }),
    }),
  remove: (id: number) => request<unknown>(`/admin/users/${id}`, { method: "DELETE" }),
  roles: async (): Promise<Role[]> => {
    try {
      return unwrap<Role>(await request<unknown>("/admin/roles"));
    } catch {
      // Fall back to the fixed role list defined by the existing schema.
      return [
        { roleId: 1, roleName: "Admin" },
        { roleId: 2, roleName: "Doctor" },
        { roleId: 3, roleName: "Patient" },
        { roleId: 4, roleName: "Lab Technician" },
      ];
    }
  },
};
