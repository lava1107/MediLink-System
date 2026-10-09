import React, { useState } from "react";
import {
  ShieldAlert, ShieldCheck, AlertTriangle, X, Plus, Trash2, CheckCircle2,
  Info, Sparkles, RefreshCw,
} from "lucide-react";
import { T } from "../../utils/theme.js";
import Modal from "./Modal.jsx";
import Btn from "./Btn.jsx";
import { useApp } from "../../hooks/useApp.js";
import { analyzePrescriptionSafety } from "../../services/drugSafetyEngine.js";

export default function DrugSafetyModal({ isOpen, onClose, initialMedicines = [] }) {
  const { db } = useApp();
  const allMeds = db?.medicines || [];

  const [selectedMeds, setSelectedMeds] = useState(() => {
    if (initialMedicines.length > 0) return initialMedicines;
    // Default 2 medicines that show a realistic interaction demo
    return [
      allMeds.find((m) => m.name.includes("Dolo")) || allMeds[0] || { name: "Dolo 650", generic: "Paracetamol" },
      allMeds.find((m) => m.name.includes("Ibuprofen")) || allMeds[9] || { name: "Ibuprofen 400mg", generic: "Ibuprofen" },
    ];
  });

  const [medSelectValue, setMedSelectValue] = useState("");

  const safetyResult = analyzePrescriptionSafety(selectedMeds);

  const addMed = (med) => {
    if (!med) return;
    if (selectedMeds.some((m) => m.id === med.id || m.name === med.name)) return;
    setSelectedMeds((prev) => [...prev, med]);
  };

  const removeMed = (index) => {
    setSelectedMeds((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Medicine Combination & Safety Checker"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <p className="text-xs text-slate-600 leading-relaxed">
          Pharmacological cross-check evaluating concurrent administration risks, hepatic/renal clearance competition, absorption alteration, and duplicate therapeutic classes.
        </p>

        {/* Medicine Selector */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border" style={{ borderColor: T.border }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700">Add Medicines to Analysis Basket:</span>
          </div>
          <div className="flex gap-2">
            <select
              value={medSelectValue}
              onChange={(e) => {
                const found = allMeds.find((m) => m.id === e.target.value);
                if (found) addMed(found);
                setMedSelectValue("");
              }}
              className="flex-1 px-3 py-2 rounded-xl border text-xs bg-white outline-none focus:border-blue-400"
              style={{ borderColor: T.border }}
            >
              <option value="">-- Choose a medicine from formulary --</option>
              {allMeds.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.generic}) - {m.type}
                </option>
              ))}
            </select>
          </div>

          {/* Selected chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedMeds.map((m, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border text-xs font-medium text-slate-700 shadow-2xs"
                style={{ borderColor: T.border }}
              >
                <span className="font-semibold text-slate-900">{m.name}</span>
                <span className="text-slate-400 text-[11px]">({m.generic || "Active"})</span>
                <button
                  type="button"
                  onClick={() => removeMed(idx)}
                  className="hover:text-red-600 p-0.5"
                  title="Remove"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Safety Score Meter */}
        <div className="p-4 rounded-2xl border flex items-center justify-between bg-white shadow-2xs" style={{ borderColor: T.border }}>
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base ${
                safetyResult.safetyScore >= 80
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : safetyResult.safetyScore >= 50
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {safetyResult.safetyScore}%
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Formulary Safety Index:{" "}
                <span
                  className={
                    safetyResult.safetyScore >= 80
                      ? "text-emerald-600"
                      : safetyResult.safetyScore >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                  }
                >
                  {safetyResult.safetyScore >= 80 ? "Optimal / Safe" : safetyResult.safetyScore >= 50 ? "Caution Advised" : "High Risk Contraindication"}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {selectedMeds.length} active agent(s) evaluated against clinical pharmacology database.
              </div>
            </div>
          </div>
        </div>

        {/* Results & Warnings */}
        <div className="space-y-3">
          {safetyResult.allIssues.length === 0 ? (
            <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-center text-xs">
              <CheckCircle2 size={24} className="mx-auto mb-1.5 text-emerald-600" />
              <div className="font-bold text-sm">No Known Adverse Interactions Found</div>
              <p className="mt-1 text-emerald-700/80 text-[11px]">
                The selected drug combination has independent clearance routes and does not violate safe co-dispensing guidelines.
              </p>
            </div>
          ) : (
            safetyResult.allIssues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border text-xs ${
                  issue.severity === "Critical"
                    ? "bg-red-50/80 border-red-200 text-red-900"
                    : "bg-amber-50/80 border-amber-200 text-amber-900"
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {issue.severity === "Critical" ? (
                    <ShieldAlert size={16} className="text-red-600 shrink-0" />
                  ) : (
                    <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  )}
                  <span>{issue.title}</span>
                  <span
                    className={`ml-auto text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      issue.severity === "Critical" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>
                <p className="mt-1 leading-relaxed opacity-90">{issue.description}</p>
                <div className="mt-2 pt-2 border-t border-black/10 font-medium">
                  <span className="font-bold">Pharmacist Recommendation:</span> {issue.recommendation}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="outline" size="sm" onClick={onClose}>
            Close
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
