"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("result");
    if (!raw) {
      router.replace("/");
      return;
    }

    const parsed = JSON.parse(raw);
    setProfile(parsed.ABHAProfile);
  }, [router]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow overflow-hidden">

        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-white text-2xl font-semibold">
            ABHA Dashboard
          </h1>
          <p className="text-blue-100 text-sm">
            Ayushman Bharat Health Account
          </p>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Profile Photo */}
          <div className="flex flex-col items-center">
            {profile.profilePhoto ? (
              <img
                src={`data:image/jpeg;base64,${profile.profilePhoto}`}
                alt="Profile"
                className="w-32 h-32 rounded-full border"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                No Photo
              </div>
            )}

            <span className="mt-3 text-sm font-medium text-green-600">
              {profile.status}
            </span>
          </div>

          {/* Info */}
          <div className="md:col-span-2 space-y-3 text-sm">
            <Info label="Full Name" value={profile.name} />
            <Info label="Gender" value={profile.gender} />
            <Info label="Date of Birth" value={profile.dob} />
            <Info label="ABHA Number" value={profile.ABHANumber} />
            <Info label="PHR Address" value={profile.preferredAbhaAddress} />
            <Info label="Verified Status" value={profile.verifiedStatus} />
            <Info label="Verification Type" value={profile.verificationType} />
            <Info label="Account Status" value={profile.status} />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex-1 bg-gray-800 text-white py-2 rounded"
          >
            Home
          </button>

          <button
            onClick={() => {
              sessionStorage.clear();
              router.push("/");
            }}
            className="flex-1 bg-red-600 text-white py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/* Reusable row */
function Info({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row">
      <span className="w-48 font-medium text-gray-500">{label}</span>
      <span className="text-gray-800 break-words">
        {value || "-"}
      </span>
    </div>
  );
}
