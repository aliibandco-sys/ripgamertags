// pages/m/[slug].js
import React from "react";
import { createClient } from "@supabase/supabase-js";

export default function MemorialPage({ memorial }) {
  if (!memorial) {
    return (
      <main style={{ minHeight: "60vh", padding: 24 }}>
        <h1>Memorial not found</h1>
        <p>Try another link.</p>
      </main>
    );
  }
  return (
    <main style={{ minHeight: "60vh", padding: 24 }}>
      <h1>{memorial.name}</h1>
      <p>Game: {memorial.game}</p>
      <p>Years: {memorial.years || "-"}</p>
    </main>
  );
}

// ✅ SSR so it runs at request time, not at build time
export async function getServerSideProps(ctx) {
  const { slug } = ctx.params || {};

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Guard against missing envs on Vercel to avoid build crashes
  if (!url || !key) {
    console.error("Missing Supabase envs");
    return { props: { memorial: null } };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Adjust to your actual schema: slug column or id, etc.
  const { data, error } = await supabase
    .from("memorials")
    .select("*")
    .eq("slug", slug) // or .eq("id", slug)
    .maybeSingle();

  if (error) {
    console.error("Supabase error:", error.message);
    // Don’t crash the build; just render a not-found page
    return { props: { memorial: null } };
  }

  return { props: { memorial: data || null } };
}
