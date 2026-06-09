import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { enviarEmailPagina } from '@/lib/email'

export async function GET(req: NextRequest) {
  const email    = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  const casalId  = req.nextUrl.searchParams.get('casal_id')?.trim()
  const sendEmail = req.nextUrl.searchParams.get('sendEmail') === '1'

  const admin = getSupabaseAdmin()

  let query = admin
    .from('casais')
    .select('id, slug, nome1, nome2, status, email_cliente, created_at')

  if (casalId) {
    // Busca direta por ID — mais confiável
    query = query.eq('id', casalId) as typeof query
  } else if (email && email.includes('@')) {
    query = query.ilike('email_cliente', email).in('status', ['publicado', 'pendente']).order('created_at', { ascending: false }) as typeof query
  } else {
    return NextResponse.json({ error: 'Informe casal_id ou e-mail' }, { status: 400 })
  }

  const { data, error } = await query.limit(1).single()

  if (error || !data) {
    return NextResponse.json({ error: 'Nenhuma página encontrada para este e-mail.' }, { status: 404 })
  }

  if (data.status === 'pendente') {
    return NextResponse.json({ error: 'Pagamento ainda não confirmado. Redirecionando...', status: 'pendente', casalId: data.id }, { status: 404 })
  }

  // Envia e-mail com o link quando solicitado (cliente na página /sucesso)
  if (sendEmail && data.slug && data.email_cliente) {
    try {
      await enviarEmailPagina(data.email_cliente, data.nome1 ?? '', data.nome2 ?? '', data.slug)
      console.log('[buscar-pagina] e-mail reenviado para:', data.email_cliente)
    } catch (err) {
      console.error('[buscar-pagina] erro ao reenviar e-mail:', err)
    }
  }

  return NextResponse.json({ slug: data.slug, nome1: data.nome1, nome2: data.nome2, status: data.status })
}
