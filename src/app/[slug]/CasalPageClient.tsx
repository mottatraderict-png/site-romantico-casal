'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { CasalCompleto } from '@/lib/types'
import '@/styles/casal.css'

// ── FAIRY LIGHTS ─────────────────────────────────────────────
const BULBS = Array.from({ length: 20 })
function FairyLights({ bottom = false }) {
  return (
    <div className={bottom ? 'fairy-lights fairy-lights-bottom' : 'fairy-lights'}>
      <div className="wire" />
      {BULBS.map((_, i) => (
        <div key={i} className="bulb">
          <div className="bulb-wire" />
          <div className="bulb-light" />
        </div>
      ))}
    </div>
  )
}

// ── HELPERS ───────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function todayFormatted() {
  return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── TIPOS INTERNOS ────────────────────────────────────────────
interface CounterState {
  years: number; months: number; days: number
  hours: string; mins: string; secs: string
}

// ─────────────────────────────────────────────────────────────
export default function CasalPageClient({ casal }: { casal: CasalCompleto }) {
  const [opened, setOpened] = useState(false)
  const [introHidden, setIntroHidden] = useState(false)
  const [envelopeOpen, setEnvelopeOpen] = useState(false)
  const [counter, setCounter] = useState<CounterState>({ years: 0, months: 0, days: 0, hours: '00', mins: '00', secs: '00' })
  const prevSecsRef = useRef('')
  const [flashSecs, setFlashSecs] = useState(false)
  const spotifyRef = useRef<HTMLIFrameElement>(null)
  const petalCanvasRef   = useRef<HTMLCanvasElement>(null)
  const confCanvasRef    = useRef<HTMLCanvasElement>(null)
  const petalRunning     = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const petals    = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const confetti  = useRef<any[]>([])

  // ── ABRIR ENVELOPE ───────────────────────────────────────────
  const openPage = useCallback(() => {
    if (opened) return
    setEnvelopeOpen(true)
    setTimeout(() => {
      setOpened(true)
      setTimeout(() => {
        setIntroHidden(true)
        petalRunning.current = true
        animatePetals()
      }, 800)
    }, 900)

    // Autoplay Spotify — dispara após interação do usuário (clique no envelope)
    // Usamos um pequeno delay para garantir que o navegador processe o gesto do usuário
    setTimeout(() => {
      const iframe = document.getElementById('spotify-player') as HTMLIFrameElement
      if (iframe && casal.spotify_track_id) {
        // Força recarregamento com autoplay=1 — funciona pois há gesto do usuário
        iframe.src = `https://open.spotify.com/embed/track/${casal.spotify_track_id}?utm_source=generator&theme=0&autoplay=1`
      }
    }, 800)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened])

  useEffect(() => {
    const timer = setTimeout(() => openPage(), 12000)
    return () => clearTimeout(timer)
  }, [openPage])

  // ── CONTADOR ─────────────────────────────────────────────────
  useEffect(() => {
    const startDate = new Date(casal.data_inicio + 'T12:00:00')
    function tick() {
      const now = new Date()
      const diff = now.getTime() - startDate.getTime()
      if (diff < 0) return // data no futuro
      const totalSecs  = Math.floor(diff / 1000)
      const totalMins  = Math.floor(totalSecs / 60)
      const totalHours = Math.floor(totalMins / 60)
      const totalDays  = Math.floor(totalHours / 24)
      const years  = Math.floor(totalDays / 365.25)
      const months = Math.floor((totalDays % 365.25) / 30.44)
      const days   = Math.floor((totalDays % 365.25) % 30.44)
      const secs   = String(totalSecs % 60).padStart(2, '0')

      setCounter({
        years, months, days,
        hours: String(totalHours % 24).padStart(2, '0'),
        mins:  String(totalMins % 60).padStart(2, '0'),
        secs,
      })
      if (prevSecsRef.current !== secs) {
        setFlashSecs(true)
        setTimeout(() => setFlashSecs(false), 300)
        prevSecsRef.current = secs
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [casal.data_inicio])

  // ── SCROLL REVEAL ────────────────────────────────────────────
  useEffect(() => {
    if (!opened) return
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }),
      { threshold: 0.05 }
    )
    setTimeout(() => {
      document.querySelectorAll('.reveal, .tl-item').forEach((el) => obs.observe(el))
    }, 200)
    // Fallback: após 3s força todos os reveals a aparecerem (caso IntersectionObserver não dispare)
    const fallback = setTimeout(() => {
      document.querySelectorAll('.reveal, .tl-item').forEach((el) => el.classList.add('visible'))
      obs.disconnect()
    }, 3000)
    return () => { obs.disconnect(); clearTimeout(fallback) }
  }, [opened])

  // ── CANVAS RESIZE ────────────────────────────────────────────
  useEffect(() => {
    function resize() {
      if (petalCanvasRef.current)   { petalCanvasRef.current.width   = window.innerWidth; petalCanvasRef.current.height   = window.innerHeight }
      if (confCanvasRef.current)    { confCanvasRef.current.width    = window.innerWidth; confCanvasRef.current.height    = window.innerHeight }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ── PÉTALAS ───────────────────────────────────────────────────
  const PETAL_COLORS = ['#c8506a', '#d4607a', '#e8899a', '#f2c4cc', '#c9933a', '#e8c0e0']

  function createPetal() {
    const canvas = petalCanvasRef.current!
    return {
      x: Math.random() * canvas.width, y: -20,
      size: Math.random() * 11 + 5,
      speedY: Math.random() * 1.4 + 0.7, speedX: (Math.random() - 0.5) * 1.1,
      rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 3,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      opacity: Math.random() * 0.45 + 0.35,
      type: Math.random() > 0.5 ? 'petal' : 'heart',
    }
  }

  function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, opacity: number) {
    ctx.save(); ctx.globalAlpha = opacity; ctx.fillStyle = color; ctx.beginPath()
    ctx.moveTo(x, y + size * 0.3)
    ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3)
    ctx.bezierCurveTo(x - size * 0.5, y + size * 0.65, x, y + size * 0.9, x, y + size)
    ctx.bezierCurveTo(x, y + size * 0.9, x + size * 0.5, y + size * 0.65, x + size * 0.5, y + size * 0.3)
    ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3)
    ctx.fill(); ctx.restore()
  }

  function animatePetals() {
    if (!petalRunning.current) return
    const canvas = petalCanvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (petals.current.length < 38 && Math.random() < 0.18) petals.current.push(createPetal())
    petals.current = petals.current.filter((p) => p.y < canvas.height + 30)
    petals.current.forEach((p) => {
      p.y += p.speedY; p.x += p.speedX + Math.sin(p.y * 0.02) * 0.5; p.rot += p.rotSpeed
      if (p.type === 'heart') {
        drawHeart(ctx, p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.color, p.opacity)
      } else {
        ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color
        ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180)
        ctx.beginPath(); ctx.ellipse(0, 0, p.size * 0.35, p.size * 0.6, 0, 0, Math.PI * 2)
        ctx.fill(); ctx.restore()
      }
    })
    requestAnimationFrame(animatePetals)
  }

  // ── CONFETE ───────────────────────────────────────────────────
  const HEART_COLORS = ['#c8506a', '#e8899a', '#f2c4cc', '#c9933a', '#ffffff', '#e8c0e0', '#d4607a']

  function spawnConfetti() {
    for (let i = 0; i < 70; i++) {
      confetti.current.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 240,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.92) * 16,
        size: Math.random() * 14 + 6,
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
        gravity: 0.4, alpha: 1,
      })
    }
    animateConfetti()
  }

  function animateConfetti() {
    const canvas = confCanvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    confetti.current = confetti.current.filter((c) => c.alpha > 0.02)
    confetti.current.forEach((c) => {
      c.x += c.vx; c.y += c.vy; c.vy += c.gravity; c.alpha -= 0.013
      drawHeart(ctx, c.x - c.size * 0.5, c.y - c.size * 0.5, c.size, c.color, c.alpha)
    })
    if (confetti.current.length > 0) requestAnimationFrame(animateConfetti)
  }

  // ── RENDER ────────────────────────────────────────────────────
  const host = typeof window !== 'undefined' ? window.location.host : 'nossoamor.com.br'

  return (
    <div className="casal-root">
      <canvas ref={petalCanvasRef}   className="petals-canvas" />
      <canvas ref={confCanvasRef}    className="confetti-canvas" />
      <div className="vignette" />
      <div className="ambient-glow" />
      <FairyLights />
      <FairyLights bottom />

      {/* ── INTRO — ENVELOPE 3D ─────────────────────────────── */}
      <div className={`intro-screen${introHidden ? ' hidden' : ''}`}>
        <div
          className="envelope-wrapper"
          onClick={openPage}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPage() }}
        >
          <div className={`envelope-3d${envelopeOpen ? ' open' : ''}`}>
            <div className="env-body">
              <div className="env-flap" />
              <div className="env-letter-preview">
                <span className="env-letter-script">Para o meu grande amor...</span>
                <p className="env-letter-tiny">Abra para ver o que preparei com tanto carinho.</p>
              </div>
            </div>
            <div className="env-seal">♡</div>
          </div>
        </div>
        <p className="intro-text">
          Alguém preparou<br />algo especial para você
        </p>
        <p className="intro-sub">toque no envelope para abrir</p>
      </div>

      {/* ── CONTEÚDO PRINCIPAL ─────────────────────────────── */}
      <main id="main-content">

        {/* HERO */}
        <section className="hero">
          <div className="hero-candles">
            {[{ h: 55 }, { h: 85 }, { h: 65 }].map(({ h }, i) => (
              <div key={i} className="candle">
                <div className="flame" />
                <div className="candle-body" style={{ height: h }}>
                  <div className="candle-drip" />
                  <div className="candle-drip" />
                </div>
                <div className="candle-base" />
              </div>
            ))}
          </div>
          <p className="hero-eyebrow">uma história de amor</p>
          <h1 className="hero-names">
            {casal.nome1}
            <span className="amp">&amp;</span>
            {casal.nome2}
          </h1>
          <div className="hero-divider">
            <span>♥</span>
            <span className="main">♥</span>
            <span>♥</span>
          </div>
          <p className="hero-date">juntos desde {formatDate(casal.data_inicio)}</p>
          <div className="scroll-hint">
            <span>role para baixo</span>
            <div className="scroll-arrow" />
          </div>
        </section>

        {/* MÚSICA — logo após o hero, cria atmosfera antes do contador */}
        {casal.spotify_track_id && (
          <section className="music-section">
            <div className="section-header">
              <span className="section-tag">nossa trilha sonora</span>
              <h2 className="section-title">a música que toca em nossos corações</h2>
            </div>
            <div className="music-card">
              <span className="music-icon-decor">♪</span>
              {casal.musica_nome    && <h3 className="song-title">{casal.musica_nome}</h3>}
              {casal.musica_artista && <p className="song-artist">{casal.musica_artista}</p>}
              <div className="spotify-embed-wrap">
                <iframe
                  ref={spotifyRef}
                  id="spotify-player"
                  src={`https://open.spotify.com/embed/track/${casal.spotify_track_id}?utm_source=generator&theme=0`}
                  height="80"
                  frameBorder={0}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                />
              </div>
            </div>
          </section>
        )}

        {/* CONTADOR */}
        <section className="counter-section reveal">
          <span className="counter-label">vivendo juntos há</span>
          <div className="counter-cards">
            {[
              { val: counter.years,  unit: 'Anos',     flash: false },
              { val: counter.months, unit: 'Meses',    flash: false },
              { val: counter.days,   unit: 'Dias',     flash: false },
              { val: counter.hours,  unit: 'Horas',    flash: false },
              { val: counter.mins,   unit: 'Minutos',  flash: false },
              { val: counter.secs,   unit: 'Segundos', flash: flashSecs },
            ].map(({ val, unit, flash }, i) => (
              <div key={i} className="counter-card">
                <span className={`c-num${flash ? ' flash' : ''}`}>{val}</span>
                <span className="c-unit">{unit}</span>
              </div>
            ))}
          </div>
        </section>

        {/* GALERIA */}
        {casal.fotos.length > 0 && (
          <section className="gallery-section reveal">
            <div className="section-header">
              <span className="section-tag">nossas memórias</span>
              <h2 className="section-title">momentos que guardamos para sempre</h2>
            </div>
            <div className="polaroid-grid">
              {casal.fotos.map((foto, i) => (
                <div key={foto.id} className="polaroid">
                  {i % 3 === 0 && <div className="tape" />}
                  {i % 5 === 4 && <div className="tape-r" />}
                  <div className="polaroid-img">
                    <img src={foto.url} alt={foto.caption || `foto ${i + 1}`} />
                  </div>
                  {foto.caption && <p className="polaroid-caption">{foto.caption}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LINHA DO TEMPO */}
        {casal.marcos.length > 0 && (
          <section className="timeline-section">
            <div className="section-header reveal">
              <span className="section-tag">nossa história</span>
              <h2 className="section-title">como chegamos até aqui</h2>
            </div>
            <div className="timeline">
              {casal.marcos.map((marco) => (
                <div key={marco.id} className="tl-item">
                  <div className="tl-card">
                    {marco.data_texto && <span className="tl-date">{marco.data_texto}</span>}
                    <p className="tl-title">{marco.titulo}</p>
                    {marco.descricao && <p className="tl-desc">{marco.descricao}</p>}
                    {marco.foto_url && (
                      <div className="tl-foto">
                        <img src={marco.foto_url} alt={marco.titulo} />
                      </div>
                    )}
                  </div>
                  <div className="tl-center">
                    <div className="tl-dot-wrap"><div className="tl-dot-inner" /></div>
                  </div>
                  <div className="tl-empty" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CARTA */}
        {casal.carta_texto && (
          <section className="message-section reveal">
            <div className="section-header">
              <span className="section-tag">uma cartinha</span>
              <h2 className="section-title">palavras do fundo do coração</h2>
            </div>
            <div className="letter-wrap">
              <div className="letter-petals">🌹🌸🌹</div>
              <div className="letter">
                <p className="letter-city">{todayFormatted()}</p>
                {casal.carta_para && <p className="letter-salutation">{casal.carta_para},</p>}
                <p className="letter-body">{casal.carta_texto}</p>
                <p className="letter-closing">Com todo o meu amor,</p>
                {casal.carta_ass && <span className="letter-sig">{casal.carta_ass} ♡</span>}
              </div>
            </div>
          </section>
        )}

        {/* FECHAMENTO */}
        <section className="closing-section reveal">
          <h2 className="closing-title">e a história continua...</h2>
          <p className="closing-sub">
            {casal.frase_favorita
              ? `"${casal.frase_favorita}"`
              : 'Cada segundo ao seu lado é uma eternidade de felicidade. Esse lugar é nosso — para sempre.'}
          </p>
          <div
            className="heart-pulse-wrapper"
            onClick={spawnConfetti}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') spawnConfetti() }}
          >
            <div className="heart-glow-ring" />
            <span className="heart-big">🌹</span>
          </div>
        </section>
      </main>

      <footer className="casal-footer">
        <p className="footer-text">
          feito com amor · <a href={`https://${host}`} className="footer-link">{host}</a>
        </p>
      </footer>
    </div>
  )
}
