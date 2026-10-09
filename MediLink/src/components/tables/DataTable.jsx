import React, { useEffect, useMemo, useState } from "react";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { T } from "../../utils/theme.js";
import { classNames } from "../../utils/format.js";
import EmptyState from "../common/EmptyState.jsx";

export default function DataTable({
  columns,
  data,
  searchKeys = [],
  filters = [],
  onRowClick,
  pageSize = 8,
  actions,
  emptyTitle = "No records found",
  emptySub,
}) {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)));
    }
    Object.entries(activeFilters).forEach(([key, val]) => {
      if (val && val !== "All") rows = rows.filter((r) => String(r[key]) === val);
    });
    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return rows;
  }, [data, query, activeFilters, sortKey, sortDir, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, activeFilters]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.border }}>
      <div className="flex items-center gap-2.5 p-4 border-b flex-wrap" style={{ borderColor: T.border }}>
        {searchKeys.length > 0 && (
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AA6B2" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none focus:border-blue-400"
              style={{ borderColor: T.border }}
            />
          </div>
        )}
        {filters.map((f) => (
          <select
            key={f.key}
            value={activeFilters[f.key] || "All"}
            onChange={(e) => setActiveFilters((af) => ({ ...af, [f.key]: e.target.value }))}
            className="px-3 py-2 rounded-xl border text-sm bg-white outline-none"
            style={{ borderColor: T.border, color: T.navySoft }}
          >
            <option value="All">
              {f.label}: All
            </option>
            {f.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ))}
        {(searchKeys.length > 0 || filters.length > 0) && (
          <span className="text-xs ml-auto shrink-0" style={{ color: "#9AA6B2" }}>
            {filtered.length} results
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: T.blueTint2 }}>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => c.sortable && toggleSort(c.key)}
                  className={classNames("text-left px-4 py-3 font-semibold whitespace-nowrap", c.sortable && "cursor-pointer select-none")}
                  style={{ color: T.navySoft, fontSize: 12, letterSpacing: 0.2 }}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {c.sortable && <ArrowUpDown size={11} className={sortKey === c.key ? "opacity-100" : "opacity-30"} />}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="text-right px-4 py-3 font-semibold" style={{ color: T.navySoft, fontSize: 12 }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr
                key={row.id || ri}
                onClick={() => onRowClick && onRowClick(row)}
                className={classNames("border-t hover:bg-slate-50 transition-colors", onRowClick && "cursor-pointer")}
                style={{ borderColor: T.borderSoft }}
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 whitespace-nowrap" style={{ color: T.navy }}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {pageRows.length === 0 && <EmptyState title={emptyTitle} sub={emptySub} />}
      </div>
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs" style={{ borderColor: T.border, color: "#9AA6B2" }}>
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-30"
              style={{ borderColor: T.border }}
            >
              <ChevronLeft size={13} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-30"
              style={{ borderColor: T.border }}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
