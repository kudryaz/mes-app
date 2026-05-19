import api from "./api";

export interface User {
  id: number;
  login: string;
  name: string;
  role: "admin" | "foreman" | "technologist" | "boiler_operator" | "machine_operator" | "sorter" | "quality_control" | "workshop_master" | "mechanic";
  workshop: "mzhk" | "tzhk" | null;
  can_switch_workshop: boolean;
  is_active: boolean;
  created_at: string;
  password: string;
}

export const authApi = {
  login: (login: string, password: string) =>
    api.post<{ access_token: string; token_type: string }>("/auth/login", { login, password }),
  getMe: () => api.get<User>("/auth/me"),
};

export const usersApi = {
  list: () => api.get<User[]>("/users/"),
  get: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: { login: string; password: string; name: string; role: string; workshop?: string | null; can_switch_workshop?: boolean; is_active?: boolean }) =>
    api.post<User>("/users/", data),
  update: (id: number, data: { login?: string; password?: string; name?: string; role?: string; workshop?: string | null; can_switch_workshop?: boolean; is_active?: boolean }) =>
    api.put<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export interface GelatinComponent {
  id?: number;
  recipe_id?: number;
  name: string;
  percentage: number;
  order_index: number;
}

export interface FillingComponent {
  id?: number;
  recipe_id?: number;
  name: string;
  percentage: number;
  order_index: number;
}

export interface Recipe {
  id: number;
  workshop: "mzhk" | "tzhk";
  created_by: number;
  name: string;
  capsule_weight: "250" | "700" | "1350" | "1630";
  description: string | null;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  gelatin_components: GelatinComponent[];
  filling_components: FillingComponent[];
  capsule_ratio?: string;
  creator?: User;
}

export const recipesApi = {
  list: (params?: { workshop?: string; capsule_weight?: string; active_only?: boolean }) =>
    api.get<Recipe[]>("/recipes/", { params }),
  get: (id: number) => api.get<Recipe>(`/recipes/${id}`),
  create: (data: {
    workshop: string;
    name: string;
    capsule_weight: string;
    description?: string;
    gelatin_components: { name: string; percentage: number }[];
    filling_components: { name: string; percentage: number }[];
  }) => api.post<Recipe>("/recipes/", data),
  update: (id: number, data: {
    name?: string;
    description?: string;
    gelatin_components?: { name: string; percentage: number }[];
    filling_components?: { name: string; percentage: number }[];
  }) => api.put<Recipe>(`/recipes/${id}`, data),
  newVersion: (id: number, data: {
    name?: string;
    description?: string;
    gelatin_components?: { name: string; percentage: number }[];
    filling_components?: { name: string; percentage: number }[];
  }) => api.post<Recipe>(`/recipes/${id}/new-version`, data),
  delete: (id: number) => api.delete(`/recipes/${id}`),
};

export type BatchStatus = "planned" | "in_progress" | "gelatin_ready" | "filling_ready" | "completed" | "cancelled";

export interface BatchComponent {
  id: number;
  batch_id: number;
  type: "gelatin" | "filling";
  name: string;
  percentage: number;
  required_kg: number;
  added_kg: number | null;
  order_index: number;
}

export interface Batch {
  id: number;
  workshop: "mzhk" | "tzhk";
  batch_number: string;
  recipe_id: number;
  recipe_name: string;
  capsule_weight: "250" | "700" | "1350" | "1630";
  capsule_ratio: string;
  capsule_count: number;
  total_mass_kg: number;
  gelatin_mass_kg: number;
  filling_mass_kg: number;
  status: BatchStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  components: BatchComponent[];
}

export const batchesApi = {
  list: (params?: { status_filter?: string; workshop?: string }) =>
    api.get<Batch[]>("/batches/", { params }),
  get: (id: number) => api.get<Batch>(`/batches/${id}`),
  create: (data: { batch_number: string; recipe_id: number; capsule_count: number }) =>
    api.post<Batch>("/batches/", data),
  updateStatus: (id: number, status: BatchStatus) =>
    api.patch<Batch>(`/batches/${id}/status`, { status }),
  updateComponentAdded: (batchId: number, componentId: number, addedKg: number) =>
    api.patch<Batch>(`/batches/${batchId}/component/${componentId}/added`, null, { params: { added_kg: addedKg } }),
};
