import React from "react";
import { useAuth } from "../../hooks/useAuth.js";
import AdminDashboard from "./AdminDashboard.jsx";
import PharmacistDashboard from "./PharmacistDashboard.jsx";

// Single /dashboard route that renders the right dashboard for the signed-in role.
export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "Admin" ? <AdminDashboard /> : <PharmacistDashboard />;
}
