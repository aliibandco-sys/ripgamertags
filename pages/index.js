import React from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Skull, Gamepad2, Ghost, Swords, TimerReset, Flame } from "lucide-react";

/**
 * RIPGAMERTAGS — Homepage (Pages Router, JavaScript)
 * - Graves shown on homepage
 * - 3 rows per grave: Char name / Game / Years
 * - Colorful CTA → /pay
 * Deps:
 *   npm i @supabase/supabase-js lucide-react framer-motion
 *
 * Env (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
 */

// ---------- CONFIG ----------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ---------- PAGE ----------
export default function Home({ graves = [] }) {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#07070a] text-zinc-100">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(139,92,246,0.16),rgba(0,0,0,0))]"
      />
      <FogLayer className="mix-blend-screen" />
      <FloatingIcons />

      {/* HERO */}
      <section className="relative w-full pt-24 pb-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800/60 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/8 to-cyan-400/10 p-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-900/70 px-3 py-1 text-xs text-zinc-300">
              <Ghost className="h-4 w-4" />
              Now open for legends & fallen tags
            </div>

            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              The world’s largest online gamer cemetery
            </h1>

            {/* First two lines / promise */}
            <div className="mt-4 space-y-2 text-lg text-zinc-200">
              <p>
                Best & biggest gamer cemetery — building a vault of <strong>1,000,000</strong> burials.
              </p>
              <p>Join us, claim your plot, and let your tag haunt the leaderboard forever.</p>
            </div>

            {/* CTA row */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/pay"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-5 py-3 text-sm font-semibold shadow-lg shadow-fuchsia-900/20 transition hover:brightness-110"
                title="Go to payment & add your info"
              >
                <Gamepad2 className="h-4 w-4" />
                Bury your character
              </Link>

              <a
                href="#graves"
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 px-5 py-3 text-sm font-semibold hover:bg-zinc-900/60"
              >
                Browse the graves
              </a>
            </div>

            {/* Quick stats (Burials = live count) */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat icon={<Skull className="h-5 w-5" />} label="Burials" value={formatK(graves.length)} />
              <Stat icon={<Swords className="h-5 w-5" />} label="Games" value="742" />
              <Stat icon={<Flame className="h-5 w-5" />} label="Candles lit" value="98k" />
              <Stat icon={<TimerReset className="h-5 w-5" />} label="Clips saved" value="31k" />
            </div>
          </div>
        </div>
      </section>

      {/* GRAVEYARD GRID ON HOMEPAGE */}
      <section id="graves" className="relative w-full pb-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Fresh burials</h2>
          </div>

          {graves.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-zinc-400">
              No graves yet. Be the first to{" "}
              <Link className="underline hover:text-zinc-200" href="/pay">
                bury your character
              </Link>
              .
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {graves.map((g, i) => (
                <Tombstone key={g.slug || g.id || i} {...g} />
              ))}
            </div>
          )}

          <div className="mt-16 h-32 w-full rounded-2xl bg-gradient-to-b from-transparent via-zinc-900/40 to-black" />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-zinc-900/70 bg-black/30 py-10 text-sm text-zinc-400">
        <div className="mx-auto max-w-6xl px-4">
          <p>Respectful by design — no real grave imagery, no religious symbols. Just gamer lore.</p>
          <p className="mt-2">© {new Date().getFullYear()} RIPGAMERTAGS</p>
        </div>
      </footer>
    </main>
  );
}

// ---------- DATA (SSR) ----------
export async function getServerSideProps() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Fetch EVERYTHING to avoid column name mismatches (we normalize below)
  const { data, error } = await supabase
    .from("memorials") // <-- change if your table name is different
    .select("*")
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    console.error("Supabase error:", error.message);
    return { props: { graves: [] } };
  }

  const graves = (data || []).map((r) => normalizeRow(r));
  return { props: { graves } };
}

