'use client'

import { useState, useEffect, useRef } from 'react'
import { pixelTrack } from '@/lib/pixel'
import '@/styles/checkout.css'

interface PagarProps {
  casalId: string
  nome1: string
  nome2: string
  email: string
}

type Stage = 'form' | 'pix-qr' | 'pix-confirmed'

export default function PagarClient({ casalId, nome1, nome2, email }: PagarProps) {
  const [payMethod, setPayMethod] = useState<'pix' | 'card'>('pix')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState('')
  const [stage, setStage] = useState<Stage>('form')
  const [copied, setCopied] = useState(false)

  // PIX QR code data
  const [qrBase64, setQrBase64] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [ticketUrl, setTicketUrl] = useState('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (stage !== 'pix-qr') return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/buscar-pagina?casal_id=${casalId}`)
        const json = await res.json()
        if (json.status === 'publicado' && json.slug) {
          clearInterval(pollRef.current!)
          setStage('pix-confirmed')
          pixelTrack('Purchase', { value: 19.90, currency: 'BRL' })
          setTimeout(() => {
            window.location.href = `/sucesso?casal_id=${casalId}`
          }, 2000)
        }
      } catch { /* ignora erros */ }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [stage, casalId])

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
    setSubmitting(true)
    setStatus('Preparando seu pagamento...')
    pixelTrack('Lead', { content_name: 'pagar_retry' })

    const formData = new FormData()
    formData.append('casal_id', casalId)

    try {
      if (payMethod === 'pix') {
        setStatus('Gerando QR Code PIX...')
        const res = await fetch('/api/pix', { method: 'POST', body: formData })
        const json = await res.json()

        if (!res.ok) throw new Error(json.error ?? 'Erro ao gerar PIX')

        setQrBase64(json.qrCodeBase64 ?? '')
        setQrCode(json.qrCode ?? '')
        setTicketUrl(json.ticketUrl ?? '')
        pixelTrack('InitiateCheckout', { value: 19.90, currency: 'BRL' })
        setStage('pix-qr')
        setTimeLeft(3 * 60)
        setSubmitting(false)
        setStatus('')
      } else {
        setStatus('Gerando link de pagamento...')
        const res = await fetch('/api/checkout', { method: 'POST', body: formData })
        const json = await res.json()

        if (!res.ok || !json.checkoutUrl) throw new Error(json.error ?? 'Erro ao gerar pagamento')

        pixelTrack('InitiateCheckout', { value: 19.90, currency: 'BRL' })
        window.location.href = `/sucesso?casal_id=${casalId}&mp=${encodeURIComponent(json.checkoutUrl)}`
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

  if (stage === 'pix-qr' || stage === 'pix-confirmed') {
    return (
      <div className="ck">
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
                <div className="ck-qr-wrap">
                  {qrBase64 ? (
                    <img src={`data:image/png;base64,${qrBase64}`} alt="QR Code PIX" className="ck-qr-img" />
                  ) : (
                    <div className="ck-qr-placeholder">⬡</div>
                  )}
                  <div className="ck-qr-amount">R$ 19,90</div>
                </div>
                {qrCode && (
                  <div className="ck-copy-wrap">
                    <p className="ck-copy-label">ou copie o código PIX</p>
                    <div className="ck-copy-row">
                      <input className="ck-copy-input" value={qrCode} readOnly onClick={e => (e.target as HTMLInputElement).select()} />
                      <button className="ck-copy-btn" onClick={copyCode}>{copied ? '✓ Copiado' : 'Copiar'}</button>
                    </div>
                  </div>
                )}
                <div className="ck-pix-waiting">
                  <div className="ck-pix-spinner" />
                  <span>
                    Aguardando pagamento...
                    {timeLeft !== null && <b style={{ color: 'var(--rose)', marginLeft: 8 }}>(Expira em {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')})</b>}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="ck">
      <div className="ck-body" style={{ marginTop: '5vh' }}>
        <div className="ck-left">
          <div className="ck-card">
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontStyle: 'italic', marginBottom: 8 }}>Finalizar Pedido</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              Parece que o seu pedido anterior ({email}) ficou com o pagamento pendente. Escolha como deseja pagar:
            </p>

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
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Você será redirecionado para o Mercado Pago de forma segura.</p>
              </div>
            )}
          </div>

          <div className="ck-cta-wrap">
            {status && <div className="ck-status">{status}</div>}
            <button className="ck-btn-pay" onClick={handlePay} disabled={submitting}>
              {submitting ? '⏳ Processando...' : payMethod === 'pix' ? '⬡ Gerar QR Code PIX — R$ 19,90' : '🔒 Pagar com Cartão — R$ 19,90'}
            </button>
            <p className="ck-trust-text">🔒 Pagamento seguro pelo Mercado Pago</p>
          </div>
        </div>

        <div className="ck-right">
          <div className="ck-summary-card">
            {nome1 && nome2 && (
              <div className="ck-summary-row" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', paddingBottom: 12, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <span>💑 {nome1} &amp; {nome2}</span>
              </div>
            )}
            <div className="ck-summary-row"><span>Página Romântica</span><span>R$ 19,90</span></div>
            <div className="ck-summary-row total"><span>Total</span><span>R$ 19,90</span></div>
          </div>
          <div className="ck-security-card">
            <span className="ck-security-icon">🛡️</span>
            <div>
              <p className="ck-security-title">100% seguro · Mercado Pago</p>
              <p className="ck-security-sub">Dados criptografados e processados pelo Mercado Pago.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
