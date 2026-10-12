import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password }).then((r) => r.data);

export const getMe = () => api.get("/auth/me").then((r) => r.data);

export const getUsers = () => api.get("/auth/users").then((r) => r.data);
export const createUser = (data: any) => api.post("/auth/register", data).then((r) => r.data);
export const toggleUser = (id: string, isActive: boolean) =>
  api.patch(`/auth/users/${id}/toggle`, { isActive }).then((r) => r.data);
export const updateLimit = (id: string, limit: number) =>
  api.patch(`/auth/users/${id}/limit`, { limit }).then((r) => r.data);

// API Keys
export const getApiKeys = () => api.get("/auth/api-keys").then((r) => r.data);
export const createApiKey = (name: string) => api.post("/auth/api-keys", { name }).then((r) => r.data);
export const revokeApiKey = (id: string) => api.delete(`/auth/api-keys/${id}`).then((r) => r.data);

// Chat
export const getConversations = () => api.get("/chat/conversations").then((r) => r.data);
export const createConversation = (data?: any) => api.post("/chat/conversations", data || {}).then((r) => r.data);
export const getConversation = (id: string) => api.get(`/chat/conversations/${id}`).then((r) => r.data);
export const deleteConversation = (id: string) => api.delete(`/chat/conversations/${id}`).then((r) => r.data);

// Usage
export const getMyUsage = () => api.get("/usage/me").then((r) => r.data);
export const getAdminUsage = () => api.get("/usage/admin").then((r) => r.data);

// Models
export const getModels = () => api.get("/models").then((r) => r.data);
