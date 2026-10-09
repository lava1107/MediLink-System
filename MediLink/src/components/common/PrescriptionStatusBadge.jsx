import React from "react";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { T } from "../../utils/theme.js";

const CONFIG = {
  Pending: { bg: T.amberTint, fg: T.amber, icon: Clock, label: "Pending" },
  Verified: { bg: T.greenTint, fg: T.green, icon: CheckCircle2, label: "Prescription Verified" },
  Rejected: { bg: T.redTint, fg: T.red, icon: XCircle, label: "Prescription Rejected" },
  Expired: { bg: T.redTint, fg: T.red, icon: AlertTriangle, label: "Prescription Expired" },
};

// Prescription-specific status badge with an icon and full wording, used on the
// Sales & Billing cart and the Prescription Verification history table.
export default function PrescriptionStatusBadge({ status, compact = false }) {
  const c = CONFIG[status] || CONFIG.Pending;
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      <Icon size={13} />
      {compact ? status : c.label}
    </span>
  );
}
