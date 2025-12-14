"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(null); // "create" | "login" | null

  const handleNavigate = (path, type) => {
    setLoading(type);
    router.push(path);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors px-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-lg dark:shadow-black/40 p-8 text-center">
        
        {/* Header */}
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
          ABHA Sandbox
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Ayushman Bharat Health Account
        </p>

        {/* Create ABHA */}
        <button
          onClick={() => handleNavigate("/create", "create")}
          disabled={loading !== null}
          className={`w-full py-2.5 rounded-md font-medium transition mb-4
            ${loading === "create"
              ? "bg-blue-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"}
            text-white`}
        >
          {loading === "create" ? "Redirecting..." : "Create ABHA"}
        </button>

        {/* Login ABHA */}
        <button
          onClick={() => handleNavigate("/login", "login")}
          disabled={loading !== null}
          className={`w-full py-2.5 rounded-md font-medium transition
            ${loading === "login"
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gray-700 hover:bg-gray-800"}
            text-white`}
        >
          {loading === "login" ? "Redirecting..." : "Login ABHA"}
        </button>

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          Government of India • ABHA Sandbox
        </div>
      </div>
    </div>
  );
}
