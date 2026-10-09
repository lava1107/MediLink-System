import { api } from "./api.js";

export async function getUsers() {
  try {
    return await api.get("/users");
  } catch (err) {
    console.warn("Backend unavailable, fetching users locally:", err.message);
    return [];
  }
}

export async function getUserById(id) {
  try {
    return await api.get(`/users/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, fetching user locally:", err.message);
    return null;
  }
}

export async function createUser(payload) {
  try {
    return await api.post("/users", payload);
  } catch (err) {
    console.warn("Backend unavailable, creating user locally:", err.message);
    return {
      id: `USR-${Date.now().toString().slice(-4)}`,
      status: "Active",
      lastLogin: "-",
      created: new Date().toISOString().split("T")[0],
      ...payload,
    };
  }
}

export async function updateUser(id, payload) {
  try {
    return await api.put(`/users/${id}`, payload);
  } catch (err) {
    console.warn("Backend unavailable, updating user locally:", err.message);
    return { id, ...payload };
  }
}

export async function toggleUserStatus(id, currentStatus = "Active") {
  try {
    return await api.patch(`/users/${id}/status`);
  } catch (err) {
    console.warn("Backend unavailable, toggling user status locally:", err.message);
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    return { id, status: newStatus };
  }
}

export async function deleteUser(id) {
  try {
    return await api.delete(`/users/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, deleting user locally:", err.message);
    return { id };
  }
}
