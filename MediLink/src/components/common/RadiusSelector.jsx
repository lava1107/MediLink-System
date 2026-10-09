import React from "react";
import { T } from "../../utils/theme.js";

// Reusable pill-button radius selector used by Medicine Availability for both
// the "nearby branches" and "nearby partner shops" distance filters.
export default function RadiusSelector({ label, value, options, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {label && (
        <span className="text-xs font-semibold" style={{ color: T.navySoft }}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        {options.map((km) => (
          <button
            key={km}
            type="button"
            onClick={() => onChange(km)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: value === km ? T.blue : "#fff",
              color: value === km ? "#fff" : T.navySoft,
              border: `1px solid ${value === km ? T.blue : T.border}`,
            }}
          >
            {km} km
          </button>
        ))}
      </div>
    </div>
  );
}
