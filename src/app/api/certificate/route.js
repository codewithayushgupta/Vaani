import { uuid, timestamp } from "@/app/lib/abdm";

export async function POST(req) {
  const { token } = await req.json();

  const res = await fetch(
    "https://abhasbx.abdm.gov.in/abha/api/v3/profile/public/certificate",
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "REQUEST-ID": uuid(),
        "TIMESTAMP": timestamp(),
        "X-CM-ID": "sbx"
      }
    }
  );

  return Response.json(await res.json());
}
