// Tracking leve de funil. Envia para 2 destinos:
//  1. Vercel Analytics (aparece no painel da Vercel, ZERO configuração)
//  2. Nossa tabela `eventos` no Supabase (alimenta o /admin) — opcional
// Não bloqueia nada: falhas são silenciosas.

import { track as vercelTrack } from '@vercel/analytics'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem('rc_sid')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('rc_sid', id)
    }
    return id
  } catch {
    return ''
  }
}

export function track(tipo: 'page_view' | 'form_open' | 'checkout_reached') {
  if (typeof window === 'undefined') return

  // 1) Vercel Analytics — evento de funil (page_view já é automático via <Analytics/>)
  try {
    if (tipo !== 'page_view') vercelTrack(tipo)
  } catch { /* silencioso */ }

  // 2) Nossa tabela eventos (alimenta o /admin) — opcional, falha silenciosa
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        tipo,
        path: window.location.pathname,
        referrer: document.referrer || null,
        sessionId: getSessionId(),
      }),
    }).catch(() => {})
  } catch {
    /* silencioso */
  }
}
