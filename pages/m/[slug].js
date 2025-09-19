// pages/m/[slug].js
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function MemorialPage() {
  const { query } = useRouter()
  const slug = query.slug

  const [mem, setMem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      const { data, error } = await supabase
        .from('memorials')
        .select('slug, title, content, published_at, created_at')
        .eq('slug', slug)
        .maybeSingle()
      if (!error) setMem(data || null)
      setLoading(false)
    })()
  }, [slug])

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>
  if (!mem) return <div style={{ padding: 24 }}>Memorial not found.</div>

  const c = mem.content || {}
  const avatar = c.avatar || null // URL to an image if provided
  const tag = c.gamertag || mem.title || mem.slug
  const platform = c.platform || '—'
  const years = c.years || c.period || '—'
  const epitaph = c.epitaph || c.message || 'Gone but not forgotten.'
  const badges = c.badges || [] // e.g., ["Xbox", "PSN", "2009—2021"]

  return (
    <div style={{ maxWidth: 880, margin: '40px auto', padding: '0 16px', fontFamily: 'Inter, system-ui, Arial, sans-serif' }}>
      <div style={{
        background: 'linear-gradient(180deg, #0b0f17 0%, #0f1522 100%)',
        border: '1px solid #1a2233',
        borderRadius: 16,
        padding: 24,
        color: '#e9eef7',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: '#141b2b', border: '1px solid #24324c',
            overflow: 'hidden', flex: '0 0 auto', display: 'grid', placeItems: 'center'
          }}>
            {avatar ? (
              <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#778bb2', fontSize: 28 }}>🎮</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.15 }}>{tag}</h1>
            <div style={{ marginTop: 6, color: '#9fb0d6', fontSize: 14 }}>
              Platform: <b style={{ color: '#d7e2ff' }}>{platform}</b> · Years: <b style={{ color: '#d7e2ff' }}>{years}</b>
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {badges.map((b, i) => (
                <span key={i} style={{ border: '1px solid #24324c', color: '#9fb0d6', padding: '4px 8px', borderRadius: 999 }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1a2233' }}>
          <blockquote style={{ margin: 0, fontSize: 18, lineHeight: 1.7, color: '#cdd8f3' }}>
            “{epitaph}”
          </blockquote>
          <div style={{ marginTop: 14, fontSize: 12, color: '#8ea0c9' }}>
            {mem.published_at ? `Published ${new Date(mem.published_at).toLocaleString()}` : `Created ${new Date(mem.created_at).toLocaleString()}`}
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={`/m`} style={{ color: '#b7c4e0', textDecoration: 'none' }}>← Back to memorials</a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Link copied!')
            }}
            style={{ border: '1px solid #24324c', background: '#0f1522', color: '#e9eef7', borderRadius: 10, padding: '6px 10px', cursor: 'pointer' }}
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>
  )
}
