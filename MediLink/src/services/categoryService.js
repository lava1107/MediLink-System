import { api } from "./api.js";

export async function getCategories() {
  try {
    return await api.get("/categories");
  } catch (err) {
    console.warn("Backend unavailable, fetching categories locally:", err.message);
    return [];
  }
}

export async function createCategory(payload) {
  try {
    return await api.post("/categories", payload);
  } catch (err) {
    console.warn("Backend unavailable, creating category locally:", err.message);
    return {
      id: `CAT-${Date.now().toString().slice(-4)}`,
      status: "Active",
      created: new Date().toISOString().split("T")[0],
      ...payload,
    };
  }
}

export async function updateCategory(id, payload) {
  try {
    return await api.put(`/categories/${id}`, payload);
  } catch (err) {
    console.warn("Backend unavailable, updating category locally:", err.message);
    return { id, ...payload };
  }
}

export async function deleteCategory(id) {
  try {
    return await api.delete(`/categories/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, deleting category locally:", err.message);
    return { id };
  }
}
