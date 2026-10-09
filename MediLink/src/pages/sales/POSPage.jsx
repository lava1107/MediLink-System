import React, { useState } from "react";
import {
  Search,
  X,
  Trash2,
  Plus,
  ShoppingCart,
  Banknote,
  CreditCard,
  Smartphone,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  History,
} from "lucide-react";
import { useApp } from "../../hooks/useApp.js";
import { useAuth } from "../../hooks/useAuth.js";
import { createSale } from "../../services/salesService.js";
import { generateInvoicePdf } from "../../utils/invoicePdf.js";
import { findPrescription, createPrescription, verifyPrescription, rejectPrescription } from "../../services/prescriptionService.js";
import { createCustomer } from "../../services/customerService.js";
import { medicineStock } from "../../services/medicineService.js";
import { formatCurrency, formatDate, pad } from "../../utils/format.js";
import { T } from "../../utils/theme.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Btn from "../../components/common/Btn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput } from "../../components/common/FormControls.jsx";
import PrescriptionStatusBadge from "../../components/common/PrescriptionStatusBadge.jsx";
import PrescriptionVerificationModal from "../../components/prescriptions/PrescriptionVerificationModal.jsx";
import DrugSafetyModal from "../../components/common/DrugSafetyModal.jsx";
import { analyzePrescriptionSafety } from "../../services/drugSafetyEngine.js";

