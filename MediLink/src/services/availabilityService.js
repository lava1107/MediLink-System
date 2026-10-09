import { calculateDistance } from "../utils/geo.js";
import { api } from "./api.js";

export const BRANCH_RADIUS_OPTIONS = [5, 10, 25, 50, 100];
export const PARTNER_RADIUS_OPTIONS = [2, 5, 10, 25];
export const DEFAULT_BRANCH_RADIUS = 25;
export const DEFAULT_PARTNER_RADIUS = 5;

export function findMedicine(medicines, query) {
  if (!medicines || !query) return null;
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    medicines.find(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.generic?.toLowerCase().includes(q) ||
        m.brand?.toLowerCase().includes(q)
    ) || null
  );
}

export async function checkCurrentBranch(batches, medicineId, branchName) {
  if (!batches) return null;
  return (
    batches.find(
      (b) =>
        b.medicineId === medicineId &&
        b.branchName === branchName &&
        b.status !== "Expired" &&
        Number(b.available) > 0
    ) || null
  );
}

export async function checkNearbyBranches(batches, branches, medicineId, currentBranch, radiusKm = DEFAULT_BRANCH_RADIUS) {
  if (!branches || !batches || !currentBranch) return [];
  return branches
    .filter((b) => b.name !== currentBranch.name && b.status === "Active")
    .map((b) => {
      const distance = calculateDistance(currentBranch.lat, currentBranch.lng, b.lat, b.lng);
      const batch = batches.find(
        (bt) => bt.medicineId === medicineId && bt.branchName === b.name && bt.status !== "Expired" && Number(bt.available) > 0
      );
      return batch && distance !== null && distance <= radiusKm ? { branch: b, batch, distance } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);
}

export async function checkNearbyPartnerShops(medicineName, currentBranch, radiusKm = DEFAULT_PARTNER_RADIUS, partnerShops = [], partnerAvailability = []) {
  // If partner data is available in client state, compute directly
  if (partnerShops.length > 0 && partnerAvailability.length > 0) {
    return partnerAvailability
      .filter((pa) => pa.medicineName?.toLowerCase() === medicineName?.toLowerCase())
      .map((pa) => {
        const shop = partnerShops.find((s) => s.id === pa.shopId);
        if (!shop || shop.status !== "Active") return null;
        const distance = calculateDistance(currentBranch.lat, currentBranch.lng, shop.lat, shop.lng);
        return distance !== null && distance <= radiusKm ? { ...pa, shop, distance } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);
  }

  // Otherwise query backend availability endpoint
  try {
    const result = await api.get(
      `/availability/check?query=${encodeURIComponent(medicineName)}&branchName=${encodeURIComponent(currentBranch.name)}&partnerRadius=${radiusKm}`
    );
    return result?.nearbyPartners || [];
  } catch (err) {
    console.error("checkNearbyPartnerShops error:", err);
    return [];
  }
}

export { calculateDistance };
