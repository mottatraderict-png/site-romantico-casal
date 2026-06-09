'use client'

import { useState } from 'react'
import { pixelTrack } from '@/lib/pixel'
import '@/styles/checkout.css'

interface CheckoutProps {
  nome1: string
  nome2: string
  dataInicio: string
  fotosCount: number
  marcosCount: number
  temCarta: boolean
  temMusica: string
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

export default function CheckoutClient({
  nome1, nome2, dataInicio, fotosCount, marcosCount, temCarta, temMusica,
  formData, onBack
}: CheckoutProps) {
  const [payMethod, setPayMethod] = useState<'card' | 'pix'>('pix')
  const [email, setEmail]         = useState('')
  const [whatsapp, setWhatsapp]   = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus]        = useState('')

  function formatDate(d: string) {
    if (!d) return ''
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  async function handlePay() {
    setEmailError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Informe um e-mail válido para receber o link.')
      return
    }
    if (!formData) return

    setSubmitting(true)
    setStatus('Preparando sua página...')

    try {
      formData.set('email', email.trim())
      formData.set('whatsapp', whatsapp.trim())

      const fotoCount = Array.from(formData.keys()).filter(k => k.startsWith('foto_')).length
      if (fotoCount > 0) setStatus(`Enviando ${fotoCount} foto${fotoCount > 1 ? 's' : ''}...`)

      setStatus('Gerando seu link de pagamento...')
      pixelTrack('Lead', { content_name: 'checkout_pay' })

      const res  = await fetch('/api/checkout', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok || !json.checkoutUrl) throw new Error(json.error ?? 'Erro ao gerar pagamento')

      pixelTrack('InitiateCheckout', { value: 19.90, currency: 'BRL' })

      const dest = `/sucesso?casal_id=${json.casalId}&mp=${encodeURIComponent(json.checkoutUrl)}`
      window.location.href = dest
    } catch (err) {
      console.error(err)
      setStatus('Erro ao processar. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <div className="ck">
      {/* ── TOPBAR COM STEPS ── */}
      <div className="ck-topbar">
        <div className="ck-steps">
          <div className="ck-step done">
            <div className="ck-step-num">✓</div>
            <span>Sua história</span>
          </div>
          <span className="ck-step-arrow">›</span>
          <div className="ck-step active">
            <div className="ck-step-num">2</div>
            <span>Pagamento</span>
          </div>
          <span className="ck-step-arrow">›</span>
          <div className="ck-step">
            <div className="ck-step-num">3</div>
            <span>Confirmação</span>
          </div>
        </div>
      </div>

      <div className="ck-body">
        {/* ══ COLUNA ESQUERDA ══ */}
        <div className="ck-left">

          {/* Forma de pagamento */}
          <div className="ck-card">
            <p className="ck-card-title">Forma de pagamento</p>

            <div className="ck-pay-tabs">
              <button
                className={`ck-tab${payMethod === 'pix' ? ' active' : ''}`}
                onClick={() => setPayMethod('pix')}
              >
                <span className="ck-tab-icon">⬡</span> PIX
              </button>
              <button
                className={`ck-tab${payMethod === 'card' ? ' active' : ''}`}
                onClick={() => setPayMethod('card')}
              >
                <span className="ck-tab-icon">💳</span> Cartão de crédito
              </button>
            </div>

            {payMethod === 'pix' ? (
              <div className="ck-pix-box">
                <span className="ck-pix-icon">⬡</span>
                <p className="ck-pix-title">Pague com PIX</p>
                <p className="ck-pix-sub">
                  Aprovação imediata · QR Code gerado pelo Mercado Pago<br />
                  Você será redirecionado após clicar em pagar.
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
                  <div>
                    <label className="ck-label">Validade</label>
                    <input className="ck-input" placeholder="MM/AA" />
                  </div>
                  <div>
                    <label className="ck-label">CVV</label>
                    <input className="ck-input" placeholder="•••" />
                  </div>
                </div>
                <div className="ck-field-row-3">
                  <div>
                    <label className="ck-label">Tipo</label>
                    <select className="ck-select">
                      <option>CPF</option>
                      <option>CNPJ</option>
                    </select>
                  </div>
                  <div>
                    <label className="ck-label">CPF / Documento</label>
                    <input className="ck-input" placeholder="Digite seu CPF" />
                  </div>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  * Os dados do cartão são processados pelo Mercado Pago com criptografia SSL.
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
                <input
                  className="ck-input"
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError('') }}
                />
                {emailError && <span className="ck-error">⚠ {emailError}</span>}
              </div>
              <div>
                <label className="ck-label">WhatsApp <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
                <input
                  className="ck-input"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="ck-cta-wrap">
            {status && <div className="ck-status">{status}</div>}
            <button className="ck-btn-pay" onClick={handlePay} disabled={submitting}>
              {submitting ? '⏳ Processando...' : '🔒 Pagar R$ 19,90 e criar minha página ♡'}
            </button>
            <p className="ck-trust-text">
              🔒 Pagamento seguro e criptografado pelo{' '}
              <a href="https://mercadopago.com.br" target="_blank" rel="noopener noreferrer">
                Mercado Pago
              </a>
            </p>
            <button
              onClick={onBack}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 4 }}
            >
              ← Voltar e editar
            </button>
          </div>

        </div>

        {/* ══ COLUNA DIREITA ══ */}
        <div className="ck-right">

          {/* Card escuro do plano */}
          <div className="ck-plan-card">
            <span className="ck-popular-badge">♥ Presente perfeito</span>
            <div className="ck-plan-name">
              <span>🌹</span> Página Romântica do Casal
            </div>
            <div className="ck-plan-price">R$ 19,90</div>
            <p className="ck-plan-period">pagamento único · página no ar para sempre</p>
            <div className="ck-plan-features">
              {FEATURES.map((f, i) => (
                <div key={i} className="ck-feature">
                  <span className="ck-feature-check">✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Resumo do pedido */}
          <div className="ck-summary-card">
            {nome1 && nome2 && (
              <div className="ck-summary-row" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', paddingBottom: 12, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <span>💑 {nome1} &amp; {nome2}</span>
              </div>
            )}
            {dataInicio && (
              <div className="ck-summary-row">
                <span>📅 Juntos desde</span>
                <span style={{ fontStyle: 'italic' }}>{formatDate(dataInicio)}</span>
              </div>
            )}
            {fotosCount > 0 && (
              <div className="ck-summary-row">
                <span>📷 Fotos</span>
                <span>{fotosCount} foto{fotosCount > 1 ? 's' : ''}</span>
              </div>
            )}
            {marcosCount > 0 && (
              <div className="ck-summary-row">
                <span>📖 Momentos</span>
                <span>{marcosCount} momento{marcosCount > 1 ? 's' : ''}</span>
              </div>
            )}
            {temCarta && (
              <div className="ck-summary-row">
                <span>💌 Cartinha</span>
                <span style={{ color: 'var(--green)' }}>✓ incluída</span>
              </div>
            )}
            {temMusica && (
              <div className="ck-summary-row">
                <span>🎵 Música</span>
                <span style={{ fontStyle: 'italic', maxWidth: 120, textAlign: 'right', fontSize: 11 }}>{temMusica}</span>
              </div>
            )}
            <div className="ck-summary-row">
              <span>Página Romântica</span>
              <span>R$ 19,90</span>
            </div>
            <div className="ck-summary-row">
              <span>Desconto</span>
              <span className="discount">R$ 0,00</span>
            </div>
            <div className="ck-summary-row total">
              <span>Total</span>
              <span>R$ 19,90</span>
            </div>
          </div>

          {/* Segurança */}
          <div className="ck-security-card">
            <span className="ck-security-icon">🛡️</span>
            <div>
              <p className="ck-security-title">100% seguro · Processado pelo Mercado Pago</p>
              <p className="ck-security-sub">Seus dados financeiros são criptografados e nunca armazenados em nossos servidores.</p>
            </div>
          </div>

          {/* Trust items */}
          <div className="ck-trust-list">
            <div className="ck-trust-item">
              <span className="ck-trust-item-icon">🔒</span>
              <span>Conexão SSL — dados 100% criptografados</span>
            </div>
            <div className="ck-trust-item">
              <span className="ck-trust-item-icon">✅</span>
              <span>Entrega instantânea após o pagamento</span>
            </div>
            <div className="ck-trust-item">
              <span className="ck-trust-item-icon">♡</span>
              <span>Página no ar para sempre, sem mensalidade</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
