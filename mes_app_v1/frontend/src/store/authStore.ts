import { create } from "zustand";
import { authApi, type User } from "../services/api-client";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isLoading: false,
  error: null,

  login: async (login: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login(login, password);
      localStorage.setItem("token", data.access_token);
      set({ token: data.access_token });
      const meResp = await authApi.getMe();
      set({ user: meResp.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || "Ошибка входа", isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const { data } = await authApi.getMe();
      set({ user: data });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null });
    }
  },

  clearError: () => set({ error: null }),
}));
