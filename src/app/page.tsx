'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { pixelTrack } from '@/lib/pixel'
import '@/styles/landing.css'

const BULBS = Array.from({ length: 20 })

const STEPS = [
  {
    icon: '✍️',
    num: '1',
    title: 'Preencha o formulário',
    desc: 'Conta a história de vocês: nomes, data, fotos, marcos e a música que toca no coração.',
  },
  {
    icon: '💳',
    num: '2',
    title: 'Pague R$ 19,90',
    desc: 'Pagamento seguro via Mercado Pago — PIX ou cartão. Rápido e sem complicação.',
  },
  {
    icon: '🔗',
    num: '3',
    title: 'Compartilhe o link',
    desc: 'Sua página romântica fica no ar para sempre. Mande o link e surpreenda quem você ama.',
  },
]

const TESTIMONIALS = [
  {
    stars: '★★★★★',
    text: '"Mandei o link para minha namorada no dia do aniversário de 2 anos. Ela chorou. Valeu cada centavo — ficou lindo demais, parece coisa de cinema."',
    name: 'Lucas M.',
    when: 'comprou há 3 dias',
    emoji: '💑',
  },
  {
    stars: '★★★★★',
    text: '"Criei em 20 minutos e a reação do meu marido foi incrível. O contador ao vivo dos anos juntos é o detalhe que mais emocionou. Super recomendo!"',
    name: 'Fernanda R.',
    when: 'comprou há 5 dias',
    emoji: '💍',
  },
  {
    stars: '★★★★★',
    text: '"A carta gerada pela IA ficou tão boa que parecia que eu mesmo tinha escrito com muito cuidado. Surpresa de Dia dos Namorados perfeita."',
    name: 'Rafael S.',
    when: 'comprou há 1 semana',
    emoji: '🌹',
  },
]

export default function LandingPage() {
  useEffect(() => { pixelTrack('ViewContent', { content_name: 'landing' }) }, [])

  return (
    <div className="lp">
      {/* URGENCY BAR */}
      <div className="lp-urgency">
        🌹 <strong>Dia dos Namorados é dia 12 de junho</strong> — faltam poucos dias! Garanta já a sua página ♡
      </div>

      {/* FAIRY LIGHTS */}
      <div className="lp-lights">
        <div className="lp-wire" />
        <div className="lp-bulbs">
          {BULBS.map((_, i) => (
            <div key={i} className="lp-bulb">
              <div className="lp-bulb-wire" />
              <div className="lp-bulb-light" />
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-bg" />
        <div className="lp-hero-content">
          <span className="lp-eyebrow">✦ presente perfeito para o dia dos namorados ✦</span>

          <h1>
            Uma página romântica<br />
            <em>só para os dois</em>
          </h1>

          <p className="lp-hero-sub">
            Fotos, contador ao vivo, linha do tempo, carta de amor escrita pela IA —
            tudo em uma página linda com o link de vocês. Por apenas <strong style={{color:'var(--gold)'}}>R$&nbsp;19,90</strong>.
          </p>

          <div className="lp-cta-box">
            <Link href="/criar" className="lp-btn-buy" style={{display:'block',textAlign:'center',textDecoration:'none'}}>
              🌹 Criar minha página — R$&nbsp;19,90
            </Link>
            <p className="lp-price-note">
              🔒 Pagamento seguro via Mercado Pago · PIX ou cartão · Você preenche tudo antes de pagar
            </p>
          </div>
        </div>
      </section>

      {/* PREVIEW MOCKUP */}
      <section className="lp-preview-section">
        <span className="lp-section-tag">✦ o que você recebe ✦</span>
        <h2 className="lp-section-title">Uma página assim, só de vocês</h2>

        <div className="lp-mockup">
          <div className="lp-mockup-bar">
            <div className="lp-mockup-dot" />
            <div className="lp-mockup-dot" />
            <div className="lp-mockup-dot" />
            <span className="lp-mockup-url">seusite.vercel.app/ana-e-pedro</span>
          </div>
          <div className="lp-mockup-body">
            <div className="lp-mock-lights">
              {Array.from({length:10}).map((_,i) => <div key={i} className="lp-mock-bulb"/>)}
            </div>
            <p className="lp-mock-eyebrow">uma história de amor</p>
            <div className="lp-mock-names">
              Ana<span className="lp-mock-amp">&amp;</span>Pedro
            </div>
            <p className="lp-mock-date">juntos desde 14 de janeiro de 2022</p>
            <div className="lp-mock-counter">
              {[['4','anos'],['5','meses'],['12','dias'],['08','horas']].map(([n,u]) => (
                <div key={u} className="lp-mock-cnt">
                  <span className="lp-mock-cnt-num">{n}</span>
                  <span className="lp-mock-cnt-unit">{u}</span>
                </div>
              ))}
            </div>
            <div className="lp-mock-photos">
              <div className="lp-mock-photo">📷</div>
              <div className="lp-mock-photo">🌅</div>
              <div className="lp-mock-photo">💑</div>
            </div>
            <div className="lp-mock-carta">
              &ldquo;Você é a pessoa que transforma qualquer lugar em lar. Cada instante ao seu lado me faz querer viver mais intensamente...&rdquo;
            </div>
            <p className="lp-mock-frase">&ldquo;para sempre e um dia a mais&rdquo;</p>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="lp-how">
        <div className="lp-how-inner">
          <span className="lp-section-tag">✦ simples assim ✦</span>
          <h2 className="lp-section-title">Como funciona</h2>
          <div className="lp-steps">
            {STEPS.map((s) => (
              <div key={s.num} className="lp-step">
                <span className="lp-step-icon">{s.icon}</span>
                <div className="lp-step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="lp-testimonials">
        <div className="lp-testimonials-inner">
          <span className="lp-section-tag">✦ quem já criou ✦</span>
          <h2 className="lp-section-title">Momentos que emocionaram de verdade</h2>
          <div className="lp-cards">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="lp-card">
                <div className="lp-card-stars">{t.stars}</div>
                <p className="lp-card-text">{t.text}</p>
                <div className="lp-card-author">
                  <div className="lp-card-avatar">{t.emoji}</div>
                  <div>
                    <div className="lp-card-name">{t.name}</div>
                    <div className="lp-card-when">{t.when}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="lp-final-cta">
        <h2>Falta pouco para o<br /><em>Dia dos Namorados</em></h2>
        <p>Não deixe para última hora. Em menos de 5 minutos o presente está pronto.</p>

        <div className="lp-cta-box" style={{margin:'0 auto'}}>
          <Link href="/criar" className="lp-btn-buy" style={{display:'block',textAlign:'center',textDecoration:'none'}}>
            🌹 Criar minha página — R$&nbsp;19,90
          </Link>
          <p className="lp-price-note">
            🔒 Você preenche tudo primeiro, paga só no final · PIX ou cartão
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <p>
          Feito com 🌹 para casais apaixonados &nbsp;·&nbsp;{' '}
          <Link href="/ana-e-pedro" style={{color:'var(--rose-light)'}}>ver exemplo</Link>
        </p>
      </footer>
    </div>
  )
}