import { api } from "./api.js";

export async function getBranches() {
  try {
    return await api.get("/branches");
  } catch (err) {
    console.warn("Backend unavailable, fetching branches locally:", err.message);
    return [];
  }
}

export async function getBranchById(id) {
  try {
    return await api.get(`/branches/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, fetching branch locally:", err.message);
    return null;
  }
}

export async function createBranch(payload) {
  try {
    return await api.post("/branches", payload);
  } catch (err) {
    console.warn("Backend unavailable, creating branch locally:", err.message);
    return {
      id: `BR-${Date.now().toString().slice(-4)}`,
      status: "Active",
      ...payload,
    };
  }
}

export async function updateBranch(id, payload) {
  try {
    return await api.put(`/branches/${id}`, payload);
  } catch (err) {
    console.warn("Backend unavailable, updating branch locally:", err.message);
    return { id, ...payload };
  }
}

export async function deleteBranch(id) {
  try {
    return await api.delete(`/branches/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, deleting branch locally:", err.message);
    return { id };
  }
}
