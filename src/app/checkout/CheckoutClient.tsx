'use client'

import { useState, useEffect, useRef } from 'react'
import { pixelTrack } from '@/lib/pixel'
import '@/styles/checkout.css'

interface CheckoutProps {
  nome1: string; nome2: string; dataInicio: string
  fotosCount: number; marcosCount: number
  temCarta: boolean; temMusica: string
  formData: FormData | null
  onBack: () => void
}

const FEATURES = [
  'Página personalizada para sempre',
  'Contador ao vivo de anos, meses e dias',
  'Galeria de fotos estilo polaroid',
  'Linha do tempo da história de vocês',
  'Carta de amor gerada pela IA',
  'Player do Spotify integrado',
  'Link exclusivo para compartilhar',
]

type Stage = 'form' | 'pix-qr' | 'pix-confirmed' | 'card-redirect'

export default function CheckoutClient({
  nome1, nome2, dataInicio, fotosCount, marcosCount, temCarta, temMusica,
  formData, onBack
}: CheckoutProps) {
  const [payMethod,  setPayMethod]  = useState<'pix' | 'card'>('pix')
  const [email,      setEmail]      = useState('')
  const [cpf,        setCpf]        = useState('')
  const [whatsapp,   setWhatsapp]   = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status,     setStatus]     = useState('')
  const [stage,      setStage]      = useState<Stage>('form')
  const [copied,     setCopied]     = useState(false)

  // PIX QR code data
  const [qrBase64,  setQrBase64]  = useState('')
  const [qrCode,    setQrCode]    = useState('')   // copia-e-cola
  const [ticketUrl, setTicketUrl] = useState('')
  const [casalId,   setCasalId]   = useState('')
  const [timeLeft,  setTimeLeft]  = useState<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function formatDate(d: string) {
    if (!d) return ''
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // ── Polling — verifica se o pagamento foi confirmado ────────
  useEffect(() => {
    if (stage !== 'pix-qr' || !casalId) return
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/buscar-pagina?casal_id=${casalId}`)
        const json = await res.json()
        if (json.status === 'publicado' && json.slug) {
          clearInterval(pollRef.current!)
          setStage('pix-confirmed')
          pixelTrack('Purchase', { value: 19.90, currency: 'BRL' })
          try {
            localStorage.removeItem('form_casal_draft')
          } catch {}
          setTimeout(() => {
            window.location.href = `/sucesso?casal_id=${casalId}`
          }, 2000)
        }
      } catch { /* ignora erros de rede */ }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [stage, casalId])

  // ── Timer regressivo para o PIX ─────────────────────────────
  useEffect(() => {
    if (stage !== 'pix-qr' || timeLeft === null) return
    if (timeLeft <= 0) {
      setQrBase64('')
      setQrCode('')
      setStatus('O tempo para pagamento expirou. Gere um novo PIX.')
      setStage('form')
      setTimeLeft(null)
      return
    }
    const timer = setInterval(() => setTimeLeft(prev => prev! - 1), 1000)
    return () => clearInterval(timer)
  }, [stage, timeLeft])

  async function handlePay() {
    setEmailError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Informe um e-mail válido para receber o link.')
      return
    }
    const cleanCpf = cpf.replace(/\D/g, '')
    if (payMethod === 'pix' && cleanCpf.length !== 11) {
      setEmailError('Para o PIX, o Banco Central exige um CPF válido.')
      return
    }
    if (!formData) return

    setSubmitting(true)
    formData.set('email', email.trim())
    formData.set('whatsapp', whatsapp.trim())
    formData.set('cpf', cleanCpf)

    const fotoCount = Array.from(formData.keys()).filter(k => k.startsWith('foto_')).length
    if (fotoCount > 0) setStatus(`Enviando ${fotoCount} foto${fotoCount > 1 ? 's' : ''}...`)
    else setStatus('Preparando sua página...')

    pixelTrack('Lead', { content_name: 'checkout_pay' })

    try {
      if (payMethod === 'pix') {
        // ── Fluxo PIX: gera QR Code direto ──────────────────
        setStatus('Gerando QR Code PIX...')
        const res  = await fetch('/api/pix', { method: 'POST', body: formData })
        const json = await res.json()

        if (!res.ok) throw new Error(json.error ?? 'Erro ao gerar PIX')

        setQrBase64(json.qrCodeBase64 ?? '')
        setQrCode(json.qrCode ?? '')
        setTicketUrl(json.ticketUrl ?? '')
        setCasalId(json.casalId ?? '')
        pixelTrack('InitiateCheckout', { value: 19.90, currency: 'BRL' })
        setStage('pix-qr')
        setTimeLeft(3 * 60)
        setSubmitting(false)
        setStatus('')

      } else {
        // ── Fluxo Cartão: redireciona para MP ───────────────
        setStatus('Gerando link de pagamento...')
        const res  = await fetch('/api/checkout', { method: 'POST', body: formData })
        const json = await res.json()

        if (!res.ok || !json.checkoutUrl) throw new Error(json.error ?? 'Erro ao gerar pagamento')

        pixelTrack('InitiateCheckout', { value: 19.90, currency: 'BRL' })
        try {
          localStorage.removeItem('form_casal_draft')
        } catch {}
        window.location.href = `/sucesso?casal_id=${json.casalId}&mp=${encodeURIComponent(json.checkoutUrl)}`
      }
    } catch (err) {
      console.error(err)
      setStatus('Erro ao processar. Tente novamente.')
      setSubmitting(false)
    }
  }

  async function copyCode() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(qrCode)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = qrCode
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar código:', err)
    }
  }

  // ── TELA PIX QR ─────────────────────────────────────────────
  if (stage === 'pix-qr' || stage === 'pix-confirmed') {
    return (
      <div className="ck">
        <div className="ck-topbar">
          <div className="ck-steps">
            <div className="ck-step done"><div className="ck-step-num">✓</div><span>Sua história</span></div>
            <span className="ck-step-arrow">›</span>
            <div className="ck-step done"><div className="ck-step-num">✓</div><span>Pagamento</span></div>
            <span className="ck-step-arrow">›</span>
            <div className="ck-step active"><div className="ck-step-num">3</div><span>Confirmação</span></div>
          </div>
        </div>

        <div className="ck-pix-screen">
          {stage === 'pix-confirmed' ? (
            <div className="ck-pix-confirmed">
              <div className="ck-pix-confirmed-icon">✓</div>
              <h2>Pagamento confirmado! ♥</h2>
              <p>Sua página está sendo preparada. Você será redirecionado em instantes...</p>
            </div>
          ) : (
            <>
              <div className="ck-pix-header">
                <h2>Pague com <span>PIX</span></h2>
                <p>Escaneie o QR Code ou copie o código. A confirmação é <b>instantânea</b>.</p>
              </div>

              <div className="ck-pix-body">
                {/* QR Code */}
                <div className="ck-qr-wrap">
                  {qrBase64 ? (
                    <img
                      src={`data:image/png;base64,${qrBase64}`}
                      alt="QR Code PIX"
                      className="ck-qr-img"
                    />
                  ) : (
                    <div className="ck-qr-placeholder">⬡</div>
                  )}
                  <div className="ck-qr-amount">R$ 19,90</div>
                </div>

                {/* Copia e cola */}
                {qrCode && (
                  <div className="ck-copy-wrap">
                    <p className="ck-copy-label">ou copie o código PIX</p>
                    <div className="ck-copy-row">
                      <input
                        className="ck-copy-input"
                        value={qrCode}
                        readOnly
                        onClick={e => (e.target as HTMLInputElement).select()}
                      />
                      <button className="ck-copy-btn" onClick={copyCode}>
                        {copied ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Aguardando */}
                <div className="ck-pix-waiting">
                  <div className="ck-pix-spinner" />
                  <span>
                    Aguardando pagamento...
                    {timeLeft !== null && (
                      <b style={{ color: 'var(--rose)', marginLeft: 8 }}>
                        (Expira em {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')})
                      </b>
                    )}
                  </span>
                </div>

                {ticketUrl && (
                  <a href={ticketUrl} target="_blank" rel="noopener noreferrer" className="ck-ticket-link">
                    Abrir página do PIX no Mercado Pago →
                  </a>
                )}
              </div>

              <div className="ck-pix-trust">
                <span>🔒 Pagamento processado pelo Mercado Pago · 100% seguro</span>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── TELA PRINCIPAL DE CHECKOUT ───────────────────────────────
  return (
    <div className="ck">
      <div className="ck-topbar">
        <div className="ck-steps">
          <div className="ck-step done"><div className="ck-step-num">✓</div><span>Sua história</span></div>
          <span className="ck-step-arrow">›</span>
          <div className="ck-step active"><div className="ck-step-num">2</div><span>Pagamento</span></div>
          <span className="ck-step-arrow">›</span>
          <div className="ck-step"><div className="ck-step-num">3</div><span>Confirmação</span></div>
        </div>
      </div>

      <div className="ck-body">
        {/* ══ ESQUERDA ══ */}
        <div className="ck-left">

          {/* Método de pagamento */}
          <div className="ck-card">
            <p className="ck-card-title">Forma de pagamento</p>
            <div className="ck-pay-tabs">
              <button className={`ck-tab${payMethod === 'pix' ? ' active' : ''}`} onClick={() => setPayMethod('pix')}>
                <span className="ck-tab-icon">⬡</span> PIX
              </button>
              <button className={`ck-tab${payMethod === 'card' ? ' active' : ''}`} onClick={() => setPayMethod('card')}>
                <span className="ck-tab-icon">💳</span> Cartão de crédito
              </button>
            </div>

            {payMethod === 'pix' ? (
              <div className="ck-pix-box">
                <span className="ck-pix-icon">⬡</span>
                <p className="ck-pix-title">QR Code gerado na hora</p>
                <p className="ck-pix-sub">
                  Clique em pagar e o QR Code aparece aqui.<br />
                  Aprovação <b>instantânea</b> — sem redirecionar.
                </p>
              </div>
            ) : (
              <div className="ck-fields">
                <div>
                  <label className="ck-label">Nome no cartão</label>
                  <input className="ck-input" placeholder="Nome como no cartão" />
                </div>
                <div>
                  <label className="ck-label">Número do cartão</label>
                  <input className="ck-input" placeholder="0000 0000 0000 0000" />
                </div>
                <div className="ck-field-row">
                  <div><label className="ck-label">Validade</label><input className="ck-input" placeholder="MM/AA" /></div>
                  <div><label className="ck-label">CVV</label><input className="ck-input" placeholder="•••" /></div>
                </div>
                <div className="ck-field-row-3">
                  <div>
                    <label className="ck-label">Tipo</label>
                    <select className="ck-select"><option>CPF</option><option>CNPJ</option></select>
                  </div>
                  <div><label className="ck-label">CPF / Documento</label><input className="ck-input" placeholder="Digite seu CPF" /></div>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  * Dados processados pelo Mercado Pago com criptografia SSL.
                </p>
              </div>
            )}
          </div>

          {/* Contato */}
          <div className="ck-card">
            <p className="ck-card-title">Onde enviamos o link</p>
            <div className="ck-contact">
              <div>
                <label className="ck-label">Seu e-mail <span style={{ color: 'var(--rose)' }}>*</span></label>
                <input className="ck-input" type="email" placeholder="voce@email.com"
                  value={email} onChange={e => { setEmail(e.target.value); setEmailError('') }} />
              </div>
              <div>
                <label className="ck-label">Seu CPF {payMethod === 'pix' && <span style={{ color: 'var(--rose)' }}>*</span>}</label>
                <input className="ck-input" type="text" placeholder="000.000.000-00" maxLength={14}
                  value={cpf} onChange={e => { setCpf(e.target.value); setEmailError('') }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="ck-label">WhatsApp <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
                <input className="ck-input" type="tel" placeholder="(11) 99999-9999"
                  value={whatsapp} onChange={e => setWhatsapp(e.target.value)} maxLength={20} />
              </div>
              {emailError && <div className="ck-error" style={{ gridColumn: '1 / -1' }}>⚠ {emailError}</div>}
            </div>
          </div>

          {/* CTA */}
          <div className="ck-cta-wrap">
            {status && <div className="ck-status">{status}</div>}
            <button className="ck-btn-pay" onClick={handlePay} disabled={submitting}>
              {submitting ? '⏳ Processando...' : payMethod === 'pix' ? '⬡ Gerar QR Code PIX — R$ 19,90' : '🔒 Pagar com Cartão — R$ 19,90'}
            </button>
            <p className="ck-trust-text">
              🔒 Pagamento seguro pelo{' '}
              <a href="https://mercadopago.com.br" target="_blank" rel="noopener noreferrer">Mercado Pago</a>
            </p>
            <button onClick={onBack} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:12,textAlign:'center',padding:4 }}>
              ← Voltar e editar
            </button>
          </div>
        </div>

        {/* ══ DIREITA ══ */}
        <div className="ck-right">
          <div className="ck-plan-card">
            <span className="ck-popular-badge">♥ Presente perfeito</span>
            <div className="ck-plan-name"><span>🌹</span> Página Romântica do Casal</div>
            <div className="ck-plan-price">R$ 19,90</div>
            <p className="ck-plan-period">pagamento único · página no ar para sempre</p>
            <div className="ck-plan-features">
              {FEATURES.map((f, i) => (
                <div key={i} className="ck-feature">
                  <span className="ck-feature-check">✓</span>{f}
                </div>
              ))}
            </div>
          </div>

          <div className="ck-summary-card">
            {nome1 && nome2 && (
              <div className="ck-summary-row" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', paddingBottom: 12, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <span>💑 {nome1} &amp; {nome2}</span>
              </div>
            )}
            {dataInicio && <div className="ck-summary-row"><span>📅 Juntos desde</span><span style={{ fontStyle: 'italic' }}>{formatDate(dataInicio)}</span></div>}
            {fotosCount > 0  && <div className="ck-summary-row"><span>📷 Fotos</span><span>{fotosCount} foto{fotosCount > 1 ? 's' : ''}</span></div>}
            {marcosCount > 0 && <div className="ck-summary-row"><span>📖 Momentos</span><span>{marcosCount} momento{marcosCount > 1 ? 's' : ''}</span></div>}
            {temCarta        && <div className="ck-summary-row"><span>💌 Cartinha</span><span style={{ color: '#22c55e' }}>✓ incluída</span></div>}
            {temMusica       && <div className="ck-summary-row"><span>🎵 Música</span><span style={{ fontStyle:'italic', fontSize:11 }}>{temMusica}</span></div>}
            <div className="ck-summary-row"><span>Página Romântica</span><span>R$ 19,90</span></div>
            <div className="ck-summary-row total"><span>Total</span><span>R$ 19,90</span></div>
          </div>

          <div className="ck-security-card">
            <span className="ck-security-icon">🛡️</span>
            <div>
              <p className="ck-security-title">100% seguro · Mercado Pago</p>
              <p className="ck-security-sub">Dados criptografados e nunca armazenados em nossos servidores.</p>
            </div>
          </div>

          <div className="ck-trust-list">
            <div className="ck-trust-item"><span className="ck-trust-item-icon">🔒</span><span>SSL — dados 100% criptografados</span></div>
            <div className="ck-trust-item"><span className="ck-trust-item-icon">✅</span><span>Entrega instantânea após o pagamento</span></div>
            <div className="ck-trust-item"><span className="ck-trust-item-icon">♡</span><span>Página no ar para sempre, sem mensalidade</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
