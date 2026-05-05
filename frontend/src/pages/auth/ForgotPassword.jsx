import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const API = "http://localhost:8080/api";
const BLUE = "#29ABE2";
const BLUE_DARK = "#1A8FBF";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ── STEP 1: SEND OTP ──
  const sendOtp = async () => {
    if (!email || !email.includes("@")) {
      Swal.fire("Error", "Enter a valid email address",
        "error");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API}/auth/forgot-password/send-otp`,
        { email }
      );
      Swal.fire({
        title: "OTP Sent! 📧",
        text: "Check your Mailtrap inbox for the OTP code",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      setStep(2);
    } catch (err) {
      Swal.fire("Error",
        err?.response?.data || "Failed to send OTP",
        "error");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: VERIFY OTP ──
  const verifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Swal.fire("Error", "Enter the 6-digit OTP", "error");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API}/auth/forgot-password/verify-otp`,
        { email, otp }
      );
      Swal.fire({
        title: "Verified! ✅",
        text: "OTP verified successfully",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      setStep(3);
    } catch (err) {
      Swal.fire("Error",
        err?.response?.data || "Invalid OTP",
        "error");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: RESET PASSWORD ──
  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Swal.fire("Error", "All fields are required", "error");
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire("Error",
        "Password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire("Error", "Passwords do not match", "error");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API}/auth/forgot-password/reset`,
        { email, otp, newPassword }
      );
      Swal.fire({
        title: "Password Reset! 🎉",
        text: "Your password has been reset successfully",
        icon: "success",
        confirmButtonColor: BLUE,
      }).then(() => navigate("/login"));
    } catch (err) {
      Swal.fire("Error",
        err?.response?.data || "Failed to reset password",
        "error");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Email", "Verify OTP", "New Password"];

  return (
    <div className="min-h-screen flex items-center
                    justify-center px-4"
      style={{ background: "#f0f9ff" }}>
      <div className="w-full max-w-md">

        {/* ── CARD ── */}
        <div className="bg-white rounded-2xl shadow-lg
                        overflow-hidden">

          {/* header */}
          <div className="px-8 py-8 text-white text-center"
            style={{ background: `linear-gradient(135deg,
              ${BLUE_DARK} 0%, ${BLUE} 100%)` }}>
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="text-2xl font-bold">
              Forgot Password
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Reset your FitTrack password
            </p>
          </div>

          {/* progress steps */}
          <div className="flex items-center px-8 py-4
                          border-b border-gray-100">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center
                                      flex-1">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full
                                  flex items-center
                                  justify-center text-sm
                                  font-bold text-white"
                    style={{
                      background: step > i + 1
                        ? "#10b981"
                        : step === i + 1
                        ? BLUE : "#e5e7eb",
                      color: step <= i + 1 && i + 1 !== step
                        ? "#9ca3af" : "white"
                    }}>
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  <p className="text-xs mt-1 text-gray-500">
                    {s}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-4"
                    style={{
                      background: step > i + 1
                        ? "#10b981" : "#e5e7eb"
                    }}/>
                )}
              </div>
            ))}
          </div>

          {/* form */}
          <div className="px-8 py-6 space-y-4">

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <div>
                  <label className="text-sm text-gray-500
                                    mb-1 block">
                    Email Address
                  </label>
                  <input type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && sendOtp()}
                    placeholder="Enter your email address"
                    className="w-full border border-gray-200
                               rounded-xl px-4 py-3
                               text-gray-800 focus:outline-none
                               text-sm"/>
                </div>
                <p className="text-xs text-gray-400">
                  We'll send a 6-digit OTP to your email
                </p>
                <button onClick={sendOtp}
                  disabled={loading}
                  className="w-full py-3 rounded-xl
                             text-white font-bold
                             transition-all active:scale-95
                             disabled:opacity-50"
                  style={{ background: BLUE }}>
                  {loading ? "Sending..." : "Send OTP 📧"}
                </button>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <div className="bg-blue-50 rounded-xl p-3
                                text-sm text-center"
                  style={{ borderColor: BLUE,
                    border: `1px solid ${BLUE}30` }}>
                  <p className="text-gray-500">
                    OTP sent to
                  </p>
                  <p className="font-semibold"
                    style={{ color: BLUE }}>
                    {email}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Check your Mailtrap inbox
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500
                                    mb-1 block">
                    Enter OTP Code
                  </label>
                  <input type="text" value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && verifyOtp()}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full border border-gray-200
                               rounded-xl px-4 py-3
                               text-gray-800 focus:outline-none
                               text-sm text-center
                               tracking-widest text-lg
                               font-bold"/>
                </div>
                <p className="text-xs text-gray-400
                               text-center">
                  OTP expires in 5 minutes
                </p>
                <button onClick={verifyOtp}
                  disabled={loading}
                  className="w-full py-3 rounded-xl
                             text-white font-bold
                             transition-all active:scale-95
                             disabled:opacity-50"
                  style={{ background: BLUE }}>
                  {loading ? "Verifying..." : "Verify OTP ✓"}
                </button>
                <button
                  onClick={() => { setStep(1); setOtp(""); }}
                  className="w-full py-2 text-sm
                             text-gray-400 hover:text-gray-600">
                  ← Change Email
                </button>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <div className="bg-green-50 rounded-xl p-3
                                text-sm text-center border
                                border-green-200">
                  <p className="text-green-600 font-semibold">
                    ✅ OTP Verified! Set your new password
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500
                                    mb-1 block">
                    New Password
                  </label>
                  <input type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full border border-gray-200
                               rounded-xl px-4 py-3
                               text-gray-800 focus:outline-none
                               text-sm"/>
                </div>
                <div>
                  <label className="text-sm text-gray-500
                                    mb-1 block">
                    Confirm New Password
                  </label>
                  <input type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && resetPassword()}
                    placeholder="Repeat your password"
                    className="w-full border border-gray-200
                               rounded-xl px-4 py-3
                               text-gray-800 focus:outline-none
                               text-sm"/>
                </div>
                <button onClick={resetPassword}
                  disabled={loading}
                  className="w-full py-3 rounded-xl
                             text-white font-bold
                             transition-all active:scale-95
                             disabled:opacity-50"
                  style={{ background: BLUE }}>
                  {loading
                    ? "Resetting..."
                    : "Reset Password 🔐"}
                </button>
              </>
            )}

            {/* back to login */}
            <button onClick={() => navigate("/login")}
              className="w-full py-2 text-sm text-gray-400
                         hover:text-gray-600 text-center">
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}