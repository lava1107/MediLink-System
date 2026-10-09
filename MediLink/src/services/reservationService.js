import { api } from "./api.js";

export async function getReservations() {
  return await api.get("/reservations");
}

export async function createReservation(reservations, form) {
  try {
    const created = await api.post("/reservations", form);
    return [created, ...(reservations || [])];
  } catch (err) {
    console.warn("Backend unavailable, creating reservation locally:", err.message);
    const local = {
      id: `RES-${Date.now().toString().slice(-4)}`,
      status: "Pending",
      resDate: new Date().toISOString().split("T")[0],
      ...form,
    };
    return [local, ...(reservations || [])];
  }
}

export async function confirmReservation(reservations, id) {
  try {
    const updated = await api.patch(`/reservations/${id}/status`, { action: "confirm" });
    return (reservations || []).map((r) => (r.id === id ? updated : r));
  } catch (err) {
    console.warn("Backend unavailable, confirming reservation locally:", err.message);
    return (reservations || []).map((r) => (r.id === id ? { ...r, status: "Reserved" } : r));
  }
}

export async function markCollected(reservations, id) {
  try {
    const updated = await api.patch(`/reservations/${id}/status`, { action: "collect" });
    return (reservations || []).map((r) => (r.id === id ? updated : r));
  } catch (err) {
    console.warn("Backend unavailable, marking reservation collected locally:", err.message);
    return (reservations || []).map((r) => (r.id === id ? { ...r, status: "Collected" } : r));
  }
}

export async function cancelReservation(reservations, id) {
  try {
    const updated = await api.patch(`/reservations/${id}/status`, { action: "cancel" });
    return (reservations || []).map((r) => (r.id === id ? updated : r));
  } catch (err) {
    console.warn("Backend unavailable, cancelling reservation locally:", err.message);
    return (reservations || []).map((r) => (r.id === id ? { ...r, status: "Cancelled" } : r));
  }
}

export async function updateReservation(id, payload) {
  try {
    return await api.put(`/reservations/${id}`, payload);
  } catch (err) {
    console.warn("Backend unavailable, updating reservation locally:", err.message);
    return { id, ...payload };
  }
}

export async function deleteReservation(id) {
  try {
    return await api.delete(`/reservations/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, deleting reservation locally:", err.message);
    return { id };
  }
}

export async function notifyStockQueue(payload) {
  try {
    return await api.post("/reservations/notify-stock", payload);
  } catch (err) {
    console.warn("Backend notify-stock error:", err.message);
    throw err;
  }
}

export async function sendReservationWhatsApp(id, payload) {
  try {
    return await api.post(`/reservations/${id}/send-whatsapp`, payload);
  } catch (err) {
    console.warn("Backend send-whatsapp error:", err.message);
    throw err;
  }
}

export const sendReservationSMS = sendReservationWhatsApp;


