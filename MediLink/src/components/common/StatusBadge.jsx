import React from "react";
import { T } from "../../utils/theme.js";

const MAP = {
  Active: { bg: T.greenTint, fg: T.green },
  Inactive: { bg: T.redTint, fg: T.red },
  Safe: { bg: T.greenTint, fg: T.green },
  "Expiring Soon": { bg: T.amberTint, fg: T.amber },
  Expired: { bg: T.redTint, fg: T.red },
  Pending: { bg: T.amberTint, fg: T.amber },
  Reserved: { bg: T.blueTint, fg: T.blue },
  Collected: { bg: T.greenTint, fg: T.green },
  Cancelled: { bg: "#F1F1F1", fg: "#6B7280" },
  Completed: { bg: T.greenTint, fg: T.green },
  Received: { bg: T.greenTint, fg: T.green },
  Ordered: { bg: T.blueTint, fg: T.blue },
  Paid: { bg: T.greenTint, fg: T.green },
  "Partially Paid": { bg: T.amberTint, fg: T.amber },
  "In Stock": { bg: T.greenTint, fg: T.green },
  "Low Stock": { bg: T.amberTint, fg: T.amber },
  "Out of Stock": { bg: T.redTint, fg: T.red },
  Verified: { bg: T.greenTint, fg: T.green },
  Rejected: { bg: T.redTint, fg: T.red },
};

export default function StatusBadge({ status }) {
  const s = MAP[status] || { bg: "#F1F1F1", fg: "#4B5563" };
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fg }} />
      {status}
    </span>
  );
}
