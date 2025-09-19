// pages/api/checkout/start.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { amount = "1.00", currency = "USD" } = req.body || {};

    const base = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
    const id = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;

    if (!id || !secret) {
      return res.status(500).send("Missing PAYPAL_CLIENT_ID or PAYPAL_SECRET on server");
    }

    // 1) Get access token
    const tokenResp = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResp.ok) {
      const t = await tokenResp.text();
      return res.status(500).send("Token error: " + t);
    }
    const { access_token } = await tokenResp.json();

    // 2) Create order
    const orderResp = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: currency, value: amount },
            description: "RIPGAMERTAGS burial",
          },
        ],
      }),
    });

    const text = await orderResp.text(); // return raw text for easier debugging
    if (!orderResp.ok) {
      return res.status(500).send("Create order error: " + text);
    }

    // Expect JSON with { id, status, links, ... }
    res.status(200).send(text);
  } catch (e) {
    res.status(500).send("Server error: " + (e?.message || e));
  }
}
