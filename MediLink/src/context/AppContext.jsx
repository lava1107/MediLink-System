import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  BRANCHES,
  CATEGORIES,
  SUPPLIERS,
  MEDICINES,
  BATCHES,
  CUSTOMERS,
  USERS,
  SALES,
  PURCHASES,
  RESERVATIONS,
  PARTNER_SHOPS,
  PARTNER_AVAILABILITY,
  NOTIFICATIONS,
  PRESCRIPTIONS,
} from "../data/mockData.js";
import { loadJSON, saveJSON } from "../utils/storage.js";
import { api } from "../services/api.js";

export const AppContext = createContext(null);

const DB_KEY = "db_v2";
const NOTIFICATIONS_KEY = "notifications_v2";

const SEED_DB = {
  branches: BRANCHES,
  categories: CATEGORIES,
  suppliers: SUPPLIERS,
  medicines: MEDICINES,
  batches: BATCHES,
  customers: CUSTOMERS,
  users: USERS,
  sales: SALES,
  purchases: PURCHASES,
  reservations: RESERVATIONS,
  partnerShops: PARTNER_SHOPS,
  partnerAvailability: PARTNER_AVAILABILITY,
  prescriptions: PRESCRIPTIONS,
};

export function AppProvider({ children }) {
  const [db, setDb] = useState(() => {
    const loaded = loadJSON(DB_KEY, null);
    if (!loaded || typeof loaded !== "object") return SEED_DB;
    return {
      ...SEED_DB,
      ...loaded,
      branches: Array.isArray(loaded.branches) && loaded.branches.length > 0 ? loaded.branches : SEED_DB.branches,
      medicines: Array.isArray(loaded.medicines) && loaded.medicines.length > 0 ? loaded.medicines : SEED_DB.medicines,
      batches: Array.isArray(loaded.batches) ? loaded.batches : SEED_DB.batches,
      categories: Array.isArray(loaded.categories) && loaded.categories.length > 0 ? loaded.categories : SEED_DB.categories,
      suppliers: Array.isArray(loaded.suppliers) ? loaded.suppliers : SEED_DB.suppliers,
      customers: Array.isArray(loaded.customers) ? loaded.customers : SEED_DB.customers,
      users: Array.isArray(loaded.users) ? loaded.users : SEED_DB.users,
      sales: Array.isArray(loaded.sales) ? loaded.sales : SEED_DB.sales,
      purchases: Array.isArray(loaded.purchases) ? loaded.purchases : SEED_DB.purchases,
      reservations: Array.isArray(loaded.reservations) ? loaded.reservations : SEED_DB.reservations,
      partnerShops: Array.isArray(loaded.partnerShops) ? loaded.partnerShops : SEED_DB.partnerShops,
      partnerAvailability: Array.isArray(loaded.partnerAvailability) ? loaded.partnerAvailability : SEED_DB.partnerAvailability,
      prescriptions: Array.isArray(loaded.prescriptions) ? loaded.prescriptions : SEED_DB.prescriptions,
    };
  });

  const [notifications, setNotifications] = useState(() => {
    const loaded = loadJSON(NOTIFICATIONS_KEY, null);
    return Array.isArray(loaded) ? loaded : NOTIFICATIONS;
  });
  const [toasts, setToasts] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);

  // Sync to local cache for instant offline rendering
  useEffect(() => {
    if (db) saveJSON(DB_KEY, db);
  }, [db]);

  useEffect(() => {
    if (Array.isArray(notifications)) saveJSON(NOTIFICATIONS_KEY, notifications);
  }, [notifications]);

  // Fetch full synchronized state from MySQL backend
  const refreshDb = useCallback(async () => {
    try {
      const data = await api.get("/bootstrap");
      if (data && data.medicines) {
        setDb((prev) => ({
          ...SEED_DB,
          ...prev,
          branches: data.branches || prev.branches || SEED_DB.branches,
          categories: data.categories || prev.categories || SEED_DB.categories,
          suppliers: data.suppliers || prev.suppliers || SEED_DB.suppliers,
          medicines: data.medicines || prev.medicines || SEED_DB.medicines,
          batches: data.batches || prev.batches || SEED_DB.batches,
          customers: data.customers || prev.customers || SEED_DB.customers,
          users: data.users || prev.users || SEED_DB.users,
          sales: data.sales || prev.sales || SEED_DB.sales,
          purchases: data.purchases || prev.purchases || SEED_DB.purchases,
          reservations: data.reservations || prev.reservations || SEED_DB.reservations,
          partnerShops: data.partnerShops || prev.partnerShops || SEED_DB.partnerShops,
          partnerAvailability: data.partnerAvailability || prev.partnerAvailability || SEED_DB.partnerAvailability,
          prescriptions: data.prescriptions || prev.prescriptions || SEED_DB.prescriptions,
        }));
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
        setBackendConnected(true);
      }
    } catch (err) {
      console.warn("[MediLink] Backend sync notice:", err.message);
      setBackendConnected(false);
    }
  }, []);

  // Initial load from backend on mount and automatic live sync every 3 seconds
  useEffect(() => {
    refreshDb();
    const interval = setInterval(() => {
      refreshDb();
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshDb]);

  const toast = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    try {
      await api.patch("/notifications/read-all");
    } catch {
      // Local state already updated
    }
  }, []);

  const value = useMemo(
    () => ({
      db,
      setDb,
      notifications,
      setNotifications,
      markAllRead,
      toast,
      toasts,
      refreshDb,
      backendConnected,
    }),
    [db, notifications, markAllRead, toast, toasts, refreshDb, backendConnected]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
