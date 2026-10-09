import React from "react";
import { PackageX } from "lucide-react";
import { T } from "../../utils/theme.js";

export default function EmptyState({ icon: Icon = PackageX, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center w-full">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: T.blueTint }}>
        <Icon size={24} style={{ color: T.blue }} />
      </div>
      <div className="font-semibold text-sm" style={{ color: T.navy }}>
        {title}
      </div>
      {sub && (
        <div className="text-xs mt-1" style={{ color: "#9AA6B2" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
