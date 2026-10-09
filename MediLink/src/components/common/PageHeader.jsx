import React from "react";
import { ChevronRight } from "lucide-react";
import { T } from "../../utils/theme.js";

export default function PageHeader({ title, subtitle, crumbs, action }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
      <div>
        {crumbs && (
          <div className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "#9AA6B2" }}>
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={12} />}
                <span className={i === crumbs.length - 1 ? "font-semibold" : ""} style={i === crumbs.length - 1 ? { color: T.blue } : {}}>
                  {c}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="text-[22px] font-bold" style={{ color: T.navy }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: T.navySoft }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 flex-wrap">{action}</div>}
    </div>
  );
}
