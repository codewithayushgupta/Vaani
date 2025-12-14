import { encrypt, uuid, timestamp } from "@/app/lib/abdm";

export async function POST(req) {
  try {
    const { otp, txnId, token, publicKey } = await req.json();

    if (!otp || !txnId || !token || !publicKey) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const encryptedOtp = encrypt(otp, publicKey);

    const abdmRes = await fetch(
      "https://abhasbx.abdm.gov.in/abha/api/v3/profile/login/verify",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "REQUEST-ID": uuid(),
          "TIMESTAMP": timestamp(),
          "X-CM-ID": "sbx"
        },
        body: JSON.stringify({
          scope: ["abha-login", "mobile-verify"],
          authData: {
            authMethods: ["otp"],
            otp: {
              txnId,
              otpValue: encryptedOtp
            }
          }
        })
      }
    );

    const raw = await abdmRes.text();
    console.log("ABDM VERIFY OTP RAW:", raw);

    const data = raw ? JSON.parse(raw) : {};
    return Response.json(data, { status: abdmRes.status });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
