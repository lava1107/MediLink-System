import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPinned, CalendarClock, Pencil, Plus } from "lucide-react";
import { T } from "../../utils/theme.js";
import { formatCurrency, formatDate } from "../../utils/format.js";
import { useApp } from "../../hooks/useApp.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useRecent } from "../../context/RecentContext.jsx";
import { stockStatus, updateMedicine, medicineStock } from "../../services/medicineService.js";
import { createBatch, updateBatch } from "../../services/batchService.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Btn from "../../components/common/Btn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";

export default function MedicineDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, setDb, toast, refreshDb } = useApp();
  const { currentBranch } = useAuth();
  const { addRecentItem } = useRecent();
  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState({});

  // Add Stock / Batch state
  const [addStockModal, setAddStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({
    branch: "Kovilpatti Branch",
    batchNo: "",
    quantity: 100,
    available: 100,
    mfgDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    rack: "A1-01",
    purchasePrice: 0,
    sellingPrice: 0,
  });

  // Edit Batch state
  const [editBatchModal, setEditBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchEditForm, setBatchEditForm] = useState({
    available: 0,
    quantity: 0,
    rack: "",
    expiryDate: "",
    sellingPrice: 0,
  });

  const med = (db?.medicines || []).find((m) => m.id === id);

  useEffect(() => {
    if (med) {
      addRecentItem({
        id: med.id,
        type: "Medicine",
        title: med.name,
        subtitle: `${med.generic || med.brand || "Medicine"} · ${med.dosage || ""}`,
        path: `/medicines/${med.id}`,
      });
    }
  }, [med?.id, med?.name]);

  if (!med) {
    return (
      <div>
        <button onClick={() => navigate("/medicines")} className="flex items-center gap-1.5 text-xs font-semibold mb-4" style={{ color: T.blue }}>
          <ArrowLeft size={14} /> Back to Medicines
        </button>
        <EmptyState title="Medicine not found" />
      </div>
    );
  }

  const batches = (db.batches || []).filter(
    (b) => b.medicineId === med.id || b.medicine_id === med.id || b.medicineName === med.name
  );
  const totalQty = batches.length > 0
    ? batches.reduce((a, b) => a + (Number(b.quantity) || 0), 0)
    : (Number(med.stock) || 0);
  const availQty = medicineStock(med, db.batches);

  function openEdit() {
    setForm({
      name: med.name || "",
      generic: med.generic || "",
      brand: med.brand || "",
      manufacturer: med.manufacturer || "",
      category: med.category || "",
      type: med.type || "OTC",
      dosage: med.dosage || "Tablet",
      strength: med.strength || "",
      purchase: med.purchase || 0,
      selling: med.selling || 0,
      gst: med.gst !== undefined ? med.gst : 12,
      rx: Boolean(med.rx),
      status: med.status || "Active",
    });
    setEditModal(true);
  }

  function openAddStock() {
    const defaultBranch = currentBranch && currentBranch !== "All" && currentBranch !== "All Branches"
      ? currentBranch
      : db.branches?.[0]?.name || "Kovilpatti Branch";
    setStockForm({
      branch: defaultBranch,
      batchNo: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      quantity: 100,
      available: 100,
      mfgDate: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      rack: "A1-01",
      purchasePrice: med.purchase || 0,
      sellingPrice: med.selling || 0,
    });
    setAddStockModal(true);
  }

  function openEditBatch(b) {
    setEditingBatch(b);
    setBatchEditForm({
      available: b.available !== undefined ? b.available : b.quantity,
      quantity: b.quantity || b.available || 0,
      rack: b.rack || "A1-01",
      expiryDate: b.expiryDate ? b.expiryDate.split("T")[0] : "",
      sellingPrice: b.sellingPrice || med.selling || 0,
    });
    setEditBatchModal(true);
  }

  async function handleSaveStock() {
    if (!stockForm.batchNo || stockForm.available === undefined || Number(stockForm.available) < 0) {
      toast("Please provide batch number and valid available quantity.", "error");
      return;
    }
    try {
      const selectedBranch = (db?.branches || []).find((b) => b.name === stockForm.branch) || { id: "BR-01", name: stockForm.branch };
      const payload = {
        batchNo: stockForm.batchNo,
        medicineId: med.id,
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
        mfgDate: stockForm.mfgDate,
        expiryDate: stockForm.expiryDate,
        quantity: Number(stockForm.quantity || stockForm.available),
        available: Number(stockForm.available),
        purchasePrice: Number(stockForm.purchasePrice || med.purchase || 0),
        sellingPrice: Number(stockForm.sellingPrice || med.selling || 0),
        rack: stockForm.rack || "A1-01",
      };

      const created = await createBatch(payload);

      setDb((d) => {
        const nextBatches = [
          {
            id: created.id || `BAT-${Date.now().toString().slice(-4)}`,
            medicineName: med.name,
            ...payload,
            ...created,
          },
          ...(d.batches || []),
        ];
        const nextStock = medicineStock(med, nextBatches);
        const nextMeds = (d.medicines || []).map((m) =>
          m.id === med.id ? { ...m, stock: nextStock } : m
        );
        return {
          ...d,
          batches: nextBatches,
          medicines: nextMeds,
        };
      });

      toast(`Added ${stockForm.available} units to ${med.name} successfully!`);
      setAddStockModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to add stock.", "error");
    }
  }

  async function handleSaveBatchEdit() {
    if (!editingBatch || batchEditForm.available === undefined || Number(batchEditForm.available) < 0) {
      toast("Please enter a valid available quantity.", "error");
      return;
    }
    try {
      const payload = {
        ...editingBatch,
        available: Number(batchEditForm.available),
        quantity: Number(batchEditForm.quantity || editingBatch.quantity),
        rack: batchEditForm.rack || editingBatch.rack,
        expiryDate: batchEditForm.expiryDate || editingBatch.expiryDate,
        sellingPrice: Number(batchEditForm.sellingPrice || editingBatch.sellingPrice),
      };

      const updated = await updateBatch(editingBatch.id, payload);

      setDb((d) => {
        const nextBatches = (d.batches || []).map((b) =>
          b.id === editingBatch.id ? { ...b, ...payload, ...updated } : b
        );
        const nextStock = medicineStock(med, nextBatches);
        const nextMeds = (d.medicines || []).map((m) =>
          m.id === med.id ? { ...m, stock: nextStock } : m
        );
        return {
          ...d,
          batches: nextBatches,
          medicines: nextMeds,
        };
      });

      toast(`Batch ${editingBatch.batchNo} stock updated to ${batchEditForm.available} units.`);
      setEditBatchModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to update batch stock.", "error");
    }
  }

  async function handleSaveEdit() {
    if (!form.name || !form.generic || !form.manufacturer || !form.category) {
      toast("Please fill all required fields.", "error");
      return;
    }
    try {
      let updated;
      try {
        updated = await updateMedicine(med.id, form);
      } catch (apiErr) {
        console.warn("Backend unavailable, saving medicine edit locally:", apiErr.message);
        updated = { id: med.id, ...form };
      }
      setDb((d) => {
        const oldName = med.name;
        const newName = updated.name || form.name || oldName;

        return {
          ...d,
          medicines: d.medicines.map((m) => (m.id === med.id ? { ...m, ...updated, rx: Boolean(updated.rx ?? form.rx) } : m)),
          batches: (d.batches || []).map((b) =>
            b.medicineId === med.id || (oldName && b.medicineName === oldName)
              ? { ...b, medicineName: newName, medicineId: med.id }
              : b
          ),
          prescriptions: (d.prescriptions || []).map((p) =>
            p.medicineId === med.id || (oldName && p.medicine === oldName)
              ? { ...p, medicine: newName, medicineId: med.id }
              : p
          ),
          reservations: (d.reservations || []).map((r) =>
            r.medicineId === med.id || (oldName && r.medicine === oldName)
              ? { ...r, medicine: newName, medicineId: med.id }
              : r
          ),
          partnerAvailability: (d.partnerAvailability || []).map((pa) =>
            oldName && pa.medicineName === oldName ? { ...pa, medicineName: newName } : pa
          ),
        };
      });
      toast("Medicine updated successfully.");
      setEditModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to update medicine.", "error");
    }
  }

  return (
    <div>
      <button onClick={() => navigate("/medicines")} className="flex items-center gap-1.5 text-xs font-semibold mb-4" style={{ color: T.blue }}>
        <ArrowLeft size={14} /> Back to Medicines
      </button>
      <PageHeader
        title={med.name}
        subtitle={`${med.generic} · ${med.strength}`}
        crumbs={["MediLink", "Medicines", med.name]}
        action={
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-xs px-3 py-1.5 rounded-xl border bg-emerald-50 text-emerald-800 border-emerald-200">
              Available: {availQty} units
            </span>
            <StatusBadge status={stockStatus(availQty)} />
            <Btn icon={Plus} size="sm" onClick={openAddStock}>
              Add Stock / Batch
            </Btn>
            <Btn icon={Pencil} size="sm" variant="secondary" onClick={openEdit}>
              Edit Details
            </Btn>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: T.border }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: T.navy }}>
            Basic Information
          </h3>
          <div className="flex flex-col gap-2.5 text-sm">
            {[
              ["Medicine ID", med.id],
              ["Generic Name", med.generic],
              ["Brand Name", med.brand],
              ["Manufacturer", med.manufacturer],
              ["Category", med.category],
              ["Medicine Type", med.type],
              ["Dosage Form", med.dosage],
              ["Strength", med.strength],
              ["Prescription Required", med.rx ? "Yes" : "No"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b pb-2" style={{ borderColor: T.borderSoft }}>
                <span style={{ color: "#9AA6B2" }}>{k}</span>
                <span className="font-medium text-right" style={{ color: T.navy }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: T.border }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: T.navy }}>
            Pricing
          </h3>
          <div className="flex flex-col gap-2.5 text-sm mb-5">
            <div className="flex justify-between border-b pb-2" style={{ borderColor: T.borderSoft }}>
              <span style={{ color: "#9AA6B2" }}>Purchase Price</span>
              <span className="font-medium" style={{ color: T.navy }}>
                {formatCurrency(med.purchase)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: T.borderSoft }}>
              <span style={{ color: "#9AA6B2" }}>Selling Price</span>
              <span className="font-medium" style={{ color: T.navy }}>
                {formatCurrency(med.selling)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: T.borderSoft }}>
              <span style={{ color: "#9AA6B2" }}>GST</span>
              <span className="font-medium" style={{ color: T.navy }}>
                {med.gst}%
              </span>
            </div>
          </div>
          <h3 className="font-bold text-sm mb-3" style={{ color: T.navy }}>
            Stock Summary
          </h3>
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "#9AA6B2" }}>Total Quantity</span>
              <span className="font-medium" style={{ color: T.navy }}>
                {totalQty}
              </span>
            </div>
            <div className="flex justify-between items-center bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
              <div>
                <span className="font-bold text-emerald-900 text-xs block">Available Quantity</span>
                <span className="font-extrabold text-emerald-700 text-lg">
                  {availQty} units
                </span>
              </div>
              <button
                type="button"
                onClick={openAddStock}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus size={14} /> Add Stock
              </button>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#9AA6B2" }}>Number of Batches</span>
              <span className="font-medium" style={{ color: T.navy }}>
                {batches.length}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: T.border }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: T.navy }}>
            Description
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: T.navySoft }}>
            {med.name} ({med.generic}) is classified under {med.category.toLowerCase()} and manufactured by {med.manufacturer}.
            {med.rx
              ? " This is a prescription-only medicine and requires a valid doctor's prescription before dispensing."
              : " This medicine is available over the counter."}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Btn variant="secondary" size="sm" icon={Plus} onClick={openAddStock}>
              Add New Batch / Stock
            </Btn>
            <Btn variant="secondary" size="sm" icon={MapPinned} onClick={() => navigate("/availability")}>
              Check Other Branches
            </Btn>
            <Btn variant="secondary" size="sm" icon={CalendarClock} onClick={() => navigate("/reservations")}>
              Reserve for Customer
            </Btn>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.border }}>
        <div className="flex items-center justify-between px-5 py-4 border-b font-bold text-sm" style={{ borderColor: T.border, color: T.navy }}>
          <span>Batch & Inventory List</span>
          <button
            type="button"
            onClick={openAddStock}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Plus size={13} /> Add Batch
          </button>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: T.blueTint2 }}>
              {["Batch No.", "Branch", "Rack / Shelf", "Mfg Date", "Expiry Date", "Stock (Avail / Total)", "Selling Price", "Status", "Action"].map((h, i) => (
                <th key={h} className={`px-4 py-2.5 font-semibold ${i === 8 ? "text-right" : "text-left"}`} style={{ color: T.navySoft }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: T.borderSoft }}>
                <td className="px-4 py-2.5 font-semibold" style={{ color: T.navy }}>
                  {b.batchNo}
                </td>
                <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                  {b.branchName}
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    📍 {b.rack || "A1-01"}
                  </span>
                </td>
                <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                  {formatDate(b.mfgDate)}
                </td>
                <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                  {formatDate(b.expiryDate)}
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-bold text-emerald-700">{b.available}</span>
                  <span className="text-slate-400"> / {b.quantity}</span>
                </td>
                <td className="px-4 py-2.5 font-semibold" style={{ color: T.navy }}>
                  {formatCurrency(b.sellingPrice)}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={b.status} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => openEditBatch(b)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-[11px] transition-colors cursor-pointer"
                    title="Adjust stock quantity or details"
                  >
                    <Pencil size={11} /> Adjust Qty
                  </button>
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  No batches added yet. Click &quot;Add Stock / Batch&quot; above to add inventory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Add Stock / Batch */}
      <Modal
        open={addStockModal}
        onClose={() => setAddStockModal(false)}
        title={`Add Stock / New Batch — ${med.name}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setAddStockModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSaveStock}>Add Stock Now</Btn>
          </>
        }
      >
        <div className="flex flex-col gap-3.5 text-xs">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
            Adding inventory for <strong className="font-bold">{med.name}</strong> ({med.generic} · {med.strength}).
            The entered available quantity will immediately increase total stock for the selected branch.
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <FormSelect
              label="Select Branch"
              required
              value={stockForm.branch}
              onChange={(e) => setStockForm((f) => ({ ...f, branch: e.target.value }))}
            >
              {db.branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </FormSelect>
            <FormInput
              label="Batch Number"
              required
              placeholder="e.g. BAT-2026-01"
              value={stockForm.batchNo}
              onChange={(e) => setStockForm((f) => ({ ...f, batchNo: e.target.value }))}
            />
            <FormInput
              label="Available Quantity (Units to Add)"
              required
              type="number"
              min="1"
              placeholder="e.g. 100"
              value={stockForm.available}
              onChange={(e) =>
                setStockForm((f) => ({
                  ...f,
                  available: Number(e.target.value),
                  quantity: Number(e.target.value),
                }))
              }
            />
            <FormInput
              label="Rack / Shelf Location"
              placeholder="e.g. A1-02"
              value={stockForm.rack}
              onChange={(e) => setStockForm((f) => ({ ...f, rack: e.target.value }))}
            />
            <FormInput
              label="Manufacturing Date"
              required
              type="date"
              value={stockForm.mfgDate}
              onChange={(e) => setStockForm((f) => ({ ...f, mfgDate: e.target.value }))}
            />
            <FormInput
              label="Expiry Date"
              required
              type="date"
              value={stockForm.expiryDate}
              onChange={(e) => setStockForm((f) => ({ ...f, expiryDate: e.target.value }))}
            />
            <FormInput
              label="Purchase Price (₹)"
              type="number"
              min="0"
              value={stockForm.purchasePrice}
              onChange={(e) => setStockForm((f) => ({ ...f, purchasePrice: Number(e.target.value) }))}
            />
            <FormInput
              label="Selling Price (₹)"
              type="number"
              min="0"
              value={stockForm.sellingPrice}
              onChange={(e) => setStockForm((f) => ({ ...f, sellingPrice: Number(e.target.value) }))}
            />
          </div>
        </div>
      </Modal>

      {/* Modal 2: Adjust Batch Quantity & Details */}
      <Modal
        open={editBatchModal}
        onClose={() => setEditBatchModal(false)}
        title={`Adjust Stock — Batch ${editingBatch?.batchNo || ""}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setEditBatchModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSaveBatchEdit}>Save Adjusted Stock</Btn>
          </>
        }
      >
        <div className="flex flex-col gap-3.5 text-xs">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            Adjusting stock for batch <strong className="font-bold">{editingBatch?.batchNo}</strong> at {editingBatch?.branchName}.
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <FormInput
              label="Available Quantity"
              required
              type="number"
              min="0"
              value={batchEditForm.available}
              onChange={(e) => setBatchEditForm((f) => ({ ...f, available: Number(e.target.value) }))}
            />
            <FormInput
              label="Total Initial Quantity"
              type="number"
              min="0"
              value={batchEditForm.quantity}
              onChange={(e) => setBatchEditForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
            />
            <FormInput
              label="Rack / Shelf Location"
              value={batchEditForm.rack}
              onChange={(e) => setBatchEditForm((f) => ({ ...f, rack: e.target.value }))}
            />
            <FormInput
              label="Expiry Date"
              type="date"
              value={batchEditForm.expiryDate}
              onChange={(e) => setBatchEditForm((f) => ({ ...f, expiryDate: e.target.value }))}
            />
            <FormInput
              label="Selling Price (₹)"
              type="number"
              min="0"
              value={batchEditForm.sellingPrice}
              onChange={(e) => setBatchEditForm((f) => ({ ...f, sellingPrice: Number(e.target.value) }))}
            />
          </div>
        </div>
      </Modal>

      {/* Modal 3: Edit Medicine Details */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit Medicine — ${form.name}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setEditModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSaveEdit}>Update Medicine</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Medicine Name" required placeholder="e.g. Dolo 650" value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <FormInput label="Generic Name" required placeholder="e.g. Paracetamol" value={form.generic || ""} onChange={(e) => setForm((f) => ({ ...f, generic: e.target.value }))} />
          <FormInput label="Brand" placeholder="e.g. Micro Labs" value={form.brand || ""} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
          <FormInput label="Manufacturer" required placeholder="e.g. Micro Labs Ltd." value={form.manufacturer || ""} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} />
          <FormSelect label="Category" required value={form.category || ""} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            <option value="">Select category</option>
            {db.categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </FormSelect>
          <FormSelect label="Medicine Type" required value={form.type || "OTC"} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option>OTC</option>
            <option>Prescription</option>
            <option>Antibiotic</option>
            <option>Supplement</option>
          </FormSelect>
          <FormInput label="Dosage Form" placeholder="Tablet / Syrup / Injection" value={form.dosage || ""} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} />
          <FormInput label="Strength" placeholder="e.g. 650 mg" value={form.strength || ""} onChange={(e) => setForm((f) => ({ ...f, strength: e.target.value }))} />
          <FormInput label="Purchase Price (₹)" required type="number" min="0" value={form.purchase || 0} onChange={(e) => setForm((f) => ({ ...f, purchase: e.target.value }))} />
          <FormInput label="Selling Price (₹)" required type="number" min="0" value={form.selling || 0} onChange={(e) => setForm((f) => ({ ...f, selling: e.target.value }))} />
          <FormInput label="GST (%)" type="number" min="0" value={form.gst !== undefined ? form.gst : 12} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))} />
          <FormSelect label="Prescription Required" value={String(form.rx)} onChange={(e) => setForm((f) => ({ ...f, rx: e.target.value === "true" }))}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </FormSelect>
        </div>
      </Modal>
    </div>
  );
}
