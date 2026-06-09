import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getBaseUrl } from '@/lib/baseUrl'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug obrigatório' }, { status: 400 })

  const link = `${getBaseUrl()}/${slug}`

  const qrDataUrl = await QRCode.toDataURL(link, {
    width: 400,
    margin: 3,
    color: { dark: '#1C1410', light: '#FAF7F2' },
  })

  return NextResponse.json({ qrDataUrl })
}
