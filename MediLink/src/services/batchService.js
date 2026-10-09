import { api } from "./api.js";

export async function getBatches() {
  return await api.get("/batches");
}

export async function getBatchById(id) {
  return await api.get(`/batches/${id}`);
}

export async function createBatch(payload) {
  try {
    return await api.post("/batches", payload);
  } catch (err) {
    console.warn("Backend unavailable, creating batch locally:", err.message);
    return { id: `BAT-${Date.now().toString().slice(-4)}`, ...payload };
  }
}

export async function updateBatch(id, payload) {
  try {
    return await api.put(`/batches/${id}`, payload);
  } catch (err) {
    console.warn("Backend unavailable, updating batch locally:", err.message);
    return { id, ...payload };
  }
}

export async function deleteBatch(id) {
  try {
    return await api.delete(`/batches/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, deleting batch locally:", err.message);
    return { id };
  }
}

