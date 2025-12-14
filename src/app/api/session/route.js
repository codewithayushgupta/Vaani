import { uuid, timestamp } from "@/app/lib/abdm";

export async function POST() {
  const res = await fetch(
    "https://dev.abdm.gov.in/api/hiecm/gateway/v3/sessions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "REQUEST-ID": uuid(),
        "TIMESTAMP": timestamp(),
        "X-CM-ID": "sbx"
      },
      body: JSON.stringify({
        clientId: process.env.ABDM_CLIENT_ID,
        clientSecret: process.env.ABDM_CLIENT_SECRET,
        grantType: "client_credentials"
      })
    }
  );

  return Response.json(await res.json());
}
