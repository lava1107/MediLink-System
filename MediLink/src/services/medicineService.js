import { api } from "./api.js";

export async function getMedicines() {
  try {
    return await api.get("/medicines");
  } catch (err) {
    console.warn("Backend unavailable, fetching medicines locally:", err.message);
    return [];
  }
}

export async function getMedicineById(id) {
  try {
    return await api.get(`/medicines/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, fetching medicine locally:", err.message);
    return null;
  }
}

export async function createMedicine(payload) {
  try {
    return await api.post("/medicines", payload);
  } catch (err) {
    console.warn("Backend unavailable, creating medicine locally:", err.message);
    return {
      id: `MED-${Date.now().toString().slice(-4)}`,
      stock: Number(payload.initialStock || payload.stock || 0),
      ...payload,
    };
  }
}

export async function updateMedicine(id, payload) {
  try {
    return await api.put(`/medicines/${id}`, payload);
  } catch (err) {
    console.warn("Backend unavailable, updating medicine locally:", err.message);
    return { id, ...payload };
  }
}

export async function deleteMedicine(id) {
  try {
    return await api.delete(`/medicines/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, deleting medicine locally:", err.message);
    return { id };
  }
}

export function medicineStock(medicine, batches = []) {
  if (!medicine) return 0;
  const medBatches = (batches || []).filter(
    (b) => (b.medicineId === medicine.id || b.medicine_id === medicine.id) && b.status !== "Expired"
  );
  if (medBatches.length > 0) {
    return medBatches.reduce((total, b) => total + (Number(b.available) || 0), 0);
  }
  return Number(medicine.stock) || 0;
}

export function stockStatus(qty) {
  if (qty <= 0) return "Out of Stock";
  if (qty <= 40) return "Low Stock";
  return "In Stock";
}
