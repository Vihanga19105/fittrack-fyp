import Navbar from "../components/Navbar";
import ClientSidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function ClientLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden"
      style={{ background: "#f0f9ff" }}>

      {/* SIDEBAR — fixed, never moves */}
      <ClientSidebar />

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1
                      min-w-0 overflow-hidden">

        {/* NAVBAR */}
        <Navbar />

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}