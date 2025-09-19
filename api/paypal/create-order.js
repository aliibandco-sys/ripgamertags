// Minimal order creation route for PayPal (Sandbox)
// File: /pages/api/paypal/create-order.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  const { amount = '29.00', currency = 'USD' } = req.body || {}
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) return res.status(500).json({ error: 'Missing PayPal env' })

  const tokenResp = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  const { access_token } = await tokenResp.json()

  const orderResp = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: amount } }]]
    })
  })
  if (!orderResp.ok) {
    const t = await orderResp.text()
    return res.status(400).json({ error: t })
  }
  const order = await orderResp.json()
  res.status(200).json({ id: order.id })
}
