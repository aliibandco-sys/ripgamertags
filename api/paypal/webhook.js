// Next.js API route or Express handler for PayPal webhooks
// File path (Next Pages Router): /pages/api/paypal/webhook.js
// If using Express, export default function(req,res) and mount at POST /api/paypal/webhook

import { createClient } from '@supabase/supabase-js'

function getEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

const supabase = createClient(
  getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY'), // server-side
  { auth: { persistSession: false } }
)

async function getPayPalAccessToken() {
  const id = getEnv('PAYPAL_CLIENT_ID')
  const secret = getEnv('PAYPAL_CLIENT_SECRET')
  const auth = Buffer.from(id + ':' + secret).toString('base64')
  const resp = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error('PayPal token error: ' + t)
  }
  const json = await resp.json()
  return json.access_token
}

async function verifyWebhookSignature(req) {
  const accessToken = await getPayPalAccessToken()
  const verificationBody = {
    auth_algo: req.headers['paypal-auth-algo'],
    cert_url: req.headers['paypal-cert-url'],
    transmission_id: req.headers['paypal-transmission-id'],
    transmission_sig: req.headers['paypal-transmission-sig'],
    transmission_time: req.headers['paypal-transmission-time'],
    webhook_id: getEnv('PAYPAL_WEBHOOK_ID'),
    webhook_event: req.body
  }

  const resp = await fetch('https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(verificationBody)
  })

  const json = await resp.json()
  return json.verification_status === 'SUCCESS'
}

async function handlePaid(order) {
  const paypalOrderId = order?.id || order?.resource?.id

  // 1) Mark order paid (idempotent by paypal_order_id)
  const { data: existing } = await supabase
    .from('orders')
    .select('id, status, user_id, draft_id')
    .eq('paypal_order_id', paypalOrderId)
    .maybeSingle()

  if (!existing) {
    // If no row exists yet, create a minimal one (no user context available via webhook)
    await supabase.from('orders').insert({
      paypal_order_id: paypalOrderId,
      status: 'paid'
    })
    return
  }

  if (existing.status === 'paid') {
    // already processed
    return
  }

  await supabase.from('orders')
    .update({ status: 'paid' })
    .eq('id', existing.id)

  // 2) Publish memorial (if we have draft & user)
  if (existing.user_id && existing.draft_id) {
    // Get draft
    const { data: draft } = await supabase
      .from('burial_drafts')
      .select('title, slug, data')
      .eq('id', existing.draft_id)
      .maybeSingle()

    if (draft) {
      await supabase.from('memorials').insert({
        user_id: existing.user_id,
        draft_id: existing.draft_id,
        slug: draft.slug || paypalOrderId,
        title: draft.title || 'Memorial',
        content: draft.data || {}
      })
    }
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    // Next.js ensures req.body is already parsed for JSON by default (if middleware allowed)
    // If using raw body, add config: { api: { bodyParser: false } } and parse raw text.

    const verified = await verifyWebhookSignature(req)
    if (!verified) {
      return res.status(400).json({ error: 'Invalid webhook signature' })
    }

    const event = req.body
    const eventType = event?.event_type || event?.eventType
    const resource = event?.resource || {}

    if (eventType === 'CHECKOUT.ORDER.APPROVED' || eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      // Handle approval or capture complete
      await handlePaid({ id: resource.id, resource })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
