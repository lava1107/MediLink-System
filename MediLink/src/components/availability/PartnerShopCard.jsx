import React from "react";
import { MapPin, Phone } from "lucide-react";
import { T } from "../../utils/theme.js";
import Btn from "../common/Btn.jsx";

// One nearby-partner-shop result card, used in Medicine Availability Level 3.
// Partner shops are a separate entity from MediLink branches (registered mock data only).
export default function PartnerShopCard({ entry, onViewDetails, onReserve }) {
  const { shop, quantity, lastUpdated, distance } = entry;
  return (
    <div className="border rounded-xl p-4" style={{ borderColor: T.border }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold text-sm" style={{ color: T.navy }}>
            {shop.name}
          </div>
          <div className="text-[11px] font-semibold mt-0.5" style={{ color: T.blue }}>
            {distance} km away
          </div>
        </div>
        <span className="font-bold text-sm" style={{ color: T.green }}>
          {quantity} units
        </span>
      </div>
      <div className="text-xs flex items-center gap-1.5 mb-1" style={{ color: T.navySoft }}>
        <MapPin size={11} /> {shop.address}, {shop.city}
      </div>
      <div className="text-xs flex items-center gap-1.5 mb-3" style={{ color: T.navySoft }}>
        <Phone size={11} /> {shop.phone}
      </div>
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: T.borderSoft }}>
        <span className="text-[11px]" style={{ color: "#9AA6B2" }}>
          Updated: {lastUpdated}
        </span>
        <div className="flex items-center gap-1.5">
          {onViewDetails && (
            <Btn size="sm" variant="ghost" onClick={onViewDetails}>
              View Details
            </Btn>
          )}
          {onReserve && (
            <Btn size="sm" variant="secondary" onClick={onReserve}>
              Reserve Medicine
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
