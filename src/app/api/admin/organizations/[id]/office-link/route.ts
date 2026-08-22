export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { randomBytes } from 'crypto'

// POST — genereer onboarding link voor een kantoor van deze organisatie
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  // Controleer of de org bestaat
  const { data: org } = await supabase
    .from('organizations')
    .select('id, business_name')
    .eq('id', params.id)
    .single()

  if (!org) return NextResponse.json({ error: 'Organisatie niet gevonden' }, { status: 404 })

  const token = randomBytes(32).toString('hex')
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)

  const { error } = await supabase.from('office_onboarding_tokens').insert({
    token,
    organization_id: params.id,
    expires_at: expires.toISOString(),
  })

  if (error) return NextResponse.json({ error: 'Link aanmaken mislukt' }, { status: 500 })

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/office/onboarding?token=${token}`
  return NextResponse.json({ url, org_name: org.business_name })
}
