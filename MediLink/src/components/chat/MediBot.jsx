import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, X, Send, Bot, Sparkles, AlertTriangle, CheckCircle2,
  ExternalLink, ChevronRight, RefreshCw, Volume2, ShieldCheck,
} from "lucide-react";
import { T } from "../../utils/theme.js";
import { useApp } from "../../hooks/useApp.js";
import { useTranslation } from "../../context/LanguageContext.jsx";
import { analyzePrescriptionSafety } from "../../services/drugSafetyEngine.js";
import { api } from "../../services/api.js";

const DEFAULT_SUGGESTIONS = [
  "Check Dolo 650 stock across branches",
  "Is Paracetamol safe with Ibuprofen?",
  "Where is Human Mixtard Insulin available?",
  "Show expiring medicine batches",
  "What is MediLink's unique feature?",
  "Take me to POS Billing",
];

export default function MediBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "m-0",
      sender: "bot",
      text: "Hello! I am MediBot, your clinical pharmacy & stock assistant. Ask me about medicine stock across Kovilpatti, Tirunelveli, and Madurai, drug-drug interaction warnings, or branch transfers.",
      time: "Just now",
      suggestions: DEFAULT_SUGGESTIONS,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { db } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const botResult = await api.post("/chat", {
        message: query,
        conversationHistory: historyPayload,
      });

      let action = null;
      if (botResult?.action) {
        if (typeof botResult.action.handler === "function") {
          action = botResult.action;
        } else if (botResult.action.path) {
          action = {
            label: botResult.action.label,
            handler: () => navigate(botResult.action.path),
          };
        }
      }

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: botResult?.text || "No response received from MediBot AI.",
          action: action || undefined,
          clinicalBadge: botResult?.clinicalBadge || "Live DB Verified",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      const botResponse = generateBotResponse(query, db, navigate);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: botResponse.text,
          action: botResponse.action,
          clinicalBadge: botResponse.clinicalBadge,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          id="medibot-trigger"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl text-white font-medium hover:scale-105 transition-all group"
          style={{ background: `linear-gradient(135deg, ${T.blue}, #1d4ed8)` }}
          title="Open MediBot Assistant"
        >
          <div className="relative">
            <Bot size={20} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
          </div>
          <span className="text-xs font-semibold tracking-wide hidden sm:inline">Ask MediBot AI</span>
          <Sparkles size={14} className="text-amber-300" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          id="medibot-window"
          className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[400px] h-[550px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{ borderColor: T.border }}
        >
          {/* Header */}
          <div
            className="p-4 text-white flex items-center justify-between shrink-0"
            style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.blueDark})` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  MediBot AI
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-400/30">
                    Online
                  </span>
                </div>
                <div className="text-[11px] text-white/70">Clinical & Stock Intelligence</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: "m-init",
                      sender: "bot",
                      text: "Chat cleared. What can I assist you with?",
                      time: "Just now",
                      suggestions: DEFAULT_SUGGESTIONS,
                    },
                  ])
                }
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white"
                title="Clear Conversation"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 text-white/70 hover:text-white"
                title="Close MediBot"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none shadow-sm"
                      : "bg-white text-slate-800 border rounded-bl-none shadow-sm"
                  }`}
                  style={m.sender === "bot" ? { borderColor: T.border } : {}}
                >
                  {m.clinicalBadge && (
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase mb-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md w-fit">
                      <ShieldCheck size={12} />
                      {m.clinicalBadge}
                    </div>
                  )}

                  <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

                  {m.action && (
                    <button
                      onClick={() => {
                        m.action.handler();
                        setIsOpen(false);
                      }}
                      className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors w-fit text-[11px]"
                    >
                      {m.action.label}
                      <ChevronRight size={13} />
                    </button>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>

                {m.suggestions && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-full">
                    {m.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s)}
                        className="px-2.5 py-1.5 rounded-xl bg-white border text-[11px] text-slate-600 font-medium hover:border-blue-400 hover:text-blue-600 transition-all text-left shadow-2xs"
                        style={{ borderColor: T.border }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 p-2">
                <Bot size={15} />
                <span className="animate-pulse">MediBot is analyzing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t flex items-center gap-2"
            style={{ borderColor: T.border }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about stock, drug interaction, dosage..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border text-xs outline-none focus:border-blue-500 bg-slate-50"
              style={{ borderColor: T.border }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
              style={{ background: T.blue }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function generateBotResponse(rawQuery, db, navigate) {
  const query = rawQuery.toLowerCase();
  const medicines = db?.medicines || [];
  const batches = db?.batches || [];
  const branches = db?.branches || [];

  // 1. Navigation Commands
  if (query.includes("take me to pos") || query.includes("billing") || query.includes("pos billing")) {
    return {
      text: "Opening Point of Sale (POS) Billing module with real-time Prescription verification and Clinical Drug-Drug Interaction safeguards.",
      action: { label: "Go to POS Billing", handler: () => navigate("/sales") },
    };
  }
  if (query.includes("availability") || query.includes("partner shop") || query.includes("partner shops")) {
    return {
      text: "Navigating to Medicine Availability & Inter-Branch Stock Lookup with GPS distance calculations.",
      action: { label: "Open Availability", handler: () => navigate("/availability") },
    };
  }
  if (query.includes("api access") || query.includes("api key") || query.includes("developer")) {
    return {
      text: "Navigating to Developer API Portal with production keys, interactive REST endpoints, and cURL / Python code snippets.",
      action: { label: "Open API Access", handler: () => navigate("/api-access") },
    };
  }

  // 2. Unique Feature Query (Directly answers interview/defense questions)
  if (query.includes("unique feature") || query.includes("resume") || query.includes("crud")) {
    return {
      clinicalBadge: "Resume Showcase",
      text: `MediLink's standout defense features beyond standard CRUD are:\n
1. Automated FIFO Queue & Real WhatsApp Notifications: Dispatches real-time WhatsApp alerts strictly ordered by reservation booking timestamp when new medicine stock arrives.\n
2. Inter-Branch Geo-Stock Exchange: Automated Haversine GPS distance calculation between Kovilpatti, Tirunelveli, and Madurai branches plus 5 registered partner pharmacies for instant emergency reservation.\n
3. Developer REST API: Secured with Bearer JWT & X-API-Key with live interactive sandbox explorer.`,
      action: { label: "Explore API Portal", handler: () => navigate("/api-access") },
    };
  }

  // 3. Clinical Drug-Drug Interaction Safety
  if (
    (query.includes("safe") || query.includes("interaction") || query.includes("together") || query.includes("can i take")) &&
    (query.includes("paracetamol") || query.includes("dolo") || query.includes("crocin") || query.includes("ibuprofen") || query.includes("azithromycin") || query.includes("pantoprazole") || query.includes("metformin"))
  ) {
    if (query.includes("ibuprofen") || query.includes("brufen")) {
      return {
        clinicalBadge: "Clinical Safety Warning",
        text: `⚠️ Moderate Interaction Alert: Paracetamol (Dolo/Crocin) + Ibuprofen (Brufen)\n
• Mechanism: Both medications are antipyretic analgesics. Concomitant dosing without spacing increases renal and hepatic clearance strain.\n
• Pharmacist Protocol: Advise patient to alternate intake (e.g. Paracetamol every 4-6 hours, Ibuprofen only if fever persists after 2 hours with food).`,
      };
    }
    if (query.includes("azithromycin") || query.includes("pantoprazole") || query.includes("antacid")) {
      return {
        clinicalBadge: "Pharmacology Protocol",
        text: `⚠️ Administration Timing Warning: Azithromycin + PPI (Pantoprazole/Omeprazole)\n
• Mechanism: Significant elevation of gastric pH slows macrolide absorption peak.\n
• Pharmacist Protocol: Counsel patient to take Azithromycin 1 hour before or 2 hours following PPI ingestion for maximum bioavailability.`,
      };
    }
  }

  // 4. Specific Medicine Stock Lookup
  const matchedMed = medicines.find(
    (m) =>
      query.includes(m.name.toLowerCase()) ||
      query.includes(m.generic?.toLowerCase()) ||
      (m.brand && query.includes(m.brand.toLowerCase()))
  );

  if (matchedMed) {
    const medBatches = batches.filter((b) => b.medicineId === matchedMed.id && b.status !== "Expired");
    const totalQty = medBatches.reduce((sum, b) => sum + Number(b.available || 0), 0);

    const branchBreakdown = medBatches
      .map((b) => `• ${b.branchName}: ${b.available} units (Rack ${b.rack})`)
      .join("\n");

    return {
      clinicalBadge: "Live Inventory Status",
      text: `📦 Stock Status for ${matchedMed.name} (${matchedMed.generic}):\n\nTotal Network Stock: ${totalQty} units\n${branchBreakdown || "• Currently out of stock at primary branches. Check Partner Shops."}\n\nMRP: ₹${matchedMed.selling_price || matchedMed.selling} | Schedule: ${matchedMed.rx ? "Prescription Only (Rx)" : "OTC General Sale"}`,
      action: { label: `View ${matchedMed.name} Details`, handler: () => navigate(`/medicines/${matchedMed.id}`) },
    };
  }

  // 5. Expiring Batches Query
  if (query.includes("expir") || query.includes("batch")) {
    const expiringSoon = batches.filter((b) => b.status === "Expiring Soon");
    const list = expiringSoon
      .slice(0, 3)
      .map((b) => `• Batch ${b.batchNo}: ${b.medicineName} (${b.available} left at ${b.branchName}, exp: ${b.expiryDate})`)
      .join("\n");

    return {
      clinicalBadge: "Near-Expiry Alert",
      text: `⏳ Currently ${expiringSoon.length} batches expiring within 30 days:\n\n${list || "All batches are in safe validity status."}\n\nPlease prioritize first-expiry-first-out (FEFO) dispensing.`,
      action: { label: "Manage Batches", handler: () => navigate("/batches") },
    };
  }

  // Default intelligent assistant response
  return {
    text: `I've analyzed your query regarding "${rawQuery}".\n\nYou can query real-time stock across Kovilpatti, Tirunelveli, and Madurai, run clinical drug interaction checks, or inspect expiring batches. Try selecting one of the suggested prompts below!`,
    suggestions: DEFAULT_SUGGESTIONS,
  };
}