export default function POSPage() {
  const { user, currentBranch } = useAuth();
  const { db, setDb, toast } = useApp();
  const activeBranch = user?.role === "Admin" ? currentBranch : (user?.branch || "Kovilpatti Branch");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [safetyOverride, setSafetyOverride] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customer, setCustomer] = useState(null);
  const [payment, setPayment] = useState("Cash");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", address: "" });
  const [billSuccessModal, setBillSuccessModal] = useState(null);

  // Prescription verification (gates Generate Bill for Rx-required cart items)
  const [rxRecordModal, setRxRecordModal] = useState(null); // { item } -> shows "create prescription record" form
  const [rxVerifyRecord, setRxVerifyRecord] = useState(null); // existing prescription being verified/rejected
  const [rxDraft, setRxDraft] = useState({ doctorName: "", prescriptionDate: "", prescriptionRef: "" });

  const billingCustomerName = customer?.name || "Walk-in Customer";

  function prescriptionFor(item) {
    return findPrescription(db.prescriptions, billingCustomerName, item.name);
  }

  function openPrescriptionCheck(item) {
    const existing = prescriptionFor(item);
    if (existing) {
      setRxVerifyRecord(existing);
    } else {
      setRxDraft({ doctorName: "", prescriptionDate: "", prescriptionRef: "" });
      setRxRecordModal({ item });
    }
  }

  async function saveRxRecord() {
    if (!rxDraft.doctorName || !rxDraft.prescriptionDate || !rxDraft.prescriptionRef) {
      toast("Fill in doctor name, prescription date and reference number.", "error");
      return;
    }
    const item = rxRecordModal.item;
    const updated = await createPrescription(db.prescriptions, {
      customerId: customer?.id || "",
      customerName: billingCustomerName,
      medicine: item.name,
      quantity: item.qty,
      doctorName: rxDraft.doctorName,
      prescriptionDate: rxDraft.prescriptionDate,
      prescriptionRef: rxDraft.prescriptionRef,
    });
    setDb((d) => ({ ...d, prescriptions: updated }));
    setRxRecordModal(null);
    setRxVerifyRecord(updated[0]);
  }

  async function handleRxVerify(id, remarks) {
    const updated = await verifyPrescription(db.prescriptions, id, user.name, remarks);
    setDb((d) => ({ ...d, prescriptions: updated }));
    toast("Prescription verified. This medicine can now be billed.");
    setRxVerifyRecord(null);
  }
  async function handleRxReject(id, remarks) {
    const updated = await rejectPrescription(db.prescriptions, id, user.name, remarks);
    setDb((d) => ({ ...d, prescriptions: updated }));
    toast("Prescription rejected. This medicine cannot be billed.", "error");
    setRxVerifyRecord(null);
  }

  const allAvailableBatches = (db.batches || []).filter(
    (b) => b.status !== "Expired" && Number(b.available) > 0
  );

  const medOptions = (db.medicines || [])
    .filter((m) => medicineStock(m, db.batches) > 0)
    .filter(
      (m) =>
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.generic.toLowerCase().includes(search.toLowerCase()) ||
        m.brand.toLowerCase().includes(search.toLowerCase())
    );

  function addToCart(med) {
    const medBatches = allAvailableBatches
      .filter((b) => b.medicineId === med.id || b.medicine_id === med.id)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    // Prefer batch at current branch if available, else pick earliest-expiry batch from any branch
    const batch = medBatches.find((b) => b.branchName === activeBranch || b.branch_name === activeBranch) || medBatches[0];

    if (!batch) {
      toast("No available (non-expired) batch for this medicine.", "error");
      return;
    }
    setCart((c) => {
      const existing = c.find((i) => i.batchId === batch.id);
      if (existing) {
        if (existing.qty + 1 > batch.available) {
          toast("Cannot exceed available batch quantity.", "error");
          return c;
        }
        return c.map((i) => (i.batchId === batch.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...c,
        {
          batchId: batch.id,
          medicineId: med.id,
          name: med.name,
          rx: med.rx,
          batchNo: batch.batchNo,
          price: batch.sellingPrice || med.selling,
          gst: med.gst,
          qty: 1,
          maxQty: batch.available,
          discount: 0,
          rack: batch.rack,
        },
      ];
    });
  }
  function updateQty(batchId, qty) {
    setCart((c) =>
      c.map((i) => {
        if (i.batchId !== batchId) return i;
        const q = Math.max(1, Math.min(qty, i.maxQty));
        if (qty > i.maxQty) toast("Sale quantity cannot exceed available batch quantity.", "error");
        return { ...i, qty: q };
      })
    );
  }
  function removeItem(batchId) {
    setCart((c) => c.filter((i) => i.batchId !== batchId));
  }

  const rxBlockedItems = cart.filter((i) => i.rx && prescriptionFor(i)?.status !== "Verified");
  const billingBlocked = rxBlockedItems.length > 0;

  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const discount = cart.reduce((a, i) => a + (i.price * i.qty * i.discount) / 100, 0);
  const gst = cart.reduce((a, i) => a + ((i.price * i.qty - (i.price * i.qty * i.discount) / 100) * i.gst) / 100, 0);
  const grandTotal = subtotal - discount + gst;

  const customerResults = customerQuery ? db.customers.filter((c) => c.name.toLowerCase().includes(customerQuery.toLowerCase()) || c.phone.includes(customerQuery)) : [];

  async function createCustomerRecord() {
    if (!newCustomer.name || !newCustomer.phone) {
      toast("Name and phone are required.", "error");
      return;
    }
    try {
      const c = await createCustomer({ ...newCustomer, email: "", rxRef: "-" });
      setDb((d) => ({ ...d, customers: [...d.customers, c] }));
      setCustomer(c);
      setShowNewCustomer(false);
      toast("Customer added.");
    } catch (err) {
      toast(err.message || "Failed to add customer.", "error");
    }
  }

  async function generateBill() {
    if (cart.length === 0) {
      toast("Add at least one item to the cart.", "error");
      return;
    }
    if (billingBlocked) {
      toast("One or more items require a verified prescription before billing.", "error");
      return;
    }
    try {
      const result = await createSale(db, {
        cart,
        customerName: customer?.name,
        branch: activeBranch,
        pharmacistName: user.name,
        payment,
        grandTotal,
      });
      setDb((d) => ({
        ...d,
        sales: result.sales,
        batches: result.batches,
        medicines: result.medicines || d.medicines,
      }));
      const newSale = result.sales[0];
      toast(`Bill ${newSale.bill} generated successfully.`);

      // Build a real, downloadable PDF invoice for this sale.
      const branchObj = (db.branches || []).find((b) => b.name === activeBranch || b.id === activeBranch) || {
        name: activeBranch,
        address: "12, VOC Street, Bus Stand Road",
        city: "Kovilpatti",
        phone: "+91 98421 30221",
        email: "kovilpatti@medilink.in",
      };

      const invoiceItems = cart.map((i) => {
        const med = (db.medicines || []).find((m) => m.id === i.medicineId);
        const batch = (db.batches || []).find((b) => b.id === i.batchId);
        const lineSubtotal = i.price * i.qty;
        const lineDiscount = (lineSubtotal * (i.discount || 0)) / 100;
        const lineGst = ((lineSubtotal - lineDiscount) * (i.gst || 12)) / 100;
        return {
          name: i.name,
          generic: med?.generic || "",
          batchNo: i.batchNo,
          expiryDate: batch?.expiryDate,
          qty: i.qty,
          price: i.price,
          discount: i.discount || 0,
          gst: i.gst || 12,
          lineTotal: lineSubtotal - lineDiscount + lineGst,
        };
      });

      let pdfResult = null;
      try {
        pdfResult = generateInvoicePdf({
          sale: newSale,
          branch: branchObj,
          customerName: billingCustomerName,
          items: invoiceItems,
          subtotal,
          discount,
          gst,
          grandTotal,
        });
        toast(`Invoice PDF generated & downloaded: ${pdfResult.filename}`, "success");
      } catch (pdfErr) {
        console.error("PDF generation error:", pdfErr);
        toast(`Bill created, but PDF download failed: ${pdfErr.message}`, "error");
      }

      setBillSuccessModal({
        sale: newSale,
        branch: branchObj,
        customerName: billingCustomerName,
        items: invoiceItems,
        subtotal,
        discount,
        gst,
        grandTotal,
        pdfResult,
      });

      setCart([]);
      setCustomer(null);
      setCustomerQuery("");
    } catch (err) {
      toast(err.message || "Failed to generate bill.", "error");
    }
  }

  function handleReprintPdf(s) {
    const branchObj = (db.branches || []).find((b) => b.name === s.branch || b.id === s.branch) || {
      name: s.branch || activeBranch,
      address: "12, VOC Street, Bus Stand Road",
      city: "Kovilpatti",
      phone: "+91 98421 30221",
      email: "kovilpatti@medilink.in",
    };
    const items = s.items && s.items.length > 0 ? s.items : [
      {
        name: "Prescription Item (" + (s.bill || "Medicine") + ")",
        generic: "Pharmaceutical Formulation",
        batchNo: "BT-2026",
        expiryDate: "2027-12-31",
        qty: 1,
        price: Number(s.amount || s.total || 0),
        discount: Number(s.discount || 0),
        gst: Number(s.gst || 0),
        lineTotal: Number(s.amount || s.total || 0),
      },
    ];
    try {
      const res = generateInvoicePdf({
        sale: s,
        branch: branchObj,
        customerName: s.customer || "Walk-in Customer",
        items,
        subtotal: s.subtotal || s.amount,
        discount: s.discount || 0,
        gst: s.gst || 0,
        grandTotal: s.amount,
      });
      toast(`Downloaded Invoice: ${res.filename}`, "success");
    } catch (err) {
      toast(`PDF reprint failed: ${err.message}`, "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Sales & Billing"
        subtitle={`Point of Sale · ${activeBranch}`}
        crumbs={["MediLink", "Sales & Billing"]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-white rounded-2xl border p-5" style={{ borderColor: T.border }}>
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AA6B2" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by medicine name, generic, brand or barcode..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-400"
              style={{ borderColor: T.border }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
            {medOptions.map((m) => {
              const medBatches = allAvailableBatches.filter((b) => b.medicineId === m.id || b.medicine_id === m.id);
              const batch = medBatches.find((b) => b.branchName === activeBranch || b.branch_name === activeBranch) || medBatches[0];
              const availStock = medicineStock(m, db.batches);
              return (
                <button
                  key={m.id}
                  onClick={() => addToCart(m)}
                  className="text-left p-3.5 rounded-xl border hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
                  style={{ borderColor: T.border }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: T.navy }}>
                        {m.name}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "#9AA6B2" }}>
                        {m.generic} · {m.strength}
                      </div>
                    </div>
                    {m.rx && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: T.redTint, color: T.red }}>
                        Rx
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="font-bold text-sm" style={{ color: T.blue }}>
                      {formatCurrency(batch?.sellingPrice)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {batch?.rack && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          📍 {batch.rack}
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                          availStock > 20
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : availStock > 0
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-red-50 text-red-800 border-red-200"
                        }`}
                      >
                        Avail: {availStock}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {medOptions.length === 0 && (
              <div className="col-span-2">
                <EmptyState title="No medicines match your search" sub="Try a different name or check Medicine Availability" />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border p-5 flex flex-col" style={{ borderColor: T.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: T.navy }}>
            Customer
          </h3>
          {customer ? (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-4" style={{ background: T.blueTint }}>
              <div>
                <div className="text-xs font-semibold" style={{ color: T.navy }}>
                  {customer.name}
                </div>
                <div className="text-[11px]" style={{ color: T.navySoft }}>
                  {customer.phone}
                </div>
              </div>
              <button onClick={() => setCustomer(null)}>
                <X size={14} style={{ color: T.navySoft }} />
              </button>
            </div>
          ) : (
            <div className="mb-4">
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AA6B2" }} />
                <input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Search existing customer..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border text-xs outline-none"
                  style={{ borderColor: T.border }}
                />
              </div>
              {customerResults.length > 0 && (
                <div className="border rounded-xl overflow-hidden mb-2" style={{ borderColor: T.border }}>
                  {customerResults.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCustomer(c);
                        setCustomerQuery("");
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b last:border-b-0"
                      style={{ borderColor: T.borderSoft, color: T.navy }}
                    >
                      {c.name} <span style={{ color: "#9AA6B2" }}>· {c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setShowNewCustomer(true)} className="text-xs font-semibold flex items-center gap-1" style={{ color: T.blue }}>
                <Plus size={12} /> Add new customer
              </button>
            </div>
          )}

          <h3 className="font-bold text-sm mb-2" style={{ color: T.navy }}>
            Cart ({cart.length})
          </h3>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-4 max-h-[260px]">
            {cart.map((i) => {
              const rxRecord = i.rx ? prescriptionFor(i) : null;
              return (
                <div key={i.batchId} className="border rounded-xl p-2.5" style={{ borderColor: T.borderSoft }}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: T.navy }}>
                        {i.name}
                      </div>
                      <div className="text-[10px] flex items-center gap-1.5 flex-wrap" style={{ color: "#9AA6B2" }}>
                        <span>Batch {i.batchNo} · {formatCurrency(i.price)}</span>
                        {i.rack && (
                          <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            📍 {i.rack}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => updateQty(i.batchId, i.qty - 1)} className="w-6 h-6 rounded-md border flex items-center justify-center text-xs" style={{ borderColor: T.border }}>
                        -
                      </button>
                      <span className="text-xs font-semibold w-4 text-center">{i.qty}</span>
                      <button onClick={() => updateQty(i.batchId, i.qty + 1)} className="w-6 h-6 rounded-md border flex items-center justify-center text-xs" style={{ borderColor: T.border }}>
                        +
                      </button>
                      <button onClick={() => removeItem(i.batchId)}>
                        <Trash2 size={13} style={{ color: T.red }} />
                      </button>
                    </div>
                  </div>
                  {i.rx && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: T.borderSoft }}>
                      {rxRecord ? (
                        <PrescriptionStatusBadge status={rxRecord.status} compact />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: T.amberTint, color: T.amber }}>
                          <AlertTriangle size={13} /> Prescription Required
                        </span>
                      )}
                      <button onClick={() => openPrescriptionCheck(i)} className="text-[11px] font-semibold" style={{ color: T.blue }}>
                        {rxRecord ? "View / Verify" : "Add Prescription"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {cart.length === 0 && <EmptyState icon={ShoppingCart} title="Cart is empty" sub="Select medicines from the left panel" />}
          </div>

          <div className="flex flex-col gap-1.5 text-xs mb-3 pt-3 border-t" style={{ borderColor: T.border }}>
            <div className="flex justify-between">
              <span style={{ color: T.navySoft }}>Subtotal</span>
              <span style={{ color: T.navy }}>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: T.navySoft }}>Discount</span>
              <span style={{ color: T.red }}>-{formatCurrency(discount)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: T.navySoft }}>GST</span>
              <span style={{ color: T.navy }}>+{formatCurrency(gst)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1.5 border-t" style={{ borderColor: T.border, color: T.navy }}>
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              ["Cash", Banknote],
              ["Card", CreditCard],
              ["UPI", Smartphone],
            ].map(([label, Icon]) => (
              <button
                key={label}
                onClick={() => setPayment(label)}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium"
                style={{ borderColor: payment === label ? T.blue : T.border, background: payment === label ? T.blueTint : "#fff", color: payment === label ? T.blue : T.navySoft }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="secondary" onClick={() => setCart([])}>
              Clear Cart
            </Btn>
            <Btn variant="secondary" onClick={() => toast("Bill held for later.")}>
              Hold Bill
            </Btn>
          </div>
          {/* Clinical Drug-Drug Interaction Safety Alert */}
          {cart.length > 0 && (
            <>
              {billingBlocked && (
                <div className="flex items-center gap-1.5 text-[11px] font-medium mt-2 px-2.5 py-2 rounded-lg" style={{ background: T.amberTint, color: T.amber }}>
                  <AlertTriangle size={13} />
                  Verify {rxBlockedItems.length === 1 ? "this prescription" : "all prescriptions"} before billing.
                </div>
              )}
              <div className="mt-2">
                <Btn size="lg" onClick={generateBill} disabled={billingBlocked || cart.length === 0}>
                  Generate Bill · {formatCurrency(grandTotal)}
                </Btn>
              </div>
            </>
          )}

          {cart.length === 0 && (
            <div className="mt-2">
              <Btn size="lg" disabled>
                Generate Bill · ₹0.00
              </Btn>
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices & Bills Section */}
      <div className="mt-8 bg-white rounded-2xl border p-5 shadow-2xs" style={{ borderColor: T.border }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: T.blueTint, color: T.blue }}>
              <History size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: T.navy }}>
                Recent Invoices & Bills ({activeBranch})
              </h3>
              <p className="text-[11px] text-slate-400">
                Click "Download PDF" on any bill below to generate and download an authenticated tax invoice instantly.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {(db.sales || []).length} Recorded Bills
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-slate-400 font-semibold" style={{ borderColor: T.borderSoft }}>
                <th className="pb-2.5 pl-2">Bill Number</th>
                <th className="pb-2.5">Date</th>
                <th className="pb-2.5">Customer</th>
                <th className="pb-2.5">Branch</th>
                <th className="pb-2.5">Payment</th>
                <th className="pb-2.5 text-right">Amount</th>
                <th className="pb-2.5 text-center pr-2">PDF Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: T.borderSoft }}>
              {(db.sales || []).slice(0, 6).map((s) => (
                <tr key={s.id || s.bill} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 pl-2 font-mono font-bold" style={{ color: T.blue }}>
                    {s.bill}
                  </td>
                  <td className="py-2.5 text-slate-600 font-mono text-[11px]">{formatDate(s.date)}</td>
                  <td className="py-2.5 font-medium text-slate-800">{s.customer || "Walk-in Customer"}</td>
                  <td className="py-2.5 text-slate-500 text-[11px]">{s.branch}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {s.payment || "Cash"}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-bold text-slate-900 font-mono">
                    {formatCurrency(s.amount)}
                  </td>
                  <td className="py-2.5 text-center pr-2">
                    <button
                      onClick={() => handleReprintPdf(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-2xs"
                      style={{ borderColor: T.border }}
                      title={`Download PDF for ${s.bill}`}
                    >
                      <Download size={13} className="text-blue-600" />
                      <span>Download PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DrugSafetyModal
        isOpen={safetyModalOpen}
        onClose={() => setSafetyModalOpen(false)}
        initialMedicines={cart.length > 0 ? cart : []}
      />

      <Modal
        open={!!rxRecordModal}
        onClose={() => setRxRecordModal(null)}
        title="Add Prescription Record"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setRxRecordModal(null)}>
              Cancel
            </Btn>
            <Btn onClick={saveRxRecord}>Save & Continue</Btn>
          </>
        }
      >
        {rxRecordModal && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border p-3 text-sm" style={{ borderColor: T.border, background: T.blueTint2 }}>
              <div className="flex justify-between mb-1">
                <span style={{ color: T.navySoft }}>Customer</span>
                <span className="font-semibold" style={{ color: T.navy }}>{billingCustomerName}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: T.navySoft }}>Medicine</span>
                <span className="font-semibold" style={{ color: T.navy }}>{rxRecordModal.item.name}</span>
              </div>
            </div>
            <FormInput label="Doctor Name" required value={rxDraft.doctorName} onChange={(e) => setRxDraft((d) => ({ ...d, doctorName: e.target.value }))} />
            <FormInput
              label="Prescription Date"
              required
              type="date"
              value={rxDraft.prescriptionDate}
              onChange={(e) => setRxDraft((d) => ({ ...d, prescriptionDate: e.target.value }))}
            />
            <FormInput
              label="Prescription Reference"
              required
              placeholder="e.g. RX-1029"
              value={rxDraft.prescriptionRef}
              onChange={(e) => setRxDraft((d) => ({ ...d, prescriptionRef: e.target.value }))}
            />
          </div>
        )}
      </Modal>

      <PrescriptionVerificationModal
        open={!!rxVerifyRecord}
        onClose={() => setRxVerifyRecord(null)}
        prescription={rxVerifyRecord}
        onVerify={handleRxVerify}
        onReject={handleRxReject}
      />

      <Modal
        open={showNewCustomer}
        onClose={() => setShowNewCustomer(false)}
        title="Add New Customer"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setShowNewCustomer(false)}>
              Cancel
            </Btn>
            <Btn onClick={createCustomerRecord}>Add Customer</Btn>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormInput label="Full Name" required value={newCustomer.name} onChange={(e) => setNewCustomer((c) => ({ ...c, name: e.target.value }))} />
          <FormInput label="Phone" required placeholder="+91 XXXXX XXXXX" value={newCustomer.phone} onChange={(e) => setNewCustomer((c) => ({ ...c, phone: e.target.value }))} />
          <FormInput label="Address" value={newCustomer.address} onChange={(e) => setNewCustomer((c) => ({ ...c, address: e.target.value }))} />
        </div>
      </Modal>

      {/* Bill & Tax Invoice Generated Modal */}
      {billSuccessModal && (
        <Modal
          open={true}
          onClose={() => setBillSuccessModal(null)}
          title="Tax Invoice Generated Successfully"
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Btn variant="secondary" onClick={() => setBillSuccessModal(null)}>
                Start New Bill
              </Btn>
              <div className="flex items-center gap-2">
                {billSuccessModal.pdfResult?.blobUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const w = window.open(billSuccessModal.pdfResult.blobUrl, "_blank");
                      if (w) w.focus();
                    }}
                    className="px-3.5 py-2 rounded-xl border text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                    style={{ borderColor: T.border }}
                  >
                    <Printer size={14} />
                    <span>Print / Preview</span>
                  </button>
                )}
                <Btn
                  onClick={() => {
                    generateInvoicePdf({
                      sale: billSuccessModal.sale,
                      branch: billSuccessModal.branch,
                      customerName: billSuccessModal.customerName,
                      items: billSuccessModal.items,
                      subtotal: billSuccessModal.subtotal,
                      discount: billSuccessModal.discount,
                      gst: billSuccessModal.gst,
                      grandTotal: billSuccessModal.grandTotal,
                    });
                    toast("Invoice PDF downloaded!", "success");
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </Btn>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">Official Tax Invoice Downloaded</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Bill <strong>{billSuccessModal.sale?.bill}</strong> is generated and recorded. A GST-compliant PDF invoice has been downloaded to your computer.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border bg-slate-50/70" style={{ borderColor: T.border }}>
                <div className="text-[11px] text-slate-500">Invoice Number</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5 font-mono">{billSuccessModal.sale?.bill}</div>
              </div>
              <div className="p-3 rounded-xl border bg-slate-50/70" style={{ borderColor: T.border }}>
                <div className="text-[11px] text-slate-500">Billed Customer</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{billSuccessModal.customerName}</div>
              </div>
              <div className="p-3 rounded-xl border bg-slate-50/70" style={{ borderColor: T.border }}>
                <div className="text-[11px] text-slate-500">Grand Total</div>
                <div className="font-bold text-emerald-700 text-base mt-0.5 font-mono">
                  {formatCurrency(billSuccessModal.grandTotal)}
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-slate-50/70" style={{ borderColor: T.border }}>
                <div className="text-[11px] text-slate-500">Payment Mode</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{billSuccessModal.sale?.payment || "Cash"}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl border text-xs" style={{ borderColor: T.border, background: T.blueTint2 }}>
              <div className="font-bold mb-1.5 flex items-center justify-between" style={{ color: T.navy }}>
                <span>Line Items ({billSuccessModal.items?.length || 0})</span>
                <span className="text-[11px] font-normal text-slate-500">GST Compliant</span>
              </div>
              <ul className="space-y-1 text-slate-700">
                {(billSuccessModal.items || []).slice(0, 4).map((it, idx) => (
                  <li key={idx} className="flex justify-between py-0.5 border-b border-slate-200/50">
                    <span>{it.qty}x {it.name}</span>
                    <span className="font-mono font-semibold">{formatCurrency(it.lineTotal)}</span>
                  </li>
                ))}
                {(billSuccessModal.items?.length || 0) > 4 && (
                  <li className="text-[11px] text-slate-400 italic pt-1">
                    + {billSuccessModal.items.length - 4} more items included in invoice...
                  </li>
                )}
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
