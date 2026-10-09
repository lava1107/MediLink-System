import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useApp } from "../hooks/useApp.js";

// Restricts a subtree of routes to specific roles (e.g. Users/Branches/Categories = Admin only).
// Pharmacist accounts attempting these URLs are bounced back to the dashboard with a toast.
export default function RoleRoute({ allow = ["Admin"] }) {
  const { user } = useAuth();
  const { toast } = useApp();

  useEffect(() => {
    if (user && !allow.includes(user.role)) {
      toast("You don't have access to that section.", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
