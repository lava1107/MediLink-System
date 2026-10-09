import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu, Search, Building, Bell, ChevronDown, ChevronRight, Settings,
  Clock, Languages, KeyRound, ShieldCheck, Trash2, ArrowUpRight,
  Sun, Moon, Mail, User, Palette, Check,
} from "lucide-react";
import { T } from "../../utils/theme.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useApp } from "../../hooks/useApp.js";
import { BRANCHES } from "../../data/mockData.js";
import { useTranslation } from "../../context/LanguageContext.jsx";
import { useRecent } from "../../context/RecentContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { api } from "../../services/api.js";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  users: "Users",
  branches: "Branches",
  medicines: "Medicines",
  categories: "Categories",
  batches: "Medicine Batches",
  suppliers: "Suppliers",
  purchases: "Purchases",
  sales: "Sales & Billing",
  prescriptions: "Prescriptions",
  customers: "Customers",
  reservations: "Reservations",
  availability: "Medicine Availability",
  partners: "Partner Medical Shops",
  reports: "Reports",
  communication: "Communication Hub",
  notifications: "Notifications",
  settings: "Settings",
  "api-access": "API Access",
};

export default function Navbar({ toggleSidebar }) {
  const { user, currentBranch, setCurrentBranch } = useAuth();
  const { db, notifications = [], markAllRead } = useApp() || {};
  const { t, lang, setLang, languages = [] } = useTranslation();
  const { recentItems = [], clearRecent } = useRecent() || {};
  const {
    theme,
    isDark,
    toggleTheme,
    colorTheme,
    setColorTheme,
    colorThemes,
    activePalette,
  } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);

  const segment = location.pathname.split("/").filter(Boolean)[0] || "dashboard";
  const rawTitle = PAGE_TITLES[segment] || "MediLink";
  const pageTitle = t(segment, rawTitle);
  const unread = Array.isArray(notifications) ? notifications.filter((n) => !n.read).length : 0;

  return (
    <header className="h-16 sticky top-0 z-30 bg-white border-b flex items-center px-5 gap-4" style={{ borderColor: T.border }}>
      <button onClick={toggleSidebar} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100">
        <Menu size={16} />
      </button>
      <div className="flex items-center gap-1.5 text-xs" style={{ color: "#9AA6B2" }}>
        <span>MediLink</span>
        <ChevronRight size={12} />
        <span className="font-semibold" style={{ color: T.navy }}>
          {pageTitle}
        </span>
      </div>

      <div className="relative flex-1 max-w-sm ml-4 hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AA6B2" }} />
        <input
          placeholder="Search medicines, customers, bills..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none focus:border-blue-400"
          style={{ borderColor: T.border, background: T.bg }}
        />
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {user?.role === "Admin" && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: T.blueTint, color: T.blue }}>
            <Building size={13} />
            <select value={currentBranch} onChange={(e) => setCurrentBranch(e.target.value)} className="bg-transparent outline-none font-semibold cursor-pointer" style={{ color: T.blue }}>
              <option value="All">All Branches</option>
              {(db?.branches || BRANCHES).map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {user?.role === "Pharmacist" && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: T.blueTint, color: T.blue }}>
            <Building size={13} /> {user?.branch || "Branch"}
          </div>
        )}

        {/* Recently Accessed Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRecent((v) => !v);
              setShowNotif(false);
              setShowProfile(false);
              setShowLangMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            style={{ borderColor: T.border }}
            title="Recently Accessed Records"
          >
            <Clock size={14} className="text-slate-500" />
            <span className="hidden md:inline">{t("recentItems", "Recent")}</span>
            {recentItems.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                {recentItems.length}
              </span>
            )}
          </button>
          {showRecent && (
            <div
              className="absolute right-0 top-11 w-80 bg-white rounded-2xl border shadow-xl z-40 overflow-hidden"
              style={{ borderColor: T.border }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: T.border }}>
                <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-600" />
                  {t("recentItems", "Recently Accessed")}
                </span>
                {recentItems.length > 0 && (
                  <button
                    onClick={clearRecent}
                    className="text-[11px] font-medium text-slate-400 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 size={11} /> {t("clearRecent", "Clear")}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: T.borderSoft }}>
                {recentItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    {t("noRecent", "No recently accessed records yet")}
                  </div>
                ) : (
                  recentItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        navigate(item.path);
                        setShowRecent(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {item.type}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600">
                            {item.title}
                          </span>
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                      <ArrowUpRight size={13} className="text-slate-300 group-hover:text-blue-600 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Multi-lingual Language Selector (Translates Entire Website) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLangMenu((v) => !v);
              setShowNotif(false);
              setShowProfile(false);
              setShowRecent(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            style={{ borderColor: T.border }}
            title="Translate Entire Website"
          >
            <Languages size={14} className="text-blue-600" />
            <span>{languages.find((l) => l.code === lang)?.short || "EN"}</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>
          {showLangMenu && (
            <div
              className="absolute right-0 top-11 w-56 bg-white rounded-2xl border shadow-2xl z-40 overflow-hidden py-1.5"
              style={{ borderColor: T.border }}
            >
              <div className="px-3.5 py-2 border-b bg-slate-50/70" style={{ borderColor: T.border }}>
                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <Languages size={13} className="text-blue-600" />
                  <span>Translate Entire Website</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Translates every page & letter in real-time
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      lang === l.code ? "font-bold text-blue-600 bg-blue-50/60" : "text-slate-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{l.flag}</span>
                      <span>{l.label}</span>
                    </span>
                    {lang === l.code && <span className="w-2 h-2 rounded-full bg-blue-600 shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>


        {/* 5 Color Theme Pairs / Groups Quick Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowColorMenu((v) => !v);
              setShowNotif(false);
              setShowProfile(false);
              setShowRecent(false);
              setShowLangMenu(false);
            }}
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ borderColor: T.border }}
            title={`Active Color Theme: ${activePalette?.name} (Click to switch between 5 pairs)`}
            aria-label="Select Color Theme"
          >
            <div className="flex items-center -space-x-1">
              <span
                className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs"
                style={{ backgroundColor: activePalette?.pair[0] || "#1D6FA5" }}
              />
              <span
                className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs"
                style={{ backgroundColor: activePalette?.pair[1] || "#132335" }}
              />
            </div>
          </button>
          {showColorMenu && (
            <div
              className="absolute right-0 top-11 w-64 bg-white rounded-2xl border shadow-xl z-40 overflow-hidden py-1.5"
              style={{ borderColor: T.border }}
            >
              <div
                className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b flex items-center justify-between"
                style={{ borderColor: T.border }}
              >
                <span>5 Color Themes (Pairs)</span>
                <span className="font-mono text-[9px] lowercase text-blue-600">group palettes</span>
              </div>
              {(colorThemes || []).map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => {
                    setColorTheme(ct.id);
                    setShowColorMenu(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    colorTheme === ct.id ? "font-bold text-blue-600 bg-blue-50/50" : "text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center -space-x-1 shrink-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                        style={{ backgroundColor: ct.pair[0] }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                        style={{ backgroundColor: ct.pair[1] }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-xs text-slate-800">{ct.name}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{ct.subtitle}</div>
                    </div>
                  </div>
                  {colorTheme === ct.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl border flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ borderColor: T.border }}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun size={16} className="text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon size={16} className="text-slate-600 transition-transform hover:-rotate-12" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setShowNotif((v) => !v);
              setShowProfile(false);
              setShowRecent(false);
              setShowLangMenu(false);
            }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100"
          >
            <Bell size={17} style={{ color: T.navySoft }} />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: T.red }} />}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl border shadow-xl z-40 overflow-hidden" style={{ borderColor: T.border }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: T.border }}>
                <span className="font-semibold text-sm" style={{ color: T.navy }}>
                  Notifications
                </span>
                <button onClick={markAllRead} className="text-xs font-semibold" style={{ color: T.blue }}>
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 6).map((n) => (
                  <div key={n.id} className="px-4 py-3 border-b flex gap-2.5" style={{ borderColor: T.borderSoft, background: n.read ? "#fff" : T.blueTint2 }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: n.read ? "#D1D9E0" : T.blue }} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: T.navy }}>
                        {n.title}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "#9AA6B2" }}>
                        {n.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  navigate("/notifications");
                  setShowNotif(false);
                }}
                className="w-full py-2.5 text-xs font-semibold hover:bg-slate-50"
                style={{ color: T.blue }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowProfile((v) => !v);
              setShowNotif(false);
              setShowRecent(false);
              setShowLangMenu(false);
            }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-white" style={{ background: T.blue }}>
              {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <ChevronDown size={14} style={{ color: T.navySoft }} />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-11 w-56 bg-white rounded-2xl border shadow-xl z-40 overflow-hidden py-1.5" style={{ borderColor: T.border }}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: T.border }}>
                <div className="text-xs font-semibold" style={{ color: T.navy }}>
                  {user.name}
                </div>
                <div className="text-[11px]" style={{ color: "#9AA6B2" }}>
                  {user.email}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    JWT Session Active
                  </span>
                  {user.oauthProvider && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">
                      {user.oauthProvider}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  navigate("/settings?tab=profile");
                  setShowProfile(false);
                }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <User size={13} className="text-blue-600" /> My Profile
              </button>
              <button
                onClick={() => {
                  navigate("/api-access");
                  setShowProfile(false);
                }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <KeyRound size={13} className="text-blue-600" /> Developer API Portal
              </button>
              <button
                onClick={() => {
                  navigate("/communication");
                  setShowProfile(false);
                }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <Mail size={13} className="text-emerald-600" /> Communication Hub
              </button>
              <button
                onClick={() => {
                  navigate("/settings");
                  setShowProfile(false);
                }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2"
                style={{ color: T.navySoft }}
              >
                <Settings size={13} /> Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
