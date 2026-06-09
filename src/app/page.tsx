'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import '@/styles/landing.css'

// ── Google Fonts ──────────────────────────────────────────────
// (já carregadas no layout.tsx via <link>)

const BULB_COLORS = ['#E8627F','#F2A93B','#E84855','#C8993F','#E25C77','#EFC34B']

const PHRASES = [
  {t:'eu te amo',g:'♥'},{t:'pra sempre',g:'∞'},{t:'meu amor',g:'❀'},
  {t:'só nós dois',g:'♥'},{t:'você e eu',g:'❤'},{t:'meu bem',g:'✿'},
  {t:'pra vida toda',g:'♥'},{t:'minha metade',g:'❤'},
  {t:'amo demais',g:'♥'},{t:'pra todo sempre',g:'∞'}
]
const GLYPHS = ['♥','❀','✿','❤','☼','✦']
const CAPS   = ['nós dois','aquele dia','te amo','lembra?','pra sempre','♥ 14.01']

const FEATURES = [
  {ic:'✉',t:'Envelope animado',  p:'Abre com um toque e revela a surpresa — como uma carta de verdade.'},
  {ic:'◷',t:'Contador ao vivo', p:'Anos, meses, dias, horas e segundos juntos, atualizando na hora.'},
  {ic:'❏',t:'Galeria polaroid',  p:'As fotos preferidas de vocês em um mural fofo estilo instantânea.'},
  {ic:'❰',t:'Linha do tempo',    p:'Os momentos marcantes da relação, em uma timeline delicada.'},
  {ic:'✎',t:'Carta com IA',     p:'Escreva você mesmo ou deixe a IA criar uma declaração que toca o coração.'},
  {ic:'♪',t:'Música do casal',  p:'O player do Spotify com a canção que é a trilha sonora de vocês.'},
]
const REVIEWS = [
  {q:'Mandei o link pra minha namorada no dia do nosso aniversário de 2 anos. Ela chorou. Valeu cada centavo — ficou lindo demais, parece coisa de cinema.',av:'L',name:'Lucas M.',when:'comprou há 3 dias'},
  {q:'Criei em 20 minutos e a reação do meu marido foi incrível. O contador ao vivo dos anos juntos é o detalhe que mais emociona. Super recomendo!',av:'F',name:'Fernanda R.',when:'comprou há 5 dias'},
  {q:'A carta gerada pela IA ficou tão boa que parecia que eu mesmo tinha escrito com muito cuidado. Surpresa de Dia dos Namorados perfeita.',av:'R',name:'Rafael S.',when:'comprou há 1 semana'},
]
const SINCE = new Date('2022-01-14T00:00:00')

function pad(n: number){ return n < 10 ? '0'+n : ''+n }
function diffParts(from: Date, to: Date){
  let y  = to.getFullYear() - from.getFullYear()
  let mo = to.getMonth()    - from.getMonth()
  let d  = to.getDate()     - from.getDate()
  let h  = to.getHours()    - from.getHours()
  let mi = to.getMinutes()  - from.getMinutes()
  let s  = to.getSeconds()  - from.getSeconds()
  if(s <0){s +=60;mi--} if(mi<0){mi+=60;h--} if(h <0){h +=24;d--}
  if(d <0){const pm=new Date(to.getFullYear(),to.getMonth(),0).getDate();d+=pm;mo--}
  if(mo<0){mo+=12;y--}
  return {y,mo,d,h,mi,s}
}
function nextValentines(){
  const now = new Date(); let y = now.getFullYear()
  let t = new Date(y,5,12)
  if(t < now) t = new Date(y+1,5,12)
  return t
}

