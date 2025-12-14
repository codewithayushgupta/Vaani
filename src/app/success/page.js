"use client";
import { useEffect, useState } from "react";

export default function Success() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("result");
    if (!raw) return;

    const parsed = JSON.parse(raw);
    setProfile(parsed.ABHAProfile);
  }, []);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-lg dark:shadow-black/40 overflow-hidden">
        
        {/* Header */}
        <div className="bg-green-600 dark:bg-green-700 px-6 py-4">
          <h2 className="text-white text-xl font-semibold">
            ABHA Profile Details
          </h2>
          <p className="text-green-100 text-sm">
            Ayushman Bharat Health Account
          </p>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Profile Photo */}
          <div className="flex flex-col items-center">
            {profile.photo ? (
              <img
                src={`data:image/jpeg;base64,${profile.photo}`}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border border-gray-300 dark:border-gray-600"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No Photo
              </div>
            )}

            <span className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {profile.abhaStatus}
            </span>
          </div>

          {/* Profile Info */}
          <div className="md:col-span-2 space-y-3 text-sm">
            <Info label="Full Name" value={`${profile.firstName} ${profile.middleName || ""} ${profile.lastName}`} />
            <Info label="Date of Birth" value={profile.dob} />
            <Info label="Gender" value={profile.gender} />
            <Info label="ABHA Number" value={profile.ABHANumber} />
            <Info label="PHR Address" value={profile.phrAddress && profile.phrAddress[0]} />
            <Info label="Mobile Number" value={profile.mobile} />
            <Info label="State" value={profile.stateName} />
            <Info label="District" value={profile.districtName} />
            <Info label="Address" value={profile.address} />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white py-2 rounded-md transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* Reusable Info Row */
function Info({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center">
      <span className="w-40 text-gray-500 dark:text-gray-400 font-medium">
        {label}
      </span>
      <span className="text-gray-800 dark:text-gray-100 break-words">
        {value || "-"}
      </span>
    </div>
  );
}
