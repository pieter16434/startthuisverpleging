export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getOfficeSession } from '@/lib/office/auth'
import { z } from 'zod'

const Schema = z.object({ code: z.string().min(1).max(30) })

export async function POST(req: NextRequest) {
  try {
    const session = await getOfficeSession()
    if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

    const body = await req.json()
    const { code } = Schema.parse(body)

    const supabase = createServiceClient()

    // Zoek de code op binnen deze organisatie
    const { data: codeRow } = await supabase
      .from('organization_codes')
      .select('id, code, is_verified, verified_at, verified_by_office_id, office_id, organization_id, customers(first_name, last_name)')
      .eq('code', code.toUpperCase().trim())
      .eq('organization_id', session.organizationId)
      .single()

    if (!codeRow) {
      return NextResponse.json({ valid: false, message: 'Deze code is onbekend of hoort niet bij uw organisatie.' })
    }

    // Haal org op om code_mode te kennen
    const { data: org } = await supabase
      .from('organizations')
      .select('code_mode')
      .eq('id', session.organizationId)
      .single()

    // Per-office modus: controleer of dit de juiste office is
    if (org?.code_mode === 'per_office' && codeRow.office_id !== session.officeId) {
      return NextResponse.json({
        valid: false,
        message: 'Deze code behoort aan een ander kantoor. U kunt hem hier niet verifiëren.',
      })
    }

    // Al geverifieerd?
    if (codeRow.is_verified) {
      const verifiedDate = codeRow.verified_at
        ? new Date(codeRow.verified_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
        : '—'
      return NextResponse.json({
        valid: true,
        alreadyVerified: true,
        message: `Deze code werd al geverifieerd op ${verifiedDate}.`,
        customer: codeRow.customers,
      })
    }

    // Verifieer de code
    const { error } = await supabase
      .from('organization_codes')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by_office_id: session.officeId,
        verified_by_member_id: session.memberId ?? null,
        verified_by_email: session.email,
      })
      .eq('id', codeRow.id)

    if (error) throw error

    return NextResponse.json({
      valid: true,
      alreadyVerified: false,
      message: `Code succesvol geverifieerd. De klant ontvangt het voordeel van ${(codeRow.customers as unknown as { first_name: string; last_name: string } | null)?.first_name ?? 'de klant'}.`,
      customer: codeRow.customers,
    })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ valid: false, message: 'Ongeldige code.' })
    console.error('[office/verify]', err)
    return NextResponse.json({ valid: false, message: 'Verificatie mislukt. Probeer opnieuw.' })
  }
}
