import { createServiceClient } from '@/lib/supabase/server'

const BUCKET = 'guides'
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 7 // 7 dagen in seconden

/**
 * Genereer een tijdelijke signed URL voor een PDF in Supabase Storage.
 * Geeft null terug als het bestand niet bestaat.
 */
export async function getSignedPdfUrl(storagePath: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

  if (error || !data?.signedUrl) {
    console.error('[storage/pdf] Signed URL mislukt:', error?.message)
    return null
  }
  return data.signedUrl
}

/**
 * Controleer of een bestand bestaat in Supabase Storage.
 */
export async function pdfExists(storagePath: string): Promise<boolean> {
  const supabase = createServiceClient()
  const { data } = await supabase.storage.from(BUCKET).list(
    storagePath.split('/').slice(0, -1).join('/'),
    { search: storagePath.split('/').pop() }
  )
  return (data?.length ?? 0) > 0
}

/**
 * Storage paden:
 *   Hoofdgids:  'main-guide.pdf'
 *   Codeboeken: 'codebooks/ANT.pdf', 'codebooks/LIM.pdf', etc.
 *
 * Upload via: Supabase Dashboard → Storage → guides bucket
 */
export const GUIDE_PATH = 'main-guide.pdf'
export const CODEBOOK_PATH = (province: string) => `codebooks/${province}.pdf`
