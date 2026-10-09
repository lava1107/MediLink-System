import { api } from "./api.js";

export async function getCustomers() {
  try {
    return await api.get("/customers");
  } catch (err) {
    console.warn("Backend unavailable, fetching customers locally:", err.message);
    return [];
  }
}

export async function getCustomerById(id) {
  try {
    return await api.get(`/customers/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, fetching customer locally:", err.message);
    return null;
  }
}

export async function createCustomer(payload) {
  try {
    return await api.post("/customers", payload);
  } catch (err) {
    console.warn("Backend unavailable, creating customer locally:", err.message);
    return {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      created: new Date().toISOString().split("T")[0],
      ...payload,
    };
  }
}

export async function updateCustomer(id, payload) {
  try {
    return await api.put(`/customers/${id}`, payload);
  } catch (err) {
    console.warn("Backend unavailable, updating customer locally:", err.message);
    return { id, ...payload };
  }
}

export async function deleteCustomer(id) {
  try {
    return await api.delete(`/customers/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, deleting customer locally:", err.message);
    return { id };
  }
}
