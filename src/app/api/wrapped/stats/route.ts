import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// 60 seconden gecached — tellers hoeven niet real-time te zijn
export const revalidate = 60

export async function GET() {
  try {
    const db = createServiceClient()

    // Totaal aantal completions
    const { count: total, error: countErr } = await db
      .from('wrapped_completions')
      .select('*', { count: 'exact', head: true })
    if (countErr) throw countErr

    // Tellers per provincie (ziekenhuis)
    const { data: proRows, error: proErr } = await db
      .from('wrapped_completions')
      .select('provincie')
      .eq('rol', 'ziekenhuis')
      .not('provincie', 'is', null)
    if (proErr) throw proErr

    const per_provincie: Record<string, number> = {}
    for (const row of proRows ?? []) {
      if (row.provincie) per_provincie[row.provincie] = (per_provincie[row.provincie] ?? 0) + 1
    }

    // Tellers per hogeschool (student)
    const { data: schoolRows, error: schoolErr } = await db
      .from('wrapped_completions')
      .select('hogeschool')
      .eq('rol', 'student')
      .not('hogeschool', 'is', null)
    if (schoolErr) throw schoolErr

    const per_school: Record<string, number> = {}
    for (const row of schoolRows ?? []) {
      if (row.hogeschool) per_school[row.hogeschool] = (per_school[row.hogeschool] ?? 0) + 1
    }

    return NextResponse.json({ total: total ?? 0, per_provincie, per_school })
  } catch {
    // Fallback zodat het startscherm niet breekt als de DB niet beschikbaar is
    return NextResponse.json({ total: 0, per_provincie: {}, per_school: {} })
  }
}
