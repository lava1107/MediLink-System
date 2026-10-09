import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, Clock, Plus, Pencil } from "lucide-react";
import { T } from "../../utils/theme.js";
import { useApp } from "../../hooks/useApp.js";
import { createBranch, updateBranch } from "../../services/branchService.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Btn from "../../components/common/Btn.jsx";
import IconBtn from "../../components/common/IconBtn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";

export default function BranchesPage() {
  const { db, setDb, toast, refreshDb } = useApp();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // { mode: "add" } or { mode: "edit", id }
  const [form, setForm] = useState({
    name: "",
    manager: "",
    address: "",
    city: "Kovilpatti",
    state: "Tamil Nadu",
    pin: "628501",
    phone: "",
    email: "",
    opening: "08:30 AM",
    closing: "09:30 PM",
    staff: 5,
    status: "Active",
    isHQ: false,
  });

  function openAdd() {
    setForm({
      name: "",
      manager: "",
      address: "",
      city: "Kovilpatti",
      state: "Tamil Nadu",
      pin: "628501",
      phone: "",
      email: "",
      opening: "08:30 AM",
      closing: "09:30 PM",
      staff: 5,
      status: "Active",
      isHQ: false,
    });
    setModal({ mode: "add" });
  }

  function openEdit(b) {
    setForm({
      name: b.name || "",
      manager: b.manager || "",
      address: b.address || "",
      city: b.city || "",
      state: b.state || "Tamil Nadu",
      pin: b.pin || "",
      phone: b.phone || "",
      email: b.email || "",
      opening: b.opening || "08:30 AM",
      closing: b.closing || "09:30 PM",
      staff: b.staff || 5,
      status: b.status || "Active",
      isHQ: Boolean(b.isHQ),
    });
    setModal({ mode: "edit", id: b.id });
  }

  async function handleSave() {
    if (!form.name || !form.manager || !form.address) {
      toast("Please fill in branch name, manager and address.", "error");
      return;
    }
    try {
      if (modal.mode === "add") {
        let created;
        try {
          created = await createBranch(form);
        } catch (apiErr) {
          console.warn("Backend unavailable, creating branch locally:", apiErr.message);
          created = { id: `BR-${String((db.branches?.length || 0) + 1).padStart(2, "0")}`, ...form };
        }
        setDb((d) => ({ ...d, branches: [...d.branches, created] }));
        toast("Branch added successfully.");
      } else {
        let updated;
        try {
          updated = await updateBranch(modal.id, form);
        } catch (apiErr) {
          console.warn("Backend unavailable, updating branch locally:", apiErr.message);
          updated = { id: modal.id, ...form };
        }
        setDb((d) => {
          const oldBranch = (d.branches || []).find((b) => b.id === modal.id);
          const oldName = oldBranch?.name;
          const newName = updated.name || form.name || oldName;

          return {
            ...d,
            branches: d.branches.map((b) => (b.id === modal.id ? { ...b, ...updated } : b)),
            batches: (d.batches || []).map((b) =>
              b.branchId === modal.id || (oldName && b.branchName === oldName)
                ? { ...b, branchName: newName, branchId: modal.id }
                : b
            ),
            sales: (d.sales || []).map((s) =>
              s.branchId === modal.id || (oldName && s.branch === oldName)
                ? { ...s, branch: newName, branchId: modal.id }
                : s
            ),
            reservations: (d.reservations || []).map((r) =>
              r.branchId === modal.id || (oldName && r.branch === oldName)
                ? { ...r, branch: newName, branchId: modal.id }
                : r
            ),
            purchases: (d.purchases || []).map((p) =>
              p.branchId === modal.id || (oldName && p.branch === oldName)
                ? { ...p, branch: newName, branchId: modal.id }
                : p
            ),
            users: (d.users || []).map((u) =>
              oldName && u.branch === oldName ? { ...u, branch: newName } : u
            ),
          };
        });
        toast("Branch updated successfully.");
      }
      setModal(null);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to save branch.", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Branch Management"
        subtitle="Manage all pharmacy branch locations"
        crumbs={["MediLink", "Branches"]}
        action={
          <Btn icon={Plus} onClick={openAdd}>
            Add Branch
          </Btn>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {db.branches.map((b) => (
          <div
            key={b.id}
            onClick={() => navigate(`/branches/${b.id}`)}
            className="bg-white rounded-2xl border p-5 cursor-pointer hover:shadow-md transition-shadow relative group"
            style={{ borderColor: T.border }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: T.blueTint }}>
                <Building2 size={20} style={{ color: T.blue }} />
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={b.status} />
                <IconBtn
                  icon={Pencil}
                  tone="blue"
                  title="Edit Branch"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(b);
                  }}
                />
              </div>
            </div>
            <h3 className="font-bold text-sm mb-1" style={{ color: T.navy }}>
              {b.name}{" "}
              {b.isHQ && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-1" style={{ background: T.blueTint, color: T.blue }}>
                  HQ
                </span>
              )}
            </h3>
            <p className="text-xs mb-4" style={{ color: "#9AA6B2" }}>
              {b.address}, {b.city}
            </p>
            <div className="flex items-center gap-4 text-xs pt-3 border-t" style={{ borderColor: T.borderSoft }}>
              <span className="flex items-center gap-1" style={{ color: T.navySoft }}>
                <Users size={12} /> {b.staff} staff
              </span>
              <span className="flex items-center gap-1" style={{ color: T.navySoft }}>
                <Clock size={12} /> {b.opening}–{b.closing}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "add" ? "Add New Branch" : "Edit Branch"}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Btn>
            <Btn onClick={handleSave}>{modal?.mode === "add" ? "Save Branch" : "Update Branch"}</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Branch Name" required placeholder="e.g. Kovilpatti Branch" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <FormInput label="Manager" required placeholder="e.g. R. Rajan" value={form.manager} onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))} />
          <FormInput label="Phone Number" placeholder="e.g. +91 98421 30221" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <FormInput label="Email" type="email" placeholder="e.g. kovilpatti@medilink.in" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <div className="col-span-2">
            <FormInput label="Address" required placeholder="e.g. 12, VOC Street" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <FormInput label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          <FormInput label="Pincode" value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))} />
          <FormInput label="Opening Time" value={form.opening} onChange={(e) => setForm((f) => ({ ...f, opening: e.target.value }))} />
          <FormInput label="Closing Time" value={form.closing} onChange={(e) => setForm((f) => ({ ...f, closing: e.target.value }))} />
          <FormInput label="Staff Count" type="number" min="1" value={form.staff} onChange={(e) => setForm((f) => ({ ...f, staff: e.target.value }))} />
          <FormSelect label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option>Active</option>
            <option>Inactive</option>
          </FormSelect>
        </div>
      </Modal>
    </div>
  );
}
