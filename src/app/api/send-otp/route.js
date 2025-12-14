import { encrypt, uuid, timestamp } from "@/app/lib/abdm";

export async function POST(req) {
  const { aadhaar, token, publicKey } = await req.json();

  const encryptedAadhaar = encrypt(aadhaar, publicKey);

  const res = await fetch(
    "https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/request/otp",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "REQUEST-ID": uuid(),
        "TIMESTAMP": timestamp(),
        "X-CM-ID": "sbx"
      },
      body: JSON.stringify({
        txnId: "",
        scope: ["abha-enrol"],
        loginHint: "aadhaar",
        loginId: encryptedAadhaar,
        otpSystem: "aadhaar"
      })
    }
  );

  return Response.json(await res.json());
}
