// Tracking leve de funil para o painel admin (independente do Meta Pixel).
// Não bloqueia nada: falhas são silenciosas.

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
