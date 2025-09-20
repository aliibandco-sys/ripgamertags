export default function handler(req, res) {
  const envs = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };
  res.status(200).json({ ok: true, envs });
}
