'use client'

import { useEffect, useState } from 'react'
import { pixelTrack } from '@/lib/pixel'
import '@/styles/formulario.css'

const BULBS = Array.from({ length: 18 })

export default function SucessoClient({ slug, qrDataUrl, casalId, mpUrl }: { slug: string | null; qrDataUrl: string | null; casalId: string | null; mpUrl: string | null }) {
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [foundSlug, setFoundSlug] = useState<string | null>(slug)
  const [foundQr, setFoundQr] = useState<string | null>(qrDataUrl)
  const [foundNomes, setFoundNomes] = useState('')
  const [buscaErro, setBuscaErro] = useState('')
  const [buscaStatus, setBuscaStatus] = useState('')
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState('')

  async function resendEmail() {
    if (!casalId && !email && !foundSlug) return
    setResending(true)
    setResendStatus('Enviando...')
    try {
      const query = casalId ? `casal_id=${casalId}` : email ? `email=${encodeURIComponent(email)}` : `slug=${foundSlug}`
      const res = await fetch(`/api/buscar-pagina?${query}&sendEmail=1`)
      if (res.ok) setResendStatus('E-mail reenviado com sucesso!')
      else setResendStatus('Erro ao reenviar.')
    } catch {
      setResendStatus('Erro ao reenviar.')
    } finally {
      setResending(false)
      setTimeout(() => setResendStatus(''), 4000)
    }
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const link = foundSlug ? `${baseUrl}/${foundSlug}` : ''

  // Pixel: Purchase ao carregar página de sucesso
  useEffect(() => { pixelTrack('Purchase', { value: 29.90, currency: 'BRL' }) }, [])

  // Polling automático por casal_id — verifica a cada 3s por até 2 minutos
  useEffect(() => {
    if (!casalId || slug) return // já tem slug ou não tem casal_id
    let stopped = false
    const MAX_TENTATIVAS = 40 // 40 × 3s = 2 minutos

    async function poll(tentativa: number) {
      if (stopped) return
      if (tentativa === 0) {
        setBuscando(true)
        setBuscaStatus('Confirmando seu pagamento...')
      }

      try {
        const res = await fetch(`/api/buscar-pagina?casal_id=${casalId}`)
        const json = await res.json()

        if (json.status === 'publicado' && json.slug) {
          if (stopped) return
          // Pagamento confirmado!
          setFoundSlug(json.slug)
          setFoundNomes(json.nome1 && json.nome2 ? `${json.nome1} & ${json.nome2}` : '')
          setBuscaStatus('')
          setBuscando(false)
          // Envia e-mail com o link
          fetch(`/api/buscar-pagina?casal_id=${casalId}&sendEmail=1`).catch(() => {})
          // Gera QR code
          const qrRes = await fetch(`/api/gerar-qr?slug=${json.slug}`)
          if (qrRes.ok) { const { qrDataUrl: qr } = await qrRes.json(); setFoundQr(qr) }
          return
        }

        // Ainda pendente — tenta de novo em 3s
        if (tentativa < MAX_TENTATIVAS) {
          setBuscaStatus(`Confirmando seu pagamento... ⏳`)
          setTimeout(() => poll(tentativa + 1), 3000)
        } else {
          setBuscaStatus('')
          setBuscaErro('Não detectamos o pagamento ainda. Se já pagou, digite seu e-mail abaixo.')
          setBuscando(false)
        }
      } catch {
        if (tentativa < MAX_TENTATIVAS) {
          setTimeout(() => poll(tentativa + 1), 3000)
        }
      }
    }

    poll(0)
    return () => { stopped = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Confete de corações
  useEffect(() => {
    const canvas = document.getElementById('conf-canvas') as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight })

    const COLORS = ['#c8506a', '#e8899a', '#f2c4cc', '#c9933a', '#ffffff', '#e8c0e0']
    interface Particle { x: number; y: number; vx: number; vy: number; s: number; c: string; g: number; a: number }
    const parts: Particle[] = []

    function drawHeart(x: number, y: number, s: number, c: string, a: number) {
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath()
      ctx.moveTo(x, y + s * 0.3)
      ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3)
      ctx.bezierCurveTo(x - s * 0.5, y + s * 0.65, x, y + s * 0.9, x, y + s)
      ctx.bezierCurveTo(x, y + s * 0.9, x + s * 0.5, y + s * 0.65, x + s * 0.5, y + s * 0.3)
      ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3)
      ctx.fill(); ctx.restore()
    }

    for (let i = 0; i < 80; i++) {
      parts.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 300,
        y: window.innerHeight * 0.4,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.9) * 16,
        s: Math.random() * 14 + 5,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        g: 0.5, a: 1,
      })
    }

    function anim() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        p.x += p.vx; p.y += p.vy; p.vy += p.g; p.a -= 0.012
        if (p.a <= 0.02) { parts.splice(i, 1); continue }
        drawHeart(p.x - p.s * 0.5, p.y - p.s * 0.5, p.s, p.c, p.a)
      }
      if (parts.length > 0) requestAnimationFrame(anim)
    }
    requestAnimationFrame(anim)
  }, [])

  async function copyLink() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadQR() {
    if (!foundQr || !foundSlug) return
    const a = document.createElement('a')
    a.href = foundQr
    a.download = `qrcode-${foundSlug}.png`
    a.click()
  }

  async function buscarPagina(e: React.FormEvent) {
    e.preventDefault()
    setBuscaErro('')
    setBuscaStatus('')
    if (!email.trim() || !email.includes('@')) {
      setBuscaErro('Informe um e-mail válido.')
      return
    }
    setBuscando(true)
    setBuscaStatus('Buscando sua página...')
    try {
      const res = await fetch(`/api/buscar-pagina?email=${encodeURIComponent(email.trim())}&sendEmail=1`)
      const json = await res.json()
      if (!res.ok || !json.slug) {
        if (json.status === 'pendente' && json.casalId) {
          window.location.href = `/pagar?casal_id=${json.casalId}`
          return
        }
        setBuscaStatus('')
        setBuscaErro(json.error ?? 'Nenhuma página encontrada para este e-mail.')
        setBuscando(false)
        return
      }

      // Gerar QR code via canvas
      const pageLink = `${window.location.origin}/${json.slug}`
      setFoundSlug(json.slug)
      setFoundNomes(json.nome1 && json.nome2 ? `${json.nome1} & ${json.nome2}` : '')
      setBuscaStatus('')

      // Gera QR via API do servidor
      const qrRes = await fetch(`/api/gerar-qr?slug=${json.slug}`)
      if (qrRes.ok) {
        const { qrDataUrl: qr } = await qrRes.json()
        setFoundQr(qr)
      }

      void pageLink
      setBuscando(false)
    } catch {
      setBuscaErro('Erro ao buscar. Tente novamente.')
      setBuscando(false)
    }
  }

  const btnSolid: React.CSSProperties = {
    background: '#be2e4b', border: 'none', borderRadius: 4,
    padding: '16px 28px', color: 'white',
    fontFamily: 'var(--title)', fontSize: 11, letterSpacing: '0.15em',
    textTransform: 'uppercase', cursor: 'pointer', flex: 1,
    minWidth: 160
  }
  const btnOutline: React.CSSProperties = {
    background: '#fffbf9', border: '1px solid #eadad2', borderRadius: 4,
    padding: '16px 28px', color: '#8e7970',
    fontFamily: 'var(--title)', fontSize: 11, letterSpacing: '0.15em',
    textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'none', 
    flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center'
  }
  const btnReenviar: React.CSSProperties = {
    background: 'none', border: 'none', color: '#c59d87',
    fontFamily: 'var(--title)', fontSize: 10, letterSpacing: '0.1em',
    textTransform: 'uppercase', cursor: 'pointer', marginTop: 16,
    textDecoration: 'underline'
  }

  return (
    <div className="form-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <canvas id="conf-canvas" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 500 }} />
      <div className="fairy-lights">
        <div className="wire" />
        {BULBS.map((_, i) => (<div key={i} className="bulb"><div className="bulb-wire" /><div className="bulb-light" /></div>))}
      </div>
      <div className="vignette" />

      <div style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 520, zIndex: 2, position: 'relative', width: '100%' }}>
        <div style={{ fontSize: 56, marginBottom: 24, animation: 'heartbeat 1.4s ease-in-out infinite', display: 'inline-block' }}>🌹</div>

        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px,5vw,34px)', fontStyle: 'italic', color: 'var(--text)', marginBottom: 12 }}>
          {foundSlug ? 'A página está pronta! ♡' : casalId ? 'Quase lá...' : 'Pagamento aprovado! ♡'}
        </h1>

        {/* ── COM SLUG: mostra link + QR ── */}
        {foundSlug ? (
          <>
            {foundNomes && (
              <p style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', color: '#f76b8a', marginBottom: 24, fontWeight: 500 }}>
                {foundNomes}
              </p>
            )}
            <p style={{ fontSize: 16, color: '#6d5a52', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 24 }}>
              A história de vocês ganhou um lugar especial na internet.<br />
              Compartilhe o link abaixo como surpresa. ♡
            </p>
            <p style={{ fontSize: 14, color: '#c59d87', fontStyle: 'italic', marginBottom: 24 }}>
              ✉️ Enviamos o link para o seu e-mail também.
            </p>

            <div
              onClick={copyLink}
              style={{ background: '#ffffff', border: '1px solid #eadad2', borderRadius: 4, padding: '16px 20px', fontFamily: 'var(--title)', fontSize: 14, letterSpacing: '0.05em', color: '#f76b8a', wordBreak: 'break-all', cursor: 'pointer', marginBottom: 32, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
            >
              {link}
            </div>

            {foundQr && (
              <div style={{ marginBottom: 40 }}>
                <p style={{ fontFamily: 'var(--title)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c59d87', marginBottom: 16 }}>
                  QR Code para imprimir ou enviar
                </p>
                <div style={{ display: 'inline-block', padding: 12, background: '#f5ede6', borderRadius: 8, margin: '0 auto' }}>
                  <img src={foundQr} alt="QR Code" width={180} height={180} style={{ display: 'block', borderRadius: 4, mixBlendMode: 'multiply' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <button onClick={copyLink} style={btnSolid}>{copied ? '✓ Copiado!' : 'Copiar link'}</button>
              {foundQr && <button onClick={downloadQR} style={btnOutline}>Baixar QR code</button>}
            </div>
            
            <a href={`/${foundSlug}`} target="_blank" rel="noopener noreferrer" style={{ ...btnOutline, display: 'flex', width: '100%', maxWidth: 360, margin: '0 auto' }}>Ver minha página →</a>
            
            <div style={{ marginTop: 24 }}>
              <button onClick={resendEmail} disabled={resending} style={btnReenviar}>
                {resending ? 'Enviando...' : 'Reenviar E-mail'}
              </button>
              {resendStatus && <p style={{ fontSize: 12, color: '#c59d87', marginTop: 8 }}>{resendStatus}</p>}
            </div>
          </>
        ) : casalId ? (
          /* ── COM casal_id: polling automático ── */
          <>
            {buscando && (
              <div style={{ margin: '32px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
                <p style={{ fontSize: 15, color: 'var(--gold-light)', fontStyle: 'italic', lineHeight: 1.8 }}>
                  {buscaStatus || 'Confirmando seu pagamento...'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 8 }}>
                  Verificando a cada 3 segundos. Não feche esta página.
                </p>
              </div>
            )}
            {mpUrl && buscando && (
              <a href={mpUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnSolid, display: 'inline-block', marginTop: 8, textDecoration: 'none' }}>
                Abrir Mercado Pago →
              </a>
            )}
            {buscaErro && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-gold)', borderRadius: 4, padding: '28px', marginTop: 24 }}>
                <p style={{ fontSize: 13, color: 'var(--rose-light)', fontStyle: 'italic', marginBottom: 20 }}>{buscaErro}</p>
                <form onSubmit={buscarPagina} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input type="email" className="field-input" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ textAlign: 'center' }} />
                  <button type="submit" className="btn-submit" disabled={buscando}>{buscando ? 'Buscando...' : 'Buscar minha página'}</button>
                </form>
              </div>
            )}
          </>
        ) : (
          /* ── SEM casal_id: busca manual por e-mail ── */
          <>
            <p style={{ fontSize: 15, color: 'var(--text-soft)', fontStyle: 'italic', lineHeight: 1.8, marginBottom: 32 }}>
              Digite o e-mail usado no cadastro para acessar sua página.
            </p>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-gold)', borderRadius: 4, padding: '32px 28px' }}>
              <form onSubmit={buscarPagina} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="email" className="field-input" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ textAlign: 'center' }} />
                <button type="submit" className="btn-submit" disabled={buscando}>{buscando ? 'Buscando...' : 'Buscar minha página'}</button>
              </form>
              {buscaStatus && <p style={{ fontSize: 13, color: 'var(--gold-light)', marginTop: 12, fontStyle: 'italic' }}>{buscaStatus}</p>}
              {buscaErro  && <p style={{ fontSize: 13, color: 'var(--rose-light)', marginTop: 12, fontStyle: 'italic' }}>{buscaErro}</p>}
            </div>
          </>
        )}

        <style>{`
          @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
          @keyframes heartbeat {
            0%,100% { transform: scale(1) }
            14% { transform: scale(1.2) }
            28% { transform: scale(1) }
            42% { transform: scale(1.1) }
            70% { transform: scale(1) }
          }
        `}</style>
      </div>
    </div>
  )
}
