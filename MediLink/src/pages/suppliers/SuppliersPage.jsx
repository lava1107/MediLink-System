import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil } from "lucide-react";
import { useApp } from "../../hooks/useApp.js";
import { createSupplier, updateSupplier } from "../../services/supplierService.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/tables/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Btn from "../../components/common/Btn.jsx";
import IconBtn from "../../components/common/IconBtn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";

export default function SuppliersPage() {
  const { db, setDb, toast, refreshDb } = useApp();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // { mode: "add" } or { mode: "edit", id }
  const [form, setForm] = useState({
    name: "",
    company: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "Tamil Nadu",
    gst: "",
    license: "",
    status: "Active",
  });

  function openAdd() {
    setForm({
      name: "",
      company: "",
      contact: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "Tamil Nadu",
      gst: "",
      license: "",
      status: "Active",
    });
    setModal({ mode: "add" });
  }

  function openEdit(s) {
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
    setModal({ mode: "edit", id: s.id });
  }

  async function handleSave() {
    if (!form.name || !form.company || !form.contact || !form.phone || !form.gst) {
      toast("Please fill in name, company, contact, phone and GST number.", "error");
      return;
    }
    try {
      if (modal.mode === "add") {
        let created;
        try {
          created = await createSupplier(form);
        } catch (apiErr) {
          console.warn("Backend unavailable, creating supplier locally:", apiErr.message);
          created = { id: `SUP-${String((db.suppliers?.length || 0) + 1).padStart(2, "0")}`, ...form };
        }
        setDb((d) => ({ ...d, suppliers: [...d.suppliers, created] }));
        toast("Supplier created successfully.");
      } else {
        let updated;
        try {
          updated = await updateSupplier(modal.id, form);
        } catch (apiErr) {
          console.warn("Backend unavailable, updating supplier locally:", apiErr.message);
          updated = { id: modal.id, ...form };
        }
        setDb((d) => {
          const oldSup = (d.suppliers || []).find((s) => s.id === modal.id);
          const oldName = oldSup?.name;
          const newName = updated.name || form.name || oldName;

          return {
            ...d,
            suppliers: d.suppliers.map((s) => (s.id === modal.id ? { ...s, ...updated } : s)),
            purchases: (d.purchases || []).map((p) =>
              p.supplierId === modal.id || (oldName && p.supplier === oldName)
                ? { ...p, supplier: newName, supplierId: modal.id }
                : p
            ),
            batches: (d.batches || []).map((b) =>
              b.supplierId === modal.id || (oldName && b.supplierName === oldName)
                ? { ...b, supplierName: newName, supplierId: modal.id }
                : b
            ),
          };
        });
        toast("Supplier updated successfully.");
      }
      setModal(null);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to save supplier.", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Supplier Management"
        subtitle="Manage medicine suppliers and distributors"
        crumbs={["MediLink", "Suppliers"]}
        action={
          <Btn icon={Plus} onClick={openAdd}>
            Add Supplier
          </Btn>
        }
      />
      <DataTable
        columns={[
          { key: "id", label: "Supplier ID", sortable: true },
          { key: "name", label: "Supplier Name", sortable: true, render: (r) => <span className="font-semibold">{r.name}</span> },
          { key: "contact", label: "Contact Person" },
          { key: "phone", label: "Phone" },
          { key: "city", label: "City" },
          { key: "gst", label: "GST Number" },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
        data={db.suppliers}
        searchKeys={["name", "company", "contact", "gst"]}
        filters={[{ key: "status", label: "Status", options: ["Active", "Inactive"] }]}
        onRowClick={(s) => navigate(`/suppliers/${s.id}`)}
        actions={(s) => (
          <>
            <IconBtn icon={Eye} tone="blue" title="View Details" onClick={() => navigate(`/suppliers/${s.id}`)} />
            <IconBtn
              icon={Pencil}
              tone="blue"
              title="Edit Supplier"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(s);
              }}
            />
          </>
        )}
      />

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "add" ? "Add New Supplier" : "Edit Supplier"}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Btn>
            <Btn onClick={handleSave}>{modal?.mode === "add" ? "Save Supplier" : "Update Supplier"}</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Supplier Name" required placeholder="e.g. Sun Pharma Distributors" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <FormInput label="Company Name" required placeholder="e.g. Sun Pharma Industries Ltd." value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
          <FormInput label="Contact Person" required placeholder="e.g. Ramesh Iyer" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
          <FormInput label="Phone Number" required placeholder="e.g. +91 98400 12345" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <FormInput label="Email Address" type="email" placeholder="e.g. orders@sunpharma.in" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <FormInput label="City" placeholder="e.g. Chennai" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          <FormInput label="GST Number" required placeholder="e.g. 33AAACS1234F1Z5" value={form.gst} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))} />
          <FormInput label="Drug License No." placeholder="e.g. TN-DL-88213" value={form.license} onChange={(e) => setForm((f) => ({ ...f, license: e.target.value }))} />
          <div className="col-span-2">
            <FormInput label="Address" placeholder="e.g. Guindy Industrial Estate" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <FormSelect label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option>Active</option>
            <option>Inactive</option>
          </FormSelect>
        </div>
      </Modal>
    </div>
  );
}
