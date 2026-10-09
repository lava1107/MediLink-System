import React from "react";
import { CircleAlert, CheckCircle2 } from "lucide-react";
import { T } from "../../utils/theme.js";

export default function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fadeIn"
          style={{ background: t.type === "error" ? T.red : T.navy, color: "#fff", minWidth: 260 }}
        >
          {t.type === "error" ? <CircleAlert size={16} /> : <CheckCircle2 size={16} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
