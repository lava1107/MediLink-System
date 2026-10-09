import React, { useState } from "react";
import { Eye, Check, X, Pencil } from "lucide-react";
import { useApp } from "../../hooks/useApp.js";
import { useAuth } from "../../hooks/useAuth.js";
import { verifyPrescription, rejectPrescription, updatePrescription } from "../../services/prescriptionService.js";
import { formatDate } from "../../utils/format.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/tables/DataTable.jsx";
import PrescriptionStatusBadge from "../../components/common/PrescriptionStatusBadge.jsx";
import IconBtn from "../../components/common/IconBtn.jsx";
import Btn from "../../components/common/Btn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";
import PrescriptionVerificationModal from "../../components/prescriptions/PrescriptionVerificationModal.jsx";

export default function PrescriptionsPage() {
  const { db, setDb, toast, refreshDb } = useApp();
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  async function handleVerify(id, remarks) {
    const updated = await verifyPrescription(db.prescriptions, id, user.name, remarks);
    setDb((d) => ({ ...d, prescriptions: updated }));
    toast("Prescription verified. Billing is now allowed for this medicine.");
    setSelected(null);
  }

  async function handleReject(id, remarks) {
    const updated = await rejectPrescription(db.prescriptions, id, user.name, remarks);
    setDb((d) => ({ ...d, prescriptions: updated }));
    toast("Prescription rejected. Billing remains blocked for this medicine.", "error");
    setSelected(null);
  }

  function openEdit(r) {
    setEditForm({
      id: r.id,
      customerName: r.customerName || "",
      medicine: r.medicine || "",
      doctorName: r.doctorName || "",
      prescriptionDate: r.prescriptionDate ? r.prescriptionDate.slice(0, 10) : "",
      quantity: r.quantity || 1,
      status: r.status || "Pending",
      remarks: r.remarks || "",
    });
    setEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editForm.customerName || !editForm.medicine) {
      toast("Customer name and medicine are required.", "error");
      return;
    }
    try {
      let updated;
      try {
        updated = await updatePrescription(editForm.id, editForm);
      } catch (apiErr) {
        console.warn("Backend unavailable, updating prescription locally:", apiErr.message);
        updated = { ...editForm };
      }
      setDb((d) => ({
        ...d,
        prescriptions: d.prescriptions.map((p) => (p.id === editForm.id ? { ...p, ...updated } : p)),
      }));
      toast("Prescription updated successfully.");
      setEditModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to update prescription.", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Prescription Verification"
        subtitle="Verify or reject prescriptions before Rx-required medicines can be billed"
        crumbs={["MediLink", "Prescriptions"]}
      />
      <DataTable
        columns={[
          { key: "id", label: "Prescription ID", sortable: true },
          { key: "customerName", label: "Customer", sortable: true },
          { key: "medicine", label: "Medicine" },
          { key: "doctorName", label: "Doctor" },
          { key: "prescriptionDate", label: "Date", sortable: true, render: (r) => formatDate(r.prescriptionDate) },
          { key: "status", label: "Status", render: (r) => <PrescriptionStatusBadge status={r.status} compact /> },
          { key: "verifiedBy", label: "Verified By", render: (r) => r.verifiedBy || "—" },
          { key: "verifiedDate", label: "Verified Date", render: (r) => (r.verifiedDate ? formatDate(r.verifiedDate) : "—") },
        ]}
        data={db.prescriptions}
        searchKeys={["customerName", "medicine", "doctorName", "prescriptionRef"]}
        filters={[{ key: "status", label: "Status", options: ["Pending", "Verified", "Rejected", "Expired"] }]}
        actions={(r) => (
          <>
            <IconBtn icon={Eye} tone="blue" title="View & Verify" onClick={() => setSelected(r)} />
            <IconBtn icon={Pencil} tone="blue" title="Edit Prescription" onClick={() => openEdit(r)} />
            {r.status === "Pending" && (
              <>
                <IconBtn icon={Check} tone="green" title="Quick Verify" onClick={() => setSelected(r)} />
                <IconBtn icon={X} tone="red" title="Quick Reject" onClick={() => setSelected(r)} />
              </>
            )}
          </>
        )}
      />
      <PrescriptionVerificationModal
        open={!!selected}
        onClose={() => setSelected(null)}
        prescription={selected}
        onVerify={handleVerify}
        onReject={handleReject}
      />

      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit Prescription — ${editForm.id}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setEditModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSaveEdit}>Update Prescription</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Customer Name" required value={editForm.customerName || ""} onChange={(e) => setEditForm((f) => ({ ...f, customerName: e.target.value }))} />
          <FormInput label="Medicine" required value={editForm.medicine || ""} onChange={(e) => setEditForm((f) => ({ ...f, medicine: e.target.value }))} />
          <FormInput label="Doctor Name" placeholder="e.g. Dr. K. Ramesh MD" value={editForm.doctorName || ""} onChange={(e) => setEditForm((f) => ({ ...f, doctorName: e.target.value }))} />
          <FormInput label="Prescription Date" type="date" value={editForm.prescriptionDate || ""} onChange={(e) => setEditForm((f) => ({ ...f, prescriptionDate: e.target.value }))} />
          <FormInput label="Quantity Prescribed" type="number" min="1" value={editForm.quantity || 1} onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))} />
          <FormSelect label="Status" value={editForm.status || "Pending"} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
            <option>Pending</option>
            <option>Verified</option>
            <option>Rejected</option>
            <option>Expired</option>
          </FormSelect>
          <div className="col-span-2">
            <FormInput label="Remarks" placeholder="Verification or dosage notes" value={editForm.remarks || ""} onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
