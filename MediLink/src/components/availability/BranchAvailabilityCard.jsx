import React from "react";
import { MapPin, Phone } from "lucide-react";
import { T } from "../../utils/theme.js";
import { formatCurrency } from "../../utils/format.js";
import Btn from "../common/Btn.jsx";

// One nearby-MediLink-branch result card, used in Medicine Availability Level 2.
export default function BranchAvailabilityCard({ branch, batch, distance, onReserve }) {
  return (
    <div className="border rounded-xl p-4" style={{ borderColor: T.border }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold text-sm" style={{ color: T.navy }}>
            {branch.name}
          </div>
          <div className="text-[11px] font-semibold mt-0.5" style={{ color: T.blue }}>
            {distance} km away
          </div>
        </div>
        <span className="font-bold text-sm" style={{ color: T.green }}>
          {batch.available} strips
        </span>
      </div>
      <div className="text-xs flex items-center gap-1.5 mb-1" style={{ color: T.navySoft }}>
        <MapPin size={11} /> {branch.address}, {branch.city}
      </div>
      <div className="text-xs flex items-center gap-1.5 mb-2" style={{ color: T.navySoft }}>
        <Phone size={11} /> {branch.phone}
      </div>
      <div className="text-xs mb-3" style={{ color: T.navySoft }}>
        Selling Price: <span className="font-semibold" style={{ color: T.navy }}>{formatCurrency(batch.sellingPrice)}</span>
      </div>
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: T.borderSoft }}>
        <span className="text-[11px]" style={{ color: "#9AA6B2" }}>
          Last updated: 2026-08-20 09:00 AM
        </span>
        {onReserve && (
          <Btn size="sm" variant="secondary" onClick={onReserve}>
            Reserve Medicine
          </Btn>
        )}
      </div>
    </div>
  );
}
