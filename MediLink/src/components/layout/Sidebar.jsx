import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, Pill, Tags, PackageSearch, Truck, ShoppingCart,
  UserRound, CalendarClock, MapPinned, Handshake, BarChart3, Bell, Settings, LogOut,
  ClipboardList, Menu, FileCheck2, KeyRound, Mail,
} from "lucide-react";
import { T } from "../../utils/theme.js";
import { classNames } from "../../utils/format.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useApp } from "../../hooks/useApp.js";
import { useTranslation } from "../../context/LanguageContext.jsx";

const NAV_ADMIN = [
  { to: "/dashboard", label: "Dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/users", label: "Users", key: "users", icon: Users },
  { to: "/branches", label: "Branches", key: "branches", icon: Building2 },
  { to: "/medicines", label: "Medicines", key: "medicines", icon: Pill },
  { to: "/categories", label: "Categories", key: "categories", icon: Tags },
  { to: "/batches", label: "Medicine Batches", key: "batches", icon: PackageSearch },
  { to: "/suppliers", label: "Suppliers", key: "suppliers", icon: Truck },
  { to: "/purchases", label: "Purchases", key: "purchases", icon: ClipboardList },
  { to: "/sales", label: "Sales & Billing", key: "sales", icon: ShoppingCart },
  { to: "/prescriptions", label: "Prescriptions", key: "prescriptions", icon: FileCheck2 },
  { to: "/customers", label: "Customers", key: "customers", icon: UserRound },
  { to: "/reservations", label: "Reservations", key: "reservations", icon: CalendarClock },
  { to: "/availability", label: "Medicine Availability", key: "availability", icon: MapPinned },
  { to: "/partners", label: "Partner Medical Shops", key: "partners", icon: Handshake },
  { to: "/reports", label: "Reports", key: "reports", icon: BarChart3 },
  { to: "/communication", label: "Communication Hub", key: "communication", icon: Mail },
  { to: "/api-access", label: "API Access", key: "apiAccess", icon: KeyRound },
  { to: "/notifications", label: "Notifications", key: "notifications", icon: Bell },
  { to: "/settings", label: "Settings", key: "settings", icon: Settings },
];

const NAV_PHARMACIST = [
  { to: "/dashboard", label: "Dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/medicines", label: "Medicines", key: "medicines", icon: Pill },
  { to: "/batches", label: "Medicine Batches", key: "batches", icon: PackageSearch },
  { to: "/sales", label: "Sales & Billing", key: "sales", icon: ShoppingCart },
  { to: "/prescriptions", label: "Prescriptions", key: "prescriptions", icon: FileCheck2 },
  { to: "/customers", label: "Customers", key: "customers", icon: UserRound },
  { to: "/reservations", label: "Reservations", key: "reservations", icon: CalendarClock },
  { to: "/availability", label: "Medicine Availability", key: "availability", icon: MapPinned },
  { to: "/partners", label: "Partner Medical Shops", key: "partners", icon: Handshake },
  { to: "/reports", label: "Reports", key: "reports", icon: BarChart3 },
  { to: "/communication", label: "Communication Hub", key: "communication", icon: Mail },
  { to: "/api-access", label: "API Access", key: "apiAccess", icon: KeyRound },
  { to: "/notifications", label: "Notifications", key: "notifications", icon: Bell },
  { to: "/settings", label: "Profile", key: "settings", icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const { notifications = [] } = useApp() || {};
  const { t } = useTranslation();
  const items = user?.role === "Admin" ? NAV_ADMIN : NAV_PHARMACIST;
  const hasUnread = Array.isArray(notifications) && notifications.some((n) => !n.read);

  return (
    <aside
      className={classNames("shrink-0 h-screen sticky top-0 flex flex-col border-r bg-white transition-all", collapsed ? "w-[76px]" : "w-[248px]")}
      style={{ borderColor: T.border }}
    >
      <div className="flex items-center gap-2.5 px-4 h-16 border-b shrink-0" style={{ borderColor: T.border }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.blueTint }}>
          <Pill size={18} style={{ color: T.blue }} />
        </div>
        {!collapsed && (
          <span className="font-bold text-[15px] tracking-tight" style={{ color: T.navy }}>
            MediLink
          </span>
        )}
        <button onClick={() => setCollapsed((c) => !c)} className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 shrink-0">
          <Menu size={15} style={{ color: T.navySoft }} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 flex flex-col gap-0.5">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            title={collapsed ? t(it.key, it.label) : undefined}
            className={({ isActive }) =>
              classNames(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors relative",
                collapsed && "justify-center"
              )
            }
            style={({ isActive }) => ({ background: isActive ? T.blueTint : "transparent", color: isActive ? T.blue : T.navySoft })}
          >
            <it.icon size={17} />
            {!collapsed && <span>{t(it.key, it.label)}</span>}
            {!collapsed && it.to === "/notifications" && hasUnread && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: T.red }} />}
          </NavLink>
        ))}
      </nav>
      <div className="p-2.5 border-t shrink-0" style={{ borderColor: T.border }}>
        <div className={classNames("flex items-center gap-2.5 px-2 py-2", collapsed && "justify-center")}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white" style={{ background: T.blue }}>
            {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: T.navy }}>
                {user.name}
              </div>
              <div className="text-[11px] truncate" style={{ color: "#9AA6B2" }}>
                {user.role} · {user.branch.replace(" Branch", "")}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={classNames("flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-xl text-[13px] font-medium w-full hover:bg-red-50 transition-colors", collapsed && "justify-center")}
          style={{ color: T.red }}
        >
          <LogOut size={16} />
          {!collapsed && t("logout", "Logout")}
        </button>
      </div>
    </aside>
  );
}
