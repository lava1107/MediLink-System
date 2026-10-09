import React, { createContext, useContext, useState, useEffect } from "react";

const RecentContext = createContext(null);
const STORAGE_KEY = "medilink.recentlyAccessed";

export function RecentProvider({ children }) {
  const [recentItems, setRecentItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default initial seeded recent items for demo presentation
    return [
      {
        id: "MED-01",
        type: "Medicine",
        title: "Dolo 650 (Paracetamol)",
        subtitle: "Micro Labs · 650mg Tablet",
        path: "/medicines/MED-01",
        timestamp: Date.now() - 1000 * 60 * 5, // 5 min ago
      },
      {
        id: "CUS-02",
        type: "Customer",
        title: "Suresh Babu",
        subtitle: "+91 90031 44567 · Kovilpatti",
        path: "/customers/CUS-02",
        timestamp: Date.now() - 1000 * 60 * 25, // 25 min ago
      },
      {
        id: "BR-01",
        type: "Branch",
        title: "Kovilpatti Branch (HQ)",
        subtitle: "12, VOC Street · 6 Staff",
        path: "/branches/BR-01",
        timestamp: Date.now() - 1000 * 60 * 60, // 1 hr ago
      },
      {
        id: "MED-16",
        type: "Medicine",
        title: "Human Mixtard Insulin",
        subtitle: "Novo Nordisk · 40 IU/ml Rx",
        path: "/medicines/MED-16",
        timestamp: Date.now() - 1000 * 60 * 120, // 2 hrs ago
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentItems));
    } catch {
      // ignore
    }
  }, [recentItems]);

  const addRecentItem = ({ id, type, title, subtitle, path }) => {
    if (!path || !title) return;
    setRecentItems((prev) => {
      const filtered = prev.filter((item) => item.path !== path);
      const updated = [
        {
          id: id || path,
          type: type || "Record",
          title,
          subtitle: subtitle || "",
          path,
          timestamp: Date.now(),
        },
        ...filtered,
      ].slice(0, 10);
      return updated;
    });
  };

  const clearRecent = () => {
    setRecentItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <RecentContext.Provider value={{ recentItems, addRecentItem, clearRecent }}>
      {children}
    </RecentContext.Provider>
  );
}

export function useRecent() {
  const ctx = useContext(RecentContext);
  if (!ctx) {
    return {
      recentItems: [],
      addRecentItem: () => {},
      clearRecent: () => {},
    };
  }
  return ctx;
}
