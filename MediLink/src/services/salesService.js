import { api } from "./api.js";

export async function getSales() {
  return await api.get("/sales");
}

export async function getSaleById(id) {
  return await api.get(`/sales/${id}`);
}

/**
 * Creates a sale transaction in MySQL backend (with robust local stock deduction fallback):
 * @param {object} db - current AppContext db { sales, batches, medicines }
 * @param {object} form - { cart, customerName, branch, pharmacistName, payment, grandTotal }
 */
export async function createSale(db, form) {
  const { cart, customerName, branch, pharmacistName, payment, grandTotal } = form;

  // Compute quantity deductions per batch and per medicine
  const batchDeductionMap = new Map();
  const medDeductionMap = new Map();
  for (const item of cart || []) {
    const qty = Number(item.qty || item.quantity || 1);
    if (item.batchId) {
      batchDeductionMap.set(item.batchId, (batchDeductionMap.get(item.batchId) || 0) + qty);
    }
    if (item.medicineId) {
      medDeductionMap.set(item.medicineId, (medDeductionMap.get(item.medicineId) || 0) + qty);
    }
  }

  // Pre-calculate locally deducted batches and medicines
  const locallyUpdatedBatches = (db.batches || []).map((b) => {
    if (batchDeductionMap.has(b.id)) {
      const deduction = batchDeductionMap.get(b.id);
      const newAvail = Math.max(0, Number(b.available || 0) - deduction);
      return { ...b, available: newAvail };
    }
    return b;
  });

  const locallyUpdatedMedicines = (db.medicines || []).map((m) => {
    if (medDeductionMap.has(m.id)) {
      const deduction = medDeductionMap.get(m.id);
      const newStock = Math.max(0, Number(m.stock || 0) - deduction);
      return { ...m, stock: newStock };
    }
    return m;
  });

  try {
    const result = await api.post("/sales", form);
    if (result && result.sale) {
      // Merge updated batches from server, ensuring camelCase and consistency
      const serverBatchMap = new Map((result.batches || []).map((b) => [b.id, b]));
      const mergedBatches = (db.batches || []).map((b) => {
        if (serverBatchMap.has(b.id)) {
          const s = serverBatchMap.get(b.id);
          return {
            ...b,
            ...s,
            available: Number(s.available ?? b.available),
            batchNo: s.batchNo || s.batch_no || b.batchNo,
            medicineId: s.medicineId || s.medicine_id || b.medicineId,
          };
        }
        return b;
      });

      return {
        sales: [result.sale, ...(db.sales || [])],
        batches: mergedBatches,
        medicines: locallyUpdatedMedicines,
        newSale: result.sale,
      };
    }
  } catch (err) {
    console.warn("Backend unavailable, processing sale and reducing stock locally:", err.message);
  }

  // Local offline fallback
  const sCount = (db.sales?.length || 0) + 1;
  const newSale = {
    id: `SAL-${String(sCount).padStart(2, "0")}`,
    bill: `MDL/26-27/${1000 + sCount}`,
    customer: customerName || "Walk-in Customer",
    pharmacist: pharmacistName || "Pharmacist",
    branch: branch || "Kovilpatti Branch",
    amount: Number(grandTotal) || 0,
    payment: payment || "Cash",
    date: new Date().toISOString().slice(0, 10),
    status: "Completed",
  };

  return {
    sales: [newSale, ...(db.sales || [])],
    batches: locallyUpdatedBatches,
    medicines: locallyUpdatedMedicines,
    newSale,
  };
}

