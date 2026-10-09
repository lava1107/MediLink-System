import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil } from "lucide-react";
import { useApp } from "../../hooks/useApp.js";
import { createCustomer, updateCustomer } from "../../services/customerService.js";
import { formatDate } from "../../utils/format.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/tables/DataTable.jsx";
import Btn from "../../components/common/Btn.jsx";
import IconBtn from "../../components/common/IconBtn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput } from "../../components/common/FormControls.jsx";

export default function CustomersPage() {
  const { db, setDb, toast, refreshDb } = useApp();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // { mode: "add" } or { mode: "edit", id }
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    rxRef: "-",
  });

  function openAdd() {
    setForm({ name: "", phone: "", email: "", address: "", rxRef: "-" });
    setModal({ mode: "add" });
  }

  function openEdit(c) {
    setForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      rxRef: c.rxRef || "-",
    });
    setModal({ mode: "edit", id: c.id });
  }

  async function handleSave() {
    if (!form.name || !form.phone) {
      toast("Name and phone number are required.", "error");
      return;
    }
    try {
      if (modal.mode === "add") {
        let created;
        try {
          created = await createCustomer(form);
        } catch (apiErr) {
          console.warn("Backend unavailable, creating customer locally:", apiErr.message);
          created = { id: `CUS-${String((db.customers?.length || 0) + 1).padStart(2, "0")}`, ...form, created: new Date().toISOString().slice(0, 10) };
        }
        setDb((d) => ({ ...d, customers: [...d.customers, created] }));
        toast("Customer created successfully.");
      } else {
        let updated;
        try {
          updated = await updateCustomer(modal.id, form);
        } catch (apiErr) {
          console.warn("Backend unavailable, updating customer locally:", apiErr.message);
          updated = { id: modal.id, ...form };
        }
        setDb((d) => {
          const oldCust = (d.customers || []).find((c) => c.id === modal.id);
          const oldName = oldCust?.name;
          const newName = updated.name || form.name || oldName;

          return {
            ...d,
            customers: (d.customers || []).map((c) => (c.id === modal.id ? { ...c, ...updated } : c)),
            sales: (d.sales || []).map((s) =>
              s.customerId === modal.id || (oldName && s.customer === oldName)
                ? { ...s, customer: newName, customerId: modal.id }
                : s
            ),
            prescriptions: (d.prescriptions || []).map((p) =>
              p.customerId === modal.id || (oldName && (p.customer === oldName || p.customerName === oldName))
                ? { ...p, customer: newName, customerName: newName, customerId: modal.id }
                : p
            ),
            reservations: (d.reservations || []).map((r) =>
              r.customerId === modal.id || (oldName && r.customer === oldName)
                ? { ...r, customer: newName, customerId: modal.id }
                : r
            ),
          };
        });
        toast("Customer updated successfully.");
      }
      setModal(null);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to save customer.", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Customer Management"
        subtitle="View and manage customer records"
        crumbs={["MediLink", "Customers"]}
        action={
          <Btn icon={Plus} onClick={openAdd}>
            Add Customer
          </Btn>
        }
      />
      <DataTable
        columns={[
          { key: "id", label: "Customer ID", sortable: true },
          { key: "name", label: "Name", sortable: true, render: (r) => <span className="font-semibold">{r.name}</span> },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "rxRef", label: "Prescription Ref." },
          { key: "created", label: "Created Date", render: (r) => formatDate(r.created) },
        ]}
        data={db.customers}
        searchKeys={["name", "phone", "email"]}
        onRowClick={(c) => navigate(`/customers/${c.id}`)}
        actions={(c) => (
          <>
            <IconBtn icon={Eye} tone="blue" title="View Details" onClick={() => navigate(`/customers/${c.id}`)} />
            <IconBtn
              icon={Pencil}
              tone="blue"
              title="Edit Customer"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(c);
              }}
            />
          </>
        )}
      />

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "add" ? "Add New Customer" : "Edit Customer"}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Btn>
            <Btn onClick={handleSave}>{modal?.mode === "add" ? "Save Customer" : "Update Customer"}</Btn>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormInput label="Customer Full Name" required placeholder="e.g. Suresh Babu" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <FormInput label="Phone Number" required placeholder="e.g. +91 90031 44567" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <FormInput label="Email Address" type="email" placeholder="e.g. suresh.babu@gmail.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <FormInput label="Address" placeholder="e.g. 7 North Car Street, Kovilpatti" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <FormInput label="Prescription Reference (Optional)" placeholder="e.g. RX-2291 or '-'" value={form.rxRef} onChange={(e) => setForm((f) => ({ ...f, rxRef: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
