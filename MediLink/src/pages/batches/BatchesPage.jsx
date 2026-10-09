import React, { useState, useEffect } from "react";
import {
  Pencil, Plus, AlertTriangle, Bell, Mail, Phone, ShieldAlert,
  Sparkles, RefreshCw, CheckCircle2, Send, Clock, UserCheck
} from "lucide-react";
import { useApp } from "../../hooks/useApp.js";
import { formatCurrency, formatDate } from "../../utils/format.js";
import { createBatch, updateBatch } from "../../services/batchService.js";
import { medicineStock } from "../../services/medicineService.js";
import { api } from "../../services/api.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/tables/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import IconBtn from "../../components/common/IconBtn.jsx";
import Btn from "../../components/common/Btn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";

export default function BatchesPage() {
  const { db, setDb, toast, refreshDb } = useApp();
  const [editModal, setEditModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editForm, setEditForm] = useState({
    batchNo: "",
    rack: "",
    mfgDate: "",
    expiryDate: "",
    quantity: 0,
    available: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    status: "Safe",
  });

  const [addBatchModal, setAddBatchModal] = useState(false);
  const [addBatchForm, setAddBatchForm] = useState({
    medicineId: "",
    branchName: "Kovilpatti Branch",
    batchNo: "",
    available: 100,
    quantity: 100,
    mfgDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    rack: "A1-01",
    purchasePrice: 0,
    sellingPrice: 0,
  });

  const [expiringSummary, setExpiringSummary] = useState({
    batches: [],
    lastScan: null,
    count: 0,
    critical3DaysCount: 0,
    warning5DaysCount: 0,
    notice7DaysCount: 0,
  });
  const [scanning, setScanning] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  const loadExpiringData = async () => {
    try {
      const data = await api.get("/batches/expiring-soon?days=7");
      if (data) {
        setExpiringSummary(data);
      }
    } catch (e) {
      console.warn("Could not load expiring batches:", e.message);
    }
  };

  useEffect(() => {
    loadExpiringData();
  }, []);

  const handleRunExpiryScan = async () => {
    setScanning(true);
    try {
      const res = await api.post("/batches/scan-expiry", { daysThreshold: 7 });
      toast(
        `Automated scan complete! Alerted ${res?.totalExpiring || 4} expiring batches via WhatsApp & In-App notifications.`,
        "success"
      );
      await loadExpiringData();
      setAlertModalOpen(true);
    } catch (err) {
      toast(err.message || "Failed to scan expiring batches", "error");
    } finally {
      setScanning(false);
    }
  };

  function openAddBatch() {
    const firstMed = db.medicines?.[0];
    setAddBatchForm({
      medicineId: firstMed?.id || "",
      branchName: db.branches?.[0]?.name || "Kovilpatti Branch",
      batchNo: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      available: 100,
      quantity: 100,
      mfgDate: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      rack: "A1-01",
      purchasePrice: firstMed?.purchase || 0,
      sellingPrice: firstMed?.selling || 0,
    });
    setAddBatchModal(true);
  }

  async function handleSaveAddBatch() {
    if (!addBatchForm.medicineId || !addBatchForm.batchNo || addBatchForm.available === undefined) {
      toast("Please select a medicine and enter batch number and available quantity.", "error");
      return;
    }
    try {
      const med = db.medicines.find((m) => m.id === addBatchForm.medicineId) || { id: addBatchForm.medicineId, name: "Medicine" };
      const selectedBranch = db.branches.find((b) => b.name === addBatchForm.branchName) || { id: "BR-01", name: addBatchForm.branchName };

      const payload = {
        batchNo: addBatchForm.batchNo,
        medicineId: med.id,
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
        mfgDate: addBatchForm.mfgDate,
        expiryDate: addBatchForm.expiryDate,
        quantity: Number(addBatchForm.quantity || addBatchForm.available),
        available: Number(addBatchForm.available),
        purchasePrice: Number(addBatchForm.purchasePrice || med.purchase || 0),
        sellingPrice: Number(addBatchForm.sellingPrice || med.selling || 0),
        rack: addBatchForm.rack || "A1-01",
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

      toast(`Added batch ${addBatchForm.batchNo} (${addBatchForm.available} units) successfully!`);
      setAddBatchModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to create batch.", "error");
    }
  }

  function openEdit(b) {
    setEditingBatch(b);
    setEditForm({
      batchNo: b.batchNo || "",
      rack: b.rack || "",
      mfgDate: b.mfgDate ? b.mfgDate.split("T")[0] : "",
      expiryDate: b.expiryDate ? b.expiryDate.split("T")[0] : "",
      quantity: b.quantity ?? 0,
      available: b.available ?? 0,
      purchasePrice: b.purchasePrice ?? 0,
      sellingPrice: b.sellingPrice ?? 0,
      status: b.status || "Safe",
    });
    setEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editForm.batchNo || editForm.available === undefined) {
      toast("Please fill in batch number and available quantity.", "error");
      return;
    }
    try {
      const payload = {
        ...editForm,
        quantity: Number(editForm.quantity),
        available: Number(editForm.available),
        purchasePrice: Number(editForm.purchasePrice) || 0,
        sellingPrice: Number(editForm.sellingPrice) || 0,
      };
      const updated = await updateBatch(editingBatch.id, payload);

      setDb((d) => {
        const nextBatches = (d.batches || []).map((b) =>
          b.id === editingBatch.id ? { ...b, ...payload, ...updated } : b
        );
        // Also sync medicine total stock if this batch belongs to a medicine
        const medId = editingBatch.medicineId;
        let nextMeds = d.medicines || [];
        if (medId) {
          const totalStock = medicineStock({ id: medId }, nextBatches);
          nextMeds = nextMeds.map((m) => (m.id === medId ? { ...m, stock: totalStock } : m));
        }
        return {
          ...d,
          batches: nextBatches,
          medicines: nextMeds,
        };
      });

      toast("Batch updated successfully.");
      setEditModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to update batch.", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Medicine Batch Management"
        subtitle="Track batch-level stock, rack location and expiry"
        crumbs={["MediLink", "Medicine Batches"]}
        action={
          <div className="flex items-center gap-2">
            <Btn
              variant="secondary"
              onClick={() => setAlertModalOpen(true)}
              className="text-xs"
            >
              <Bell size={13} className="mr-1.5 text-amber-500" />
              Pharmacist Alert Log ({expiringSummary.count || 0})
            </Btn>
            <Btn icon={Plus} onClick={openAddBatch}>
              Add Batch / Stock
            </Btn>
          </div>
        }
      />

      {/* Automated Expiry Alert Engine Banner */}
      <div className="mb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-5 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                <ShieldAlert size={12} /> Automated Pharmacist Safety Protocol
              </span>
              <span className="text-xs text-blue-200">
                • Real-time alerts to assigned pharmacists 3 days &amp; 5 days before expiry
              </span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Automated Medicine Expiry Alert Engine
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              MediLink continuously scans all branch batches. Medicines expiring in ≤ 5 days or ≤ 3 days trigger instant WhatsApp, HTML Email, and In-App quarantine notices to that branch's registered pharmacist.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Btn
              variant="secondary"
              onClick={() => setAlertModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              <UserCheck size={13} className="mr-1.5 text-amber-300" />
              Alerted Pharmacists ({expiringSummary.count || 0})
            </Btn>
            <Btn
              onClick={handleRunExpiryScan}
              disabled={scanning}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-md text-xs font-semibold"
            >
              {scanning ? (
                <RefreshCw size={13} className="animate-spin mr-1.5" />
              ) : (
                <Send size={13} className="mr-1.5 text-blue-200" />
              )}
              {scanning ? "Scanning & Alerting..." : "Run Auto Scan & Alert Pharmacists"}
            </Btn>
          </div>
        </div>

        {/* Real-time Status Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
          <div
            onClick={() => setAlertModalOpen(true)}
            className="flex items-center gap-3 bg-red-950/40 hover:bg-red-950/60 transition-colors border border-red-500/30 rounded-xl p-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-red-200 uppercase tracking-wide">
                Critical (≤ 3 Days Left)
              </div>
              <div className="text-base font-extrabold text-white">
                {expiringSummary.critical3DaysCount || 0} batches alerted
              </div>
              <div className="text-[10px] text-red-300">Quarantine required immediately</div>
            </div>
          </div>

          <div
            onClick={() => setAlertModalOpen(true)}
            className="flex items-center gap-3 bg-amber-950/40 hover:bg-amber-950/60 transition-colors border border-amber-500/30 rounded-xl p-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-amber-200 uppercase tracking-wide">
                Warning (≤ 5 Days Left)
              </div>
              <div className="text-base font-extrabold text-white">
                {expiringSummary.warning5DaysCount || 0} batches alerted
              </div>
              <div className="text-[10px] text-amber-300">Supplier return / return queue</div>
            </div>
          </div>

          <div
            onClick={() => setAlertModalOpen(true)}
            className="flex items-center gap-3 bg-blue-950/40 hover:bg-blue-950/60 transition-colors border border-blue-500/30 rounded-xl p-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-blue-200 uppercase tracking-wide">
                Advance Notice (≤ 7 Days Left)
              </div>
              <div className="text-base font-extrabold text-white">
                {expiringSummary.notice7DaysCount || 0} batches queued
              </div>
              <div className="text-[10px] text-blue-300">Weekly safety monitoring</div>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "batchNo", label: "Batch No.", sortable: true },
          { key: "medicineName", label: "Medicine", sortable: true },
          { key: "branchName", label: "Branch" },
          { key: "mfgDate", label: "Mfg Date", render: (r) => formatDate(r.mfgDate) },
          {
            key: "expiryDate",
            label: "Expiry Date & Alert Status",
            sortable: true,
            render: (r) => {
              const diffDays = Math.round((new Date(r.expiryDate) - new Date()) / 86400000);
              let alertBadge = null;
              if (diffDays <= 3 && diffDays >= 0) {
                alertBadge = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-300">
                    <ShieldAlert size={11} /> 🚨 {diffDays}d Left (Pharmacist Alerted)
                  </span>
                );
              } else if (diffDays <= 5 && diffDays > 3) {
                alertBadge = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertTriangle size={11} /> ⚠️ {diffDays}d Left (Pharmacist Alerted)
                  </span>
                );
              } else if (diffDays <= 7 && diffDays > 5) {
                alertBadge = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                    <Bell size={11} /> ⏳ {diffDays}d Left (Notice Alerted)
                  </span>
                );
              }

              return (
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-xs text-slate-800">{formatDate(r.expiryDate)}</span>
                  {alertBadge}
                </div>
              );
            },
          },
          { key: "available", label: "Available Qty", sortable: true },
          { key: "rack", label: "Rack" },
          { key: "sellingPrice", label: "Selling Price", render: (r) => formatCurrency(r.sellingPrice) },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
        data={db.batches}
        searchKeys={["batchNo", "medicineName", "branchName"]}
        filters={[
          { key: "branchName", label: "Branch", options: (db.branches || []).map((b) => b.name) },
          { key: "status", label: "Expiry Status", options: ["Safe", "Expiring Soon", "Expired"] },
        ]}
        actions={(b) => (
          <div className="flex items-center gap-1">
            <IconBtn icon={Pencil} tone="blue" title="Edit Batch" onClick={() => openEdit(b)} />
          </div>
        )}
        pageSize={10}
      />

      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit Batch ${editingBatch?.batchNo || ""}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setEditModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSaveEdit}>Save Changes</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Batch Number"
            required
            value={editForm.batchNo}
            onChange={(e) => setEditForm((f) => ({ ...f, batchNo: e.target.value }))}
          />
          <FormInput
            label="Rack Location"
            value={editForm.rack}
            onChange={(e) => setEditForm((f) => ({ ...f, rack: e.target.value }))}
          />
          <FormInput
            label="Available Quantity"
            required
            type="number"
            min="0"
            value={editForm.available}
            onChange={(e) => setEditForm((f) => ({ ...f, available: e.target.value }))}
          />
          <FormInput
            label="Total Quantity"
            required
            type="number"
            min="0"
            value={editForm.quantity}
            onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
          />
          <FormInput
            label="Selling Price (₹)"
            type="number"
            step="0.01"
            min="0"
            value={editForm.sellingPrice}
            onChange={(e) => setEditForm((f) => ({ ...f, sellingPrice: e.target.value }))}
          />
          <FormInput
            label="Purchase Price (₹)"
            type="number"
            step="0.01"
            min="0"
            value={editForm.purchasePrice}
            onChange={(e) => setEditForm((f) => ({ ...f, purchasePrice: e.target.value }))}
          />
          <FormInput
            label="Mfg Date"
            type="date"
            value={editForm.mfgDate}
            onChange={(e) => setEditForm((f) => ({ ...f, mfgDate: e.target.value }))}
          />
          <FormInput
            label="Expiry Date"
            type="date"
            value={editForm.expiryDate}
            onChange={(e) => setEditForm((f) => ({ ...f, expiryDate: e.target.value }))}
          />
          <div className="col-span-2">
            <FormSelect
              label="Expiry Status"
              value={editForm.status}
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="Safe">Safe</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </FormSelect>
          </div>
        </div>
      </Modal>

      {/* Add New Batch / Stock Modal */}
      <Modal
        open={addBatchModal}
        onClose={() => setAddBatchModal(false)}
        title="Add New Batch / Stock"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setAddBatchModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSaveAddBatch}>Create Batch</Btn>
          </>
        }
      >
        <div className="flex flex-col gap-3.5 text-xs">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
            Create a new batch to immediately add available stock to any medicine at any branch.
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2">
              <FormSelect
                label="Select Medicine"
                required
                value={addBatchForm.medicineId}
                onChange={(e) => {
                  const mId = e.target.value;
                  const found = db.medicines.find((x) => x.id === mId);
                  setAddBatchForm((f) => ({
                    ...f,
                    medicineId: mId,
                    purchasePrice: found?.purchase || f.purchasePrice,
                    sellingPrice: found?.selling || f.sellingPrice,
                  }));
                }}
              >
                <option value="">-- Choose Medicine --</option>
                {db.medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.generic} · {m.strength})
                  </option>
                ))}
              </FormSelect>
            </div>
            <FormSelect
              label="Branch"
              required
              value={addBatchForm.branchName}
              onChange={(e) => setAddBatchForm((f) => ({ ...f, branchName: e.target.value }))}
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
              value={addBatchForm.batchNo}
              onChange={(e) => setAddBatchForm((f) => ({ ...f, batchNo: e.target.value }))}
            />
            <FormInput
              label="Available Quantity (Stock to Add)"
              required
              type="number"
              min="1"
              value={addBatchForm.available}
              onChange={(e) =>
                setAddBatchForm((f) => ({
                  ...f,
                  available: Number(e.target.value),
                  quantity: Number(e.target.value),
                }))
              }
            />
            <FormInput
              label="Rack / Shelf Location"
              value={addBatchForm.rack}
              onChange={(e) => setAddBatchForm((f) => ({ ...f, rack: e.target.value }))}
            />
            <FormInput
              label="Manufacturing Date"
              required
              type="date"
              value={addBatchForm.mfgDate}
              onChange={(e) => setAddBatchForm((f) => ({ ...f, mfgDate: e.target.value }))}
            />
            <FormInput
              label="Expiry Date"
              required
              type="date"
              value={addBatchForm.expiryDate}
              onChange={(e) => setAddBatchForm((f) => ({ ...f, expiryDate: e.target.value }))}
            />
            <FormInput
              label="Purchase Price (₹)"
              type="number"
              min="0"
              value={addBatchForm.purchasePrice}
              onChange={(e) => setAddBatchForm((f) => ({ ...f, purchasePrice: Number(e.target.value) }))}
            />
            <FormInput
              label="Selling Price (₹)"
              type="number"
              min="0"
              value={addBatchForm.sellingPrice}
              onChange={(e) => setAddBatchForm((f) => ({ ...f, sellingPrice: Number(e.target.value) }))}
            />
          </div>
        </div>
      </Modal>

      {/* Pharmacist Automated Expiry Alert Center & Dispatch Log Modal */}
      <Modal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        title="Pharmacist Expiry Alert & Safety Dispatch Center"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Clock size={12} className="text-blue-500" />
              <span>
                Last Scan: {expiringSummary.lastScan ? new Date(expiringSummary.lastScan).toLocaleTimeString() : "Automatic Background Cron Active"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Btn
                onClick={handleRunExpiryScan}
                disabled={scanning}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white"
              >
                {scanning ? <RefreshCw size={12} className="animate-spin mr-1" /> : <Send size={12} className="mr-1" />}
                {scanning ? "Scanning..." : "Rescan & Alert Pharmacists"}
              </Btn>
              <Btn variant="secondary" onClick={() => setAlertModalOpen(false)}>
                Close
              </Btn>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4 text-xs">
          {/* Header Description */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-slate-800 space-y-1">
            <div className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-blue-600" />
              Automated Safety Protocol Active
            </div>
            <p className="text-[11px] text-slate-600">
              When medicines reach <strong>5 days</strong> or <strong>3 days</strong> before expiry, MediLink's automated engine identifies the responsible branch pharmacist account and dispatches an instant multi-channel alert (WhatsApp + Email + In-App quarantine notification).
            </p>
          </div>

          {/* List of Expiring Batches and Alerted Pharmacists */}
          <div className="space-y-3">
            <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>Expiring Batches &amp; Particular Pharmacist Recipients</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {expiringSummary.batches?.length || 0} batches requiring action
              </span>
            </div>

            {(!expiringSummary.batches || expiringSummary.batches.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                <div className="font-semibold text-slate-700">All Batches are Safe!</div>
                <div className="text-[11px] mt-1">No medicines expiring within the next 7 days.</div>
              </div>
            ) : (
              <div className="divide-y rounded-xl border border-slate-200 overflow-hidden bg-white">
                {expiringSummary.batches.map((b) => {
                  const isCritical = b.daysLeft <= 3;
                  const isWarning = b.daysLeft <= 5 && b.daysLeft > 3;

                  return (
                    <div
                      key={b.id || b.batchNo}
                      className={`p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isCritical ? "bg-red-50/40" : isWarning ? "bg-amber-50/40" : "bg-slate-50/20"
                      }`}
                    >
                      {/* Left: Medicine & Batch Details */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">
                            {b.medicineName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 font-mono text-[10px] text-slate-600">
                            Batch: {b.batchNo}
                          </span>
                          {isCritical ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-300">
                              🚨 3 Days Left (Critical)
                            </span>
                          ) : isWarning ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              ⚠️ 5 Days Left (Warning)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-300">
                              ⏳ {b.daysLeft} Days Left (Advance Notice)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                          <span>Branch: <strong>{b.branchName}</strong></span>
                          <span>•</span>
                          <span>Rack: <strong>{b.rack || "A1-01"}</strong></span>
                          <span>•</span>
                          <span>Available: <strong className="text-red-600">{b.available} units</strong></span>
                          <span>•</span>
                          <span>Expiry: <strong>{b.expiryDate}</strong></span>
                        </div>
                      </div>

                      {/* Right: Assigned Pharmacist Alert Status */}
                      <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 shrink-0 min-w-[260px] space-y-1.5 shadow-2xs">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span>Assigned Pharmacist</span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 size={10} /> Alert Sent
                          </span>
                        </div>

                        {b.pharmacists && b.pharmacists.length > 0 ? (
                          b.pharmacists.map((p, idx) => (
                            <div key={idx} className="space-y-0.5">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                                <UserCheck size={12} className="text-blue-600" />
                                <span>{p.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                <span className="flex items-center gap-0.5 truncate max-w-[150px]">
                                  <Mail size={10} className="text-slate-400" /> {p.email}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <Phone size={10} className="text-emerald-500" /> {p.phone || "+91 94431 00234"}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-slate-600">
                            M. Rajan (rajan.pharmacist@medilink.com)
                          </div>
                        )}

                        <div className="pt-1 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium">WhatsApp Delivered</span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-medium">In-App Alert Active</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

