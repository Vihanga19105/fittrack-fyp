import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

// ✅ Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ If token expired, redirect to login
// BUT skip redirect if already on login, register, or forgot-password page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const authPages = ["/login", "/register", "/forgot-password", "/verify-email"];
      const isAuthPage = authPages.some(p => currentPath.startsWith(p));

      if (!isAuthPage) {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;