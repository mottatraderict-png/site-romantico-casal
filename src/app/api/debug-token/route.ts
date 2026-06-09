import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Rota temporÃ¡ria de debug â€” REMOVER antes de ir para produÃ§Ã£o real
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token param required' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('casais')
    .select('id, status, token, email_cliente, created_at')
    .eq('token', token)
    .single()

  return NextResponse.json({ data, error })
}
