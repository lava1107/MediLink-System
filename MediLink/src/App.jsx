import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import RoleRoute from "./routes/RoleRoute.jsx";
import AppLayout from "./layouts/AppLayout.jsx";

import LoginPage from "./pages/auth/LoginPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import UsersPage from "./pages/users/UsersPage.jsx";
import BranchesPage from "./pages/branches/BranchesPage.jsx";
import BranchDetailPage from "./pages/branches/BranchDetailPage.jsx";
import MedicinesPage from "./pages/medicines/MedicinesPage.jsx";
import MedicineDetailPage from "./pages/medicines/MedicineDetailPage.jsx";
import CategoriesPage from "./pages/categories/CategoriesPage.jsx";
import BatchesPage from "./pages/batches/BatchesPage.jsx";
import SuppliersPage from "./pages/suppliers/SuppliersPage.jsx";
import SupplierDetailPage from "./pages/suppliers/SupplierDetailPage.jsx";
import PurchasesPage from "./pages/purchases/PurchasesPage.jsx";
import POSPage from "./pages/sales/POSPage.jsx";
import PrescriptionsPage from "./pages/prescriptions/PrescriptionsPage.jsx";
import CustomersPage from "./pages/customers/CustomersPage.jsx";
import CustomerDetailPage from "./pages/customers/CustomerDetailPage.jsx";
import ReservationsPage from "./pages/reservations/ReservationsPage.jsx";
import AvailabilityPage from "./pages/availability/AvailabilityPage.jsx";
import PartnerShopsPage from "./pages/partners/PartnerShopsPage.jsx";
import ReportsPage from "./pages/reports/ReportsPage.jsx";
import ReportDetailPage from "./pages/reports/ReportDetailPage.jsx";
import NotificationsPage from "./pages/notifications/NotificationsPage.jsx";
import SettingsPage from "./pages/settings/SettingsPage.jsx";
import ApiAccessPage from "./pages/api/ApiAccessPage.jsx";
import CommunicationPage from "./pages/communication/CommunicationPage.jsx";
import GoogleCallbackPage from "./pages/auth/GoogleCallbackPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

      {/* All routes below require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<Navigate to="/settings?tab=profile" replace />} />

          {/* Admin-only sections */}
          <Route element={<RoleRoute allow={["Admin"]} />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/branches/:id" element={<BranchDetailPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
          </Route>

          {/* Shared Admin + Pharmacist sections */}
          <Route path="/medicines" element={<MedicinesPage />} />
          <Route path="/medicines/:id" element={<MedicineDetailPage />} />
          <Route path="/batches" element={<BatchesPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/sales" element={<POSPage />} />
          <Route path="/prescriptions" element={<PrescriptionsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/availability" element={<AvailabilityPage />} />
          <Route path="/partners" element={<PartnerShopsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:key" element={<ReportDetailPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/communication" element={<CommunicationPage />} />
          <Route path="/api-access" element={<ApiAccessPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
