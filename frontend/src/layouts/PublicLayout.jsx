import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="bg-navy min-h-screen text-white">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}