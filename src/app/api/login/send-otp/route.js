import { encrypt, uuid, timestamp } from "@/app/lib/abdm";

export async function POST(req) {
  try {
    const { mobile, token, publicKey } = await req.json();

    if (!mobile || !token || !publicKey) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const encryptedMobile = encrypt(mobile, publicKey);

    const abdmRes = await fetch(
      "https://abhasbx.abdm.gov.in/abha/api/v3/profile/login/request/otp",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "REQUEST-ID": uuid(),
          TIMESTAMP: timestamp(),
          "X-CM-ID": "sbx",
        },
        body: JSON.stringify({
          scope: ["abha-login", "mobile-verify"],
          loginHint: "mobile",
          loginId: encryptedMobile,
          otpSystem: "abdm",
        }),
      }
    );

    const raw = await abdmRes.text();
    console.log("ABDM LOGIN OTP RAW:", raw);

    const data = raw ? JSON.parse(raw) : {};
    return Response.json(data, { status: abdmRes.status });
  } catch (err) {
    console.error("LOGIN SEND OTP ERROR:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
