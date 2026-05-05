import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-white">

      {/* SIDEBAR (keep dark if you want) */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col bg-white">

        {/* NAVBAR */}
        <Navbar />

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 bg-white text-gray-900">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
