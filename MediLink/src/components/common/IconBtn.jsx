import React from "react";
import { T } from "../../utils/theme.js";

const TONES = { default: T.navySoft, blue: T.blue, red: T.red, green: T.green };

export default function IconBtn({ icon: Icon, onClick, tone = "default", title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
      style={{ color: TONES[tone] }}
    >
      <Icon size={15} />
    </button>
  );
}
