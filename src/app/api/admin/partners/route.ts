export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const PartnerSchema = z.object({
  name: z.string().min(1).max(100),
  business_name: z.string().min(1).max(100),
  email: z.string().email(),
  province: z.enum(['ANT', 'LIM', 'OVL', 'VBR', 'WVL', 'VLA']),
  service_type: z.string().min(1).max(100),
  discount_description: z.string().min(1).max(500),
  fee_per_customer: z.number().min(0),
  notes: z.string().optional(),
  vat_number: z.string().max(50).optional(),
  billing_address: z.string().max(300).optional(),
  partner_type: z.enum(['service', 'product']).optional(),
  discount_code: z.string().max(50).optional(),
})

// GET — alle partners ophalen
export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: partners } = await supabase
    .from('partners')
    .select(`
      id, name, business_name, email, province, service_type,
      discount_description, fee_per_customer, is_active, notes,
      vat_number, billing_address, created_at,
      partner_type, discount_code,
      partner_codes(count)
    `)
    .order('created_at', { ascending: false })

  // Tel geverifieerde codes per partner
  const { data: verifiedCounts } = await supabase
    .from('partner_codes')
    .select('partner_id')
    .eq('is_verified', true)

  const verifiedMap: Record<string, number> = {}
  verifiedCounts?.forEach(r => {
    verifiedMap[r.partner_id] = (verifiedMap[r.partner_id] ?? 0) + 1
  })

  const result = partners?.map(p => ({
    ...p,
    total_codes: (p.partner_codes as unknown as { count: number }[])?.[0]?.count ?? 0,
    verified_codes: verifiedMap[p.id] ?? 0,
  }))

  return NextResponse.json({ partners: result ?? [] })
}

// POST — nieuwe partner aanmaken
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  try {
    const body = await req.json()
    const data = PartnerSchema.parse(body)

    // Genereer uitnodigingstoken — partner stelt zelf wachtwoord in via de link
    const supabase = createServiceClient()
    const isProduct = data.partner_type === 'product'

    // Alleen voor service partners: uitnodigingstoken aanmaken
    let inviteToken: string | null = null
    let inviteExpires: Date | null = null
    if (!isProduct) {
      inviteToken = randomBytes(32).toString('hex')
      inviteExpires = new Date()
      inviteExpires.setDate(inviteExpires.getDate() + 7)
    }

    const { data: partner, error } = await supabase
      .from('partners')
      .insert({
        name: data.name,
        business_name: data.business_name,
        email: data.email.toLowerCase(),
        password_hash: null,
        invite_token: inviteToken,
        invite_token_expires_at: inviteExpires?.toISOString() ?? null,
        province: data.province,
        service_type: data.service_type,
        discount_description: data.discount_description,
        fee_per_customer: data.fee_per_customer,
        notes: data.notes ?? null,
        vat_number: data.vat_number ?? null,
        billing_address: data.billing_address ?? null,
        is_active: true,
        partner_type: data.partner_type ?? 'service',
        discount_code: data.discount_code ?? null,
      })
      .select('id, name, business_name, email')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik' }, { status: 409 })
      }
      throw error
    }

    const inviteUrl = inviteToken
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/partner/instellen?token=${inviteToken}`
      : null
    return NextResponse.json({ ok: true, partner, invite_url: inviteUrl })
  } catch (err) {
    console.error('[admin/partners POST]', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ongeldige gegevens', details: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Partner aanmaken mislukt' }, { status: 500 })
  }
}
