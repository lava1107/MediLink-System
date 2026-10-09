import React from "react";
import { Building2, MapPin } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApp } from "../../hooks/useApp.js";
import { BRANCHES } from "../../data/mockData.js";
import { T } from "../../utils/theme.js";
import { isBranchAll, matchBranch } from "../../utils/branchUtils.js";

export default function BranchTabs({ className = "", compact = false }) {
  const { user, currentBranch, setCurrentBranch } = useAuth();
  const { db } = useApp();

  if (user?.role !== "Admin") return null;

  const branchList = db?.branches?.length > 0 ? db.branches : BRANCHES;
  const isAll = isBranchAll(currentBranch);

  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border ${className}`}
      style={{ borderColor: T.borderSoft }}
    >
      <button
        type="button"
        onClick={() => setCurrentBranch("All")}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
          isAll
            ? "bg-white text-blue-600 shadow-sm border border-slate-200"
            : "text-slate-600 hover:text-slate-900"
        }`}
        title="View unified data across all network branches"
      >
        <Building2 size={12} className={isAll ? "text-blue-600" : "text-slate-400"} />
        All Branches
      </button>

      {branchList.map((b) => {
        const active = !isAll && matchBranch(b.name, currentBranch);
        const shortName = b.name.replace(/\s+(Branch|HQ)$/i, "");
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => setCurrentBranch(b.name)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              active
                ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title={`Filter view exclusively for ${b.name}`}
          >
            <MapPin size={12} className={active ? "text-blue-600" : "text-slate-400"} />
            {shortName}
          </button>
        );
      })}
    </div>
  );
}
