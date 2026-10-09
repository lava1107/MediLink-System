import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Store,
  Phone,
  MapPin,
  Pill,
  CheckCircle2,
  Search,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../../hooks/useApp.js";
import { useAuth } from "../../hooks/useAuth.js";
import { calculateDistance } from "../../utils/geo.js";
import {
  createPartnerShop,
  updatePartnerShop,
  getShopMedicines,
  addShopMedicine,
  updateShopMedicine,
  deleteShopMedicine,
} from "../../services/partnerService.js";
import { api } from "../../services/api.js";
import { T } from "../../utils/theme.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/tables/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Btn from "../../components/common/Btn.jsx";
import IconBtn from "../../components/common/IconBtn.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";

export default function PartnerShopsPage() {
  const { db, setDb, toast, refreshDb } = useApp();
  const { user, currentBranch } = useAuth();

  // Registration modal
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    owner: "",
    phone: "",
    email: "",
    address: "",
    city: "Kovilpatti",
    state: "Tamil Nadu",
    pin: "628501",
    license: "",
    status: "Active",
    lat: 9.17,
    lng: 77.87,
  });

  // Edit partner shop modal
  const [editModal, setEditModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    owner: "",
    phone: "",
    email: "",
    address: "",
    city: "Kovilpatti",
    state: "Tamil Nadu",
    pin: "628501",
    license: "",
    status: "Active",
    lat: 9.17,
    lng: 77.87,
  });

  // Selected shop for displaying available medicines below
  const [selectedShopId, setSelectedShopId] = useState(() => db.partnerShops?.[0]?.id || "PS-01");

  // Shop medicines search & modals
  const [medSearch, setMedSearch] = useState("");
  const [shopMedicines, setShopMedicines] = useState([]);
  const [loadingShopMeds, setLoadingShopMeds] = useState(false);

  // Add medicine to shop modal
  const [addMedModal, setAddMedModal] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    medicineName: "",
    medicineId: "",
    quantity: 10,
    price: 45,
  });

  // Edit stock modal
  const [editMedModal, setEditMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [editMedForm, setEditMedForm] = useState({
    medicineName: "",
    quantity: 0,
    price: 0,
  });

  // WhatsApp Inquiry modal for partner shop
  const [whatsappModal, setWhatsappModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  const activeBranchName = user.role === "Admin" ? currentBranch : user.branch;
  const activeBranch =
    db.branches?.find((b) => b.name === activeBranchName) ||
    db.branches?.[0] || { lat: 9.1734, lng: 77.8713, name: "Kovilpatti Branch" };

  const rows = useMemo(() => {
    return (db.partnerShops || []).map((s) => ({
      ...s,
      distanceKm: calculateDistance(activeBranch.lat, activeBranch.lng, s.lat, s.lng),
    }));
  }, [db.partnerShops, activeBranch]);

  // Find currently selected shop object
  const selectedShop = useMemo(() => {
    return rows.find((s) => s.id === selectedShopId) || rows[0] || null;
  }, [rows, selectedShopId]);

  // Load medicines for currently selected shop (API with local db.partnerAvailability fallback)
  useEffect(() => {
    if (!selectedShop?.id) return;
    let isCurrent = true;
    setLoadingShopMeds(true);

    getShopMedicines(selectedShop.id)
      .then((res) => {
        if (!isCurrent) return;
        if (Array.isArray(res) && res.length > 0) {
          setShopMedicines(res);
        } else {
          // Fallback to local partnerAvailability in db
          const localMeds = (db.partnerAvailability || [])
            .filter((pa) => pa.shopId === selectedShop.id || pa.shopName === selectedShop.name)
            .map((pa, idx) => ({
              id: pa.id || idx + 1,
              shopId: selectedShop.id,
              medicineName: pa.medicineName,
              quantity: pa.quantity,
              price: pa.price || 50,
              generic: pa.generic || "Formula Standard",
              category: pa.category || "General",
              lastUpdated: pa.lastUpdated || "2026-10-06 05:00 PM",
            }));
          setShopMedicines(localMeds);
        }
      })
      .catch(() => {
        if (!isCurrent) return;
        const localMeds = (db.partnerAvailability || [])
          .filter((pa) => pa.shopId === selectedShop.id || pa.shopName === selectedShop.name)
          .map((pa, idx) => ({
            id: pa.id || idx + 1,
            shopId: selectedShop.id,
            medicineName: pa.medicineName,
            quantity: pa.quantity,
            price: pa.price || 50,
            generic: pa.generic || "Formula Standard",
            category: pa.category || "General",
            lastUpdated: pa.lastUpdated || "2026-10-06 05:00 PM",
          }));
        setShopMedicines(localMeds);
      })
      .finally(() => {
        if (isCurrent) setLoadingShopMeds(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedShop?.id, selectedShop?.name, db.partnerAvailability]);

  // Filtered medicines in selected shop
  const filteredShopMedicines = useMemo(() => {
    if (!medSearch.trim()) return shopMedicines;
    const q = medSearch.toLowerCase();
    return shopMedicines.filter(
      (m) =>
        (m.medicineName && m.medicineName.toLowerCase().includes(q)) ||
        (m.generic && m.generic.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q))
    );
  }, [shopMedicines, medSearch]);

  function openEdit(s) {
    setEditingShop(s);
    setEditForm({
      name: s.name || "",
      owner: s.owner || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      city: s.city || "Kovilpatti",
      state: s.state || "Tamil Nadu",
      pin: s.pin || "628501",
      license: s.license || "",
      status: s.status || "Active",
      lat: s.lat || 9.17,
      lng: s.lng || 77.87,
    });
    setEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editForm.name || !editForm.owner || !editForm.phone || !editForm.address || !editForm.city) {
      toast("Please fill in shop name, owner, phone, address and city.", "error");
      return;
    }
    try {
      const updated = await updatePartnerShop(editingShop.id, editForm);
      setDb((d) => {
        const oldName = editingShop.name;
        const newName = updated.name || editForm.name || oldName;

        return {
          ...d,
          partnerShops: (d.partnerShops || []).map((s) =>
            s.id === editingShop.id ? { ...s, ...editForm, ...updated } : s
          ),
          partnerAvailability: (d.partnerAvailability || []).map((pa) =>
            pa.shopId === editingShop.id || (oldName && pa.shopName === oldName)
              ? { ...pa, shopName: newName, shopId: editingShop.id }
              : pa
          ),
        };
      });
      toast("Partner shop updated successfully.");
      setEditModal(false);
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to update partner shop.", "error");
    }
  }

  async function handleSave() {
    if (!form.name || !form.owner || !form.phone || !form.address || !form.city) {
      toast("Please fill in shop name, owner, phone, address and city.", "error");
      return;
    }
    try {
      const created = await createPartnerShop(form);
      setDb((d) => ({ ...d, partnerShops: [...(d.partnerShops || []), created] }));
      setSelectedShopId(created.id);
      toast("Partner shop registered successfully.");
      setModal(false);
      setForm({
        name: "",
        owner: "",
        phone: "",
        email: "",
        address: "",
        city: "Kovilpatti",
        state: "Tamil Nadu",
        pin: "628501",
        license: "",
        status: "Active",
        lat: 9.17,
        lng: 77.87,
      });
      refreshDb?.();
    } catch (err) {
      toast(err.message || "Failed to register partner shop.", "error");
    }
  }

  async function handleAddMedicineToShop(e) {
    if (e) e.preventDefault();
    if (!newMedForm.medicineName.trim()) {
      toast("Please enter or select a medicine name.", "error");
      return;
    }
    try {
      const payload = {
        medicineName: newMedForm.medicineName.trim(),
        medicineId: newMedForm.medicineId || null,
        quantity: Number(newMedForm.quantity) || 0,
        price: Number(newMedForm.price) || 0,
      };

      const created = await addShopMedicine(selectedShop.id, payload);

      setShopMedicines((prev) => [created, ...prev]);

      // Also sync to global db state
      setDb((d) => ({
        ...d,
        partnerAvailability: [
          {
            id: created.id,
            shopId: selectedShop.id,
            shopName: selectedShop.name,
            medicineName: created.medicineName,
            quantity: created.quantity,
            price: created.price,
            lastUpdated: created.lastUpdated,
          },
          ...(d.partnerAvailability || []),
        ],
      }));

      toast(`Added ${newMedForm.medicineName} to ${selectedShop.name}!`);
      setAddMedModal(false);
      setNewMedForm({ medicineName: "", medicineId: "", quantity: 10, price: 45 });
    } catch (err) {
      toast(err.message || "Failed to add medicine to partner shop", "error");
    }
  }

  function openEditMed(m) {
    setEditingMed(m);
    setEditMedForm({
      medicineName: m.medicineName,
      quantity: m.quantity,
      price: m.price || 0,
    });
    setEditMedModal(true);
  }

  async function handleSaveMedEdit(e) {
    if (e) e.preventDefault();
    try {
      const payload = {
        quantity: Number(editMedForm.quantity),
        price: Number(editMedForm.price),
        medicineName: editMedForm.medicineName,
      };

      const updated = await updateShopMedicine(selectedShop.id, editingMed.id, payload);

      setShopMedicines((prev) =>
        prev.map((m) => (m.id === editingMed.id ? { ...m, ...updated, ...payload } : m))
      );

      setDb((d) => ({
        ...d,
        partnerAvailability: (d.partnerAvailability || []).map((pa) =>
          pa.id === editingMed.id ||
          (pa.shopId === selectedShop.id && pa.medicineName === editingMed.medicineName)
            ? { ...pa, quantity: payload.quantity, price: payload.price }
            : pa
        ),
      }));

      toast("Medicine stock updated successfully.");
      setEditMedModal(false);
    } catch (err) {
      toast(err.message || "Failed to update stock", "error");
    }
  }

  async function handleDeleteShopMed(med) {
    if (!window.confirm(`Remove ${med.medicineName} from ${selectedShop.name}?`)) return;
    try {
      await deleteShopMedicine(selectedShop.id, med.id);
      setShopMedicines((prev) => prev.filter((m) => m.id !== med.id));
      setDb((d) => ({
        ...d,
        partnerAvailability: (d.partnerAvailability || []).filter(
          (pa) => !(pa.id === med.id || (pa.shopId === selectedShop.id && pa.medicineName === med.medicineName))
        ),
      }));
      toast(`${med.medicineName} removed from ${selectedShop.name}.`);
    } catch (err) {
      toast(err.message || "Failed to delete medicine", "error");
    }
  }

  function openWhatsappToShop() {
    setWhatsappMessage(
      `[MediLink Inquiry] Hello ${selectedShop.owner}, urgent inquiry from ${activeBranch.name}: Do you currently have ready stock of scheduled medicines? Please confirm.`
    );
    setWhatsappModal(true);
  }

  async function handleSendWhatsappToShop(e) {
    if (e) e.preventDefault();
    if (!whatsappMessage.trim()) return;
    setSendingWhatsapp(true);
    try {
      const cleanDigits = (selectedShop.phone || "").replace(/[^0-9]/g, "");
      const intlDigits = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
      const waUrl = `https://wa.me/${intlDigits}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(waUrl, "_blank");

      await api.post("/communication/whatsapp", {
        toPhone: selectedShop.phone,
        toName: selectedShop.owner,
        message: whatsappMessage,
      });
      toast(`WhatsApp opened & dispatched to ${selectedShop.name} (${selectedShop.phone})!`);
      setWhatsappModal(false);
    } catch (err) {
      toast(err.message || "Failed to send WhatsApp to partner shop", "error");
    } finally {
      setSendingWhatsapp(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Medical Shops"
        subtitle={`Registered external medical shops – live distance calculated from ${activeBranch.name}`}
        crumbs={["MediLink", "Partner Medical Shops"]}
        action={
          <div className="flex items-center gap-2">
            <Btn icon={Plus} onClick={() => setModal(true)}>
              Register New Shop
            </Btn>
          </div>
        }
      />

      {/* Interactive Quick Shop Selector Strip */}
      <div className="p-4 bg-white rounded-2xl border shadow-xs" style={{ borderColor: T.border }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Store size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Partner Shop to View Live Available Inventory Below:
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Click any shop below to switch inventory &bull; {rows.length} shops registered
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {rows.map((s) => {
            const isSelected = selectedShop?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedShopId(s.id)}
                className={`text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                    : "bg-slate-50/50 hover:bg-slate-100/70 border-slate-200"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                    <CheckCircle2 size={10} /> Active
                  </span>
                )}
                <div>
                  <div className="font-bold text-xs text-slate-900 truncate pr-12">{s.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="shrink-0 text-slate-400" />
                    <span>{s.city}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-blue-700">{s.distanceKm} km away</span>
                  <span className="text-slate-400 font-mono text-[10px]">{s.id}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Partner Shops Table */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            All Registered Partner Directory (Click any row to view medicines)
          </span>
        </div>
        <DataTable
          columns={[
            {
              key: "id",
              label: "Shop ID",
              sortable: true,
              render: (r) => (
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                    selectedShop?.id === r.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {r.id}
                </span>
              ),
            },
            {
              key: "name",
              label: "Shop Name",
              sortable: true,
              render: (r) => (
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    {r.name}
                    {selectedShop?.id === r.id && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-bold">
                        Viewing Below
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-500">{r.address}</span>
                </div>
              ),
            },
            { key: "owner", label: "Owner" },
            {
              key: "phone",
              label: "Phone",
              render: (r) => (
                <a
                  href={`tel:${r.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 font-medium hover:underline inline-flex items-center gap-1 text-xs"
                >
                  <Phone size={11} /> {r.phone}
                </a>
              ),
            },
            { key: "city", label: "City" },
            { key: "license", label: "License No." },
            {
              key: "distanceKm",
              label: "Distance",
              sortable: true,
              render: (r) => <span className="font-bold text-blue-700">{r.distanceKm} km</span>,
            },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
          data={rows}
          onRowClick={(row) => setSelectedShopId(row.id)}
          searchKeys={["name", "owner", "city", "phone"]}
          actions={(s) => (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <IconBtn
                icon={Eye}
                tone="blue"
                title="View Medicines"
                onClick={() => setSelectedShopId(s.id)}
              />
              <IconBtn icon={Pencil} tone="blue" title="Edit Partner Shop" onClick={() => openEdit(s)} />
            </div>
          )}
        />
      </div>

      {/* SECTION REQUIRED: Available Medicines for Selected Shop (Dynamically varies according to selected shop) */}
      {selectedShop && (
        <div
          id="partner-shop-medicines-section"
          className="bg-white rounded-2xl border overflow-hidden shadow-sm transition-all"
          style={{ borderColor: T.border }}
        >
          {/* Shop Highlight Banner */}
          <div className="p-5 border-b bg-gradient-to-r from-blue-50/80 via-white to-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: T.border }}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                  {selectedShop.id}
                </span>
                <h2 className="text-base font-bold text-slate-900">{selectedShop.name}</h2>
                <StatusBadge status={selectedShop.status} />
              </div>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                <span>
                  Owner: <strong className="text-slate-800">{selectedShop.owner}</strong>
                </span>
                <span>
                  Contact: <strong className="text-slate-800">{selectedShop.phone}</strong>
                </span>
                <span>
                  City: <strong className="text-slate-800">{selectedShop.city}</strong> ({selectedShop.distanceKm} km from {activeBranch.name})
                </span>
                <span>
                  License: <strong className="text-slate-800">{selectedShop.license}</strong>
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Btn
                variant="secondary"
                size="sm"
                icon={MessageSquare}
                onClick={openWhatsappToShop}
                className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                Send WhatsApp Inquiry
              </Btn>
              <Btn
                size="sm"
                icon={Plus}
                onClick={() => setAddMedModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                + Add Medicine Stock
              </Btn>
            </div>
          </div>

          {/* Subheader & Search for this shop's medicines */}
          <div className="p-4 bg-slate-50/60 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: T.borderSoft }}>
            <div className="flex items-center gap-2">
              <Pill size={15} className="text-blue-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Available Medicines at {selectedShop.name} ({filteredShopMedicines.length} in stock)
              </span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                placeholder={`Search medicines in ${selectedShop.name}...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none focus:border-blue-500 bg-white"
                style={{ borderColor: T.border }}
              />
            </div>
          </div>

          {/* Table of Available Medicines for this specific shop */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: T.blueTint2 }}>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Medicine Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Generic Formula</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Category</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">Available Stock</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Unit Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Last Stock Updated</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingShopMeds ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Loading available medicines for {selectedShop.name}...
                    </td>
                  </tr>
                ) : filteredShopMedicines.length > 0 ? (
                  filteredShopMedicines.map((med, idx) => {
                    const isLowStock = Number(med.quantity) <= 10;
                    return (
                      <tr
                        key={med.id || idx}
                        className="border-t hover:bg-slate-50/70 transition-colors"
                        style={{ borderColor: T.borderSoft }}
                      >
                        <td className="px-4 py-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>{med.medicineName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {med.generic || "Standard Formula"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                            {med.category || "General"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isLowStock
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {med.quantity} units {isLowStock ? "(Low)" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          ₹{Number(med.price || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            {med.lastUpdated}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <IconBtn
                              icon={Pencil}
                              tone="blue"
                              title="Update Quantity / Price"
                              onClick={() => openEditMed(med)}
                            />
                            <IconBtn
                              icon={Trash2}
                              tone="red"
                              title="Remove from Shop"
                              onClick={() => handleDeleteShopMed(med)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No medicines recorded for <strong>{selectedShop.name}</strong> matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t flex items-center justify-between text-[11px] text-slate-500" style={{ borderColor: T.borderSoft }}>
            <span>
              Showing live inventory verified specifically for <strong>{selectedShop.name}</strong>. Stock varies by individual partner shop.
            </span>
            <span className="font-semibold text-blue-600">
              {filteredShopMedicines.length} medicine(s) in catalog
            </span>
          </div>
        </div>
      )}

      {/* Modal: Register New Partner Shop */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Register Partner Medical Shop"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSave}>Register Shop</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Shop Name"
            required
            placeholder="e.g. Sri Lakshmi Medicals"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <FormInput
            label="Owner Name"
            required
            placeholder="e.g. T. Chandrasekar"
            value={form.owner}
            onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
          />
          <FormInput
            label="Phone Number"
            required
            placeholder="e.g. +91 94860 12093"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <FormInput
            label="Email Address"
            type="email"
            placeholder="e.g. srilakshmi.med@gmail.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <FormInput
            label="City"
            required
            placeholder="e.g. Kovilpatti"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <FormInput
            label="Drug License No."
            placeholder="e.g. TN-DL-22013"
            value={form.license}
            onChange={(e) => setForm((f) => ({ ...f, license: e.target.value }))}
          />
          <FormInput
            label="Latitude"
            required
            type="number"
            step="0.0001"
            value={form.lat}
            onChange={(e) => setForm((f) => ({ ...f, lat: Number(e.target.value) }))}
          />
          <FormInput
            label="Longitude"
            required
            type="number"
            step="0.0001"
            value={form.lng}
            onChange={(e) => setForm((f) => ({ ...f, lng: Number(e.target.value) }))}
          />
          <div className="col-span-2">
            <FormInput
              label="Address"
              required
              placeholder="e.g. Main Bazaar Street"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <FormSelect
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option>Active</option>
            <option>Inactive</option>
          </FormSelect>
        </div>
      </Modal>

      {/* Modal: Edit Partner Shop */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit Partner Shop ${editingShop?.name ? `(${editingShop.name})` : ""}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setEditModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSaveEdit}>Save Changes</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Shop Name"
            required
            placeholder="e.g. Sri Lakshmi Medicals"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
          />
          <FormInput
            label="Owner Name"
            required
            placeholder="e.g. T. Chandrasekar"
            value={editForm.owner}
            onChange={(e) => setEditForm((f) => ({ ...f, owner: e.target.value }))}
          />
          <FormInput
            label="Phone Number"
            required
            placeholder="e.g. +91 94860 12093"
            value={editForm.phone}
            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <FormInput
            label="Email Address"
            type="email"
            placeholder="e.g. srilakshmi.med@gmail.com"
            value={editForm.email}
            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
          />
          <FormInput
            label="City"
            required
            placeholder="e.g. Kovilpatti"
            value={editForm.city}
            onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
          />
          <FormInput
            label="Drug License No."
            placeholder="e.g. TN-DL-22013"
            value={editForm.license}
            onChange={(e) => setEditForm((f) => ({ ...f, license: e.target.value }))}
          />
          <FormInput
            label="Latitude"
            required
            type="number"
            step="0.0001"
            value={editForm.lat}
            onChange={(e) => setEditForm((f) => ({ ...f, lat: Number(e.target.value) }))}
          />
          <FormInput
            label="Longitude"
            required
            type="number"
            step="0.0001"
            value={editForm.lng}
            onChange={(e) => setEditForm((f) => ({ ...f, lng: Number(e.target.value) }))}
          />
          <div className="col-span-2">
            <FormInput
              label="Address"
              required
              placeholder="e.g. Main Bazaar Street"
              value={editForm.address}
              onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <FormSelect
            label="Status"
            value={editForm.status}
            onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option>Active</option>
            <option>Inactive</option>
          </FormSelect>
        </div>
      </Modal>

      {/* Modal: Add Medicine Stock to Selected Shop */}
      <Modal
        open={addMedModal}
        onClose={() => setAddMedModal(false)}
        title={`Add Medicine Stock to ${selectedShop?.name || "Partner Shop"}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setAddMedModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleAddMedicineToShop}>Add to Shop Catalog</Btn>
          </>
        }
      >
        <form onSubmit={handleAddMedicineToShop} className="space-y-4">
          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
            Record available inventory for <strong>{selectedShop?.name}</strong>. This stock will be displayed when customers check medicine availability across nearby partner medical shops.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select or Type Medicine Name *
            </label>
            <input
              type="text"
              required
              list="system-medicines-list"
              placeholder="e.g. Human Mixtard Insulin, Dolo 650..."
              value={newMedForm.medicineName}
              onChange={(e) => {
                const val = e.target.value;
                const match = (db.medicines || []).find((m) => m.name.toLowerCase() === val.toLowerCase());
                setNewMedForm((f) => ({
                  ...f,
                  medicineName: val,
                  medicineId: match?.id || "",
                  price: match?.selling || f.price,
                }));
              }}
              className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 bg-white"
              style={{ borderColor: T.border }}
            />
            <datalist id="system-medicines-list">
              {(db.medicines || []).map((m) => (
                <option key={m.id} value={m.name}>
                  {m.generic} ({m.dosage})
                </option>
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Available Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={newMedForm.quantity}
                onChange={(e) => setNewMedForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 bg-white"
                style={{ borderColor: T.border }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={newMedForm.price}
                onChange={(e) => setNewMedForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 bg-white"
                style={{ borderColor: T.border }}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Existing Stock */}
      <Modal
        open={editMedModal}
        onClose={() => setEditMedModal(false)}
        title={`Update Stock: ${editingMed?.medicineName || ""}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setEditMedModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleSaveMedEdit}>Save Quantity</Btn>
          </>
        }
      >
        <form onSubmit={handleSaveMedEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Medicine Name</label>
            <input
              type="text"
              value={editMedForm.medicineName}
              onChange={(e) => setEditMedForm((f) => ({ ...f, medicineName: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 bg-white"
              style={{ borderColor: T.border }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Available Quantity</label>
              <input
                type="number"
                min="0"
                value={editMedForm.quantity}
                onChange={(e) => setEditMedForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 bg-white"
                style={{ borderColor: T.border }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={editMedForm.price}
                onChange={(e) => setEditMedForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-blue-500 bg-white"
                style={{ borderColor: T.border }}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Send WhatsApp Inquiry to Partner Shop */}
      <Modal
        open={whatsappModal}
        onClose={() => setWhatsappModal(false)}
        title={`Send Real WhatsApp to ${selectedShop?.name || "Partner Shop"}`}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setWhatsappModal(false)}>
              Cancel
            </Btn>
            <Btn
              onClick={handleSendWhatsappToShop}
              disabled={sendingWhatsapp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {sendingWhatsapp ? "Opening WhatsApp..." : "Open & Send via WhatsApp"}
            </Btn>
          </>
        }
      >
        <form onSubmit={handleSendWhatsappToShop} className="space-y-3">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
            WhatsApp message will be sent to <strong>{selectedShop?.owner}</strong> at{" "}
            <strong>{selectedShop?.phone}</strong> via MediLink Direct WhatsApp.
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Message Body *</label>
            <textarea
              rows={4}
              required
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-emerald-500 bg-white font-mono"
              style={{ borderColor: T.border }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
