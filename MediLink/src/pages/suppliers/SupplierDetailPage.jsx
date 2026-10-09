import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, CircleAlert, Pencil, Mail, MessageSquare } from "lucide-react";
import { T } from "../../utils/theme.js";
import { formatCurrency, formatDate } from "../../utils/format.js";
import { useApp } from "../../hooks/useApp.js";
import { updateSupplier } from "../../services/supplierService.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Btn from "../../components/common/Btn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, setDb, toast, refreshDb } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  const s = db.suppliers.find((x) => x.id === id);

  if (!s) {
    return (
      <div>
        <button onClick={() => navigate("/suppliers")} className="flex items-center gap-1.5 text-xs font-semibold mb-4" style={{ color: T.blue }}>
          <ArrowLeft size={14} /> Back to Suppliers
        </button>
        <EmptyState title="Supplier not found" />
      </div>
    );
  }

  const purchases = db.purchases.filter((p) => p.supplier === s.name);
  const totalPurchases = purchases.reduce((a, p) => a + p.amount, 0);
  const pending = purchases.filter((p) => p.payment !== "Paid").reduce((a, p) => a + p.amount, 0);

  function openEdit() {
    setForm({
      name: s.name || "",
      company: s.company || "",
      contact: s.contact || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      city: s.city || "",
      state: s.state || "Tamil Nadu",
      gst: s.gst || "",
      license: s.license || "",
      status: s.status || "Active",
    });
    setModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.company || !form.contact || !form.phone || !form.gst) {
      toast("Please fill in name, company, contact, phone and GST number.", "error");
      return;
    }
    try {
      let updated;
      try {
        updated = await updateSupplier(s.id, form);
      } catch (apiErr) {
        console.warn("Backend unavailable, updating supplier locally:", apiErr.message);
        updated = { id: s.id, ...form };
      }
      setDb((d) => {
        const oldName = s.name;
        const newName = updated.name || form.name || oldName;

        return {
          ...d,
          suppliers: d.suppliers.map((sup) => (sup.id === s.id ? { ...sup, ...updated } : sup)),
          purchases: (d.purchases || []).map((p) =>
            p.supplierId === s.id || (oldName && p.supplier === oldName)
              ? { ...p, supplier: newName, supplierId: s.id }
              : p
          ),
          batches: (d.batches || []).map((b) =>
            b.supplierId === s.id || (oldName && b.supplierName === oldName)
              ? { ...b, supplierName: newName, supplierId: s.id }
              : b
          ),
        };
      });
      toast("Supplier updated successfully.");
      setModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to update supplier.", "error");
    }
  }

  return (
    <div>
      <button onClick={() => navigate("/suppliers")} className="flex items-center gap-1.5 text-xs font-semibold mb-4" style={{ color: T.blue }}>
        <ArrowLeft size={14} /> Back to Suppliers
      </button>
      <PageHeader
        title={s.name}
        subtitle={s.company}
        crumbs={["MediLink", "Suppliers", s.name]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={s.status} />
            <Btn
              icon={Mail}
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(
                  `/communication?type=email&to=${encodeURIComponent(
                    s.email || `${s.name.toLowerCase().replace(/\s+/g, ".")}@pharma.com`
                  )}&name=${encodeURIComponent(s.name)}`
                )
              }
            >
              Email PO
            </Btn>
            <Btn
              icon={MessageSquare}
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(
                  `/communication?type=whatsapp&phone=${encodeURIComponent(s.phone || "")}&name=${encodeURIComponent(
                    s.name
                  )}`
                )
              }
            >
              WhatsApp Order
            </Btn>
            <Btn icon={Pencil} size="sm" onClick={openEdit}>
              Edit Supplier
            </Btn>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: T.border }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: T.navy }}>
            Supplier Profile
          </h3>
          <div className="flex flex-col gap-2.5 text-sm">
            {[
              ["Contact Person", s.contact],
              ["Phone", s.phone],
              ["Email", s.email],
              ["Address", `${s.address}, ${s.city}`],
              ["GST Number", s.gst],
              ["License No.", s.license],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b pb-2 gap-3" style={{ borderColor: T.borderSoft }}>
                <span style={{ color: "#9AA6B2" }}>{k}</span>
                <span className="font-medium text-right" style={{ color: T.navy }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
        <StatCard icon={ClipboardList} label="Total Purchases" value={formatCurrency(totalPurchases)} tone="blue" />
        <StatCard icon={CircleAlert} label="Pending Payments" value={formatCurrency(pending)} tone="amber" />
      </div>
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.border }}>
        <div className="px-5 py-4 border-b font-bold text-sm" style={{ borderColor: T.border, color: T.navy }}>
          Purchase History
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: T.blueTint2 }}>
              {["Invoice No.", "Branch", "Date", "Amount", "Payment", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-semibold" style={{ color: T.navySoft }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-t" style={{ borderColor: T.borderSoft }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: T.navy }}>
                  {p.invoice}
                </td>
                <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                  {p.branch}
                </td>
                <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                  {formatDate(p.date)}
                </td>
                <td className="px-4 py-2.5 font-semibold" style={{ color: T.navy }}>
                  {formatCurrency(p.amount)}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={p.payment} />
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState title="No purchases yet" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`Edit Supplier — ${form.name}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSave}>Update Supplier</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Supplier Name" required placeholder="e.g. Sun Pharma Distributors" value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <FormInput label="Company Name" required placeholder="e.g. Sun Pharma Industries Ltd." value={form.company || ""} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
          <FormInput label="Contact Person" required placeholder="e.g. Ramesh Iyer" value={form.contact || ""} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
          <FormInput label="Phone Number" required placeholder="e.g. +91 98400 12345" value={form.phone || ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <FormInput label="Email Address" type="email" placeholder="e.g. orders@sunpharma.in" value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <FormInput label="City" placeholder="e.g. Chennai" value={form.city || ""} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          <FormInput label="GST Number" required placeholder="e.g. 33AAACS1234F1Z5" value={form.gst || ""} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))} />
          <FormInput label="Drug License No." placeholder="e.g. TN-DL-88213" value={form.license || ""} onChange={(e) => setForm((f) => ({ ...f, license: e.target.value }))} />
          <div className="col-span-2">
            <FormInput label="Address" placeholder="e.g. Guindy Industrial Estate" value={form.address || ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <FormSelect label="Status" value={form.status || "Active"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option>Active</option>
            <option>Inactive</option>
          </FormSelect>
        </div>
      </Modal>
    </div>
  );
}
