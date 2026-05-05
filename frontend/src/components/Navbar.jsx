import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import Swal from "sweetalert2";

const NAVY = "#0A2342";
const BLUE = "#29ABE2";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");
  const name  = localStorage.getItem("name");
  const isLoggedIn = !!token;

  // Dashboard pages have their own sidebar layout — navbar should NOT be fixed there
  const isDashboardPage =
    location.pathname.startsWith("/client") ||
    location.pathname.startsWith("/trainer") ||
    location.pathname.startsWith("/admin");

  const getDashboardLink = () => {
    if (role === "CLIENT")  return "/client/dashboard";
    if (role === "TRAINER") return "/trainer/dashboard";
    if (role === "ADMIN")   return "/admin/dashboard";
    return "/";
  };

  const logout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: BLUE,
      cancelButtonColor: "#475569",
      confirmButtonText: "Yes, Logout",
      background: NAVY,
      color: "#ffffff",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        sessionStorage.clear();
        navigate("/");
      }
    });
  };

  const menuItems = [
    { label: "Home",            path: "/"               },
    { label: "About",           path: "/about"          },
    { label: "Trainers",        path: "/trainers"       },
    { label: "🎯 Goal Predictor", path: "/goal-predictor" },
    { label: "FAQ",             path: "/faq"            },
    { label: "Contact",         path: "/contact"        },
  ];

  return (
    <header
      className={`${isDashboardPage ? "w-full" : "fixed top-0 left-0 w-full"} z-50 shadow-lg`}
      style={{ background: NAVY }}>
      <div className="h-16 px-6 flex items-center justify-between max-w-7xl mx-auto">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm"
            style={{ background: BLUE }}>F</div>
          <span className="text-xl font-black text-white tracking-wide">
            Fit<span style={{ color: BLUE }}>Track</span>
          </span>
        </Link>

        {/* DESKTOP MENU */}
        <nav className="hidden md:flex items-center gap-1">
          {menuItems.map(({ label, path }) => (
            <Link key={label} to={path}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                color:      path === "/goal-predictor" ? BLUE : "rgba(255,255,255,0.7)",
                background: path === "/goal-predictor" ? "rgba(41,171,226,0.15)" : "transparent",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = path === "/goal-predictor" ? BLUE : "rgba(255,255,255,0.7)"; e.currentTarget.style.background = path === "/goal-predictor" ? "rgba(41,171,226,0.15)" : "transparent"; }}>
              {label}
            </Link>
          ))}
          {isLoggedIn && (
            <Link to={getDashboardLink()}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ color: BLUE }}>
              Dashboard
            </Link>
          )}
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden md:flex gap-2 items-center">
          {!isLoggedIn ? (
            <>
              <Link to="/login"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all border"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                Login
              </Link>
              <Link to="/register"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: BLUE }}>
                Get Started
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: BLUE }}>
                  {name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{name}</span>
              </div>
              <button onClick={logout}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: "#ef4444" }}>
                Logout
              </button>
            </div>
          )}
        </div>

        {/* MOBILE BUTTON */}
        <button onClick={() => setOpen(!open)}
          className="md:hidden text-white text-2xl p-2 rounded-lg transition-all"
          style={{ background: open ? "rgba(255,255,255,0.1)" : "transparent" }}>
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden px-4 pb-4 pt-2 space-y-1"
          style={{ background: NAVY, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {menuItems.map(({ label, path }) => (
            <Link key={label} to={path} onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ color: path === "/goal-predictor" ? BLUE : "rgba(255,255,255,0.7)", background: path === "/goal-predictor" ? "rgba(41,171,226,0.15)" : "transparent" }}>
              {label}
            </Link>
          ))}
          {isLoggedIn && (
            <Link to={getDashboardLink()} onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ color: BLUE }}>
              Dashboard
            </Link>
          )}
          <div className="pt-2 border-t space-y-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {!isLoggedIn ? (
              <>
                <Link to="/login" onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-center text-white border"
                  style={{ borderColor: "rgba(255,255,255,0.2)" }}>Login</Link>
                <Link to="/register" onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-center text-white"
                  style={{ background: BLUE }}>Get Started</Link>
              </>
            ) : (
              <>
                <p className="text-xs px-4" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Logged in as <span style={{ color: BLUE }} className="font-semibold">{name}</span>
                </p>
                <button onClick={() => { setOpen(false); logout(); }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#ef4444" }}>Logout</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}