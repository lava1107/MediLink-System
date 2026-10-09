import React, { useState, useMemo } from "react";
import {
  Plus,
  Check,
  X,
  PackageCheck,
  Pencil,
  Phone,
  MessageSquare,
  BellRing,
  Send,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
} from "lucide-react";
import { useApp } from "../../hooks/useApp.js";
import { useAuth } from "../../hooks/useAuth.js";
import {
  confirmReservation,
  markCollected,
  cancelReservation,
  createReservation,
  updateReservation,
  deleteReservation,
  notifyStockQueue,
  sendReservationWhatsApp,
} from "../../services/reservationService.js";
import { formatDate, addDays } from "../../utils/format.js";
import { TODAY } from "../../data/mockData.js";
import { T } from "../../utils/theme.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/tables/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Btn from "../../components/common/Btn.jsx";
import IconBtn from "../../components/common/IconBtn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";

export default function ReservationsPage() {
  const { db, setDb, toast, refreshDb } = useApp();
  const { user } = useAuth();

  // Create Modal State
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    customer: "",
    phone: "",
    medicine: "",
    branch: user.role === "Admin" ? (db.branches?.[0]?.name || "Kovilpatti Branch") : user.branch,
    quantity: 1,
    expiry: addDays(TODAY, 3),
    sendWhatsappNotification: true,
  });

  // Edit Modal State
  const [editModal, setEditModal] = useState(false);
  const [editingRes, setEditingRes] = useState(null);
  const [editForm, setEditForm] = useState({
    customer: "",
    phone: "",
    medicine: "",
    branch: "",
    quantity: 1,
    expiry: "",
    status: "Pending",
  });

  // Stock Arrived: Multi-customer Queue WhatsApp Modal
  const [stockQueueModal, setStockQueueModal] = useState(false);
  const [stockQueueForm, setStockQueueForm] = useState({
    medicineName: "Human Mixtard Insulin",
    availableQuantity: 10,
    branch: user.role === "Admin" ? "All Branches" : user.branch,
    customMessage: "",
  });
  const [dispatchingQueueWhatsapp, setDispatchingQueueWhatsapp] = useState(false);
  const [queueDispatchResult, setQueueDispatchResult] = useState(null);

  // Single Direct WhatsApp Modal State
  const [singleWhatsappModal, setSingleWhatsappModal] = useState(false);
  const [activeSingleRes, setActiveSingleRes] = useState(null);
  const [singleWhatsappText, setSingleWhatsappText] = useState("");
  const [sendingSingleWhatsapp, setSendingSingleWhatsapp] = useState(false);


  // Helper: auto-fill phone when selecting customer
  function handleCustomerSelect(custName) {
    const foundCust = (db.customers || []).find(
      (c) => c.name.toLowerCase() === custName.toLowerCase()
    );
    let targetPhone = foundCust?.phone || "+91 98421 22334";
    if (custName.toLowerCase().includes("febi")) {
      targetPhone = "9655838904";
    }
    setForm((f) => ({
      ...f,
      customer: custName,
      phone: targetPhone,
    }));
  }

  function openEdit(r) {
    setEditingRes(r);
    setEditForm({
      customer: r.customer || "",
      phone: r.phone || r.customerPhone || "",
      medicine: r.medicine || "",
      branch:
        r.branch ||
        (user.role === "Admin" ? (db.branches?.[0]?.name || "Kovilpatti Branch") : user.branch),
      quantity: r.quantity || 1,
      expiry: r.expiry ? r.expiry.split("T")[0] : addDays(TODAY, 3),
      status: r.status || "Pending",
    });
    setEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editForm.customer || !editForm.medicine || !editForm.quantity) {
      toast("Fill customer, medicine and quantity.", "error");
      return;
    }
    try {
      const payload = {
        ...editForm,
        customerPhone: editForm.phone,
        quantity: parseInt(editForm.quantity) || 1,
      };
      const updated = await updateReservation(editingRes.id, payload);
      setDb((d) => ({
        ...d,
        reservations: (d.reservations || []).map((r) =>
          r.id === editingRes.id ? { ...r, ...payload, ...updated } : r
        ),
      }));
      toast("Reservation updated successfully.");
      setEditModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to update reservation", "error");
    }
  }

  async function updateStatus(r, action) {
    let updated;
    if (action === "confirm") updated = await confirmReservation(db.reservations, r.id);
    if (action === "collect") updated = await markCollected(db.reservations, r.id);
    if (action === "cancel") updated = await cancelReservation(db.reservations, r.id);
    setDb((d) => ({ ...d, reservations: updated }));
    toast(
      `Reservation ${
        action === "confirm" ? "confirmed" : action === "collect" ? "marked as collected" : "cancelled"
      }.`
    );
    refreshDb?.();
  }

  async function handleDelete(r) {
    if (!r?.id) return;
    const ok = window.confirm(
      `Are you sure you want to delete reservation ${r.id} for ${r.customer}?\nThis will permanently delete the reservation and customer details.`
    );
    if (!ok) return;

    try {
      await deleteReservation(r.id);
      setDb((d) => ({
        ...d,
        reservations: (d.reservations || []).filter((item) => item.id !== r.id),
      }));
      toast(`Reservation ${r.id} deleted successfully.`);
      if (editModal && editingRes?.id === r.id) {
        setEditModal(false);
      }
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to delete reservation", "error");
    }
  }

  async function handleCreate() {
    if (!form.customer || !form.medicine || !form.quantity) {
      toast("Fill customer, medicine and quantity.", "error");
      return;
    }
    try {
      const updated = await createReservation(db.reservations, {
        ...form,
        customerPhone: form.phone,
        createdBy: user.name,
      });
      setDb((d) => ({ ...d, reservations: updated }));
      toast(
        form.phone && form.sendWhatsappNotification
          ? `Reservation created & WhatsApp confirmation prepared for ${form.phone}!`
          : "Reservation created successfully."
      );
      setModal(false);
      setForm({
        customer: "",
        phone: "",
        medicine: "",
        branch: user.role === "Admin" ? (db.branches?.[0]?.name || "Kovilpatti Branch") : user.branch,
        quantity: 1,
        expiry: addDays(TODAY, 3),
        sendWhatsappNotification: true,
      });
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to create reservation", "error");
    }
  }

  // Open Direct WhatsApp for a specific reservation
  function openSingleWhatsapp(r) {
    let targetPhone = r.phone || r.customerPhone || "+91 98421 22334";
    if (r.customer && r.customer.toLowerCase().includes("febi")) {
      targetPhone = "9655838904";
    }
    setActiveSingleRes({ ...r, phone: targetPhone });
    setSingleWhatsappText(
      `*MediLink Alert: Stock Arrived!* 📦\nDear ${r.customer}, your reserved medicine *${r.medicine}* (${r.quantity} unit) is now available - vanthu vangitu ponga!\nPlease visit *${r.branch}* (Ref: ${r.id}) to collect before expiry.\nHelpline: +91 98421 30221`
    );
    setSingleWhatsappModal(true);
  }

  async function handleSendSingleWhatsapp(e) {
    if (e) e.preventDefault();
    if (!singleWhatsappText.trim()) return;
    setSendingSingleWhatsapp(true);
    try {
      const cleanDigits = (activeSingleRes.phone || "9655838904").replace(/[^0-9]/g, "");
      const intlDigits = cleanDigits.length === 10 ? "91" + cleanDigits : cleanDigits;
      const waUrl = `https://wa.me/${intlDigits}?text=${encodeURIComponent(singleWhatsappText)}`;

      // Open WhatsApp Web or mobile app directly
      window.open(waUrl, "_blank", "noopener,noreferrer");

      // Log dispatch to backend
      await sendReservationWhatsApp(activeSingleRes.id, {
        message: singleWhatsappText,
        customPhone: activeSingleRes.phone,
      });

      toast(`WhatsApp opened & dispatched to ${activeSingleRes.customer} (${activeSingleRes.phone})!`);
      setSingleWhatsappModal(false);
    } catch (err) {
      toast(err.message || "Failed to dispatch WhatsApp message", "error");
    } finally {
      setSendingSingleWhatsapp(false);
    }
  }


  // Calculate live preview of queue for selected medicine in stock modal
  const queueCandidates = useMemo(() => {
    if (!stockQueueForm.medicineName) return [];
    const list = (db.reservations || []).filter(
      (r) =>
        r.medicine &&
        r.medicine.toLowerCase().includes(stockQueueForm.medicineName.toLowerCase()) &&
        (r.status === "Pending" || r.status === "Reserved") &&
        (stockQueueForm.branch === "All Branches" || !stockQueueForm.branch || r.branch === stockQueueForm.branch)
    );
    // Sort strictly by booking date/time (Earliest first - FIFO)
    return list.sort((a, b) => (a.resDate || "").localeCompare(b.resDate || "") || (a.id || "").localeCompare(b.id || ""));
  }, [db.reservations, stockQueueForm.medicineName, stockQueueForm.branch]);

  // Compute FIFO stock allocation preview
  const queueAllocationPreview = useMemo(() => {
    let remStock = Number(stockQueueForm.availableQuantity) || 10;
    return queueCandidates.map((c, i) => {
      const needed = Number(c.quantity) || 1;
      let allocated = 0;
      let isCovered = false;
      if (remStock > 0) {
        allocated = Math.min(needed, remStock);
        remStock -= allocated;
        isCovered = true;
      }
      return {
        ...c,
        rank: i + 1,
        allocated,
        isCovered,
      };
    });
  }, [queueCandidates, stockQueueForm.availableQuantity]);

  // Execute Real WhatsApp Dispatch to Queue (FIFO Booking Allocation)
  async function handleDispatchStockQueue(e) {
    if (e) e.preventDefault();
    if (queueCandidates.length === 0) {
      toast("No waiting reservations found for this medicine.", "error");
      return;
    }
    setDispatchingQueueWhatsapp(true);
    try {
      const res = await notifyStockQueue({
        medicineName: stockQueueForm.medicineName,
        branch: stockQueueForm.branch,
        availableQuantity: Number(stockQueueForm.availableQuantity) || 10,
        customMessage: stockQueueForm.customMessage || undefined,
      });

      setQueueDispatchResult(res.data || res);

      // Refresh DB state to show 'Reserved' status
      toast(
        `Real WhatsApp alerts prepared for ${res.data?.notifiedCount || queueCandidates.length} customer(s) based on booking time queue!`
      );
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to dispatch queue WhatsApp messages", "error");
    } finally {
      setDispatchingQueueWhatsapp(false);
    }
  }

  // List of unique reserved medicines for quick dropdown selection
  const reservedMedicineOptions = useMemo(() => {
    const medSet = new Set();
    (db.reservations || []).forEach((r) => {
      if (r.medicine) medSet.add(r.medicine);
    });
    return Array.from(medSet);
  }, [db.reservations]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicine Reservations"
        subtitle="Manage customer reservations, track real phone numbers, and notify waitlist queues via WhatsApp when stock arrives"
        crumbs={["MediLink", "Reservations"]}
        action={
          <div className="flex items-center gap-2.5">
            <Btn
              icon={BellRing}
              onClick={() => {
                setQueueDispatchResult(null);
                setStockQueueModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2"
            >
              <span>Stock Arrived &bull; Notify Queue via WhatsApp</span>
            </Btn>
            <Btn icon={Plus} onClick={() => setModal(true)}>
              New Reservation
            </Btn>
          </div>
        }
      />

      {/* Main Reservations Table */}
      <DataTable
        columns={[
          {
            key: "id",
            label: "Reservation ID",
            sortable: true,
            render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.id}</span>,
          },
          {
            key: "customer",
            label: "Customer & Real Phone",
            sortable: true,
            render: (r) => {
              const phoneNum = r.phone || r.customerPhone || "+91 98421 22334";
              return (
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">{r.customer}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-mono text-blue-600 flex items-center gap-1">
                      <Phone size={10} className="text-slate-400" />
                      {phoneNum}
                    </span>
                    <button
                      type="button"
                      title="Send instant WhatsApp message to customer"
                      onClick={() => openSingleWhatsapp(r)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1"
                    >
                      <MessageSquare size={9} />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            },
          },
          {
            key: "medicine",
            label: "Reserved Medicine",
            sortable: true,
            render: (r) => (
              <div>
                <span className="font-semibold text-slate-900">{r.medicine}</span>
                <span className="text-[11px] text-slate-500 block">Requested: {r.quantity} unit(s)</span>
              </div>
            ),
          },
          { key: "branch", label: "Branch" },
          {
            key: "resDate",
            label: "Booking Date (Queue Order)",
            sortable: true,
            render: (r) => (
              <div className="flex items-center gap-1 text-slate-700 text-xs">
                <Clock size={12} className="text-slate-400" />
                <span>{formatDate(r.resDate)}</span>
              </div>
            ),
          },
          { key: "expiry", label: "Expires On", render: (r) => formatDate(r.expiry) },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
        data={db.reservations}
        searchKeys={["customer", "medicine", "phone", "customerPhone", "id"]}
        filters={[
          {
            key: "status",
            label: "Status",
            options: ["Pending", "Reserved", "Collected", "Cancelled", "Expired"],
          },
        ]}
        actions={(r) => (
          <div className="flex items-center gap-1">
            <IconBtn
              icon={MessageSquare}
              tone="green"
              title="Send Real WhatsApp to Customer"
              onClick={() => openSingleWhatsapp(r)}
            />

            <IconBtn icon={Pencil} title="Edit Reservation & Customer Details" onClick={() => openEdit(r)} />
            {r.status === "Pending" && (
              <IconBtn icon={Check} tone="green" title="Confirm Reservation" onClick={() => updateStatus(r, "confirm")} />
            )}
            {r.status === "Reserved" && (
              <IconBtn icon={PackageCheck} tone="green" title="Mark as Collected" onClick={() => updateStatus(r, "collect")} />
            )}
            {r.status !== "Cancelled" && r.status !== "Collected" && (
              <IconBtn icon={X} tone="red" title="Cancel Reservation" onClick={() => updateStatus(r, "cancel")} />
            )}
            <IconBtn icon={Trash2} tone="red" title="Delete Reservation Permanently" onClick={() => handleDelete(r)} />
          </div>
        )}
      />

      {/* Modal: New Reservation (Captures Real Phone Number) */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Create Customer Medicine Reservation"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleCreate}>Create Reservation</Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                list="cust-names-list"
                placeholder="Select or enter customer name"
                value={form.customer}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 bg-white"
                style={{ borderColor: T.border }}
              />
              <datalist id="cust-names-list">
                {(db.customers || []).map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.phone}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 98421 22334"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none focus:border-blue-500 bg-white"
                style={{ borderColor: T.border }}
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Required for real WhatsApp notifications & stock arrival alerts
              </span>
            </div>

            <FormSelect
              label="Medicine"
              required
              value={form.medicine}
              onChange={(e) => setForm((f) => ({ ...f, medicine: e.target.value }))}
            >
              <option value="">Select medicine</option>
              {(db.medicines || []).map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} ({m.generic})
                </option>
              ))}
            </FormSelect>

            <FormSelect
              label="Branch"
              required
              value={form.branch}
              onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
              disabled={user.role !== "Admin"}
            >
              {(db.branches || []).map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </FormSelect>

            <FormInput
              label="Quantity"
              required
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />

            <FormInput
              label="Reservation Expiry"
              required
              type="date"
              value={form.expiry}
              onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.sendWhatsappNotification}
              onChange={(e) => setForm((f) => ({ ...f, sendWhatsappNotification: e.target.checked }))}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div className="text-xs text-slate-700">
              <strong className="block text-slate-900 font-bold">
                Send Real WhatsApp Booking Confirmation to Customer
              </strong>
              Prepares reservation reference ID and pickup terms directly for customer's WhatsApp.
            </div>
          </label>

        </div>
      </Modal>

      {/* Modal: Edit Reservation */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit Reservation ${editingRes?.id || ""}`}
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => {
                if (editingRes) handleDelete(editingRes);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-1.5 border border-red-200"
            >
              <Trash2 size={13} />
              <span>Delete Reservation</span>
            </button>
            <div className="flex items-center gap-2">
              <Btn variant="secondary" onClick={() => setEditModal(false)}>
                Cancel
              </Btn>
              <Btn onClick={handleSaveEdit}>Save Changes</Btn>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Customer"
            required
            value={editForm.customer}
            onChange={(e) => setEditForm((f) => ({ ...f, customer: e.target.value }))}
          />
          <FormInput
            label="Phone Number"
            required
            value={editForm.phone}
            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <FormSelect
            label="Medicine"
            required
            value={editForm.medicine}
            onChange={(e) => setEditForm((f) => ({ ...f, medicine: e.target.value }))}
          >
            <option value="">Select medicine</option>
            {(db.medicines || []).map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </FormSelect>
          <FormSelect
            label="Branch"
            required
            value={editForm.branch}
            onChange={(e) => setEditForm((f) => ({ ...f, branch: e.target.value }))}
          >
            {(db.branches || []).map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </FormSelect>
          <FormInput
            label="Quantity"
            required
            type="number"
            min="1"
            value={editForm.quantity}
            onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
          />
          <FormInput
            label="Reservation Expiry"
            required
            type="date"
            value={editForm.expiry}
            onChange={(e) => setEditForm((f) => ({ ...f, expiry: e.target.value }))}
          />
          <FormSelect
            label="Status"
            required
            value={editForm.status}
            onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="Pending">Pending</option>
            <option value="Reserved">Reserved</option>
            <option value="Collected">Collected</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Expired">Expired</option>
          </FormSelect>
        </div>
      </Modal>

      {/* Modal: STOCK ARRIVED – NOTIFY QUEUE VIA REAL WHATSAPP */}
      <Modal
        open={stockQueueModal}
        onClose={() => setStockQueueModal(false)}
        title="Stock Arrived &bull; Booking Time Queue WhatsApp Dispatcher"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleDispatchStockQueue} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <BellRing size={16} />
            </div>
            <div>
              <strong className="font-bold block text-emerald-900 mb-0.5">
                Multi-Customer FIFO Booking Allocation via WhatsApp
              </strong>
              When new stock arrives for a medicine booked by 2 or more customers, the system allocates available units
              strictly according to <strong>booking time</strong> and dispatches real WhatsApp alerts directly to their phone numbers!
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Arrived Medicine *
              </label>
              <input
                type="text"
                required
                list="queue-medicines-list"
                placeholder="e.g. Human Mixtard Insulin..."
                value={stockQueueForm.medicineName}
                onChange={(e) => setStockQueueForm((f) => ({ ...f, medicineName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 bg-white"
                style={{ borderColor: T.border }}
              />
              <datalist id="queue-medicines-list">
                {reservedMedicineOptions.map((med, i) => (
                  <option key={i} value={med} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Now Available Units *
              </label>
              <input
                type="number"
                min="1"
                required
                value={stockQueueForm.availableQuantity}
                onChange={(e) => setStockQueueForm((f) => ({ ...f, availableQuantity: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border text-xs font-bold text-emerald-700 outline-none focus:border-blue-500 bg-white"
                style={{ borderColor: T.border }}
              />
            </div>
          </div>

          {/* Queue Breakdown Preview */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
            <div className="p-3 bg-slate-50 border-b flex items-center justify-between text-xs font-bold text-slate-700" style={{ borderColor: T.borderSoft }}>
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-blue-600" />
                Customer Booking Queue ({queueCandidates.length} waiting by booking time)
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                Sorted strictly by reservation timestamp (FIFO)
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600">
                    <th className="text-left px-3 py-2 font-semibold">Queue Rank</th>
                    <th className="text-left px-3 py-2 font-semibold">Customer</th>
                    <th className="text-left px-3 py-2 font-semibold">Real WhatsApp Number</th>
                    <th className="text-center px-3 py-2 font-semibold">Requested</th>
                    <th className="text-center px-3 py-2 font-semibold">Allocated</th>
                    <th className="text-right px-3 py-2 font-semibold">Queue Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueAllocationPreview.length > 0 ? (
                    queueAllocationPreview.map((c) => (
                      <tr key={c.id} className={c.isCovered ? "bg-emerald-50/40" : "bg-slate-50/40"}>
                        <td className="px-3 py-2 font-bold text-slate-800">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                              c.isCovered ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"
                            }`}
                          >
                            #{c.rank}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-900">{c.customer}</td>
                        <td className="px-3 py-2 font-mono text-emerald-700 font-semibold">{c.phone || c.customerPhone}</td>
                        <td className="px-3 py-2 text-center text-slate-700 font-bold">{c.quantity}</td>
                        <td className="px-3 py-2 text-center font-bold text-emerald-700">
                          {c.allocated}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {c.isCovered ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Stock Allocated (Will WhatsApp)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              Waitlisted (Next Batch)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                        No pending reservations found for "{stockQueueForm.medicineName}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* WhatsApp Body Customization */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare size={13} className="text-emerald-600" />
                <span>Real WhatsApp Alert Message (Sent to Customer's WhatsApp):</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Variables: &#123;customer&#125;, &#123;medicine&#125;, &#123;quantity&#125;, &#123;branch&#125;
              </span>
            </div>
            <div className="p-3 bg-slate-50 border rounded-xl font-mono text-xs text-slate-800 leading-relaxed select-all" style={{ borderColor: T.border }}>
              *MediLink Alert: Stock Arrived!* 📦<br />
              Dear &#123;customer&#125;, your reserved medicine *{stockQueueForm.medicineName || "Medicine"}* is now in stock! Now{" "}
              {stockQueueForm.availableQuantity || 10} available - vanthu vangitu ponga! Reserved: &#123;allocated&#125; units.<br />
              Please collect from *&#123;branch&#125;* (Ref: &#123;ref&#125;). Helpline: +91 98421 30221
            </div>
          </div>

          {/* Results Summary if Dispatched */}
          {queueDispatchResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Real WhatsApp Alerts Dispatched to {queueDispatchResult.notifiedCount} Customer(s) Successfully!</span>
              </div>
              <div className="text-[11px] text-emerald-800 space-y-1.5 font-mono">
                {(queueDispatchResult.notifiedCustomers || []).map((nc, idx) => {
                  const digits = (nc.phone || "9655838904").replace(/[^0-9]/g, "");
                  const intlDigits = digits.length === 10 ? "91" + digits : digits;
                  const chatUrl = nc.waUrl || `https://wa.me/${intlDigits}?text=${encodeURIComponent(nc.message || "Your reserved medicine has arrived!")}`;
                  return (
                    <div key={idx} className="flex items-center justify-between bg-white/90 p-2.5 rounded-xl border border-emerald-200">
                      <div>
                        <span className="font-bold text-slate-800">#{nc.queueRank} {nc.customer}</span>
                        <span className="text-slate-500 font-normal ml-1.5">({nc.phone})</span>
                        <span className="text-emerald-700 font-bold ml-2">• Allocated: {nc.allocatedQty} units</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          ✓ WhatsApp Ready
                        </span>
                        <a
                          href={chatUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare size={11} /> Open WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Btn variant="secondary" onClick={() => setStockQueueModal(false)}>
              Close
            </Btn>
            <Btn
              type="submit"
              disabled={dispatchingQueueWhatsapp || queueCandidates.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 flex items-center gap-2"
            >
              <Send size={14} />
              <span>{dispatchingQueueWhatsapp ? "Preparing WhatsApp..." : "Send Real WhatsApp Alerts to Booking Queue"}</span>
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal: Single Direct WhatsApp to Customer */}
      <Modal
        open={singleWhatsappModal}
        onClose={() => setSingleWhatsappModal(false)}
        title={`Send WhatsApp to ${activeSingleRes?.customer || "Customer"}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setSingleWhatsappModal(false)}>
              Cancel
            </Btn>
            <Btn
              onClick={handleSendSingleWhatsapp}
              disabled={sendingSingleWhatsapp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
            >
              <MessageSquare size={14} />
              <span>{sendingSingleWhatsapp ? "Preparing WhatsApp..." : "Open & Send via WhatsApp"}</span>
            </Btn>
          </>
        }
      >
        <form onSubmit={handleSendSingleWhatsapp} className="space-y-3">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
            <div>
              Recipient: <strong>{activeSingleRes?.customer}</strong> ({activeSingleRes?.medicine})
            </div>
            <div className="font-mono font-bold text-emerald-700 flex items-center gap-1">
              <Phone size={12} />
              {activeSingleRes?.phone}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Message Body *</label>
            <textarea
              rows={4}
              required
              value={singleWhatsappText}
              onChange={(e) => setSingleWhatsappText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-emerald-500 bg-white font-mono"
              style={{ borderColor: T.border }}
            />
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 size={13} />
              Opens direct WhatsApp Web / App chat to customer phone
            </span>
            <span className="font-mono text-slate-500">
              {activeSingleRes?.phone || "9655838904"}
            </span>
          </div>
        </form>
      </Modal>

    </div>
  );
}
