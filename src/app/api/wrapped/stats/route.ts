// Fase 7: tellers per provincie en hogeschool, 60 seconden gecached
// Voorlopige stub — retourneert 0 totdat de wrapped_completions-tabel bestaat
export const revalidate = 60

import { NextResponse } from 'next/server'

export async function GET() {
  // TODO Fase 7: ophalen uit wrapped_completions via Supabase
  return NextResponse.json({ total: 0, per_provincie: {}, per_school: {} })
}
