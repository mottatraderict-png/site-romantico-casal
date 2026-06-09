'use client'

import { useState, useEffect } from 'react'
import { pixelTrack } from '@/lib/pixel'
import '@/styles/formulario.css'

interface Marco { data: string; titulo: string; desc: string; foto_url?: string; foto_preview?: string }
interface Photo  { file: File; preview: string }

const STEP_LABELS = [
  'O Casal',
  'As Fotos',
  'Nossa História',
  'A Cartinha',
  'Nossa Música',
  'Finalizar e Pagar',
]

const STEP_ICONS = ['💑', '📷', '📖', '💌', '🎵', '🌹']

const TOM_OPTS = [
  { value: 'romantico', label: 'Romântico e apaixonado' },
  { value: 'poetico',   label: 'Poético e metafórico' },
  { value: 'simples',   label: 'Simples e do coração' },
  { value: 'intenso',   label: 'Intenso e emocionante' },
]

const BULBS = Array.from({ length: 20 })

export default function FormularioClient() {
  const [step, setStep] = useState(0)

  // Pixel: ViewContent ao abrir /criar
  useEffect(() => { pixelTrack('ViewContent', { content_name: 'formulario' }) }, [])

  // Step 1
  const [nome1,     setNome1]     = useState('')
  const [nome2,     setNome2]     = useState('')
  const [apelido1,  setApelido1]  = useState('')
  const [apelido2,  setApelido2]  = useState('')
  const [dataInicio,setDataInicio]= useState('')
  const [frase,     setFrase]     = useState('')

  // Step 2
  const [photos,    setPhotos]    = useState<(Photo | null)[]>(Array(15).fill(null))
  const [uploadTarget] = useState({ idx: 0 })
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null)

  // Step 3
  const [marcos, setMarcos] = useState<Marco[]>([{ data: '', titulo: '', desc: '' }])
  const [marcoFiles, setMarcoFiles] = useState<(File | null)[]>([null])

  // Step 4
  const [modoIA,      setModoIA]      = useState(true)
  const [q1, setQ1] = useState(''); const [q2, setQ2] = useState(''); const [q3, setQ3] = useState('')
  const [tom,         setTom]         = useState('romantico')
  const [cartaGerada, setCartaGerada] = useState('')
  const [cartaTexto,  setCartaTexto]  = useState('')
  const [cartaPara,   setCartaPara]   = useState('')
  const [cartaAss,    setCartaAss]    = useState('')
  const [iaLoading,   setIaLoading]   = useState(false)
  const [iaVisible,   setIaVisible]   = useState(false)
  const [isTyping,    setIsTyping]    = useState(false)

  // Step 5
  const [spotifyUrl,      setSpotifyUrl]      = useState('')
  const [spotifyTrackId,  setSpotifyTrackId]  = useState('')
  const [musicaNome,      setMusicaNome]      = useState('')
  const [musicaArtista,   setMusicaArtista]   = useState('')

  // Step 6
  const [email,       setEmail]       = useState('')
  const [whatsapp,    setWhatsapp]    = useState('')
  const [emailError,  setEmailError]  = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitStatus,setSubmitStatus]= useState('')

  // ── FOTOS ────────────────────────────────────────────────────
  function triggerUpload(idx: number) {
    uploadTarget.idx = idx
    if (fileInput) { fileInput.value = ''; fileInput.click() }
  }
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    let idx = uploadTarget.idx
    const updated = [...photos]
    files.forEach((file) => {
      if (idx >= 15) return
      updated[idx] = { file, preview: URL.createObjectURL(file) }
      idx++
    })
    setPhotos(updated)
  }
  function removePhoto(idx: number) {
    const updated = [...photos]
    if (updated[idx]?.preview) URL.revokeObjectURL(updated[idx]!.preview)
    updated[idx] = null
    const compacted = updated.filter(Boolean) as (Photo | null)[]
    while (compacted.length < 15) compacted.push(null)
    setPhotos(compacted)
  }

  // ── MARCOS ───────────────────────────────────────────────────
  function updateMarco(i: number, key: keyof Marco, val: string) {
    const u = [...marcos]; u[i] = { ...u[i], [key]: val }; setMarcos(u)
  }
  function handleMarcoFoto(e: React.ChangeEvent<HTMLInputElement>, i: number) {
    const file = e.target.files?.[0]; if (!file) return
    const preview = URL.createObjectURL(file)
    const uM = [...marcos]; uM[i] = { ...uM[i], foto_preview: preview }; setMarcos(uM)
    const uF = [...marcoFiles]; uF[i] = file; setMarcoFiles(uF)
  }
  function removeMarcoFoto(i: number) {
    const uM = [...marcos]; if (uM[i].foto_preview) URL.revokeObjectURL(uM[i].foto_preview!); uM[i] = { ...uM[i], foto_preview: undefined, foto_url: undefined }; setMarcos(uM)
    const uF = [...marcoFiles]; uF[i] = null; setMarcoFiles(uF)
  }

  // ── SPOTIFY ──────────────────────────────────────────────────
  function handleSpotifyInput(val: string) {
    setSpotifyUrl(val)
    const match = val.match(/track\/([a-zA-Z0-9]+)/)
    setSpotifyTrackId(match ? match[1] : '')
  }

  // ── GERAR CARTA IA ───────────────────────────────────────────
  async function gerarCartaIA() {
    if (!q1 && !q2 && !q3) return
    setIaLoading(true); setIaVisible(false); setCartaGerada(''); setIsTyping(true)
    try {
      const res = await fetch('/api/gerar-carta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q1, q2, q3, tom, para: cartaPara, ass: cartaAss }),
      })
      setIaLoading(false); setIaVisible(true)
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value)
        setCartaGerada(text)
      }
    } catch {
      setIaLoading(false); setIaVisible(true)
      setCartaGerada('Não foi possível conectar com a IA. Escreva a carta manualmente.')
    } finally { setIsTyping(false) }
  }
  function usarCarta() { setCartaTexto(cartaGerada); setModoIA(false) }

  // ── SUBMIT ───────────────────────────────────────────────────
  async function handleSubmit() {
    setEmailError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Informe um e-mail válido para receber o link da página.')
      return
    }
    setSubmitting(true); setSubmitStatus('Preparando seus dados...')
    try {
      const fd = new FormData()
      fd.append('email', email.trim()); fd.append('whatsapp', whatsapp.trim())
      fd.append('nome1', nome1.trim()); fd.append('nome2', nome2.trim())
      fd.append('apelido1', apelido1.trim()); fd.append('apelido2', apelido2.trim())
      fd.append('dataInicio', dataInicio); fd.append('frase', frase.trim())
      fd.append('cartaPara', cartaPara.trim())
      fd.append('cartaTexto', (modoIA ? cartaGerada : cartaTexto).trim())
      fd.append('cartaAss', cartaAss.trim())
      fd.append('musicaNome', musicaNome.trim()); fd.append('musicaArtista', musicaArtista.trim())
      fd.append('spotifyTrackId', spotifyTrackId)
      fd.append('marcos', JSON.stringify(marcos.map(m => ({ data: m.data, titulo: m.titulo, desc: m.desc }))))
      marcoFiles.forEach((file, i) => { if (file) fd.append(`marco_foto_${i}`, file) })
      const fotosValidas = photos.filter(Boolean) as Photo[]
      setSubmitStatus(`Enviando ${fotosValidas.length > 0 ? fotosValidas.length + ' fotos...' : 'dados...'}`)
      fotosValidas.forEach((foto, i) => fd.append(`foto_${i}`, foto.file))
      setSubmitStatus('Gerando seu link de pagamento...')
      pixelTrack('Lead', { content_name: 'submit_form' })
      const res = await fetch('/api/checkout', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.checkoutUrl) throw new Error(json.error ?? 'Erro ao gerar pagamento')
      // Redireciona para /sucesso?casal_id=XXX — o usuário volta para cá após pagar no MP
      const sucessoUrl = `/sucesso?casal_id=${json.casalId}&mp=${encodeURIComponent(json.checkoutUrl)}`
      window.location.href = sucessoUrl
    } catch (err) {
      console.error(err)
      setSubmitStatus('Erro ao processar. Tente novamente.')
      setSubmitting(false)
    }
  }

  // ── HELPERS ──────────────────────────────────────────────────
  function formatPrevDate(d: string) {
    if (!d) return ''
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  function daysTogether(d: string) {
    if (!d) return 0
    return Math.floor((Date.now() - new Date(d + 'T00:00:00').getTime()) / 86400000)
  }
  function goNext(to: number) {
    // Pixel: InitiateCheckout ao entrar no step 5 (resumo/finalizar)
    if (to === 5) pixelTrack('InitiateCheckout', { value: 19.90, currency: 'BRL' })
    setStep(to)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fotosValidas   = photos.filter(Boolean) as Photo[]
  const marcosValidos  = marcos.filter(m => m.titulo.trim())
  const cartaFinal     = (modoIA ? cartaGerada : cartaTexto).trim()

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <div className="form-root">
      {/* Fairy lights */}
      <div className="form-fairy-lights">
        <div className="wire" />
        {BULBS.map((_, i) => (
          <div key={i} className="bulb">
            <div className="bulb-wire" />
            <div className="bulb-light" style={{ animationDelay: `${i * 0.12}s` }} />
          </div>
        ))}
      </div>
      <div className="form-vignette" />

      <div className="form-grid">
        {/* ══ COLUNA FORMULÁRIO ══ */}
        <div className="form-panel">

          {/* Cabeçalho */}
          <div className="form-header">
            <span className="form-eyebrow">Nossa Página</span>
          </div>

          {/* Barra de progresso */}
          <div className="progress-wrap">
            <div className="progress-track">
              {[0,1,2,3,4,5].map((i) => (
                <div key={i} className={`step-bar${i < step ? ' done' : i === step ? ' active' : ''}`} />
              ))}
            </div>
            <span className="progress-label">Passo {step + 1} de 6 — {STEP_LABELS[step]}</span>
          </div>

          {/* ── STEP 1 — O CASAL ── */}
          {step === 0 && (
            <div className="step-block">
              <div className="step-icon-hero">{STEP_ICONS[0]}</div>
              <h2 className="step-heading">O casal</h2>
              <p className="step-sub">Como vocês se chamam? Vamos começar pelo começo.</p>

              <div className="fields-card">
              <div className="field-row">
                <div className="field">
                  <label className="field-label">Nome dela <span className="required">*</span></label>
                  <input className="field-input" type="text" value={nome1} onChange={e => setNome1(e.target.value)} placeholder="ex: Ana" maxLength={30} />
                </div>
                <div className="field">
                  <label className="field-label">Nome dele <span className="required">*</span></label>
                  <input className="field-input" type="text" value={nome2} onChange={e => setNome2(e.target.value)} placeholder="ex: Pedro" maxLength={30} />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label className="field-label">Apelido dela</label>
                  <input className="field-input" type="text" value={apelido1} onChange={e => setApelido1(e.target.value)} placeholder="ex: Aninha" maxLength={20} />
                </div>
                <div className="field">
                  <label className="field-label">Apelido dele</label>
                  <input className="field-input" type="text" value={apelido2} onChange={e => setApelido2(e.target.value)} placeholder="ex: Pedrinho" maxLength={20} />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Data que ficaram juntos <span className="required">*</span></label>
                <input className="field-input" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Frase favorita do casal <span className="field-opt">(opcional · max 120 caracteres)</span></label>
                <input className="field-input" type="text" value={frase} onChange={e => setFrase(e.target.value)} placeholder="ex: para sempre e um dia a mais..." maxLength={120} />
              </div>

              </div>{/* /fields-card */}

              <div className="nav-btns">
                <button className="btn-next" onClick={() => goNext(1)} disabled={!nome1.trim() || !nome2.trim() || !dataInicio}>
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 — FOTOS ── */}
          {step === 1 && (
            <div className="step-block">
              <div className="step-icon-hero">{STEP_ICONS[1]}</div>
              <h2 className="step-heading">As fotos de vocês</h2>
              <p className="step-sub">Adicione até 15 fotos dos momentos que mais gosta. Elas aparecem como polaroids na página.</p>

              <div className="photos-grid">
                {photos.map((photo, i) => (
                  <div
                    key={i}
                    className={`photo-slot${photo ? ' has-image' : ''}`}
                    onClick={() => !photo && triggerUpload(i)}
                  >
                    {photo ? (
                      <>
                        <img src={photo.preview} alt={`foto ${i + 1}`} />
                        <button
                          className="remove-photo"
                          onClick={e => { e.stopPropagation(); removePhoto(i) }}
                          aria-label="Remover foto"
                        >×</button>
                      </>
                    ) : (
                      <>
                        <span className="slot-icon">+</span>
                        <span className="slot-num">{i + 1}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <input
                ref={el => setFileInput(el)}
                type="file" accept="image/jpeg,image/png,image/webp,image/heic"
                multiple style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <p className="upload-hint">Clique em qualquer quadro para adicionar fotos · Aceita JPG, PNG, WEBP, HEIC</p>

              <div className="nav-btns">
                <button className="btn-prev" onClick={() => goNext(0)}>← Voltar</button>
                <button className="btn-next" onClick={() => goNext(2)}>Próximo →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — HISTÓRIA ── */}
          {step === 2 && (
            <div className="step-block">
              <div className="step-icon-hero">{STEP_ICONS[2]}</div>
              <h2 className="step-heading">Os momentos marcantes</h2>
              <p className="step-sub">Quais foram os momentos que definiram a história de vocês? Adicione até 5.</p>

              {marcos.map((m, i) => (
                <div key={i} className="marco-card">
                  <div className="marco-card-header">
                    <span className="marco-num">Momento {i + 1}</span>
                    {marcos.length > 1 && (
                      <button className="btn-remove-marco" onClick={() => { setMarcos(marcos.filter((_, j) => j !== i)); setMarcoFiles(marcoFiles.filter((_, j) => j !== i)) }}>×</button>
                    )}
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label className="field-label">Data</label>
                      <input className="field-input" type="text" value={m.data} onChange={e => updateMarco(i, 'data', e.target.value)} placeholder="ex: janeiro · 2021" maxLength={30} />
                    </div>
                    <div className="field">
                      <label className="field-label">Título <span className="required">*</span></label>
                      <input className="field-input" type="text" value={m.titulo} onChange={e => updateMarco(i, 'titulo', e.target.value)} placeholder="ex: primeiro beijo" maxLength={50} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Descrição <span className="field-opt">(opcional)</span></label>
                    <input className="field-input" type="text" value={m.desc} onChange={e => updateMarco(i, 'desc', e.target.value)} placeholder="uma frase sobre esse momento" maxLength={120} />
                  </div>
                  {/* Foto do momento */}
                  <div className="field">
                    <label className="field-label">Foto do momento <span className="field-opt">(opcional)</span></label>
                    {m.foto_preview ? (
                      <div className="marco-foto-preview">
                        <img src={m.foto_preview} alt="foto do momento" />
                        <button className="btn-remove-marco-foto" onClick={() => removeMarcoFoto(i)}>× Remover</button>
                      </div>
                    ) : (
                      <div className="marco-foto-slot" onClick={() => document.getElementById(`marco-foto-${i}`)?.click()}>
                        <span style={{ fontSize: 20, opacity: 0.4 }}>📷</span>
                        <span className="marco-foto-slot-text">Adicionar foto desse momento</span>
                      </div>
                    )}
                    <input id={`marco-foto-${i}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleMarcoFoto(e, i)} />
                  </div>
                </div>
              ))}

              {marcos.length < 5 && (
                <button className="btn-add-marco" onClick={() => { setMarcos([...marcos, { data: '', titulo: '', desc: '' }]); setMarcoFiles([...marcoFiles, null]) }}>
                  + Adicionar momento
                </button>
              )}

              <div className="nav-btns">
                <button className="btn-prev" onClick={() => goNext(1)}>← Voltar</button>
                <button
                  className="btn-next"
                  onClick={() => goNext(3)}
                  disabled={!marcosValidos.length}
                >Próximo →</button>
              </div>
            </div>
          )}

          {/* ── STEP 4 — CARTA ── */}
          {step === 3 && (
            <div className="step-block">
              <div className="step-icon-hero">{STEP_ICONS[3]}</div>
              <h2 className="step-heading">A cartinha</h2>
              <p className="step-sub">Escreva uma mensagem do coração ou deixe a IA criar uma carta personalizada.</p>

              {/* Toggle IA / Manual */}
              <div className="modo-tabs">
                <button className={`tab-btn${modoIA ? ' active' : ''}`} onClick={() => setModoIA(true)}>✦ Criar com IA</button>
                <button className={`tab-btn${!modoIA ? ' active' : ''}`} onClick={() => setModoIA(false)}>Escrever eu mesmo</button>
              </div>

              {modoIA ? (
                <div className="ia-panel">
                  <div className="field">
                    <label className="field-label">Como vocês se conheceram?</label>
                    <textarea className="field-input field-textarea" rows={3} value={q1} onChange={e => setQ1(e.target.value)} placeholder="ex: a gente se conheceu no trabalho, foi amizade que virou amor..." />
                  </div>
                  <div className="field">
                    <label className="field-label">Qual foi o momento mais marcante?</label>
                    <textarea className="field-input field-textarea" rows={2} value={q2} onChange={e => setQ2(e.target.value)} placeholder="ex: a primeira viagem juntos..." />
                  </div>
                  <div className="field">
                    <label className="field-label">O que você mais admira nela/nele?</label>
                    <textarea className="field-input field-textarea" rows={2} value={q3} onChange={e => setQ3(e.target.value)} placeholder="ex: a forma como ela cuida das pessoas ao redor..." />
                  </div>
                  <div className="field">
                    <label className="field-label">Tom da carta</label>
                    <select className="field-input field-select" value={tom} onChange={e => setTom(e.target.value)}>
                      {TOM_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <button className="btn-gerar-ia" onClick={gerarCartaIA} disabled={iaLoading || (!q1 && !q2 && !q3)}>
                    {iaLoading ? '⏳ Gerando...' : '✦ Gerar carta com IA'}
                  </button>
                  {iaVisible && (
                    <div className="ia-result">
                      <div className="ia-result-header">
                        <span className="ia-result-label">carta gerada pela IA</span>
                        <div className="ia-actions">
                          <button className="btn-regerar" onClick={gerarCartaIA}>Regerar</button>
                          <button className="btn-usar" onClick={usarCarta}>Usar esta ✓</button>
                        </div>
                      </div>
                      <p className={`ia-carta-text${isTyping ? ' typing-cursor' : ''}`}>{cartaGerada}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="field">
                  <label className="field-label">Sua mensagem</label>
                  <textarea
                    className="field-input field-textarea"
                    rows={10}
                    value={cartaTexto}
                    onChange={e => setCartaTexto(e.target.value)}
                    placeholder="Escreva do jeito que você fala. Não precisa ser perfeito — só precisa ser verdadeiro."
                    maxLength={800}
                  />
                  <p className="char-count">{cartaTexto.length}/800</p>
                </div>
              )}

              <div className="carta-extras">
                <div className="field">
                  <label className="field-label">Saudação <span className="field-opt">(ex: Meu amor)</span></label>
                  <input className="field-input" type="text" value={cartaPara} onChange={e => setCartaPara(e.target.value)} placeholder="Meu amor, Minha vida, Ana..." maxLength={40} />
                </div>
                <div className="field">
                  <label className="field-label">Assinatura <span className="field-opt">(ex: Com amor, Pedro)</span></label>
                  <input className="field-input" type="text" value={cartaAss} onChange={e => setCartaAss(e.target.value)} placeholder="Com todo meu amor, Pedro" maxLength={50} />
                </div>
              </div>

              <div className="nav-btns">
                <button className="btn-prev" onClick={() => goNext(2)}>← Voltar</button>
                <button className="btn-next" onClick={() => goNext(4)}>Próximo →</button>
              </div>
            </div>
          )}

          {/* ── STEP 5 — MÚSICA ── */}
          {step === 4 && (
            <div className="step-block">
              <div className="step-icon-hero">{STEP_ICONS[4]}</div>
              <h2 className="step-heading">A música de vocês</h2>
              <p className="step-sub">Cole o link do Spotify da música que é de vocês.</p>

              <div className="fields-card">
              <div className="field">
                <label className="field-label">Link do Spotify</label>
                <input className="field-input" type="text" value={spotifyUrl} onChange={e => handleSpotifyInput(e.target.value)} placeholder="https://open.spotify.com/track/..." />
              </div>

              {spotifyTrackId && (
                <div className="spotify-preview">
                  <iframe
                    src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`}
                    height="80" frameBorder={0}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="field-row" style={{ marginTop: 20 }}>
                <div className="field">
                  <label className="field-label">Nome da música</label>
                  <input className="field-input" type="text" value={musicaNome} onChange={e => setMusicaNome(e.target.value)} placeholder="ex: Perfect" maxLength={60} />
                </div>
                <div className="field">
                  <label className="field-label">Artista</label>
                  <input className="field-input" type="text" value={musicaArtista} onChange={e => setMusicaArtista(e.target.value)} placeholder="ex: Ed Sheeran" maxLength={60} />
                </div>
              </div>

              </div>{/* /fields-card */}

              <div className="nav-btns">
                <button className="btn-prev" onClick={() => goNext(3)}>← Voltar</button>
                <button className="btn-next" onClick={() => goNext(5)}>Próximo →</button>
              </div>
            </div>
          )}

          {/* ── STEP 6 — FINALIZAR ── */}
          {step === 5 && (
            <div className="step-block step-final">
              <div className="step-icon-hero">{STEP_ICONS[5]}</div>
              <div className="final-header">
                <span className="final-tag">quase lá</span>
                <h2 className="step-heading">Revise e finalize</h2>
                <p className="step-sub">Confira o resumo e informe seu e-mail para receber a página após o pagamento.</p>
              </div>

              {/* Resumo */}
              <div className="resumo-card">
                <div className="resumo-names">
                  <span className="resumo-heart">♥</span>
                  <span className="resumo-casal">{nome1 || 'Ela'} &amp; {nome2 || 'Ele'}</span>
                </div>
                {dataInicio && (
                  <p className="resumo-date">
                    Juntos desde {formatPrevDate(dataInicio)}
                    <span className="resumo-dias"> · {daysTogether(dataInicio).toLocaleString('pt-BR')} dias</span>
                  </p>
                )}
                <div className="resumo-grid">
                  <div className="resumo-item">
                    <span className="resumo-num">{fotosValidas.length}</span>
                    <span className="resumo-unit">foto{fotosValidas.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="resumo-item">
                    <span className="resumo-num">{marcosValidos.length}</span>
                    <span className="resumo-unit">momento{marcosValidos.length !== 1 ? 's' : ''}</span>
                  </div>
                  {cartaFinal && (
                    <div className="resumo-item">
                      <span className="resumo-num">✓</span>
                      <span className="resumo-unit">cartinha</span>
                    </div>
                  )}
                  {musicaNome && (
                    <div className="resumo-item">
                      <span className="resumo-num">♪</span>
                      <span className="resumo-unit">{musicaNome}</span>
                    </div>
                  )}
                </div>
                {cartaFinal && (
                  <p className="resumo-carta-preview">
                    &ldquo;{cartaFinal.slice(0, 80)}{cartaFinal.length > 80 ? '...' : ''}&rdquo;
                  </p>
                )}
              </div>

              {/* Preço */}
              <div className="preco-box">
                <span className="preco-valor">R$ 19,90</span>
                <span className="preco-desc">Entrega instantânea após o pagamento</span>
              </div>

              {/* Contato */}
              <div className="field">
                <label className="field-label">Seu e-mail <span className="required">*</span></label>
                <input
                  className="field-input"
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError('') }}
                  placeholder="voce@email.com"
                />
                {emailError && <span className="field-error">⚠ {emailError}</span>}
                <p className="field-hint">O link da sua página será enviado para este e-mail após o pagamento.</p>
              </div>
              <div className="field">
                <label className="field-label">WhatsApp <span className="field-opt">(opcional)</span></label>
                <input className="field-input" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" maxLength={20} />
              </div>

              {submitStatus && <p className="submit-status">{submitStatus}</p>}

              <div className="nav-btns nav-btns-final">
                <button className="btn-prev" onClick={() => goNext(4)}>← Voltar</button>
                <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '⏳ Processando...' : 'Criar nossa página e pagar ♡'}
                </button>
              </div>
              <p className="trust-line">🔒 Pagamento seguro · Mercado Pago · PIX e cartão</p>
            </div>
          )}
        </div>

        {/* ══ COLUNA PREVIEW ══ */}
        <aside className="preview-panel">
          <p className="preview-label">preview ao vivo</p>
          <div className="preview-device">
            {/* Mini fairy lights */}
            <div className="preview-lights">
              {Array.from({ length: 12 }).map((_, i) => <div key={i} className="prev-bulb" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>

            {/* Hero preview */}
            <div className="preview-hero">
              <p className="prev-eyebrow">uma história de amor</p>
              <h2 className="prev-names">
                <span className={nome1 ? '' : 'prev-placeholder'}>{nome1 || 'Nome dela'}</span>
                <span className="prev-amp">&amp;</span>
                <span className={nome2 ? '' : 'prev-placeholder'}>{nome2 || 'Nome dele'}</span>
              </h2>
              {dataInicio && <p className="prev-date">juntos desde {formatPrevDate(dataInicio)}</p>}
              {frase && <p className="prev-frase">&ldquo;{frase}&rdquo;</p>}
            </div>

            {/* Fotos */}
            {fotosValidas.length > 0 && (
              <div className="prev-photos">
                {photos.slice(0, 6).map((p, i) => (
                  <div key={i} className="prev-photo">
                    {p ? <img src={p.preview} alt="" /> : null}
                  </div>
                ))}
              </div>
            )}

            {/* Timeline */}
            {marcosValidos.length > 0 && (
              <div className="prev-timeline">
                {marcosValidos.slice(0, 3).map((m, i) => (
                  <div key={i} className="prev-tl-item">
                    <div className="prev-tl-dot" />
                    <div>
                      {m.data && <span className="prev-tl-date">{m.data}</span>}
                      <p className="prev-tl-title">{m.titulo}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Carta */}
            {cartaFinal && (
              <div className="prev-message">
                {cartaPara && <p className="prev-msg-salut">{cartaPara},</p>}
                <p className="prev-msg-text">{cartaFinal.slice(0, 120)}{cartaFinal.length > 120 ? '...' : ''}</p>
                {cartaAss && <span className="prev-msg-sig">{cartaAss}</span>}
              </div>
            )}

            {/* Música */}
            {musicaNome && (
              <div className="prev-music">
                <span className="prev-music-icon">♪</span>
                <span className="prev-music-name">{musicaNome}</span>
                {musicaArtista && <span className="prev-music-artist"> — {musicaArtista}</span>}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
