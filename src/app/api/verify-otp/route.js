import { encrypt, uuid, timestamp } from "@/app/lib/abdm";

export async function POST(req) {
  const { otp, txnId, mobile, token, publicKey } = await req.json();

  const encryptedOtp = encrypt(otp, publicKey);

  const res = await fetch(
    "https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/enrol/byAadhaar",
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
        authData: {
          authMethods: ["otp"],
          otp: {
            txnId,
            otpValue: encryptedOtp,
            mobile
          }
        },
        consent: {
          code: "abha-enrollment",
          version: "1.4"
        }
      })
    }
  );

  return Response.json(await res.json());
}
