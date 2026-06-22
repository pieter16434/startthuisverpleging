export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase.storage
    .from('guides')
    .createSignedUrl(`invoices/${params.id}.pdf`, 60 * 60)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Factuur PDF niet gevonden' }, { status: 404 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
