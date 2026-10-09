import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Receipt, ShoppingCart, Pencil, Mail, MessageSquare } from "lucide-react";
import { T } from "../../utils/theme.js";
import { formatCurrency, formatDate } from "../../utils/format.js";
import { useApp } from "../../hooks/useApp.js";
import { useRecent } from "../../context/RecentContext.jsx";
import { updateCustomer } from "../../services/customerService.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Btn from "../../components/common/Btn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput } from "../../components/common/FormControls.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, setDb, toast, refreshDb } = useApp();
  const { addRecentItem } = useRecent();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  const c = db.customers.find((x) => x.id === id);

  useEffect(() => {
    if (c) {
      addRecentItem({
        id: c.id,
        type: "Customer",
        title: c.name,
        subtitle: `${c.phone} · ${c.address?.slice(0, 30) || ""}`,
        path: `/customers/${c.id}`,
      });
    }
  }, [c?.id, c?.name]);

  if (!c) {
    return (
      <div>
        <button onClick={() => navigate("/customers")} className="flex items-center gap-1.5 text-xs font-semibold mb-4" style={{ color: T.blue }}>
          <ArrowLeft size={14} /> Back to Customers
        </button>
        <EmptyState title="Customer not found" />
      </div>
    );
  }

  const purchases = db.sales.filter((s) => s.customer === c.name);
  const reservations = db.reservations.filter((r) => r.customer === c.name);
  const totalSpend = purchases.reduce((a, s) => a + s.amount, 0);

  function openEdit() {
    setForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      rxRef: c.rxRef || "-",
    });
    setModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.phone) {
      toast("Name and phone number are required.", "error");
      return;
    }
    try {
      let updated;
      try {
        updated = await updateCustomer(c.id, form);
      } catch (apiErr) {
        console.warn("Backend unavailable, updating customer locally:", apiErr.message);
        updated = { id: c.id, ...form };
      }
      setDb((d) => {
        const oldName = c.name;
        const newName = updated.name || form.name || oldName;

        return {
          ...d,
          customers: d.customers.map((cust) => (cust.id === c.id ? { ...cust, ...updated } : cust)),
          sales: (d.sales || []).map((s) =>
            s.customerId === c.id || (oldName && s.customer === oldName)
              ? { ...s, customer: newName, customerId: c.id }
              : s
          ),
          prescriptions: (d.prescriptions || []).map((p) =>
            p.customerId === c.id || (oldName && (p.customer === oldName || p.customerName === oldName))
              ? { ...p, customer: newName, customerName: newName, customerId: c.id }
              : p
          ),
          reservations: (d.reservations || []).map((r) =>
            r.customerId === c.id || (oldName && r.customer === oldName)
              ? { ...r, customer: newName, customerId: c.id }
              : r
          ),
        };
      });
      toast("Customer updated successfully.");
      setModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to update customer.", "error");
    }
  }

  return (
    <div>
      <button onClick={() => navigate("/customers")} className="flex items-center gap-1.5 text-xs font-semibold mb-4" style={{ color: T.blue }}>
        <ArrowLeft size={14} /> Back to Customers
      </button>
      <PageHeader
        title={c.name}
        subtitle={c.phone}
        crumbs={["MediLink", "Customers", c.name]}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Btn
              icon={Mail}
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(
                  `/communication?type=email&to=${encodeURIComponent(
                    c.email || `${c.name.toLowerCase().replace(/\s+/g, ".")}@example.com`
                  )}&name=${encodeURIComponent(c.name)}`
                )
              }
            >
              Send Email
            </Btn>
            <Btn
              icon={MessageSquare}
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(
                  `/communication?type=whatsapp&phone=${encodeURIComponent(c.phone || "")}&name=${encodeURIComponent(
                    c.name
                  )}`
                )
              }
            >
              Send WhatsApp
            </Btn>
            <Btn icon={Pencil} size="sm" onClick={openEdit}>
              Edit Customer
            </Btn>
          </div>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: T.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: T.navy }}>
            Customer Information
          </h3>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between border-b pb-2" style={{ borderColor: T.borderSoft }}>
              <span style={{ color: "#9AA6B2" }}>Phone</span>
              <span style={{ color: T.navy }}>{c.phone}</span>
            </div>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: T.borderSoft }}>
              <span style={{ color: "#9AA6B2" }}>Email</span>
              <span style={{ color: T.navy }}>{c.email || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: T.borderSoft }}>
              <span style={{ color: "#9AA6B2" }}>Address</span>
              <span className="text-right" style={{ color: T.navy }}>
                {c.address}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#9AA6B2" }}>Prescription Ref.</span>
              <span style={{ color: T.navy }}>{c.rxRef}</span>
            </div>
          </div>
        </div>
        <StatCard icon={Receipt} label="Total Purchases" value={purchases.length} tone="blue" />
        <StatCard icon={ShoppingCart} label="Total Spending" value={formatCurrency(totalSpend)} tone="green" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.border }}>
          <div className="px-5 py-4 border-b font-bold text-sm" style={{ borderColor: T.border, color: T.navy }}>
            Purchase History
          </div>
          <table className="w-full text-xs">
            <tbody>
              {purchases.map((s) => (
                <tr key={s.id} className="border-t" style={{ borderColor: T.borderSoft }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: T.navy }}>
                    {s.bill}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                    {formatDate(s.date)}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-right" style={{ color: T.navy }}>
                    {formatCurrency(s.amount)}
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td>
                    <EmptyState title="No purchases yet" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: T.border }}>
          <div className="px-5 py-4 border-b font-bold text-sm" style={{ borderColor: T.border, color: T.navy }}>
            Reservation History
          </div>
          <table className="w-full text-xs">
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: T.borderSoft }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: T.navy }}>
                    {r.medicine}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: T.navySoft }}>
                    {formatDate(r.resDate)}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td>
                    <EmptyState title="No reservations yet" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
