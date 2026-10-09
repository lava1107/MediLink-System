import { api } from "./api.js";

export async function getPrescriptions() {
  return await api.get("/prescriptions");
}

export async function getPrescriptionById(id) {
  return await api.get(`/prescriptions/${id}`);
}

/**
 * Finds an existing prescription for customer + medicine
 */
export function findPrescription(prescriptions, customerName, medicineName) {
  if (!prescriptions || !customerName || !medicineName) return null;
  return (
    prescriptions.find(
      (p) =>
        p.customerName?.toLowerCase() === customerName.toLowerCase() &&
        p.medicine?.toLowerCase() === medicineName.toLowerCase()
    ) || null
  );
}

export async function createPrescription(prescriptions, payload) {
  try {
    const created = await api.post("/prescriptions", payload);
    return [created, ...(prescriptions || [])];
  } catch (err) {
    console.warn("Backend unavailable, creating prescription locally:", err.message);
    const local = {
      id: `RX-${Date.now().toString().slice(-4)}`,
      status: "Pending",
      prescriptionDate: new Date().toISOString().split("T")[0],
      prescriptionRef: `RX-${Math.floor(10000 + Math.random() * 90000)}`,
      verifiedBy: "",
      verifiedDate: "",
      remarks: "",
      ...payload,
    };
    return [local, ...(prescriptions || [])];
  }
}

export async function verifyPrescription(prescriptions, id, verifiedBy, remarks = "") {
  try {
    const updated = await api.patch(`/prescriptions/${id}/verify`, { verifiedBy, remarks });
    return (prescriptions || []).map((p) => (p.id === id ? updated : p));
  } catch (err) {
    console.warn("Backend unavailable, verifying prescription locally:", err.message);
    return (prescriptions || []).map((p) =>
      p.id === id ? { ...p, status: "Verified", verifiedBy, verifiedDate: new Date().toISOString().slice(0, 10), remarks } : p
    );
  }
}

export async function rejectPrescription(prescriptions, id, verifiedBy, remarks = "") {
  try {
    const updated = await api.patch(`/prescriptions/${id}/reject`, { verifiedBy, remarks });
    return (prescriptions || []).map((p) => (p.id === id ? updated : p));
  } catch (err) {
    console.warn("Backend unavailable, rejecting prescription locally:", err.message);
    return (prescriptions || []).map((p) =>
      p.id === id ? { ...p, status: "Rejected", verifiedBy, verifiedDate: new Date().toISOString().slice(0, 10), remarks } : p
    );
  }
}

export async function updatePrescription(id, payload) {
  try {
    return await api.put(`/prescriptions/${id}`, payload);
  } catch (err) {
    console.warn("Backend unavailable, updating prescription locally:", err.message);
    return { id, ...payload };
  }
}

export async function deletePrescription(id) {
  try {
    return await api.delete(`/prescriptions/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, deleting prescription locally:", err.message);
    return { id };
  }
}

