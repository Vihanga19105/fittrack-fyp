import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import api from "../../api/api";

const BLUE = "#29ABE2";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "client",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── frontend validation first ──
    if (!form.name || !form.email ||
        !form.password || !form.confirmPassword) {
      Swal.fire("Error",
        "All fields are required", "error");
      return;
    }

    if (form.password.length < 6) {
      Swal.fire("Error",
        "Password must be at least 6 characters",
        "error");
      return;
    }

    if (form.password !== form.confirmPassword) {
      Swal.fire("Error",
        "Passwords do not match", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role.toUpperCase(),
      });

      // ── only runs if request was successful ──
      await Swal.fire({
        title: "Registration Successful! 🎉",
        text: typeof res.data === "string"
          ? res.data
          : "Your account has been created!",
        icon: "success",
        confirmButtonColor: BLUE,
      });

      navigate("/login");

    } catch (error) {
      // ── error — stay on page, show message ──
      const msg =
        error?.response?.data ||
        error?.message ||
        "Registration failed. Please try again.";
      Swal.fire({
        title: "Registration Failed",
        text: String(msg),
        icon: "error",
        confirmButtonColor: BLUE,
      });
      // do NOT navigate — user stays on register page

    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex items-center
                      justify-center bg-[#EEF4FF]
                      px-4 pt-24">
        <form onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl w-full
                     max-w-md shadow-xl">

          <h2 className="text-4xl font-bold mb-2
                          text-center text-gray-800">
            Register
          </h2>
          <p className="text-center text-gray-500
                        text-sm mb-6">
            Create your FitTrack account
          </p>

          {/* FULL NAME */}
          <label className="text-sm font-medium
                            text-gray-700 mb-1 block">
            Full Name
          </label>
          <input type="text" name="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
            className="w-full mb-4 p-3 rounded-lg border
                       border-gray-300 outline-none
                       text-gray-800 bg-white
                       focus:border-blue-400
                       focus:ring-2 focus:ring-blue-100" />

          {/* EMAIL */}
          <label className="text-sm font-medium
                            text-gray-700 mb-1 block">
            Email
          </label>
          <input type="email" name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            className="w-full mb-4 p-3 rounded-lg border
                       border-gray-300 outline-none
                       text-gray-800 bg-white
                       focus:border-blue-400
                       focus:ring-2 focus:ring-blue-100" />

          {/* PASSWORD */}
          <label className="text-sm font-medium
                            text-gray-700 mb-1 block">
            Password
          </label>
          <input type="password" name="password"
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={handleChange}
            className="w-full mb-4 p-3 rounded-lg border
                       border-gray-300 outline-none
                       text-gray-800 bg-white
                       focus:border-blue-400
                       focus:ring-2 focus:ring-blue-100" />

          {/* CONFIRM PASSWORD */}
          <label className="text-sm font-medium
                            text-gray-700 mb-1 block">
            Confirm Password
          </label>
          <input type="password" name="confirmPassword"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full mb-4 p-3 rounded-lg border
                       border-gray-300 outline-none
                       text-gray-800 bg-white
                       focus:border-blue-400
                       focus:ring-2 focus:ring-blue-100" />

          {/* ROLE */}
          <label className="text-sm font-medium
                            text-gray-700 mb-1 block">
            I am a
          </label>
          <select name="role" value={form.role}
            onChange={handleChange}
            className="w-full mb-4 p-3 rounded-lg border
                       border-gray-300 outline-none
                       text-gray-800 bg-white
                       focus:border-blue-400
                       focus:ring-2 focus:ring-blue-100">
            <option value="client">Client</option>
            <option value="trainer">Trainer</option>
          </select>

          {/* TRAINER NOTE */}
          {form.role === "trainer" && (
            <div className="mb-4 bg-yellow-50 border
                            border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-700 text-sm">
                ⚠️ After registering, login and complete
                your profile. Admin will review and
                approve your account before you can
                accept clients.
              </p>
            </div>
          )}

          {/* CLIENT NOTE */}
          {form.role === "client" && (
            <div className="mb-4 rounded-lg p-3"
              style={{ background: "#E8F7FD",
                       border: "1px solid #29ABE2" }}>
              <p className="text-sm"
                style={{ color: "#1A8FBF" }}>
                ✅ Client accounts are approved instantly.
                You can login right after registering!
              </p>
            </div>
          )}

          {/* SUBMIT */}
          <button type="submit" disabled={loading}
            className="w-full text-white py-3 rounded-lg
                       font-semibold transition
                       hover:opacity-90 disabled:opacity-60"
            style={{ background: BLUE }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-sm text-center mt-4
                        text-gray-500">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}
              className="font-medium cursor-pointer
                         hover:underline"
              style={{ color: BLUE }}>
              Login
            </span>
          </p>
        </form>
      </div>

      <Footer />
    </>
  );
}