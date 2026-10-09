import React from "react";
import { T } from "../../utils/theme.js";

export function FormInput({ label, error, required, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-semibold mb-1.5" style={{ color: T.navySoft }}>
          {label} {required && <span style={{ color: T.red }}>*</span>}
        </span>
      )}
      <input
        {...props}
        className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-blue-400"
        style={{ borderColor: error ? T.red : T.border, background: "#fff" }}
      />
      {error && (
        <span className="text-xs mt-1 block" style={{ color: T.red }}>
          {error}
        </span>
      )}
    </label>
  );
}

export function FormSelect({ label, error, required, children, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-semibold mb-1.5" style={{ color: T.navySoft }}>
          {label} {required && <span style={{ color: T.red }}>*</span>}
        </span>
      )}
      <select
        {...props}
        className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none bg-white focus:border-blue-400"
        style={{ borderColor: error ? T.red : T.border }}
      >
        {children}
      </select>
      {error && (
        <span className="text-xs mt-1 block" style={{ color: T.red }}>
          {error}
        </span>
      )}
    </label>
  );
}
