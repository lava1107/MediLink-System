import React, { useState } from "react";
import { Search, Building2, PackageX, Store } from "lucide-react";
import { useApp } from "../../hooks/useApp.js";
import { useAuth } from "../../hooks/useAuth.js";
import {
  findMedicine,
  checkCurrentBranch,
  checkNearbyBranches,
  checkNearbyPartnerShops,
  BRANCH_RADIUS_OPTIONS,
  PARTNER_RADIUS_OPTIONS,
  DEFAULT_BRANCH_RADIUS,
  DEFAULT_PARTNER_RADIUS,
} from "../../services/availabilityService.js";
import { createReservation } from "../../services/reservationService.js";
import { addDays } from "../../utils/format.js";
import { TODAY } from "../../data/mockData.js";
import { T } from "../../utils/theme.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Btn from "../../components/common/Btn.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import RadiusSelector from "../../components/common/RadiusSelector.jsx";
import AvailabilityCard from "../../components/availability/AvailabilityCard.jsx";
import BranchAvailabilityCard from "../../components/availability/BranchAvailabilityCard.jsx";
import PartnerShopCard from "../../components/availability/PartnerShopCard.jsx";
import Modal from "../../components/common/Modal.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";

export default function AvailabilityPage() {
  const { user } = useAuth();
  const { db, setDb, toast, refreshDb } = useApp();
  const homeBranchName = user.role === "Admin" ? (db.branches?.[0]?.name || "Kovilpatti Main Branch") : user.branch;
  const homeBranch = (db.branches || []).find((b) => b.name === homeBranchName) || db.branches?.[0] || { name: homeBranchName, lat: 9.1726, lng: 77.8687 };

  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [branchRadius, setBranchRadius] = useState(DEFAULT_BRANCH_RADIUS);
  const [partnerRadius, setPartnerRadius] = useState(DEFAULT_PARTNER_RADIUS);

  const [reserveTarget, setReserveTarget] = useState(null); // { locationLabel, medicineName }
  const [reserveForm, setReserveForm] = useState({ customer: "", quantity: 1 });

  async function runSearch(nextBranchRadius = branchRadius, nextPartnerRadius = partnerRadius) {
    if (!query.trim()) {
      toast("Enter a medicine name to search.", "error");
      return;
    }
    setSearching(true);
    const med = findMedicine(db.medicines, query);
    if (!med) {
      setResult({ notFound: true });
      setSearching(false);
      return;
    }

    // Level 1: current branch
    const homeBatch = await checkCurrentBranch(db.batches, med.id, homeBranch.name);

    // Level 2: nearby MediLink branches (centered on the CURRENT branch), only if unavailable at home
    const nearbyBranches = homeBatch ? [] : await checkNearbyBranches(db.batches, db.branches, med.id, homeBranch, nextBranchRadius);

    // Level 3: nearby registered partner shops (centered on the CURRENT branch), only if unavailable in-network
    const nearbyPartners =
      !homeBatch && nearbyBranches.length === 0
        ? await checkNearbyPartnerShops(med.name, homeBranch, nextPartnerRadius, db.partnerShops, db.partnerAvailability)
        : [];

    setResult({ med, homeBatch, nearbyBranches, nearbyPartners });
    setSearching(false);
  }

  function handleBranchRadiusChange(km) {
    setBranchRadius(km);
    if (result && !result.notFound && !result.homeBatch) runSearch(km, partnerRadius);
  }
  function handlePartnerRadiusChange(km) {
    setPartnerRadius(km);
    if (result && !result.notFound && !result.homeBatch && result.nearbyBranches.length === 0) runSearch(branchRadius, km);
  }

  function openReserve(locationLabel, medicineName) {
    setReserveForm({ customer: "", quantity: 1 });
    setReserveTarget({ locationLabel, medicineName });
  }

  async function submitReservation() {
    if (!reserveForm.customer || !reserveForm.quantity) {
      toast("Select a customer and quantity.", "error");
      return;
    }
    const updated = await createReservation(db.reservations, {
      customer: reserveForm.customer,
      medicine: reserveTarget.medicineName,
      branch: reserveTarget.locationLabel,
      quantity: Number(reserveForm.quantity),
      expiry: addDays(TODAY, 3),
      createdBy: user.name,
    });
    setDb((d) => ({ ...d, reservations: updated }));
    toast("Reservation created. This does not create a sale until the customer collects it.");
    setReserveTarget(null);
    refreshDb?.();
  }

  return (
    <div>
      <PageHeader
        title="Medicine Availability"
        subtitle="Current branch → nearby MediLink branches → nearby partner shops → reserve"
        crumbs={["MediLink", "Medicine Availability"]}
      />
      <div className="bg-white rounded-2xl border p-5 mb-5" style={{ borderColor: T.border }}>
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9AA6B2" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search by medicine name, generic name, brand or barcode..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-400"
              style={{ borderColor: T.border }}
            />
          </div>
          <Btn icon={Search} onClick={() => runSearch()} disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </Btn>
        </div>
      </div>

      {result?.notFound && <EmptyState icon={PackageX} title="No medicine found" sub="Try a different name, brand or generic term." />}

      {result && !result.notFound && (
        <div className="flex flex-col gap-5">
          {/* Level 1: current branch */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: T.border }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: T.blue }}>
                1
              </span>
              <h3 className="font-bold text-sm" style={{ color: T.navy }}>
                Current Branch — {homeBranch.name}
              </h3>
            </div>
            <AvailabilityCard medicine={result.med} batch={result.homeBatch} branchName={homeBranch.name} />
          </div>

          {/* Level 2: nearby MediLink branches */}
          {!result.homeBatch && (
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: T.border }}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: T.blue }}>
                    2
                  </span>
                  <h3 className="font-bold text-sm" style={{ color: T.navy }}>
                    Nearby MediLink Branches
                  </h3>
                </div>
                <RadiusSelector value={branchRadius} options={BRANCH_RADIUS_OPTIONS} onChange={handleBranchRadiusChange} />
              </div>
              {result.nearbyBranches.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {result.nearbyBranches.map(({ branch, batch, distance }) => (
                    <BranchAvailabilityCard
                      key={branch.id}
                      branch={branch}
                      batch={batch}
                      distance={distance}
                      onReserve={() => openReserve(branch.name, result.med.name)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState icon={Building2} title={`No nearby MediLink branch has this medicine within ${branchRadius} km.`} sub="Checking registered partner shops next." />
              )}
            </div>
          )}

          {/* Level 3: nearby partner shops */}
          {!result.homeBatch && result.nearbyBranches.length === 0 && (
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: T.border }}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: T.blue }}>
                    3
                  </span>
                  <h3 className="font-bold text-sm" style={{ color: T.navy }}>
                    Nearby Registered Partner Medical Shops
                  </h3>
                </div>
                <RadiusSelector value={partnerRadius} options={PARTNER_RADIUS_OPTIONS} onChange={handlePartnerRadiusChange} />
              </div>
              {result.nearbyPartners.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {result.nearbyPartners.map((pr) => (
                    <PartnerShopCard
                      key={pr.shopId}
                      entry={pr}
                      onViewDetails={() => toast(`${pr.shop.name} · License ${pr.shop.license} · ${pr.shop.phone}`)}
                      onReserve={() => openReserve(pr.shop.name, result.med.name)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Store}
                  title={`No registered partner shop has this medicine within ${partnerRadius} km.`}
                  sub="Availability is limited to MediLink's own branches and registered partner shops — not every pharmacy in the real world."
                />
              )}
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!reserveTarget}
        onClose={() => setReserveTarget(null)}
        title="Reserve Medicine"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setReserveTarget(null)}>
              Cancel
            </Btn>
            <Btn onClick={submitReservation}>Create Reservation</Btn>
          </>
        }
      >
        {reserveTarget && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border p-3 text-sm" style={{ borderColor: T.border, background: T.blueTint2 }}>
              <div className="flex justify-between mb-1">
                <span style={{ color: T.navySoft }}>Medicine</span>
                <span className="font-semibold" style={{ color: T.navy }}>{reserveTarget.medicineName}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: T.navySoft }}>Reserved at</span>
                <span className="font-semibold" style={{ color: T.navy }}>{reserveTarget.locationLabel}</span>
              </div>
            </div>
            <FormSelect label="Customer" required value={reserveForm.customer} onChange={(e) => setReserveForm((f) => ({ ...f, customer: e.target.value }))}>
              <option value="">Select customer</option>
              {(db.customers || []).map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </FormSelect>
            <FormInput
              label="Quantity"
              required
              type="number"
              min="1"
              value={reserveForm.quantity}
              onChange={(e) => setReserveForm((f) => ({ ...f, quantity: e.target.value }))}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