// ---------- COMPONENTS ----------
function Tombstone({ name, game, years, epitaph, symbols, image_url, accent_color }) {
  const accent = accent_color || "#7c3aed";
  const charName = name || "Unknown";
  const gameName = game || "Unknown game";
  const yearsText = years || "";

  return (
    <motion.article
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-[0_0_80px_rgba(0,0,0,0.35)] backdrop-blur-sm"
    >
      {/* Photo banner (fallback gradient if no image) */}
      <div className="relative h-36 w-full">
        {image_url ? (
          <img src={image_url} alt={`${charName} banner`} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-fuchsia-600/30 via-violet-600/30 to-cyan-400/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Stone panel */}
      <div className="relative -mt-8 px-4 pb-4">
        <div className="mx-auto rounded-2xl bg-gradient-to-b from-zinc-900 to-black p-4 ring-1 ring-zinc-800">
          {/* Icon */}
          <div className="mx-auto -mt-8 mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
            <Skull className="h-6 w-6 opacity-80" />
          </div>

          {/* Labeled rows */}
          <dl className="space-y-1 text-sm">
            <div className="flex items-start gap-2">
              <dt className="w-24 shrink-0 text-zinc-400">Char name:</dt>
              <dd className="font-semibold text-zinc-100">{charName}</dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="w-24 shrink-0 text-zinc-400">Game:</dt>
              <dd className="text-zinc-200">{gameName}</dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="w-24 shrink-0 text-zinc-400">Years:</dt>
              <dd className="text-zinc-300">{yearsText}</dd>
            </div>
          </dl>

          {/* Optional epitaph + symbols */}
          {epitaph ? (
            <p className="mt-3 line-clamp-2 text-xs italic text-zinc-400">“{epitaph}”</p>
          ) : null}
          <div className="mt-2 flex items-center justify-start gap-2 text-lg">
            {(symbols || ["🕯️", "🎮", "💀"]).map((s, i) => (
              <span key={i} aria-hidden>
                {s}
              </span>
            ))}
            <motion.span
              initial={{ opacity: 0.7, y: 0 }}
              animate={{ opacity: [0.7, 1, 0.85, 1], y: [0, -1, 0] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              className="ml-1"
              title="Candle"
            >
              🕯️
            </motion.span>
          </div>
        </div>
      </div>

      {/* Accent glow */}
      <div
        className="pointer-events-none absolute -inset-1 -z-10 rounded-2xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(600px_200px_at_50%_0%, ${accent}22, transparent)` }}
      />
    </motion.article>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 opacity-80">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide text-zinc-400">{label}</div>
        <div className="text-lg font-semibold text-zinc-100">{value}</div>
      </div>
    </div>
  );
}

function FogLayer({ className = "" }) {
  return (
    <div
      className={
        "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),rgba(0,0,0,0)_60%)] " +
        className
      }
    />
  );
}

function FloatingIcons() {
  const items = [Ghost, Skull, Gamepad2];
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {Array.from({ length: 14 }).map((_, i) => {
        const Icon = items[i % items.length];
        const delay = (i % 7) * 0.7;
        const x = Math.random() * 100;
        const y = Math.random() * 60;
        const scale = 0.5 + Math.random() * 0.8;
        const opacity = 0.04 + Math.random() * 0.06;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: `${x}%`, top: `${y}%`, opacity }}
            initial={{ y: 0 }}
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 6 + Math.random() * 6, delay }}
          >
            <Icon className="h-10 w-10" style={{ transform: `scale(${scale})` }} />
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------- HELPERS ----------
function normalizeRow(r) {
  // Flexible mapping for unknown DB column names
  const name = r.name || r.nickname || r.tag || r.title || r.gamer_tag || r.handle || "Unknown";
  const game = r.game || r.game_name || r.title_game || r.series || "Unknown game";
  const years = r.years || joinYears(r.year_from, r.year_to);
  const epitaph = r.epitaph || r.quote || r.bio || null;
  let symbols = r.symbols || [];
  if (typeof symbols === "string") {
    try {
      symbols = JSON.parse(symbols);
    } catch {
      symbols = ["🕯️", "🎮", "💀"];
    }
  }
  const image_url = r.image_url || r.banner_url || r.photo_url || null;
  const accent_color = r.accent_color || r.color || null;

  return {
    id: r.id,
    slug: r.slug || null,
    name,
    game,
    years,
    epitaph,
    symbols: Array.isArray(symbols) && symbols.length ? symbols : ["🕯️", "🎮", "💀"],
    image_url,
    accent_color,
  };
}

function joinYears(from, to) {
  if (!from && !to) return "";
  if (from && to) return `${from}–${to}`;
  if (from && !to) return `${from}–`;
  return `${to}`;
}
function formatK(n) {
  const num = Number(n || 0);
  if (num >= 1000) return Math.round(num / 100) / 10 + "k";
  return String(num);
}
{/* BUILD MARKER: RIPGAMERTAGS-HOMEPAGE-V2 */}
