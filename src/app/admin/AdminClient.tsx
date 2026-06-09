'use client'

import { useState, useEffect, useCallback } from 'react'

interface Stats {
  range: number
  funil: {
    acessos: number; acessosUnicos: number; acessosHoje: number
    formAbertos: number; formHoje: number
    checkouts: number; checkoutHoje: number
    pagos: number; pagosHoje: number
  }
  pedidos: { total: number; pendentes: number; pagos: number }
  receita: number
  taxas: {
    acessoParaForm: number; formParaCheckout: number
    checkoutParaPago: number; acessoParaPago: number
  }
  ultimosPedidos: { nome1: string; nome2: string; status: string; email_cliente: string; created_at: string; slug: string }[]
  eventosOk?: boolean
  eventosErro?: string
}

const RANGES = [
  { label: 'Hoje', days: 1 },
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
]

const C = {
  bg: '#0f0a0c', card: '#1a1115', border: '#2a1c22',
  rose: '#e05070', roseLight: '#f2a9b7', gold: '#c8993f',
  text: '#f5ede6', muted: '#9a7d84', green: '#22c55e', amber: '#f2a93b',
}

export default function AdminClient() {
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchStats = useCallback(async (rangeDays: number) => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: rangeDays }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json?.error ?? 'Erro ao carregar'); setLoading(false); return }
      setStats(json)
    } catch {
      setError('Erro ao carregar dados')
    } finally { setLoading(false) }
  }, [])

  // Carrega ao montar
  useEffect(() => { fetchStats(30) }, [fetchStats])

  function changeRange(d: number) {
    setDays(d)
    fetchStats(d)
  }

  const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const pct = (v: number) => `${v.toFixed(1)}%`

  // ── DASHBOARD ─────────────────────────────────────────────
  const f = stats?.funil
  const t = stats?.taxas

  const cards = f ? [
    { label: 'Acessos ao site',   value: f.acessos,     sub: `${f.acessosUnicos} únicos · ${f.acessosHoje} hoje`, icon: '👁️', color: C.roseLight },
    { label: 'Abriram o formulário', value: f.formAbertos, sub: `${f.formHoje} hoje`,        icon: '📝', color: C.gold },
    { label: 'Chegaram no checkout', value: f.checkouts,   sub: `${f.checkoutHoje} hoje`,    icon: '🛒', color: C.amber },
    { label: 'Pedidos pagos',     value: f.pagos,       sub: `${f.pagosHoje} hoje`,          icon: '✅', color: C.green },
  ] : []

  const funnelSteps = f && t ? [
    { label: 'Acessos',    value: f.acessos,     rate: null },
    { label: 'Formulário', value: f.formAbertos, rate: t.acessoParaForm },
    { label: 'Checkout',   value: f.checkouts,   rate: t.formParaCheckout },
    { label: 'Pago',       value: f.pagos,       rate: t.checkoutParaPago },
  ] : []
  const maxFunnel = funnelSteps.length ? Math.max(...funnelSteps.map(s => s.value), 1) : 1

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif', color: C.text }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌹</span>
          <strong style={{ fontSize: 16 }}>Painel · Romântico do Casal</strong>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {RANGES.map(r => (
            <button key={r.days} onClick={() => changeRange(r.days)}
              style={{ padding: '8px 14px', borderRadius: 99, border: `1px solid ${days === r.days ? C.rose : C.border}`, background: days === r.days ? C.rose : 'transparent', color: days === r.days ? '#fff' : C.muted, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        {loading && <p style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Carregando...</p>}
        {error && <p style={{ color: C.rose, textAlign: 'center', padding: 40 }}>⚠ {error}</p>}

        {stats && !loading && stats.eventosOk === false && (
          <div style={{ background: 'rgba(242,169,59,0.12)', border: `1px solid ${C.amber}`, borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <p style={{ color: C.amber, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>⚠ Tracking de funil inativo</p>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
              A tabela <code style={{ color: C.text }}>eventos</code> não foi encontrada no Supabase, então
              acessos / formulário / checkout aparecem zerados. Rode o SQL de <code style={{ color: C.text }}>supabase/eventos.sql</code> no
              SQL Editor do Supabase para ativar. (Pedidos pagos continuam funcionando normalmente.)
            </p>
          </div>
        )}

        {stats && !loading && (
          <>
            {/* Receita */}
            <div style={{ background: `linear-gradient(135deg, ${C.rose}, #8c1a2e)`, borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
              <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Receita no período ({days} dias)</p>
              <p style={{ fontSize: 38, fontWeight: 700 }}>{money(stats.receita)}</p>
              <p style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{stats.pedidos.pagos} pedidos pagos · {stats.pedidos.pendentes} pendentes</p>
            </div>

            {/* Cards do funil */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
              {cards.map((c, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                  </div>
                  <p style={{ fontSize: 32, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value.toLocaleString('pt-BR')}</p>
                  <p style={{ fontSize: 13, color: C.text, marginTop: 8, fontWeight: 500 }}>{c.label}</p>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Funil de conversão */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, marginBottom: 28 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Funil de conversão</h2>
              {funnelSteps.map((s, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span>{s.label}</span>
                    <span style={{ color: C.muted }}>
                      {s.value.toLocaleString('pt-BR')}
                      {s.rate !== null && <span style={{ color: C.gold, marginLeft: 8 }}>({pct(s.rate)})</span>}
                    </span>
                  </div>
                  <div style={{ height: 10, background: C.bg, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(2, s.value / maxFunnel * 100)}%`, background: `linear-gradient(90deg, ${C.rose}, ${C.gold})`, borderRadius: 99, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 12, color: C.muted, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                Conversão total (acesso → pago): <strong style={{ color: C.green }}>{t ? pct(t.acessoParaPago) : '—'}</strong>
              </p>
            </div>

            {/* Últimos pedidos */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Últimos pedidos</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: C.muted, textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', fontWeight: 500 }}>Casal</th>
                      <th style={{ padding: '8px 12px', fontWeight: 500 }}>E-mail</th>
                      <th style={{ padding: '8px 12px', fontWeight: 500 }}>Status</th>
                      <th style={{ padding: '8px 12px', fontWeight: 500 }}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.ultimosPedidos.map((p, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: '10px 12px' }}>{p.nome1} & {p.nome2}</td>
                        <td style={{ padding: '10px 12px', color: C.muted }}>{p.email_cliente}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                            background: p.status === 'publicado' ? 'rgba(34,197,94,0.15)' : 'rgba(242,169,59,0.15)',
                            color: p.status === 'publicado' ? C.green : C.amber }}>
                            {p.status === 'publicado' ? 'pago' : p.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: C.muted }}>
                          {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                    {stats.ultimosPedidos.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: C.muted }}>Nenhum pedido ainda.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
