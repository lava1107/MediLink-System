import React from "react";
import { T } from "../../utils/theme.js";
import { classNames } from "../../utils/format.js";

const SIZES = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-5 py-3 text-sm" };
const VARIANTS = {
  primary: { background: T.blue, color: "#fff", border: "1px solid " + T.blue },
  secondary: { background: "#fff", color: T.navy, border: "1px solid " + T.border },
  green: { background: T.green, color: "#fff", border: "1px solid " + T.green },
  danger: { background: "#fff", color: T.red, border: "1px solid " + T.redTint },
  ghost: { background: "transparent", color: T.navySoft, border: "1px solid transparent" },
};

export default function Btn({ children, variant = "primary", size = "md", icon: Icon, onClick, type = "button", disabled }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={VARIANTS[variant]}
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
        SIZES[size]
      )}
    >
      {Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}
