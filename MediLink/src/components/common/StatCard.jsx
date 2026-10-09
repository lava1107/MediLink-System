import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { T } from "../../utils/theme.js";
import { classNames } from "../../utils/format.js";

const TONES = {
  blue: { bg: T.blueTint, fg: T.blue },
  green: { bg: T.greenTint, fg: T.green },
  amber: { bg: T.amberTint, fg: T.amber },
  red: { bg: T.redTint, fg: T.red },
  navy: { bg: "#EEF1F5", fg: T.navy },
};

export default function StatCard({ icon: Icon, label, value, sub, tone = "blue", trend, onClick }) {
  const c = TONES[tone];
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      className={classNames(
        "bg-white rounded-2xl border p-4 flex flex-col gap-3",
        onClick && "cursor-pointer hover:shadow-md hover:border-blue-200 transition-shadow"
      )}
      style={{ borderColor: T.border }}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.bg }}>
          <Icon size={19} style={{ color: c.fg }} />
        </div>
        {trend !== undefined && (
          <div className={classNames("flex items-center gap-0.5 text-xs font-semibold", trend >= 0 ? "text-emerald-600" : "text-red-500")}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight" style={{ color: T.navy }}>
          {value}
        </div>
        <div className="text-[13px] mt-0.5" style={{ color: T.navySoft }}>
          {label}
        </div>
        {sub && (
          <div className="text-[11px] mt-1" style={{ color: "#9AA6B2" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
