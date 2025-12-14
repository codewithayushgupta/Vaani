"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateABHA() {
  const [aadhaar, setAadhaar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function startCreate() {
    if (aadhaar.length !== 12) {
      setError("Please enter a valid 12-digit Aadhaar number");
      return;
    }

    try {
      setError("");
      setLoading(true);

      // 1. Session
      const session = await fetch("/api/session", { method: "POST" })
        .then(r => r.json());
      sessionStorage.setItem("token", session.accessToken);

      // 2. Certificate
      const cert = await fetch("/api/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.accessToken })
      }).then(r => r.json());
      sessionStorage.setItem("publicKey", cert.publicKey);

      // 3. Send OTP
      const otp = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaar,
          token: session.accessToken,
          publicKey: cert.publicKey
        })
      }).then(r => r.json());

      sessionStorage.setItem("txnId", otp.txnId);
      sessionStorage.setItem("flow", "create");

      router.push("/create/otp");
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors px-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-lg dark:shadow-black/40 p-8">
        
        {/* Header */}
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2 text-center">
          Create ABHA
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
          Verify Aadhaar to generate ABHA
        </p>

        {/* Input */}
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Aadhaar Number
        </label>
        <input
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          placeholder="Enter 12-digit Aadhaar"
          maxLength={12}
          value={aadhaar}
          onChange={e => setAadhaar(e.target.value.replace(/\D/g, ""))}
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
          onClick={startCreate}
          disabled={loading}
          className={`w-full py-2.5 rounded-md font-medium transition
            ${loading
              ? "bg-blue-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"}
            text-white`}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
          Secure Aadhaar verification via ABHA Sandbox
        </div>
      </div>
    </div>
  );
}
