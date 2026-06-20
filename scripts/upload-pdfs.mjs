/**
 * Upload de twee PDF-versies naar Supabase Storage (bucket: guides).
 * Gebruik: node scripts/upload-pdfs.mjs
 * Vereist: .env.local met NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// .env.local uitlezen
const env = {}
try {
  readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
    const eq = line.indexOf('=')
    if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
  })
} catch {
  console.error('Kon .env.local niet lezen. Zorg dat je het script uitvoert vanuit de project-root.')
  process.exit(1)
}

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = env
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

const PDFS = [
  {
    localPath: 'C:/Users/piete/OneDrive - Domus Care/PDF/finale pdf/Gids - Zelfstandig Thuisverpleegkundige Worden.pdf',
    storagePath: 'main-guide.pdf',
    label: 'Hoofdgids (digitale versie)',
  },
  {
    localPath: 'C:/Users/piete/OneDrive - Domus Care/PDF/finale pdf/Afdruk versie - Gids - Zelfstandig Thuisverpleegkundige Worden.pdf',
    storagePath: 'main-guide-print.pdf',
    label: 'Printversie (witte achtergrond)',
  },
]

for (const { localPath, storagePath, label } of PDFS) {
  console.log(`\nUploading: ${label}`)
  console.log(`  Van: ${localPath}`)
  console.log(`  Naar: guides/${storagePath}`)

  let file
  try {
    file = readFileSync(localPath)
  } catch {
    console.error(`  ✗ Bestand niet gevonden: ${localPath}`)
    continue
  }

  const { error } = await supabase.storage
    .from('guides')
    .upload(storagePath, file, { contentType: 'application/pdf', upsert: true })

  if (error) {
    console.error(`  ✗ Upload mislukt: ${error.message}`)
  } else {
    console.log(`  ✓ Succesvol geüpload (${Math.round(file.length / 1024)} KB)`)
  }
}

console.log('\nKlaar.')
