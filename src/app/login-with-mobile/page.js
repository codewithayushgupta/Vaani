"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [txnId, setTxnId] = useState(null);
  const [error, setError] = useState(null);

  async function sendOtp() {
    setError(null);

    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    // 1️⃣ Get session token
    const sessionRes = await fetch("/api/session", { method: "POST" });
    const session = await sessionRes.json();

    // 2️⃣ Get public key (WITH TOKEN)
    const certRes = await fetch("/api/public-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: session.accessToken,
      }),
    });

    const certText = await certRes.text();

    if (!certRes.ok) {
      console.error("PUBLIC KEY ERROR:", certText);
      setError("Failed to get encryption key");
      return;
    }

    const cert = JSON.parse(certText);

    if (!cert.publicKey) {
      console.error("PUBLIC KEY ERROR:", cert);
      setError("Failed to get encryption key");
      return;
    }

    // 3️⃣ Send OTP
    const res = await fetch("/api/login/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobile,
        token: session.accessToken,
        publicKey: cert.publicKey,
      }),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("SEND OTP ERROR:", text);
      setError("Failed to send OTP");
      return;
    }

    const data = JSON.parse(text);
    setTxnId(data.txnId);
  }

  async function verifyOtp() {
    setError(null);

    const sessionRes = await fetch("/api/session", { method: "POST" });
    const session = await sessionRes.json();

    const certRes = await fetch("/api/public-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: session.accessToken }),
    });

    const certText = await certRes.text();
    if (!certRes.ok) {
      setError("Failed to get encryption key");
      return;
    }

    const cert = JSON.parse(certText);

    const res = await fetch("/api/login/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        otp,
        txnId,
        token: session.accessToken,
        publicKey: cert.publicKey,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      setError("OTP verification failed");
      return;
    }

    const data = JSON.parse(text);

    // ❌ No ABHA linked
    if (!data.accounts || data.accounts.length === 0) {
      setError("This user is not created yet");
      return;
    }

    // ✅ Save profile for success page
    sessionStorage.setItem(
      "result",
      JSON.stringify({
        ABHAProfile: data.accounts[0],
      })
    );

    // ✅ Redirect to success page
    router.push("/dashboard");
  }

  function Step({ active, children }) {
    return (
      <div
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
        }`}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-700 px-6 py-5 text-center">
          <h1 className="text-white text-xl font-semibold">ABHA Login</h1>
          <p className="text-blue-100 text-sm mt-1">
            Ayushman Bharat Health Account
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Step active={!txnId}>Mobile</Step>
            <div className="w-8 h-px bg-gray-300" />
            <Step active={!!txnId}>OTP</Step>
          </div>

          {!txnId ? (
            <>
              {/* Mobile Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>

              <button
                onClick={sendOtp}
                className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-medium py-2.5 rounded-lg"
              >
                Send OTP
              </button>
            </>
          ) : (
            <>
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  One Time Password
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 tracking-widest text-center text-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <button
                onClick={verifyOtp}
                className="w-full bg-green-600 hover:bg-green-700 transition text-white font-medium py-2.5 rounded-lg"
              >
                Verify & Login
              </button>

              <button
                onClick={() => setTxnId(null)}
                className="w-full text-sm text-gray-500 hover:underline"
              >
                Change mobile number
              </button>
            </>
          )}

          {/* Error Box */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">{error}</p>
              <button
                onClick={() => router.push("/create")}
                className="text-blue-700 underline font-medium"
              >
                Create ABHA
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 text-center text-xs text-gray-500 py-3">
          Government of India • ABDM Sandbox
        </div>
      </div>
    </div>
  );
}
