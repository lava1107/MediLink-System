import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil } from "lucide-react";
import { useApp } from "../../hooks/useApp.js";
import { medicineStock, stockStatus, createMedicine, updateMedicine } from "../../services/medicineService.js";
import { createBatch } from "../../services/batchService.js";
import { formatCurrency } from "../../utils/format.js";
import { T } from "../../utils/theme.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/tables/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Btn from "../../components/common/Btn.jsx";
import IconBtn from "../../components/common/IconBtn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";

import { useAuth } from "../../hooks/useAuth.js";
import BranchTabs from "../../components/common/BranchTabs.jsx";
import { isBranchAll, matchBranch } from "../../utils/branchUtils.js";

export default function MedicinesPage() {
  const { db, setDb, toast, refreshDb } = useApp();
  const { currentBranch } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const isAll = isBranchAll(currentBranch);
  const branchBatches = isAll
    ? (db.batches || [])
    : (db.batches || []).filter((b) => matchBranch(b.branchName, currentBranch) || matchBranch(b.branchId, currentBranch));

  const [form, setForm] = useState({
    name: "",
    generic: "",
    brand: "",
    manufacturer: "",
    category: "",
    type: "OTC",
    dosage: "Tablet",
    strength: "",
    purchase: 0,
    selling: 0,
    gst: 12,
    rx: false,
    status: "Active",
  });

  const rows = (db?.medicines || []).map((m) => {
    const medBatches = branchBatches.filter(
      (b) => b.medicineId === m.id || b.medicine_id === m.id || b.medicineName === m.name
    );
    const racks = [...new Set(medBatches.map((b) => b.rack).filter(Boolean))].join(", ");
    return {
      ...m,
      stock: medicineStock(m, branchBatches),
      rack: racks || (isAll ? "Multi-Branch" : "Rack A1"),
    };
  });

  const [quickStockModal, setQuickStockModal] = useState(false);
  const [quickStockTarget, setQuickStockTarget] = useState(null);
  const [quickStockForm, setQuickStockForm] = useState({
    branch: "Kovilpatti Branch",
    batchNo: "",
    available: 100,
    rack: "A1-01",
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
  });

  function openAdd() {
    const defBranch = !isAll && currentBranch ? currentBranch : (db.branches?.[0]?.name || "Kovilpatti Branch");
    setEditingId(null);
    setForm({
      name: "",
      generic: "",
      brand: "",
      manufacturer: "",
      category: "",
      type: "OTC",
      dosage: "Tablet",
      strength: "",
      purchase: 0,
      selling: 0,
      gst: 12,
      rx: false,
      status: "Active",
      initialStock: 100,
      branch: defBranch,
      rack: "A1-01",
      batchNo: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    });
    setModal(true);
  }

  function openQuickStock(med) {
    const defBranch = !isAll && currentBranch ? currentBranch : (db.branches?.[0]?.name || "Kovilpatti Branch");
    setQuickStockTarget(med);
    setQuickStockForm({
      branch: defBranch,
      batchNo: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      available: 100,
      rack: "A1-01",
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    });
    setQuickStockModal(true);
  }

  function openEdit(med) {
    setEditingId(med.id);
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
    setModal(true);
  }

  async function handleQuickStockSave() {
    if (!quickStockTarget || !quickStockForm.batchNo || !quickStockForm.available || Number(quickStockForm.available) <= 0) {
      toast("Please provide batch number and valid stock quantity.", "error");
      return;
    }
    try {
      const selectedBranch = db.branches.find((b) => b.name === quickStockForm.branch) || { id: "BR-01", name: quickStockForm.branch };
      const payload = {
        batchNo: quickStockForm.batchNo,
        medicineId: quickStockTarget.id,
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
        mfgDate: new Date().toISOString().split("T")[0],
        expiryDate: quickStockForm.expiryDate,
        quantity: Number(quickStockForm.available),
        available: Number(quickStockForm.available),
        purchasePrice: Number(quickStockTarget.purchase || 0),
        sellingPrice: Number(quickStockTarget.selling || 0),
        rack: quickStockForm.rack || "A1-01",
      };

      const createdBatch = await createBatch(payload);

      setDb((d) => {
        const nextBatches = [
          {
            id: createdBatch.id || `BAT-${Date.now().toString().slice(-4)}`,
            medicineName: quickStockTarget.name,
            ...payload,
            ...createdBatch,
          },
          ...(d.batches || []),
        ];
        const nextStock = medicineStock(quickStockTarget, nextBatches);
        const nextMeds = (d.medicines || []).map((m) =>
          m.id === quickStockTarget.id ? { ...m, stock: nextStock } : m
        );
        return {
          ...d,
          batches: nextBatches,
          medicines: nextMeds,
        };
      });

      toast(`Added ${quickStockForm.available} units to ${quickStockTarget.name} successfully!`);
      setQuickStockModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to add stock.", "error");
    }
  }

  async function handleSave() {
    if (!form.name || !form.generic || !form.manufacturer || !form.category) {
      toast("Please fill all required fields.", "error");
      return;
    }
    try {
      if (editingId) {
        let updated;
        try {
          updated = await updateMedicine(editingId, form);
        } catch (apiErr) {
          console.warn("Backend unavailable, saving medicine edit locally:", apiErr.message);
          updated = { id: editingId, ...form };
        }
        setDb((d) => {
          const oldMed = (d.medicines || []).find((m) => m.id === editingId);
          const oldName = oldMed?.name;
          const newName = updated.name || form.name || oldName;

          return {
            ...d,
            medicines: d.medicines.map((m) => (m.id === editingId ? { ...m, ...updated, rx: Boolean(updated.rx ?? form.rx) } : m)),
            batches: (d.batches || []).map((b) =>
              b.medicineId === editingId || (oldName && b.medicineName === oldName)
                ? { ...b, medicineName: newName, medicineId: editingId }
                : b
            ),
            prescriptions: (d.prescriptions || []).map((p) =>
              p.medicineId === editingId || (oldName && p.medicine === oldName)
                ? { ...p, medicine: newName, medicineId: editingId }
                : p
            ),
            reservations: (d.reservations || []).map((r) =>
              r.medicineId === editingId || (oldName && r.medicine === oldName)
                ? { ...r, medicine: newName, medicineId: editingId }
                : r
            ),
            partnerAvailability: (d.partnerAvailability || []).map((pa) =>
              oldName && pa.medicineName === oldName ? { ...pa, medicineName: newName } : pa
            ),
          };
        });
        toast("Medicine updated successfully.");
      } else {
        const initialQty = Number(form.initialStock || 0);
        let created;
        try {
          created = await createMedicine(form);
        } catch (apiErr) {
          console.warn("Backend unavailable, creating medicine locally:", apiErr.message);
          created = { id: `MED-${String((db.medicines?.length || 0) + 1).padStart(2, "0")}`, ...form, stock: initialQty };
        }

        let newBatch = null;
        if (initialQty > 0) {
          const selectedBranch = db.branches.find((b) => b.name === form.branch) || { id: "BR-01", name: form.branch || "Kovilpatti Branch" };
          const batchPayload = {
            batchNo: form.batchNo || `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
            medicineId: created.id,
            branchId: selectedBranch.id,
            branchName: selectedBranch.name,
            mfgDate: new Date().toISOString().split("T")[0],
            expiryDate: form.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
            quantity: initialQty,
            available: initialQty,
            purchasePrice: Number(form.purchase || 0),
            sellingPrice: Number(form.selling || 0),
            rack: form.rack || "A1-01",
          };
          try {
            const bRes = await createBatch(batchPayload);
            newBatch = { id: bRes.id || `BAT-${Date.now().toString().slice(-4)}`, medicineName: created.name, ...batchPayload, ...bRes };
          } catch {
            newBatch = { id: `BAT-${Date.now().toString().slice(-4)}`, medicineName: created.name, ...batchPayload };
          }
        }

        setDb((d) => ({
          ...d,
          medicines: [...d.medicines, { ...created, stock: initialQty }],
          batches: newBatch ? [newBatch, ...(d.batches || [])] : d.batches || [],
        }));

        toast(
          initialQty > 0
            ? `Medicine and initial available stock of ${initialQty} units added successfully!`
            : "Medicine added successfully."
        );
      }
      setModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to save medicine.", "error");
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <PageHeader
          title="Medicines"
          subtitle={
            isAll
              ? "Manage the full medicine catalogue across all branches"
              : `Catalogue stock & rack locations for ${currentBranch}`
          }
          crumbs={["MediLink", "Medicines"]}
          action={
            <Btn icon={Plus} onClick={openAdd}>
              Add Medicine
            </Btn>
          }
        />
        <BranchTabs />
      </div>
      <DataTable
        columns={[
          { key: "id", label: "Medicine ID", sortable: true },
          { key: "name", label: "Medicine Name", sortable: true, render: (r) => <span className="font-semibold">{r.name}</span> },
          { key: "generic", label: "Generic Name" },
          { key: "category", label: "Category" },
          { key: "manufacturer", label: "Manufacturer" },
          { key: "strength", label: "Strength" },
          {
            key: "rx",
            label: "Rx",
            render: (r) =>
              r.rx ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: T.redTint, color: T.red }}>
                  Required
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: T.borderSoft, color: "#6B7280" }}>
                  OTC
                </span>
              ),
          },
          { key: "selling", label: "Selling Price", sortable: true, render: (r) => formatCurrency(r.selling) },
          {
            key: "rack",
            label: "Rack / Shelf",
            render: (r) => (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                📍 {r.rack}
              </span>
            ),
          },
          {
            key: "stock",
            label: "Available Qty",
            sortable: true,
            render: (r) => (
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs px-2 py-0.5 rounded border bg-blue-50/70 text-blue-900 border-blue-200">
                  {r.stock} units
                </span>
                <StatusBadge status={stockStatus(r.stock)} />
              </div>
            ),
          },
        ]}
        data={rows}
        searchKeys={["name", "generic", "brand", "manufacturer"]}
        filters={[
          { key: "category", label: "Category", options: [...new Set(rows.map((r) => r.category))] },
          { key: "manufacturer", label: "Manufacturer", options: [...new Set(rows.map((r) => r.manufacturer))] },
          { key: "type", label: "Type", options: [...new Set(rows.map((r) => r.type))] },
        ]}
        onRowClick={(r) => navigate(`/medicines/${r.id}`)}
        actions={(r) => (
          <div className="flex items-center gap-1">
            <IconBtn icon={Plus} tone="green" title="Quick Add Stock" onClick={(e) => { e.stopPropagation(); openQuickStock(r); }} />
            <IconBtn icon={Eye} tone="blue" title="View Details" onClick={() => navigate(`/medicines/${r.id}`)} />
            <IconBtn icon={Pencil} tone="blue" title="Edit Medicine" onClick={(e) => { e.stopPropagation(); openEdit(r); }} />
          </div>
        )}
      />
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editingId ? `Edit Medicine — ${form.name}` : "Add New Medicine"}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSave}>
              {editingId ? "Update Medicine" : "Save Medicine"}
            </Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Medicine Name" required placeholder="e.g. Dolo 650" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <FormInput label="Generic Name" required placeholder="e.g. Paracetamol" value={form.generic} onChange={(e) => setForm((f) => ({ ...f, generic: e.target.value }))} />
          <FormInput label="Brand" placeholder="e.g. Micro Labs" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
          <FormInput label="Manufacturer" required placeholder="e.g. Micro Labs Ltd." value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} />
          <FormSelect label="Category" required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            <option value="">Select category</option>
            {db.categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </FormSelect>
          <FormSelect label="Medicine Type" required value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option>OTC</option>
            <option>Prescription</option>
            <option>Antibiotic</option>
            <option>Supplement</option>
          </FormSelect>
          <FormInput label="Dosage Form" placeholder="Tablet / Syrup / Injection" value={form.dosage} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} />
          <FormInput label="Strength" placeholder="e.g. 650 mg" value={form.strength} onChange={(e) => setForm((f) => ({ ...f, strength: e.target.value }))} />
          <FormInput label="Purchase Price (₹)" required type="number" min="0" value={form.purchase} onChange={(e) => setForm((f) => ({ ...f, purchase: e.target.value }))} />
          <FormInput label="Selling Price (₹)" required type="number" min="0" value={form.selling} onChange={(e) => setForm((f) => ({ ...f, selling: e.target.value }))} />
          <FormInput label="GST (%)" type="number" min="0" value={form.gst} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))} />
          <FormSelect label="Prescription Required" value={String(form.rx)} onChange={(e) => setForm((f) => ({ ...f, rx: e.target.value === "true" }))}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </FormSelect>

          {!editingId && (
            <div className="col-span-2 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 mt-2">
              <span className="font-bold text-emerald-900 text-xs block mb-2.5">
                Initial Stock & Inventory (Optional — creates initial batch automatically)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="Initial Available Stock (Units)"
                  type="number"
                  min="0"
                  placeholder="e.g. 100"
                  value={form.initialStock || 0}
                  onChange={(e) => setForm((f) => ({ ...f, initialStock: Number(e.target.value) }))}
                />
                <FormSelect
                  label="Branch"
                  value={form.branch || db.branches?.[0]?.name}
                  onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                >
                  {db.branches.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </FormSelect>
                <FormInput
                  label="Batch Number"
                  placeholder="e.g. BAT-2026-01"
                  value={form.batchNo || ""}
                  onChange={(e) => setForm((f) => ({ ...f, batchNo: e.target.value }))}
                />
                <FormInput
                  label="Shelf / Rack Location"
                  placeholder="e.g. A1-01"
                  value={form.rack || "A1-01"}
                  onChange={(e) => setForm((f) => ({ ...f, rack: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Quick Add Stock Modal */}
      <Modal
        open={quickStockModal}
        onClose={() => setQuickStockModal(false)}
        title={`Add Available Stock — ${quickStockTarget?.name || ""}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setQuickStockModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleQuickStockSave}>Add Stock Now</Btn>
          </>
        }
      >
        <div className="flex flex-col gap-3.5 text-xs">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
            Adding inventory for <strong className="font-bold">{quickStockTarget?.name}</strong>. The entered quantity will immediately increase available stock.
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <FormSelect
              label="Select Branch"
              required
              value={quickStockForm.branch}
              onChange={(e) => setQuickStockForm((f) => ({ ...f, branch: e.target.value }))}
            >
              {db.branches.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </FormSelect>
            <FormInput
              label="Batch Number"
              required
              placeholder="e.g. BAT-2026-01"
              value={quickStockForm.batchNo}
              onChange={(e) => setQuickStockForm((f) => ({ ...f, batchNo: e.target.value }))}
            />
            <FormInput
              label="Available Quantity (Units to Add)"
              required
              type="number"
              min="1"
              value={quickStockForm.available}
              onChange={(e) => setQuickStockForm((f) => ({ ...f, available: Number(e.target.value) }))}
            />
            <FormInput
              label="Shelf / Rack Location"
              value={quickStockForm.rack}
              onChange={(e) => setQuickStockForm((f) => ({ ...f, rack: e.target.value }))}
            />
            <FormInput
              label="Expiry Date"
              required
              type="date"
              value={quickStockForm.expiryDate}
              onChange={(e) => setQuickStockForm((f) => ({ ...f, expiryDate: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
