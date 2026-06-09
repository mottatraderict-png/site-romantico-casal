import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const TIPOS_VALIDOS = ['page_view', 'form_open', 'checkout_reached']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const tipo = String(body?.tipo ?? '')
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json({ error: 'tipo inválido' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin.from('eventos').insert({
      tipo,
      path:       body?.path ? String(body.path).slice(0, 200) : null,
      referrer:   body?.referrer ? String(body.referrer).slice(0, 300) : null,
      session_id: body?.sessionId ? String(body.sessionId).slice(0, 60) : null,
    })

    if (error) {
      // Loga (visível nos logs da Vercel) mas não quebra a experiência do usuário
      console.error('[track] erro ao inserir evento — a tabela "eventos" existe? ', error.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track] exception:', err)
    return NextResponse.json({ ok: true })
  }
}
