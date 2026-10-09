import React from "react";
import { XCircle } from "lucide-react";
import { T } from "../../utils/theme.js";
import { formatCurrency, formatDate } from "../../utils/format.js";

// Level 1 result card: current-branch availability (found or not found).
export default function AvailabilityCard({ medicine, batch, branchName }) {
  if (batch) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: T.greenTint }}>
        <div>
          <div className="font-semibold text-sm" style={{ color: T.navy }}>
            {medicine.name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: T.navySoft }}>
            Batch {batch.batchNo} · Expires {formatDate(batch.expiryDate)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold" style={{ color: T.green }}>
            {batch.available} in stock
          </div>
          <div className="text-xs" style={{ color: T.navySoft }}>
            {formatCurrency(batch.sellingPrice)}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 p-4 rounded-xl" style={{ background: T.redTint }}>
      <XCircle size={16} style={{ color: T.red }} />
      <span className="text-sm font-medium" style={{ color: T.red }}>
        Not Available at {branchName}
      </span>
    </div>
  );
}
