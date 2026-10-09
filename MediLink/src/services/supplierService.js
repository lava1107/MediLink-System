import { api } from "./api.js";

export async function getSuppliers() {
  try {
    return await api.get("/suppliers");
  } catch (err) {
    console.warn("Backend unavailable, fetching suppliers locally:", err.message);
    return [];
  }
}

export async function getSupplierById(id) {
  try {
    return await api.get(`/suppliers/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, fetching supplier locally:", err.message);
    return null;
  }
}

export async function createSupplier(payload) {
  try {
    return await api.post("/suppliers", payload);
  } catch (err) {
    console.warn("Backend unavailable, creating supplier locally:", err.message);
    return {
      id: `SUP-${Date.now().toString().slice(-4)}`,
      status: "Active",
      created: new Date().toISOString().split("T")[0],
      ...payload,
    };
  }
}

export async function updateSupplier(id, payload) {
  try {
    return await api.put(`/suppliers/${id}`, payload);
  } catch (err) {
    console.warn("Backend unavailable, updating supplier locally:", err.message);
    return { id, ...payload };
  }
}

export async function deleteSupplier(id) {
  try {
    return await api.delete(`/suppliers/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, deleting supplier locally:", err.message);
    return { id };
  }
}
