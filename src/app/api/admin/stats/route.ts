import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString()
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const password = String(body?.password ?? '').trim()
  const expected = (process.env.ADMIN_PASSWORD ?? '').trim()

  if (!expected) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD não configurada no servidor. Defina a variável na Vercel e faça redeploy.' }, { status: 500 })
  }
  if (password !== expected) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const range = Number(body?.days) || 30 // janela em dias
  const desde = isoDaysAgo(range)

  // ── Contadores de eventos do funil ─────────────────────────
  async function countEvento(tipo: string, sinceIso?: string) {
    let q = admin.from('eventos').select('id', { count: 'exact', head: true }).eq('tipo', tipo)
    if (sinceIso) q = q.gte('created_at', sinceIso)
    const { count } = await q
    return count ?? 0
  }

  async function countEventoUnico(tipo: string, sinceIso?: string) {
    // sessões distintas (visitantes únicos aproximados)
    let q = admin.from('eventos').select('session_id').eq('tipo', tipo)
    if (sinceIso) q = q.gte('created_at', sinceIso)
    const { data } = await q
    const set = new Set((data ?? []).map((r: { session_id: string | null }) => r.session_id).filter(Boolean))
    return set.size
  }

  // ── Pedidos (tabela casais) ─────────────────────────────────
  async function countCasais(status?: string, sinceIso?: string) {
    let q = admin.from('casais').select('id', { count: 'exact', head: true })
    if (status) q = q.eq('status', status)
    if (sinceIso) q = q.gte('created_at', sinceIso)
    const { count } = await q
    return count ?? 0
  }

  const [
    acessos, acessosUnicos, acessosHoje,
    formAbertos, formHoje,
    checkouts, checkoutHoje,
    totalPedidos, pendentes, pagos, pagosHoje,
    ultimosPedidos,
  ] = await Promise.all([
    countEvento('page_view', desde),
    countEventoUnico('page_view', desde),
    countEvento('page_view', isoDaysAgo(1)),
    countEvento('form_open', desde),
    countEvento('form_open', isoDaysAgo(1)),
    countEvento('checkout_reached', desde),
    countEvento('checkout_reached', isoDaysAgo(1)),
    countCasais(undefined, desde),
    countCasais('pendente', desde),
    countCasais('publicado', desde),
    countCasais('publicado', isoDaysAgo(1)),
    admin.from('casais')
      .select('nome1, nome2, status, email_cliente, created_at, slug')
      .order('created_at', { ascending: false })
      .limit(15)
      .then(r => r.data ?? []),
  ])

  const receita = pagos * 29.90

  return NextResponse.json({
    range,
    funil: {
      acessos, acessosUnicos, acessosHoje,
      formAbertos, formHoje,
      checkouts, checkoutHoje,
      pagos, pagosHoje,
    },
    pedidos: { total: totalPedidos, pendentes, pagos },
    receita,
    taxas: {
      acessoParaForm:     acessos    ? (formAbertos / acessos * 100) : 0,
      formParaCheckout:   formAbertos ? (checkouts / formAbertos * 100) : 0,
      checkoutParaPago:   checkouts   ? (pagos / checkouts * 100) : 0,
      acessoParaPago:     acessos    ? (pagos / acessos * 100) : 0,
    },
    ultimosPedidos,
  })
}
