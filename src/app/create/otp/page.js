"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function verify() {
    if (!otp || !mobile) {
      setError("Please enter OTP and mobile number");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp,
          mobile,
          txnId: sessionStorage.getItem("txnId"),
          token: sessionStorage.getItem("token"),
          publicKey: sessionStorage.getItem("publicKey")
        })
      }).then(r => r.json());

      sessionStorage.setItem("result", JSON.stringify(res));
      router.push("/success");
    } catch (err) {
      setError("OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors px-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-lg dark:shadow-black/40 p-8">
        
        {/* Header */}
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2 text-center">
          Verify OTP
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
          Enter the OTP sent to your mobile
        </p>

        {/* OTP */}
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          OTP
        </label>
        <input
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
          placeholder="Enter OTP"
          maxLength={6}
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
          disabled={loading}
        />

        {/* Mobile */}
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Mobile Number
        </label>
        <input
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
          placeholder="Enter Mobile Number"
          maxLength={10}
          value={mobile}
          onChange={e => setMobile(e.target.value.replace(/\D/g, ""))}
          disabled={loading}
        />

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 mb-3">
            {error}
          </div>
        )}

        {/* Button */}
        <button
          onClick={verify}
          disabled={loading}
          className={`w-full py-2.5 rounded-md font-medium transition
            ${loading
              ? "bg-green-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"}
            text-white`}
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
          Secure OTP verification powered by ABHA Sandbox
        </div>
      </div>
    </div>
  );
}
