import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar.jsx";
import Navbar from "../components/layout/Navbar.jsx";
import Toast from "../components/common/Toast.jsx";
import MediBot from "../components/chat/MediBot.jsx";
import { useApp } from "../hooks/useApp.js";
import { T } from "../utils/theme.js";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { toasts } = useApp();

  return (
    <>
      <div className="flex min-h-screen" style={{ background: T.bg }}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Navbar toggleSidebar={() => setCollapsed((c) => !c)} />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <MediBot />
      <Toast toasts={toasts} />
    </>
  );
}
