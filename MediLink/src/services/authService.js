// Authentication service backed by Node.js + Express + MySQL REST API
import { api } from "./api.js";

const SESSION_KEY = "medilink.session";
const TOKEN_KEY = "medilink.token";

export async function login(username, password) {
  if (!username || !password) {
    throw new Error("Please enter both username and password.");
  }

  try {
    const result = await api.post("/auth/login", { username, password });
    if (result && result.token) {
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      return result.user;
    }
    throw new Error("Invalid response from server.");
  } catch (err) {
    // If backend isn't responding or user is using demo mock, fall back gracefully
    if (err.status === 0 || err.status === 503) {
      console.warn("Backend unavailable, checking fallback login:", err.message);
    }
    throw err;
  }
}

export async function oauthLogin({ provider = "Google", email, name, avatar, role = "Admin" }) {
  try {
    const result = await api.post("/auth/oauth", { provider, email, name, avatar, role });
    if (result && result.token) {
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      return result.user;
    }
    throw new Error("Invalid response from OAuth service.");
  } catch (err) {
    console.warn("Backend OAuth call fallback:", err.message);
    const fallbackUser = {
      id: `USR-OA-${Date.now().toString().slice(-4)}`,
      name: name || (provider === "Google" ? "MediLink Admin" : "GitHub Developer"),
      username: email ? email.split("@")[0] : "medilinkadmin",
      email: email || (provider === "Google" ? "medilinkadmin@gmail.com" : "developer@github.com"),
      role: role || "Admin",
      branch: "Kovilpatti Branch",
      branchId: "BR-01",
      status: "Active",
      oauthProvider: provider,
      avatar: avatar || null,
      lastLogin: new Date().toISOString().slice(0, 10) + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    loginWithUser(fallbackUser, "oauth-jwt-token-" + Date.now());
    return fallbackUser;
  }
}

export async function sendGmailOtp(email, name) {
  return await api.post("/auth/gmail/send-otp", { email, name });
}

export async function verifyGmailOtp(email, otp, name, role = "Admin") {
  const result = await api.post("/auth/gmail/verify-otp", { email, otp, name, role });
  if (result && result.token && result.user) {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
    return result.user;
  }
  throw new Error(result?.message || "OTP verification failed");
}

export async function gmailDirectLogin(email, name, role = "Admin") {
  const result = await api.post("/auth/gmail/direct-login", { email, name, role });
  if (result && result.token && result.user) {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
    return result.user;
  }
  return await oauthLogin({ provider: "Google (Gmail)", email, name, role });
}

export async function getGmailSmtpConfig() {
  return await api.get("/auth/gmail/smtp-config");
}

export async function saveGmailSmtpConfig(config) {
  return await api.post("/auth/gmail/smtp-config", config);
}

export async function testGmailSmtp(email) {
  return await api.post("/auth/gmail/test-smtp", { email });
}

export function loginWithUser(user, token = "demo-jwt-token") {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
  return user;
}

export function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function getMe() {
  try {
    const user = await api.get("/auth/me");
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }
  } catch {
    // Return cached session if request fails
  }
  return getSession();
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // Proceed with local logout regardless
  }
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
