import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying your email...");
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Get the token from the URL
    const token = searchParams.get("token");

    if (!token) {
      setMessage("Invalid verification link.");
      setSuccess(false);
      return;
    }
    

    // ✅ Call backend to verify
    api.get(`/api/auth/verify?token=${token}`)
      .then((res) => {
        setMessage(res.data);
        setSuccess(true);
        // ✅ Go to login after 3 seconds
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((err) => {
        setMessage(err?.response?.data || "Verification failed.");
        setSuccess(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEF4FF]">
      <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
        <p className={
          success === true ? "text-green-600 text-lg" :
          success === false ? "text-red-500 text-lg" :
          "text-gray-500 text-lg"
        }>
          {message}
        </p>
        {success && (
          <p className="text-sm text-gray-400 mt-3">
            Redirecting to login in 3 seconds...
          </p>
        )}
      </div>
    </div>
  );
}