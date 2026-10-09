import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Receipt, UserRound, CalendarClock, CircleAlert, CalendarX2, Search,
  MapPinned, Handshake, Clock, ArrowUpRight, ShieldCheck,
} from "lucide-react";
import { T } from "../../utils/theme.js";
import { formatCurrency, formatDate } from "../../utils/format.js";
import { TODAY } from "../../data/mockData.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useApp } from "../../hooks/useApp.js";
import { useRecent } from "../../context/RecentContext.jsx";
import { useTranslation } from "../../context/LanguageContext.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Btn from "../../components/common/Btn.jsx";
import DrugSafetyModal from "../../components/common/DrugSafetyModal.jsx";

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const { db } = useApp();
  const { t } = useTranslation();
  const { recentItems } = useRecent();
  const navigate = useNavigate();
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);

  const branchSales = db.sales.filter((s) => s.branch === user.branch || s.branchName === user.branch);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = branchSales
    .filter((s) => s.date === todayStr || s.date === TODAY)
    .reduce((a, s) => a + Number(s.amount || 0), 0);
  const todayBills = branchSales.filter((s) => s.date === todayStr || s.date === TODAY).length;
  const branchBatches = db.batches.filter((b) => b.branchName === user.branch || b.branchId === user.branchId);
  const lowStock = branchBatches.filter((b) => Number(b.available) > 0 && Number(b.available) <= 20).length;
  const nearExpiry = branchBatches.filter((b) => b.status === "Expiring Soon").length;
  const pendingRes = db.reservations.filter((r) => (r.branch === user.branch || r.branchName === user.branch) && (r.status === "Pending" || r.status === "Reserved")).length;

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name ? user.name.split(" ")[0] : "Pharmacist"}`}
        subtitle={`${user.branch} · ${todayFormatted}`}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard icon={ShoppingCart} label={t("totalSales", "Today's Sales")} value={formatCurrency(todaySales)} tone="green" onClick={() => navigate("/reports/daily-sales")} />
        <StatCard icon={Receipt} label="Today's Bills" value={todayBills} tone="blue" onClick={() => navigate("/reports/daily-sales")} />
        <StatCard icon={UserRound} label="Customers Served" value={new Set(branchSales.map((s) => s.customer)).size} tone="navy" onClick={() => navigate("/customers")} />
        <StatCard icon={CalendarClock} label={t("pendingReservations", "Pending Reservations")} value={pendingRes} tone="amber" onClick={() => navigate("/reservations")} />
        <StatCard icon={CircleAlert} label={t("lowStock", "Low Stock")} value={lowStock} tone="amber" onClick={() => navigate("/reports/low-stock")} />
        <StatCard icon={CalendarX2} label={t("nearExpiry", "Expiring Medicines")} value={nearExpiry} tone="red" onClick={() => navigate("/reports/near-expiry")} />
      </div>

      {/* Row: Quick Actions & Recently Accessed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        <div className="lg:col-span-7 bg-white rounded-2xl border p-5" style={{ borderColor: T.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: T.navy }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Btn variant="primary" icon={ShoppingCart} onClick={() => navigate("/sales")}>
              New Bill
            </Btn>
            <Btn variant="secondary" icon={Search} onClick={() => navigate("/medicines")}>
              Search Medicine
            </Btn>
            <Btn variant="secondary" icon={MapPinned} onClick={() => navigate("/availability")}>
              Check Other Branch
            </Btn>
            <Btn variant="secondary" icon={Handshake} onClick={() => navigate("/partners")}>
              Check Partner Shop
            </Btn>
            <Btn variant="secondary" icon={CalendarClock} onClick={() => navigate("/reservations")}>
              Reserve Medicine
            </Btn>
            <Btn variant="secondary" icon={Clock} onClick={() => navigate("/reports/daily-sales")}>
              Daily Sales
            </Btn>
          </div>
        </div>

        {/* Recently Accessed on Pharmacist Dashboard */}
        <div className="lg:col-span-5 bg-white rounded-2xl border p-5" style={{ borderColor: T.border }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Clock size={14} className="text-blue-600" />
              {t("recentItems", "Recently Accessed")}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">{recentItems.length} records</span>
          </div>

          <div className="divide-y text-xs" style={{ borderColor: T.borderSoft }}>
            {recentItems.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs">
                {t("noRecent", "No recently accessed records yet")}
              </div>
            ) : (
              recentItems.slice(0, 3).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className="w-full text-left py-2 flex items-center justify-between hover:bg-slate-50 px-1 rounded-lg transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-800 truncate group-hover:text-blue-600">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                  </div>
                  <ArrowUpRight size={13} className="text-slate-300 group-hover:text-blue-600 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.border }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: T.border }}>
          <h3 className="font-bold text-sm" style={{ color: T.navy }}>
            Recent Transactions
          </h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: T.blueTint2 }}>
              {["Bill No.", "Customer", "Amount", "Payment", "Date", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-semibold" style={{ color: T.navySoft }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branchSales.slice(0, 6).map((s) => (
              <tr key={s.id} className="border-t" style={{ borderColor: T.borderSoft }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: T.navy }}>
                  {s.bill}
                </td>
                <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                  {s.customer}
                </td>
                <td className="px-4 py-2.5 font-semibold" style={{ color: T.navy }}>
                  {formatCurrency(s.amount)}
                </td>
                <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                  {s.payment}
                </td>
                <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                  {formatDate(s.date)}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DrugSafetyModal isOpen={safetyModalOpen} onClose={() => setSafetyModalOpen(false)} />
    </div>
  );
}
