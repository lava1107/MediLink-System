import { api } from "./api.js";

export async function getPurchases() {
  return await api.get("/purchases");
}

export async function getPurchaseById(id) {
  return await api.get(`/purchases/${id}`);
}

/**
 * Creates a purchase transaction in MySQL backend:
 * - Records purchase & purchase items
 * - Creates/updates medicine batches with increased quantity
 */
export async function createPurchase(db, form) {
  try {
    const result = await api.post("/purchases", form);
    if (result && result.purchase) {
      // Merge new/updated batches with existing
      const existingBatchMap = new Map((db.batches || []).map((b) => [b.id, b]));
      for (const b of result.batches || []) {
        existingBatchMap.set(b.id, b);
      }

      return {
        purchases: [result.purchase, ...(db.purchases || [])],
        batches: Array.from(existingBatchMap.values()),
        newPurchase: result.purchase,
      };
    }
  } catch (err) {
    console.warn("Backend unavailable, recording purchase locally:", err.message);
  }

  // Local fallback for offline mode
  const newPurchase = {
    id: `PUR-${String((db.purchases?.length || 0) + 1).padStart(2, "0")}`,
    invoice: `INV/${Date.now().toString().slice(-4)}`,
    supplier: form.supplier,
    branch: form.branch,
    purchasedBy: form.purchasedBy || "Admin",
    date: new Date().toISOString().slice(0, 10),
    amount: Number(form.grandTotal) || 0,
    payment: form.paymentStatus || "Pending",
    status: "Received",
  };

  return {
    purchases: [newPurchase, ...(db.purchases || [])],
    batches: db.batches || [],
    newPurchase,
  };
}

export async function updatePurchase(id, payload) {
  try {
    return await api.put(`/purchases/${id}`, payload);
  } catch (err) {
    console.warn("Backend unavailable, updating purchase locally:", err.message);
    return { id, ...payload };
  }
}

export async function deletePurchase(id) {
  try {
    return await api.delete(`/purchases/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, deleting purchase locally:", err.message);
    return { id };
  }
}

