import { uuid, timestamp } from "@/app/lib/abdm";

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return Response.json(
        { error: "Missing access token" },
        { status: 400 }
      );
    }

    const res = await fetch(
      "https://abhasbx.abdm.gov.in/abha/api/v3/profile/public/certificate",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "REQUEST-ID": uuid(),
          "TIMESTAMP": timestamp(),
          "X-CM-ID": "sbx"
        }
      }
    );

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    return Response.json(data, { status: res.status });
  } catch (err) {
    console.error("PUBLIC KEY ERROR:", err);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