export default function LandingPage() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const floatRef   = useRef<HTMLDivElement>(null)
  const heroRef    = useRef<HTMLElement>(null)
  const dockRef    = useRef<HTMLDivElement>(null)
  const envRef     = useRef<HTMLDivElement>(null)

  const [envOpen, setEnvOpen] = useState(false)
  const [couple, setCouple]   = useState({y:4,mo:4,d:26,h:'08'})
  const [urgency, setUrgency] = useState({d:3,h:'08',mi:'42',s:'10'})
  const [bulbs,   setBulbs]   = useState<{color:string;delay:string;mt:number}[]>([])

  // luzinhas
  useEffect(()=>{
    const n = Math.max(14, Math.min(34, Math.round(window.innerWidth/52)))
    setBulbs(Array.from({length:n},(_,i)=>({
      color: BULB_COLORS[i%BULB_COLORS.length],
      delay: (i*0.18 % 2.6).toFixed(2)+'s',
      mt:    10 + (i%2)*9
    })))
  },[])

  // canvas corações
  useEffect(()=>{
    const canvas = canvasRef.current; if(!canvas) return
    const ctx = canvas.getContext('2d')!
    let W=0,H=0,dpr=1,parts:any[]=[], raf=0
    const resize=()=>{
      dpr = Math.min(window.devicePixelRatio||1,2)
      W = window.innerWidth; H = window.innerHeight
      canvas.width=W*dpr; canvas.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0)
    }
    const colors=['#E25C77','#A11D3A','#F2A9B7','#C8993F']
    function heart(x:number,y:number,s:number,r:number){
      ctx.save();ctx.translate(x,y);ctx.rotate(r);ctx.scale(s,s);ctx.beginPath()
      ctx.moveTo(0,3);ctx.bezierCurveTo(-5,-3,-9,2,0,9);ctx.bezierCurveTo(9,2,5,-3,0,3)
      ctx.closePath();ctx.restore()
    }
    function make(top:boolean){
      const isH=Math.random()<0.6
      return{x:Math.random()*W,y:top?-20-Math.random()*H*0.4:Math.random()*H,
        s:isH?0.7+Math.random()*1.4:0.5+Math.random()*0.9,
        vy:0.25+Math.random()*0.7,vx:(Math.random()-0.5)*0.4,
        rot:Math.random()*Math.PI*2,vr:(Math.random()-0.5)*0.02,
        sway:Math.random()*Math.PI*2,swaySpd:0.008+Math.random()*0.014,
        amp:14+Math.random()*26,alpha:0.3+Math.random()*0.5,
        color:colors[(Math.random()*colors.length)|0],heart:isH}
    }
    resize()
    for(let i=0;i<38;i++) parts.push(make(false))
    function draw(){
      ctx.clearRect(0,0,W,H)
      for(const p of parts){
        p.y+=p.vy;p.sway+=p.swaySpd;p.x+=p.vx+Math.sin(p.sway)*0.3;p.rot+=p.vr
        if(p.y>H+30){p.y=-20;p.x=Math.random()*W}
        ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color
        if(p.heart){heart(p.x,p.y,p.s,p.rot);ctx.fill()}
        else{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.beginPath();ctx.ellipse(0,0,4*p.s,7*p.s,0,0,Math.PI*2);ctx.fill();ctx.restore()}
      }
      ctx.globalAlpha=1;raf=requestAnimationFrame(draw)
    }
    draw()
    window.addEventListener('resize',resize)
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)}
  },[])

  // mensagens + fotos flutuantes
  useEffect(()=>{
    const layer = floatRef.current; if(!layer) return
    function spawnMsg(){
      if(document.hidden) return
      const p = PHRASES[(Math.random()*PHRASES.length)|0]
      const el = document.createElement('div'); el.className='lp-float-msg'
      el.innerHTML=`<span class="tag"><span class="glyph">${p.g}</span> ${p.t}</span>`
      el.style.left=(6+Math.random()*78)+'%'
      const dur=8+Math.random()*5
      el.style.animationDuration=dur+'s'
      el.style.fontSize=(13+Math.random()*5)+'px'
      el.style.setProperty('--drift',((Math.random()-0.5)*70).toFixed(0)+'px')
      el.style.setProperty('--rot',((Math.random()-0.5)*16).toFixed(0)+'deg')
      layer.appendChild(el)
      el.addEventListener('animationend',()=>el.remove())
      setTimeout(()=>{ if(el.isConnected)el.remove() },(dur+1)*1000)
    }
    function spawnPhoto(){
      if(document.hidden) return
      const el = document.createElement('div'); el.className='lp-float-photo'
      const sz = 50+Math.round(Math.random()*26)
      const g  = GLYPHS[(Math.random()*GLYPHS.length)|0]
      const tilt = ((Math.random()-0.5)*18).toFixed(0)+'deg'
      if(Math.random()<0.6){
        const cap = CAPS[(Math.random()*CAPS.length)|0]
        el.innerHTML=`<div class="pol" style="--sz:${sz}px;--tilt:${tilt}"><div class="img">${g}</div><div class="cap">${cap}</div></div>`
      }else{
        const tape = Math.random()<0.5?' tape':''
        el.innerHTML=`<div class="bubble${tape}" style="--sz:${sz}px;--tilt:${tilt};position:relative">${g}</div>`
      }
      el.style.left=(5+Math.random()*80)+'%'
      const dur=11+Math.random()*5
      el.style.animationDuration=dur+'s'
      el.style.setProperty('--drift',((Math.random()-0.5)*60).toFixed(0)+'px')
      el.style.setProperty('--rot',((Math.random()-0.5)*20).toFixed(0)+'deg')
      layer.appendChild(el)
      el.addEventListener('animationend',()=>el.remove())
      setTimeout(()=>{ if(el.isConnected)el.remove() },(dur+1)*1000)
    }
    // iniciais escalonados
    ;[0,900,1900,3000].forEach(d=>setTimeout(spawnMsg,d))
    ;[600,2600,4800].forEach(d=>setTimeout(spawnPhoto,d))
    const t1=setInterval(spawnMsg,1900)
    const t2=setInterval(spawnPhoto,3300)
    return()=>{clearInterval(t1);clearInterval(t2)}
  },[])

  // contadores
  useEffect(()=>{
    const VAL = nextValentines()
    function tick(){
      const p = diffParts(SINCE, new Date())
      setCouple({y:p.y,mo:p.mo,d:p.d,h:pad(p.h)})
      const ms = Math.max(0, VAL.getTime()-Date.now())
      const d  = Math.floor(ms/86400000)
      const h  = Math.floor(ms%86400000/3600000)
      const mi = Math.floor(ms%3600000/60000)
      const s  = Math.floor(ms%60000/1000)
      setUrgency({d,h:pad(h),mi:pad(mi),s:pad(s)})
    }
    tick()
    const id = setInterval(tick,1000)
    return()=>clearInterval(id)
  },[])

  // dock + reveal
  useEffect(()=>{
    const dock = dockRef.current; const hero = heroRef.current
    if(dock && hero){
      const io = new IntersectionObserver(([e])=>dock.classList.toggle('show',!e.isIntersecting),{threshold:0})
      io.observe(hero); return()=>io.disconnect()
    }
  },[])
  useEffect(()=>{
    const els = document.querySelectorAll('.lp-reveal')
    const io = new IntersectionObserver((ents)=>{
      ents.forEach(e=>{ if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)} })
    },{threshold:0.14})
    els.forEach(e=>io.observe(e))
    return()=>io.disconnect()
  },[])

  function scrollToDemo(){ document.getElementById('lp-demo')?.scrollIntoView({behavior:'smooth'}) }

  return (
    <div className="lp">
      <canvas ref={canvasRef} className="lp-canvas" />

      {/* ── TOPO ── */}
      <div className="lp-topbar">
        <div className="lp-announce">
          <span className="h">♥</span>&nbsp; <b>Dia dos Namorados é 12 de junho</b> — faltam poucos dias! Garanta já a sua página <span className="h">♥</span>
        </div>
        <div className="lp-lights">
          {bulbs.map((b,i)=>(
            <span key={i} className="lp-bulb"
              style={{background:b.color,color:b.color,animationDelay:b.delay,marginTop:b.mt}} />
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
      <header className="lp-hero" ref={heroRef} id="lp-hero">
        <div className="lp-float-layer" ref={floatRef} />
        <div className="lp-shell lp-hero-inner">
          <div className="lp-brand"><span className="dot" />&nbsp;Romântico do Casal&nbsp;<span className="dot" /></div>
          <p className="lp-eyebrow">O presente perfeito para o Dia dos Namorados</p>
          <h1 className="lp-headline">
            Uma página romântica <em>só para os dois</em>
          </h1>
          <p className="lp-lede">
            Fotos, contador ao vivo, linha do tempo e uma carta de amor — tudo numa página linda com o link de vocês. Por apenas <span className="price">R$ 19,90</span>.
          </p>
          <div className="lp-cta-card">
            <Link href="/criar" className="lp-btn">
              <span className="beat h">♥</span> Criar minha página — R$&nbsp;19,90
            </Link>
            <div className="lp-trust">
              <span><span className="ico">🔒</span> Pagamento seguro via Mercado Pago · PIX ou cartão</span>
              <span><span className="ico">✓</span> Você preenche tudo antes de pagar</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── DEMO ── */}
      <section className="lp-sec" id="lp-demo">
        <div className="lp-ornament"><span className="h">♥</span></div>
        <div className="lp-shell lp-sec-head lp-reveal">
          <p className="lp-eyebrow">O que você recebe</p>
          <h2>Uma página assim, <em>só de vocês</em></h2>
          <p>Toque no envelope e veja por dentro. Sua página fica exatamente com a cara da história de vocês.</p>
        </div>

        <div className="lp-phone-wrap lp-reveal">
          <div className="lp-phone">
            <div className="lp-screen">
              <div className="lp-screen-scroll">
                <div className="lp-statusbar">
                  <span>9:41</span>
                  <span style={{display:'flex',gap:5,alignItems:'center',fontSize:11}}>●●● ▭</span>
                </div>
                <div className="lp-cp">
                  <div className="lp-cp-dots">
                    {['#E8627F','#F2A93B','#E84855','#C8993F','#E25C77','#EFC34B','#E84855'].map((c,i)=>(
                      <i key={i} style={{background:c}} />
                    ))}
                  </div>
                  <p className="lp-cp-kicker">Uma história de amor</p>
                  <div className="lp-cp-names">
                    <span className="n">Ana</span>
                    <span className="amp">&amp;</span>
                    <span className="n">Pedro</span>
                  </div>
                  <p className="lp-cp-since">juntos desde 14 de janeiro de 2022</p>
                  <hr />
                  <div className="lp-counter">
                    <div className="u"><span className="v">{couple.y}</span><span className="l">Anos</span></div>
                    <div className="u"><span className="v">{couple.mo}</span><span className="l">Meses</span></div>
                    <div className="u"><span className="v">{couple.d}</span><span className="l">Dias</span></div>
                    <div className="u"><span className="v">{couple.h}</span><span className="l">Horas</span></div>
                  </div>
                  <hr />
                  <div className="lp-polas">
                    {['-6deg','3deg','7deg'].map((r,i)=>(
                      <div key={i} className="lp-pola" style={{'--r':r} as React.CSSProperties}>
                        <div className="ph">{['♥','❀','✿'][i]}</div>
                      </div>
                    ))}
                  </div>
                  <hr />
                  <div className="lp-tl">
                    {[
                      {d:'Jan 2022',t:'Nosso primeiro encontro'},
                      {d:'Dez 2022',t:'A primeira viagem juntos'},
                      {d:'Jun 2024',t:'Quando você disse sim'},
                    ].map((m,i)=>(
                      <div key={i} className="it">
                        <div className="d">{m.d}</div>
                        <div className="t">{m.t}</div>
                      </div>
                    ))}
                  </div>
                  <hr />
                  <p className="lp-letter-q">"Você é a pessoa que transforma qualquer lugar em lar. Cada instante ao seu lado me faz querer viver mais intensamente…"</p>
                  <p className="lp-letter-sign">para sempre e um dia a mais ♥</p>
                  <div className="lp-spfy">
                    <div className="cover">♪</div>
                    <div className="meta">
                      <div className="tt">Nossa música</div>
                      <div className="ar">A canção de vocês</div>
                      <div className="bar"><i /></div>
                    </div>
                    <div className="play">▶</div>
                  </div>
                </div>
              </div>

              {/* envelope */}
              <div
                ref={envRef}
                className={`lp-env-cover${envOpen?' open':''}`}
                onClick={()=>setEnvOpen(true)}
              >
                <div className="lp-env-title">Vocês têm uma <em>cartinha</em></div>
                <div className="lp-env">
                  <div className="body">
                    <div className="pocket" />
                    <div className="letter"><span className="hh">♥</span></div>
                  </div>
                  <div className="flap" />
                </div>
                <div className="lp-env-cta"><span className="lp-pulse" /> Toque para abrir</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lp-shell">
          <p className="lp-demo-note"><span className="lp-pulse" /> Contador atualizando em tempo real, ao vivo na página</p>
        </div>
      </section>

      {/* ── RECURSOS ── */}
      <section className="lp-sec tint">
        <div className="lp-shell lp-sec-head lp-reveal">
          <p className="lp-eyebrow">Tudo que vem dentro</p>
          <h2>Detalhes que <em>emocionam</em></h2>
        </div>
        <div className="lp-shell">
          <div className="lp-features lp-reveal">
            {FEATURES.map((f,i)=>(
              <div key={i} className="lp-feat">
                <div className="ic">{f.ic}</div>
                <h3>{f.t}</h3>
                <p>{f.p}</p>
              </div>
            ))}
          </div>
          <div className="lp-metrics lp-reveal">
            <div className="lp-metric"><div className="v">+2.400</div><div className="l">casais já criaram</div></div>
            <div className="lp-metric"><div className="v">4,9 ★</div><div className="l">avaliação média</div></div>
            <div className="lp-metric"><div className="v">5 min</div><div className="l">pra deixar pronto</div></div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="lp-sec">
        <div className="lp-shell lp-sec-head lp-reveal">
          <p className="lp-eyebrow">Simples assim</p>
          <h2>Como funciona</h2>
        </div>
        <div className="lp-shell">
          <div className="lp-steps lp-reveal">
            {[
              {n:'1',t:'Preencha o formulário',p:'Conte a história de vocês em 6 passos: nomes, data, fotos, marcos e a música que toca no coração.'},
              {n:'2',t:'Pague R$ 19,90',      p:'Pagamento seguro via Mercado Pago — PIX ou cartão. Rápido e sem complicação.'},
              {n:'3',t:'Receba o link por e-mail',p:'Sua página romântica chega na hora, pronta pra surpreender quem você ama.'},
            ].map((s,i)=>(
              <div key={i} className="lp-step">
                <div className="num">{s.n}</div>
                <div><h3>{s.t}</h3><p>{s.p}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="lp-sec tint">
        <div className="lp-shell lp-sec-head lp-reveal">
          <p className="lp-eyebrow">Quem já criou</p>
          <h2>Momentos que <em>emocionaram</em> de verdade</h2>
        </div>
        <div className="lp-shell">
          <div className="lp-reviews lp-reveal">
            {REVIEWS.map((r,i)=>(
              <div key={i} className="lp-review">
                <div className="lp-stars">★★★★★</div>
                <q>{r.q}</q>
                <div className="who">
                  <span className="av">{r.av}</span>
                  <div><b>{r.name}</b><span>{r.when}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="lp-final lp-shell">
        <div className="lp-ornament" style={{paddingTop:0,marginBottom:18}}><span className="h">♥</span></div>
        <div className="lp-reveal">
          <h2>Falta pouco para o <em>Dia dos Namorados</em></h2>
          <p>Não deixe para a última hora. Em menos de 5 minutos o presente está pronto.</p>
          <div className="lp-urgency">
            <div className="box"><div className="v">{urgency.d}</div><div className="l">dias</div></div>
            <div className="box"><div className="v">{urgency.h}</div><div className="l">horas</div></div>
            <div className="box"><div className="v">{urgency.mi}</div><div className="l">min</div></div>
            <div className="box"><div className="v">{urgency.s}</div><div className="l">seg</div></div>
          </div>
          <div className="lp-cta-card">
            <Link href="/criar" className="lp-btn">
              <span className="beat h">♥</span> Criar minha página — R$&nbsp;19,90
            </Link>
            <div className="lp-trust">
              <span><span className="ico">✓</span> Você preenche tudo primeiro, paga só no final</span>
              <span><span className="ico">🔒</span> PIX ou cartão · Mercado Pago</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-foot lp-shell">
        Feito com <span className="h">♥</span> para casais apaixonados &nbsp;·&nbsp;{' '}
        <a href="/ana-e-pedro">ver exemplo</a>
      </footer>

      {/* ── DOCK FIXO (mobile) ── */}
      <div className="lp-dock" ref={dockRef}>
        <div className="lp-dock-inner">
          <div className="info">
            <div className="t">R$ 19,90</div>
            <div className="s">PIX ou cartão · pague só no final</div>
          </div>
          <Link href="/criar" className="lp-btn" style={{width:'auto',flex:'none',fontSize:16,padding:'13px 18px',borderRadius:13}}>
            <span className="beat h">♥</span> Criar
          </Link>
        </div>
      </div>
    </div>
  )
}
