/**
 * Central API Client for MediLink Frontend
 * Communicates with Node.js + Express backend at http://localhost:5000/api
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Attach JWT token if available
  const token = localStorage.getItem("medilink.token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || `Request failed with status ${response.status}`;
      if ((response.status === 401 || response.status === 403) && errorMsg.toLowerCase().includes("token")) {
        localStorage.removeItem("medilink.token");
      }
      throw new ApiError(errorMsg, response.status, data?.details);
    }

    return data?.data !== undefined ? data.data : data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or connection error
    throw new ApiError(
      err.message || "Unable to connect to MediLink backend server. Ensure backend is running on http://localhost:5000.",
      0
    );
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: "POST", body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: "PUT", body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: "DELETE" }),
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        return { connected: true, data };
      }
      return { connected: false, error: `HTTP ${res.status}` };
    } catch (e) {
      return { connected: false, error: e.message };
    }
  },
  baseUrl: API_BASE_URL,
};

export default api;
