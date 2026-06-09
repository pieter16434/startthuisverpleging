import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const PartnerSchema = z.object({
  name: z.string().min(1).max(100),
  business_name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  province: z.enum(['ANT', 'LIM', 'OVL', 'VBR', 'WVL']),
  service_type: z.string().min(1).max(100),
  discount_description: z.string().min(1).max(500),
  fee_per_customer: z.number().min(0),
  notes: z.string().optional(),
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
      discount_description, fee_per_customer, is_active, notes, created_at,
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

    const password_hash = await bcrypt.hash(data.password, 12)
    const supabase = createServiceClient()

    const { data: partner, error } = await supabase
      .from('partners')
      .insert({
        name: data.name,
        business_name: data.business_name,
        email: data.email.toLowerCase(),
        password_hash,
        province: data.province,
        service_type: data.service_type,
        discount_description: data.discount_description,
        fee_per_customer: data.fee_per_customer,
        notes: data.notes ?? null,
        is_active: true,
      })
      .select('id, name, email')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ ok: true, partner })
  } catch (err) {
    console.error('[admin/partners POST]', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ongeldige gegevens', details: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Partner aanmaken mislukt' }, { status: 500 })
  }
}
