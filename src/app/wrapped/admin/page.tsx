import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { robots: 'noindex' }

const F = '"Bricolage Grotesque",-apple-system,sans-serif'
const BG = '#1C2A20'; const SURF = '#2A3D2E'; const BUTTER = '#E8D08A'
const CREAM = 'rgba(247,243,234,0.9)'; const MUTED = 'rgba(247,243,234,0.5)'
const BORDER = 'rgba(232,208,138,0.18)'

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: SURF, borderRadius: 12, padding: '20px', border: `1px solid ${BORDER}` }}>
      <p style={{ margin: '0 0 8px', fontSize: 12, color: MUTED, fontFamily: F, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 36, fontWeight: 800, color: BUTTER, fontFamily: F, lineHeight: 1 }}>{typeof value === 'number' ? value.toLocaleString('nl-BE') : value}</p>
      {sub && <p style={{ margin: '6px 0 0', fontSize: 13, color: MUTED, fontFamily: F }}>{sub}</p>}
    </div>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { key?: string }
}) {
  if (!process.env.WRAPPED_ADMIN_KEY || searchParams.key !== process.env.WRAPPED_ADMIN_KEY) {
    return notFound()
  }

  const db  = createServiceClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  // ── Completions ──────────────────────────────────────────────────────────────
  const [
    { count: totalComp },
    { count: todayComp },
    { count: zhComp },
    { count: stComp },
    { data: proRows },
    { data: schoolRows },
  ] = await Promise.all([
    db.from('wrapped_completions').select('*', { count: 'exact', head: true }),
    db.from('wrapped_completions').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    db.from('wrapped_completions').select('*', { count: 'exact', head: true }).eq('rol', 'ziekenhuis'),
    db.from('wrapped_completions').select('*', { count: 'exact', head: true }).eq('rol', 'student'),
    db.from('wrapped_completions').select('provincie').eq('rol', 'ziekenhuis').not('provincie', 'is', null),
    db.from('wrapped_completions').select('hogeschool').eq('rol', 'student').not('hogeschool', 'is', null),
  ])

  // ── Leads ────────────────────────────────────────────────────────────────────
  const [
    { count: totalLeads },
    { count: todayLeads },
  ] = await Promise.all([
    db.from('wrapped_leads').select('*', { count: 'exact', head: true }).eq('consent', true),
    db.from('wrapped_leads').select('*', { count: 'exact', head: true }).eq('consent', true).gte('created_at', todayStart),
  ])

  // ── Provincie-tellers ────────────────────────────────────────────────────────
  const perProv: Record<string, number> = {}
  for (const r of proRows ?? []) {
    if (r.provincie) perProv[r.provincie] = (perProv[r.provincie] ?? 0) + 1
  }
  const topProv = Object.entries(perProv).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // ── Hogeschool-tellers ───────────────────────────────────────────────────────
  const perSchool: Record<string, number> = {}
  for (const r of schoolRows ?? []) {
    if (r.hogeschool) perSchool[r.hogeschool] = (perSchool[r.hogeschool] ?? 0) + 1
  }
  const topSchool = Object.entries(perSchool).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const convRate = totalComp && totalLeads
    ? ((totalLeads / totalComp) * 100).toFixed(1)
    : '—'

  return (
    <main style={{ minHeight: '100dvh', background: BG, padding: '32px 24px', fontFamily: F }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        <div style={{ marginBottom: 32 }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(232,208,138,0.5)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Admin</p>
          <h1 style={{ margin: 0, fontSize: 28, color: BUTTER, fontWeight: 800 }}>Zorg Wrapped 2026</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: MUTED }}>
            Bijgewerkt op {now.toLocaleString('nl-BE', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>

        {/* Completions */}
        <p style={{ margin: '0 0 12px', fontSize: 12, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Completions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
          <Tile label="Totaal" value={totalComp ?? 0} />
          <Tile label="Vandaag" value={todayComp ?? 0} />
          <Tile label="Ziekenhuis" value={zhComp ?? 0} />
          <Tile label="Student" value={stComp ?? 0} />
        </div>

        {/* Leads */}
        <p style={{ margin: '0 0 12px', fontSize: 12, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Leads (rekenvoorbeeld)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
          <Tile label="Totaal" value={totalLeads ?? 0} />
          <Tile label="Vandaag" value={todayLeads ?? 0} />
          <Tile label="Conversie" value={`${convRate}%`} sub="leads / completions" />
        </div>

        {/* Provincie-rangschikking */}
        {topProv.length > 0 && (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Top provincies (ziekenhuis)</p>
            <div style={{ background: SURF, borderRadius: 12, padding: '4px 0', marginBottom: 28, border: `1px solid ${BORDER}` }}>
              {topProv.map(([prov, n], i) => (
                <div key={prov} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: i < topProv.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <span style={{ fontSize: 15, color: CREAM, fontFamily: F, textTransform: 'capitalize' }}>{prov}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: BUTTER }}>{n}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Hogeschool-rangschikking */}
        {topSchool.length > 0 && (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Top hogescholen (student)</p>
            <div style={{ background: SURF, borderRadius: 12, padding: '4px 0', marginBottom: 28, border: `1px solid ${BORDER}` }}>
              {topSchool.map(([school, n], i) => (
                <div key={school} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: i < topSchool.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <span style={{ fontSize: 15, color: CREAM, fontFamily: F }}>{school}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: BUTTER }}>{n}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <p style={{ fontSize: 12, color: 'rgba(232,208,138,0.2)', textAlign: 'center' }}>
          Geen cache — altijd live data
        </p>
      </div>
    </main>
  )
}
