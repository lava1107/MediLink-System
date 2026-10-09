import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Receipt, Pill, CircleAlert, Pencil } from "lucide-react";
import { T } from "../../utils/theme.js";
import { formatCurrency, formatDate } from "../../utils/format.js";
import { TODAY } from "../../data/mockData.js";
import { useApp } from "../../hooks/useApp.js";
import { updateBranch } from "../../services/branchService.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Btn from "../../components/common/Btn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";

export default function BranchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, setDb, toast, refreshDb } = useApp();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  const br = db.branches.find((b) => b.id === id);

  if (!br) {
    return (
      <div>
        <button onClick={() => navigate("/branches")} className="flex items-center gap-1.5 text-xs font-semibold mb-4" style={{ color: T.blue }}>
          <ArrowLeft size={14} /> Back to Branches
        </button>
        <EmptyState title="Branch not found" />
      </div>
    );
  }

  const batches = db.batches.filter((b) => b.branchName === br.name);
  const sales = db.sales.filter((s) => s.branch === br.name);
  const staff = db.users.filter((u) => u.branch === br.name);
  const monthlySales = sales.reduce((a, s) => a + s.amount, 0) * 5.2;

  function openEdit() {
    setForm({
      name: br.name || "",
      manager: br.manager || "",
      address: br.address || "",
      city: br.city || "",
      state: br.state || "Tamil Nadu",
      pin: br.pin || "",
      phone: br.phone || "",
      email: br.email || "",
      opening: br.opening || "08:30 AM",
      closing: br.closing || "09:30 PM",
      staff: br.staff || 5,
      status: br.status || "Active",
    });
    setModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.manager || !form.address) {
      toast("Please fill in branch name, manager and address.", "error");
      return;
    }
    try {
      let updated;
      try {
        updated = await updateBranch(br.id, form);
      } catch (apiErr) {
        console.warn("Backend unavailable, updating branch locally:", apiErr.message);
        updated = { id: br.id, ...form };
      }
      setDb((d) => {
        const oldName = br.name;
        const newName = updated.name || form.name || oldName;

        return {
          ...d,
          branches: d.branches.map((b) => (b.id === br.id ? { ...b, ...updated } : b)),
          batches: (d.batches || []).map((b) =>
            b.branchId === br.id || (oldName && b.branchName === oldName)
              ? { ...b, branchName: newName, branchId: br.id }
              : b
          ),
          sales: (d.sales || []).map((s) =>
            s.branchId === br.id || (oldName && s.branch === oldName)
              ? { ...s, branch: newName, branchId: br.id }
              : s
          ),
          reservations: (d.reservations || []).map((r) =>
            r.branchId === br.id || (oldName && r.branch === oldName)
              ? { ...r, branch: newName, branchId: br.id }
              : r
          ),
          purchases: (d.purchases || []).map((p) =>
            p.branchId === br.id || (oldName && p.branch === oldName)
              ? { ...p, branch: newName, branchId: br.id }
              : p
          ),
          users: (d.users || []).map((u) =>
            oldName && u.branch === oldName ? { ...u, branch: newName } : u
          ),
        };
      });
      toast("Branch updated successfully.");
      setModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to update branch.", "error");
    }
  }

  return (
    <div>
      <button onClick={() => navigate("/branches")} className="flex items-center gap-1.5 text-xs font-semibold mb-4" style={{ color: T.blue }}>
        <ArrowLeft size={14} /> Back to Branches
      </button>
      <PageHeader
        title={br.name}
        subtitle={`${br.address}, ${br.city} - ${br.pin}`}
        crumbs={["MediLink", "Branches", br.name]}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={br.status} />
            <Btn icon={Pencil} size="sm" onClick={openEdit}>
              Edit Branch
            </Btn>
          </div>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <StatCard icon={ShoppingCart} label="Today's Sales" value={formatCurrency(sales.filter((s) => s.date === TODAY).reduce((a, s) => a + s.amount, 0))} tone="green" />
        <StatCard icon={Receipt} label="Monthly Sales" value={formatCurrency(monthlySales)} tone="blue" />
        <StatCard icon={Pill} label="Medicines Available" value={batches.filter((b) => b.available > 0).length} tone="navy" />
        <StatCard icon={CircleAlert} label="Low Stock" value={batches.filter((b) => b.available > 0 && b.available <= 20).length} tone="amber" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border p-5 lg:col-span-1" style={{ borderColor: T.border }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: T.navy }}>
            Branch Information
          </h3>
          <div className="flex flex-col gap-3 text-sm">
            {[
              ["Manager", br.manager],
              ["Phone", br.phone],
              ["Email", br.email],
              ["Hours", `${br.opening} – ${br.closing}`],
              ["Staff", staff.length + " employees"],
              ["State", br.state],
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
        <div className="lg:col-span-2 bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.border }}>
          <div className="px-5 py-4 border-b font-bold text-sm" style={{ borderColor: T.border, color: T.navy }}>
            Expiring / Low Stock Medicines
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: T.blueTint2 }}>
                {["Medicine", "Batch", "Quantity", "Expiry", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-semibold" style={{ color: T.navySoft }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches
                .filter((b) => b.status !== "Safe" || b.available <= 20)
                .slice(0, 8)
                .map((b) => (
                  <tr key={b.id} className="border-t" style={{ borderColor: T.borderSoft }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: T.navy }}>
                      {b.medicineName}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                      {b.batchNo}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                      {b.available}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                      {formatDate(b.expiryDate)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`Edit Branch — ${form.name}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSave}>Update Branch</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Branch Name" required placeholder="e.g. Kovilpatti Branch" value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <FormInput label="Manager" required placeholder="e.g. R. Rajan" value={form.manager || ""} onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))} />
          <FormInput label="Phone Number" placeholder="e.g. +91 98421 30221" value={form.phone || ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <FormInput label="Email" type="email" placeholder="e.g. kovilpatti@medilink.in" value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <div className="col-span-2">
            <FormInput label="Address" required placeholder="e.g. 12, VOC Street" value={form.address || ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <FormInput label="City" value={form.city || ""} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          <FormInput label="Pincode" value={form.pin || ""} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))} />
          <FormInput label="Opening Time" value={form.opening || ""} onChange={(e) => setForm((f) => ({ ...f, opening: e.target.value }))} />
          <FormInput label="Closing Time" value={form.closing || ""} onChange={(e) => setForm((f) => ({ ...f, closing: e.target.value }))} />
          <FormInput label="Staff Count" type="number" min="1" value={form.staff || 5} onChange={(e) => setForm((f) => ({ ...f, staff: e.target.value }))} />
          <FormSelect label="Status" value={form.status || "Active"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option>Active</option>
            <option>Inactive</option>
          </FormSelect>
        </div>
      </Modal>
    </div>
  );
}
