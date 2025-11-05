import axios from "axios";

const API_BASE_URL = "http://localhost:4001/api"; //this was my local host url for the backend server, you can change it to yours when integrating

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
      window.location.href = "/"; //  this "/" is the login page as i set it to the default home page
    }
    return Promise.reject(error);
  }
);
// below is all my api endpoints
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/signup", userData),
  forgotPassword: (emailData) => api.post("/auth/forgot-password", emailData),
  resetPassword: (resetData) => api.post("/auth/reset-password", resetData),
  unlockAccount: (emailData) => api.post("/auth/unlock-account", emailData),
};

export const userAPI = {
  getProfile: () => api.get("/users/profile"),
};

export default api;
