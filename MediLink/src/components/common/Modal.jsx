import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { T } from "../../utils/theme.js";
import { classNames } from "../../utils/format.js";
import Btn from "./Btn.jsx";

export default function Modal({ open, onClose, title, children, width = "max-w-2xl", footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(19,35,53,0.45)" }}>
      <div className={classNames("bg-white rounded-2xl w-full max-h-[88vh] flex flex-col shadow-2xl", width)}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: T.border }}>
          <h3 className="font-bold text-base" style={{ color: T.navy }}>
            {title}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
            <X size={17} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: T.border }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-sm"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant={danger ? "danger" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirm
          </Btn>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: danger ? T.redTint : T.blueTint }}>
          <AlertTriangle size={18} style={{ color: danger ? T.red : T.blue }} />
        </div>
        <p className="text-sm" style={{ color: T.navySoft }}>
          {message}
        </p>
      </div>
    </Modal>
  );
}
