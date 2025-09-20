import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return res.status(200).json({ ok:false, reason:'missing envs' });

    const supabase = createClient(url, key, { auth: { persistSession: false } });
    // lightweight query; adjust to a real table you know exists:
    const { data, error } = await supabase.from('memorials').select('id').limit(1);
    if (error) return res.status(200).json({ ok:false, db:false, error: error.message });
    return res.status(200).json({ ok:true, db:true, sample: data });
  } catch (e) {
    return res.status(200).json({ ok:false, caught:e.message });
  }
}
