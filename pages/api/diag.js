// pages/api/diag.js
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY, // may be false in Preview/Prod if not set
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
      PAYPAL_CLIENT_ID: !!process.env.PAYPAL_CLIENT_ID,
      PAYPAL_SECRET: !!process.env.PAYPAL_SECRET,
      PAYPAL_API_BASE: process.env.PAYPAL_API_BASE || null,
    };

    // Try Supabase connectivity (safe, no write)
    let supabase = null;
    let memorialsCount = null;
    let supabaseError = null;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          { auth: { persistSession: false } }
        );

        // HEAD count — requires that table exists and policy allows select
        const { count, error } = await supabase
          .from("memorials")
          .select("id", { count: "exact", head: true });

        if (error) supabaseError = error.message;
        memorialsCount = typeof count === "number" ? count : null;
      } catch (e) {
        supabaseError = String(e?.message || e);
      }
    }

    res.status(200).json({
      ok: true,
      runtime: {
        node: process.versions?.node || null,
        platform: process.platform,
        vercel: !!process.env.VERCEL,
        env: env,
      },
      supabase: {
        canInit: !!supabase,
        memorialsCount,
        error: supabaseError,
      },
      now: new Date().toISOString(),
    });
  } catch (e) {
    res.status(200).json({
      ok: false,
      error: String(e?.message || e),
      now: new Date().toISOString(),
    });
  }
}
