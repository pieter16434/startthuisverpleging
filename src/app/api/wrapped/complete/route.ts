import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = createServiceClient()

    const { error } = await db.from('wrapped_completions').insert({
      rol:             body.rol            ?? null,
      provincie:       body.provincie      ?? null,
      hogeschool:      body.hogeschool     ?? null,
      superkracht:     body.superkracht    ?? null,
      afdeling:        body.afdeling       ?? null,
      tewerkstelling:  body.tewerkstelling ?? null,
      nachtdiensten:   body.nachtdiensten  ?? 0,
      weekends:        body.weekends       ?? 0,
      patienten_keuze: body.patientenKeuze ?? null,
      stappen:         body.stappen        ?? null,
      stage_uren:      body.stageUren      ?? null,
    })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    // Nooit falen naar de client — de UX mag niet breken als dit mislukt
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
