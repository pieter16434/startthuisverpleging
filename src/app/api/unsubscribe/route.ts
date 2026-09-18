import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const encodedEmail = searchParams.get('e')
  const token = searchParams.get('t')

  const html = (title: string, body: string) => new NextResponse(
    `<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title} — startthuisverpleging</title>
    <style>body{margin:0;padding:40px 20px;background:#F1ECE0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;box-sizing:border-box;}
    .card{background:#FBF8F2;border-radius:14px;overflow:hidden;max-width:440px;width:100%;}
    .hdr{background:#2A3D2E;padding:24px 28px;}
    .hdr p{margin:0;font-size:13px;color:rgba(232,208,138,0.8);text-transform:uppercase;letter-spacing:0.12em;font-weight:600;}
    .body{padding:28px 28px 32px;}</style></head>
    <body><div class="card"><div class="hdr"><p>startthuisverpleging.be</p></div><div class="body">${body}</div></div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )

  if (!encodedEmail || !token) {
    return html('Ongeldige link', '<p style="color:#1A1A17;font-size:15px;">Deze uitschrijflink is ongeldig.</p>')
  }

  let email: string
  try {
    email = Buffer.from(encodedEmail, 'base64url').toString('utf-8')
  } catch {
    return html('Ongeldige link', '<p style="color:#1A1A17;font-size:15px;">Deze uitschrijflink is ongeldig.</p>')
  }

  if (!verifyUnsubscribeToken(email, token)) {
    return html('Ongeldige link', '<p style="color:#1A1A17;font-size:15px;">Deze uitschrijflink is ongeldig of verlopen.</p>')
  }

  const supabase = createServiceClient()
  await supabase
    .from('leads')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('email', email.toLowerCase().trim())

  return html('Uitgeschreven', `
    <p style="font-size:20px;color:#2A3D2E;font-weight:700;margin:0 0 10px;">✓ Je bent uitgeschreven.</p>
    <p style="font-size:14px;color:#3A3A33;line-height:1.6;margin:0 0 20px;">
      Je ontvangt geen verdere e-mails meer van startthuisverpleging.be.<br>
      Wil je toch de gids bekijken? Je kan altijd terug naar de site.
    </p>
    <a href="https://startthuisverpleging.be" style="display:inline-block;background:#2A3D2E;color:#E8D08A;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">
      Ga naar de site →
    </a>
  `)
}
