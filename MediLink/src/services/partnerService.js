import { api } from "./api.js";

export async function getPartnerShops() {
  return await api.get("/partner-shops");
}

export async function getPartnerShopById(id) {
  return await api.get(`/partner-shops/${id}`);
}

export async function createPartnerShop(payload) {
  try {
    return await api.post("/partner-shops", payload);
  } catch (err) {
    console.warn("Backend unavailable, creating partner shop locally:", err.message);
    return { id: `PS-${Date.now().toString().slice(-4)}`, ...payload, created: new Date().toISOString() };
  }
}

export async function updatePartnerShop(id, payload) {
  try {
    return await api.put(`/partner-shops/${id}`, payload);
  } catch (err) {
    console.warn("Backend unavailable, updating partner shop locally:", err.message);
    return { id, ...payload };
  }
}

export async function deletePartnerShop(id) {
  try {
    return await api.delete(`/partner-shops/${id}`);
  } catch (err) {
    console.warn("Backend unavailable, deleting partner shop locally:", err.message);
    return { id };
  }
}

export async function getPartnerMedicines() {
  return await api.get("/partner-shops/medicines");
}

export async function getShopMedicines(shopId) {
  return await api.get(`/partner-shops/${shopId}/medicines`);
}

export async function addShopMedicine(shopId, payload) {
  try {
    return await api.post(`/partner-shops/${shopId}/medicines`, payload);
  } catch (err) {
    console.warn("Backend unavailable, adding medicine locally:", err.message);
    return { id: Date.now(), shopId, ...payload, lastUpdated: new Date().toLocaleString() };
  }
}

export async function updateShopMedicine(shopId, medId, payload) {
  try {
    return await api.put(`/partner-shops/${shopId}/medicines/${medId}`, payload);
  } catch (err) {
    console.warn("Backend unavailable, updating medicine locally:", err.message);
    return { id: medId, shopId, ...payload, lastUpdated: new Date().toLocaleString() };
  }
}

export async function deleteShopMedicine(shopId, medId) {
  try {
    return await api.delete(`/partner-shops/${shopId}/medicines/${medId}`);
  } catch (err) {
    console.warn("Backend unavailable, deleting medicine locally:", err.message);
    return { id: medId };
  }
}

