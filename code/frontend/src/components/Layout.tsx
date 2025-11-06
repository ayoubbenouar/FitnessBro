// src/components/Layout.tsx
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  return (
    <div className="flex bg-gray-100 min-h-screen text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-0 lg:ml-64 transition-all">
        <Topbar />
        <main className="flex-1 p-6">
          <Outlet /> {/* ✅ les pages coach s’affichent ici */}
        </main>
      </div>
    </div>
  );
}
