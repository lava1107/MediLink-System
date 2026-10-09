import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { T } from "../../utils/theme.js";
import { addDays } from "../../utils/format.js";
import { TODAY, BRANCHES } from "../../data/mockData.js";
import { useApp } from "../../hooks/useApp.js";
import { REPORT_DEFINITIONS, REPORT_COLUMNS, buildReportRows } from "../../services/reportService.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Btn from "../../components/common/Btn.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";

export default function ReportDetailPage() {
  const { key } = useParams();
  const navigate = useNavigate();
  const { db, toast } = useApp();
  const [branchFilter, setBranchFilter] = useState("All");
  const [from, setFrom] = useState(addDays(TODAY, -30));
  const [to, setTo] = useState(TODAY);

  const def = REPORT_DEFINITIONS.find((r) => r.key === key);
  if (!def) {
    return (
      <div>
        <button onClick={() => navigate("/reports")} className="flex items-center gap-1.5 text-xs font-semibold mb-4" style={{ color: T.blue }}>
          <ArrowLeft size={14} /> Back to Reports
        </button>
        <EmptyState title="Report not found" />
      </div>
    );
  }

  let rows = buildReportRows(key, db);
  if (branchFilter !== "All") rows = rows.filter((r) => r.cols.includes(branchFilter));
  const columns = REPORT_COLUMNS[key];

  return (
    <div>
      <button onClick={() => navigate("/reports")} className="flex items-center gap-1.5 text-xs font-semibold mb-4" style={{ color: T.blue }}>
        <ArrowLeft size={14} /> Back to Reports
      </button>
      <PageHeader
        title={def.name}
        subtitle={def.desc}
        crumbs={["MediLink", "Reports", def.name]}
        action={
          <>
            <Btn variant="secondary" size="sm" icon={Printer} onClick={() => toast("Print preview would open here.")}>
              Print
            </Btn>
            <Btn variant="secondary" size="sm" icon={Download} onClick={() => toast("Exporting as PDF...")}>
              Export PDF
            </Btn>
            <Btn variant="secondary" size="sm" icon={Download} onClick={() => toast("Exporting as Excel...")}>
              Export Excel
            </Btn>
          </>
        }
      />
      <div className="bg-white rounded-2xl border p-4 mb-4 flex flex-wrap items-end gap-3" style={{ borderColor: T.border }}>
        <FormInput label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <FormInput label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <FormSelect label="Branch" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option>All</option>
          {BRANCHES.map((b) => (
            <option key={b.id}>{b.name}</option>
          ))}
        </FormSelect>
      </div>
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.border }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: T.blueTint2 }}>
              {columns.map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-semibold" style={{ color: T.navySoft }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t" style={{ borderColor: T.borderSoft }}>
                {r.cols.map((c, i) => (
                  <td key={i} className="px-4 py-2.5" style={{ color: i === 0 ? T.navy : T.navySoft, fontWeight: i === 0 ? 600 : 400 }}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title="No data for this report" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
