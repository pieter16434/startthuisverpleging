import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Serveert de coming soon / landingspagina als statische HTML
// Wordt vervangen door een echte React page bij de volledige lancering
export async function GET() {
  const htmlPath = path.join(process.cwd(), 'public', 'coming-soon.html')
  const html = fs.readFileSync(htmlPath, 'utf8')
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
