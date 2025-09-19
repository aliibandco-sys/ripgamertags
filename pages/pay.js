// pages/pay.js — Server-assisted createOrder + client capture
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Pay() {
  const ref = useRef(null);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({ name: "", game: "", years: "" });

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setStatus("Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID in .env.local");
      console.error("Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID");
      return;
    }

    // Load PayPal SDK
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    s.async = true;
    s.onload = () => {
      if (!window.paypal) {
        setStatus("PayPal SDK failed to load");
        return;
      }

      window.paypal
        .Buttons({
          style: { shape: "pill", layout: "vertical", label: "pay", tagline: false },

          // ▶ Server creates PayPal order
          createOrder: async () => {
            try {
              setStatus("Creating order…");
              const resp = await fetch("/api/checkout/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: "1.00", currency: "USD" }),
              });
              const text = await resp.text();
              if (!resp.ok) {
                setStatus("Server error from /api/checkout/start");
                alert("Server error from /api/checkout/start:\n" + text);
                throw new Error(text);
              }
              const json = JSON.parse(text);
              if (!json.id) {
                setStatus("No order id in response");
                alert("Missing order id:\n" + text);
                throw new Error("No id");
              }
              setStatus("Order created. Awaiting approval…");
              return json.id;
            } catch (e) {
              console.error(e);
              setStatus("createOrder failed: " + (e.message || e));
              throw e;
            }
          },

          // ▶ Client capture for now (webhook/verify later)
          onApprove: async (data, actions) => {
            try {
              setStatus("Capturing payment…");
              if (actions.order) await actions.order.capture();

              // TODO: call your API to insert the grave with service role
              // await fetch("/api/after-pay", { method:"POST", headers:{"Content-Type":"application/json"},
              //   body: JSON.stringify({ ...form, orderId: data.orderID }) });

              setStatus("✅ Payment captured! We’ll publish your grave shortly.");
              alert(
                "Approved (Sandbox). We would now insert the memorial draft and publish after verification."
              );
            } catch (e) {
              console.error(e);
              setStatus("Capture error — check console");
              alert("Capture error — check console");
            }
          },

          onError: (err) => {
            console.error(err);
            setStatus("PayPal error — check console");
            alert("PayPal error — check console");
          },
        })
        .render(ref.current);
    };
    document.body.appendChild(s);
  }, []);

  return (
    <main className="min-h-[100svh] bg-[#07070a] text-zinc-100">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back to homepage
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Bury your character</h1>
        <p className="mt-2 text-zinc-300">Pay <span className="font-semibold">$1</span> to publish.</p>

        {/* Basic input (optional right now) */}
        <div className="mt-6 grid gap-3">
          <Field label="Char name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Game" value={form.game} onChange={(v) => setForm({ ...form, game: v })} />
          <Field label="Years" value={form.years} onChange={(v) => setForm({ ...form, years: v })} />
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div ref={ref} />
          <p className="mt-3 text-sm text-zinc-300">{status || "Fill details (optional) then click Pay"}</p>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-zinc-400">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-fuchsia-500/50"
        placeholder={label}
      />
    </label>
  );
}
