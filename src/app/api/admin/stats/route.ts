import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString()
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  // Acesso livre — sem senha

  const admin = getSupabaseAdmin()
  const range = Number(body?.days) || 30
  const desde = isoDaysAgo(range)
  const hoje  = isoDaysAgo(1)

  let eventosOk = true
  let eventosErro = ''
  let pedidosErro = ''

  // Detecta qual coluna de data a tabela casais usa (created_at ou criado_em)
  let dateCol = 'created_at'
  {
    const probe = await admin.from('casais').select('created_at').limit(1)
    if (probe.error) dateCol = 'criado_em'
  }

  // ── Eventos do funil ───────────────────────────────────────
  async function countEvento(tipo: string, sinceIso?: string) {
    let q = admin.from('eventos').select('id', { count: 'exact', head: true }).eq('tipo', tipo)
    if (sinceIso) q = q.gte('created_at', sinceIso)
    const { count, error } = await q
    if (error) { eventosOk = false; eventosErro = error.message }
    return count ?? 0
  }
  async function countEventoUnico(tipo: string, sinceIso?: string) {
    let q = admin.from('eventos').select('session_id').eq('tipo', tipo)
    if (sinceIso) q = q.gte('created_at', sinceIso)
    const { data } = await q
    return new Set((data ?? []).map((r: { session_id: string | null }) => r.session_id).filter(Boolean)).size
  }

  // ── Referrers (de onde vieram) ─────────────────────────────
  async function topReferrers(sinceIso: string) {
    const { data } = await admin.from('eventos')
      .select('referrer')
      .eq('tipo', 'page_view')
      .gte('created_at', sinceIso)
    const counts: Record<string, number> = {}
    for (const r of (data ?? []) as { referrer: string | null }[]) {
      let src = 'Direto / desconhecido'
      if (r.referrer) {
        try { src = new URL(r.referrer).hostname.replace(/^www\./, '') } catch { src = r.referrer }
      }
      // ignora visitas internas do próprio site
      if (src.includes('cartadeamor')) src = 'Direto / interno'
      counts[src] = (counts[src] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([fonte, total]) => ({ fonte, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }

  // ── Pedidos (tabela casais) ────────────────────────────────
  async function countCasais(status?: string, sinceIso?: string) {
    let q = admin.from('casais').select('id', { count: 'exact', head: true })
    if (status) q = q.eq('status', status)
    if (sinceIso) q = q.gte(dateCol, sinceIso)
    const { count, error } = await q
    if (error) pedidosErro = error.message
    return count ?? 0
  }

  const [
    acessos, acessosUnicos, acessosHoje,
    formAbertos, formHoje,
    checkouts, checkoutHoje,
    totalPedidos, pendentes, pagos, pagosHoje,
    referrers, ultimosPedidos,
  ] = await Promise.all([
    countEvento('page_view', desde),
    countEventoUnico('page_view', desde),
    countEvento('page_view', hoje),
    countEvento('form_open', desde),
    countEvento('form_open', hoje),
    countEvento('checkout_reached', desde),
    countEvento('checkout_reached', hoje),
    countCasais(undefined, desde),
    countCasais('pendente', desde),
    countCasais('publicado', desde),
    countCasais('publicado', hoje),
    topReferrers(desde),
    admin.from('casais')
      .select('*')
      .order(dateCol, { ascending: false })
      .limit(15)
      .then(r => ((r.data ?? []) as Record<string, unknown>[]).map((p) => ({
        nome1: p.nome1, nome2: p.nome2, status: p.status,
        email_cliente: p.email_cliente, slug: p.slug,
        created_at: p[dateCol],
      }))),
  ])

  const receita = pagos * 29.90

  return NextResponse.json({
    range,
    funil: { acessos, acessosUnicos, acessosHoje, formAbertos, formHoje, checkouts, checkoutHoje, pagos, pagosHoje },
    pedidos: { total: totalPedidos, pendentes, pagos },
    receita,
    taxas: {
      acessoParaForm:   acessos     ? (formAbertos / acessos * 100) : 0,
      formParaCheckout: formAbertos ? (checkouts / formAbertos * 100) : 0,
      checkoutParaPago: checkouts   ? (pagos / checkouts * 100) : 0,
      acessoParaPago:   acessos     ? (pagos / acessos * 100) : 0,
    },
    referrers,
    ultimosPedidos,
    eventosOk, eventosErro, pedidosErro,
  })
}
