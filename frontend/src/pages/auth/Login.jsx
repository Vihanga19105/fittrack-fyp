import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import api from "../../api/api";

const BLUE = "#29ABE2";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!form.email || !form.password) {
      await Swal.fire({
        title: "Error",
        text: "Email and Password are required",
        icon: "error",
        confirmButtonColor: BLUE,
        allowOutsideClick: false,
      });
      return;
    }

    if (!form.email.includes("@")) {
      await Swal.fire({
        title: "Error",
        text: "Enter a valid email address",
        icon: "error",
        confirmButtonColor: BLUE,
        allowOutsideClick: false,
      });
      return;
    }

    if (form.password.length < 6) {
      await Swal.fire({
        title: "Error",
        text: "Password must be at least 6 characters",
        icon: "error",
        confirmButtonColor: BLUE,
        allowOutsideClick: false,
      });
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", {
        email: form.email,
        password: form.password,
      });

      const { token, role, userId, name } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", String(userId));
      localStorage.setItem("name", name);

      await Swal.fire({
        title: "Login Successful",
        text: `Welcome ${name}! 👋`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        allowOutsideClick: false,
      });

      if (role === "CLIENT") {
        navigate("/client/dashboard");
      } else if (role === "TRAINER") {
        navigate("/trainer/dashboard");
      } else if (role === "ADMIN") {
        navigate("/admin/dashboard");
      }

    } catch (error) {
      let msg = "Invalid email or password. Please try again.";

      if (error?.response?.data) {
        if (typeof error.response.data === "string") {
          msg = error.response.data;
        } else if (error.response.data?.message) {
          msg = error.response.data.message;
        } else if (error.response.data?.error) {
          msg = error.response.data.error;
        }
      }

      setForm({ email: "", password: "" });
      setLoading(false);

      await Swal.fire({
        title: "Login Failed",
        text: msg,
        icon: "error",
        confirmButtonColor: BLUE,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex items-center justify-center bg-[#EEF4FF] px-4 pt-24">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl w-full max-w-md shadow-xl"
        >
          <h2 className="text-4xl text-gray-800 font-bold mb-2 text-center">
            Login
          </h2>
          <p className="text-center text-gray-500 text-sm mb-6">
            Welcome back to FitTrack
          </p>

          {/* EMAIL */}
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            className="w-full mb-4 p-3 rounded-lg border border-gray-300 outline-none text-gray-800 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />

          {/* PASSWORD */}
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Password
          </label>
          <div className="relative mb-2">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-300 outline-none text-gray-800 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 pr-10"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 cursor-pointer text-gray-400 hover:text-gray-600 text-lg"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* FORGOT PASSWORD */}
          <p
            onClick={() => navigate("/forgot-password")}
            className="text-sm text-right mb-5 cursor-pointer hover:underline"
            style={{ color: BLUE }}
          >
            Forgot Password?
          </p>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: BLUE }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-sm text-center mt-4 text-gray-500">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="font-medium cursor-pointer hover:underline"
              style={{ color: BLUE }}
            >
              Register
            </span>
          </p>
        </form>
      </div>

      <Footer />
    </>
  );
}