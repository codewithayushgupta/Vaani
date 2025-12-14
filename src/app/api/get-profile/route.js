import { uuid, timestamp } from "@/app/lib/abdm";

export async function POST(req) {
  const { userToken } = await req.json();

  const res = await fetch(
    "https://abhasbx.abdm.gov.in/abha/api/v3/profile",
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${userToken}`,
        "Accept": "application/json",
        "REQUEST-ID": uuid(),
        "TIMESTAMP": timestamp(),
        "X-CM-ID": "sbx"
      }
    }
  );

  return Response.json(await res.json());
}
