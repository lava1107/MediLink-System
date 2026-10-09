import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, BarChart3, ClipboardList, Truck, UserRound, Pill, Building2,
  CalendarClock, CircleAlert, CalendarX2, PackageX,
} from "lucide-react";
import { T } from "../../utils/theme.js";
import { REPORT_DEFINITIONS } from "../../services/reportService.js";
import PageHeader from "../../components/common/PageHeader.jsx";

const ICONS = {
  "daily-sales": ShoppingCart,
  "monthly-sales": BarChart3,
  purchase: ClipboardList,
  supplier: Truck,
  customer: UserRound,
  medicine: Pill,
  "branch-sales": Building2,
  reservation: CalendarClock,
  "low-stock": CircleAlert,
  "near-expiry": CalendarX2,
  expired: PackageX,
};

export default function ReportsPage() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and export operational reports" crumbs={["MediLink", "Reports"]} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORT_DEFINITIONS.map((r) => {
          const Icon = ICONS[r.key] || BarChart3;
          return (
            <button
              key={r.key}
              onClick={() => navigate(`/reports/${r.key}`)}
              className="text-left bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow"
              style={{ borderColor: T.border }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: T.blueTint }}>
                <Icon size={18} style={{ color: T.blue }} />
              </div>
              <div className="font-semibold text-sm mb-1" style={{ color: T.navy }}>
                {r.name}
              </div>
              <div className="text-xs" style={{ color: "#9AA6B2" }}>
                {r.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
