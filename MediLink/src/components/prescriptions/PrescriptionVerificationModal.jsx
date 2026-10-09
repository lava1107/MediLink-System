import React, { useState } from "react";
import { T } from "../../utils/theme.js";
import { formatDate } from "../../utils/format.js";
import Modal from "../common/Modal.jsx";
import Btn from "../common/Btn.jsx";
import PrescriptionStatusBadge from "../common/PrescriptionStatusBadge.jsx";
import { FormInput } from "../common/FormControls.jsx";

// Manual verify/reject decision UI. The system never auto-approves — an
// authorized Admin or Pharmacist must make the call, per business rules.
export default function PrescriptionVerificationModal({ open, onClose, prescription, onVerify, onReject }) {
  const [remarks, setRemarks] = useState("");

  if (!prescription) return null;

  function handleVerify() {
    onVerify(prescription.id, remarks);
    setRemarks("");
  }
  function handleReject() {
    onReject(prescription.id, remarks);
    setRemarks("");
  }

  const canDecide = prescription.status === "Pending";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Prescription Verification"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          {canDecide && (
            <>
              <Btn variant="danger" onClick={handleReject}>
                Reject Prescription
              </Btn>
              <Btn variant="green" onClick={handleVerify}>
                Verify Prescription
              </Btn>
            </>
          )}
        </>
      }
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold" style={{ color: "#9AA6B2" }}>
          {prescription.id}
        </span>
        <PrescriptionStatusBadge status={prescription.status} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm mb-4">
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: "#9AA6B2" }}>Customer</span>
          <span className="font-medium" style={{ color: T.navy }}>{prescription.customerName}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: "#9AA6B2" }}>Medicine</span>
          <span className="font-medium" style={{ color: T.navy }}>{prescription.medicine}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: "#9AA6B2" }}>Quantity</span>
          <span className="font-medium" style={{ color: T.navy }}>{prescription.quantity}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: "#9AA6B2" }}>Doctor</span>
          <span className="font-medium" style={{ color: T.navy }}>{prescription.doctorName}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: "#9AA6B2" }}>Prescription Date</span>
          <span className="font-medium" style={{ color: T.navy }}>{formatDate(prescription.prescriptionDate)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: "#9AA6B2" }}>Reference No.</span>
          <span className="font-medium" style={{ color: T.navy }}>{prescription.prescriptionRef}</span>
        </div>
      </div>
      {!canDecide && prescription.remarks && (
        <div className="text-xs px-3 py-2 rounded-lg mb-3" style={{ background: T.blueTint2, color: T.navySoft }}>
          <span className="font-semibold" style={{ color: T.navy }}>Remarks:</span> {prescription.remarks}
          {prescription.verifiedBy && (
            <div className="mt-1">
              — {prescription.verifiedBy}, {formatDate(prescription.verifiedDate)}
            </div>
          )}
        </div>
      )}
      {canDecide && (
        <FormInput label="Remarks (optional)" placeholder="Add a note for this decision..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      )}
    </Modal>
  );
}
