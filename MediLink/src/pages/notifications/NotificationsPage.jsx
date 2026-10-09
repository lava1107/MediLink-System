import React, { useState } from "react";
import { Bell, CircleAlert, CalendarX2, PackageX, PackagePlus, CalendarClock, Clock, XCircle, MapPinned } from "lucide-react";
import { T } from "../../utils/theme.js";
import { useApp } from "../../hooks/useApp.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";

const NOTIF_ICON = {
  "Low Stock": CircleAlert,
  "Near Expiry": CalendarX2,
  "Expired Medicine": PackageX,
  "New Purchase": PackagePlus,
  "Reservation Created": CalendarClock,
  "Reservation Expiring": Clock,
  "Reservation Cancelled": XCircle,
  "Branch Availability": MapPinned,
};

export default function NotificationsPage() {
  const { notifications, setNotifications } = useApp();
  const [filter, setFilter] = useState("All");
  const rows = filter === "All" ? notifications : notifications.filter((n) => (filter === "Unread" ? !n.read : n.read));

  function toggle(id) {
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  }

  return (
    <div>
      <PageHeader
        title="Notification Center"
        subtitle="Stay on top of stock, expiry and reservation alerts"
        crumbs={["MediLink", "Notifications"]}
        action={
          <div className="flex gap-1.5">
            {["All", "Unread", "Read"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: filter === f ? T.blue : "#fff", color: filter === f ? "#fff" : T.navySoft, border: `1px solid ${filter === f ? T.blue : T.border}` }}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />
      <div className="flex flex-col gap-2.5">
        {rows.map((n) => {
          const Icon = NOTIF_ICON[n.type] || Bell;
          return (
            <div
              key={n.id}
              onClick={() => toggle(n.id)}
              className="bg-white rounded-2xl border p-4 flex items-start gap-3.5 cursor-pointer hover:shadow-sm"
              style={{ borderColor: T.border, opacity: n.read ? 0.75 : 1 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.blueTint }}>
                <Icon size={17} style={{ color: T.blue }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm" style={{ color: T.navy }}>
                    {n.title}
                  </span>
                  {!n.read && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: T.blue }} />}
                </div>
                <p className="text-xs mt-0.5" style={{ color: T.navySoft }}>
                  {n.desc}
                </p>
                <div className="text-[11px] mt-1.5" style={{ color: "#9AA6B2" }}>
                  {n.time}
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <EmptyState icon={Bell} title="No notifications here" />}
      </div>
    </div>
  );
}
