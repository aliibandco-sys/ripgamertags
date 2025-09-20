// pages/api/after-pay.js
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { name, game, years, orderId } = req.body || {};
    if (!name || !game || !orderId) {
      return res.status(400).json({ error: "Missing name, game, or orderId" });
    }

    // 1) Verify PayPal order server-side (simple version)
    const base = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
    const id = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    if (!id || !secret) return res.status(500).json({ error: "Missing PayPal server creds" });

    // get access token
    const tokenResp = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!tokenResp.ok) {
      const t = await tokenResp.text();
      return res.status(500).json({ error: "PayPal token error", details: t });
    }
    const { access_token } = await tokenResp.json();

    // get order details
    const orderResp = await fetch(`${base}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const orderText = await orderResp.text();
    if (!orderResp.ok) {
      return res.status(500).json({ error: "PayPal order fetch error", details: orderText });
    }
    const order = JSON.parse(orderText);

    // basic validity checks (approved/captured in sandbox flow)
    const status = order.status; // e.g., APPROVED or COMPLETED
    if (!["APPROVED", "COMPLETED"].includes(status)) {
      return res.status(400).json({ error: "Order not approved", status });
    }

    // 2) Insert into Supabase (service role)
    const { data, error } = await supabaseAdmin
      .from("memorials")
      .insert([
        {
          name,
          game,
          years: years || null,
          order_id: orderId,
          status: "published",
          // image_url/accent_color can be filled later
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Supabase insert error", details: error.message });

    return res.status(200).json({ ok: true, memorial: data });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
