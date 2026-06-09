import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { MercadoPagoConfig, Payment } from 'mercadopago'

function generateSlug(nome1: string, nome2: string) {
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return `${normalize(nome1)}-e-${normalize(nome2)}`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const casalIdForm = (formData.get('casal_id') as string)?.trim()
    const cpfForm = (formData.get('cpf') as string)?.trim() || '19119119100'
    const admin = getSupabaseAdmin()

    let casal_id = ''
    let email = ''
    let nome1 = ''
    let nome2 = ''

    if (casalIdForm) {
      // ── Fluxo de retentativa de pagamento ──
      const { data: existente, error: exErr } = await admin
        .from('casais')
        .select('id, email_cliente, nome1, nome2')
        .eq('id', casalIdForm)
        .single()
      if (exErr || !existente) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
      }
      casal_id = existente.id
      email = existente.email_cliente
      nome1 = existente.nome1 ?? ''
      nome2 = existente.nome2 ?? ''
    } else {
      // ── Fluxo Normal de Criação ──
      email = (formData.get('email') as string)?.trim()
      const whatsapp = (formData.get('whatsapp') as string) ?? ''
      nome1 = (formData.get('nome1') as string) ?? ''
      nome2 = (formData.get('nome2') as string) ?? ''
      const apelido1 = (formData.get('apelido1') as string) ?? ''
      const apelido2 = (formData.get('apelido2') as string) ?? ''
      const dataInicio = (formData.get('dataInicio') as string) ?? ''
      const frase = (formData.get('frase') as string) ?? ''
      const cartaPara = (formData.get('cartaPara') as string) ?? ''
      const cartaTexto = (formData.get('cartaTexto') as string) ?? ''
      const cartaAss = (formData.get('cartaAss') as string) ?? ''
      const musicaNome = (formData.get('musicaNome') as string) ?? ''
      const musicaArtista = (formData.get('musicaArtista') as string) ?? ''
      const spotifyTrackId = (formData.get('spotifyTrackId') as string) ?? ''
      const marcosJson = (formData.get('marcos') as string) ?? '[]'

      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
      }

      // ── Upload das fotos ──────────────────────────────────────
      const fotosUploaded: { url: string; ordem: number }[] = []
      let fotoIndex = 0
      while (formData.has(`foto_${fotoIndex}`)) {
        const file = formData.get(`foto_${fotoIndex}`) as File
        if (file && file.size > 0) {
          const ext = file.name.split('.').pop() ?? 'jpg'
          const path = `temp-${Date.now()}/${fotoIndex}.${ext}`
          const buffer = Buffer.from(await file.arrayBuffer())
          const { data, error } = await admin.storage.from('fotos-casais').upload(path, buffer, { contentType: file.type, upsert: true })
          if (!error && data) {
            const { data: pub } = admin.storage.from('fotos-casais').getPublicUrl(data.path)
            fotosUploaded.push({ url: pub.publicUrl, ordem: fotoIndex })
          }
        }
        fotoIndex++
      }

      // ── Slug único ────────────────────────────────────────────
      let slug = generateSlug(nome1 || 'casal', nome2 || 'amor')
      const { data: existing } = await admin.from('casais').select('slug').like('slug', `${slug}%`)
      if (existing && existing.length > 0) {
        const taken = existing.map((r: { slug: string }) => r.slug)
        if (taken.includes(slug)) {
          let n = 2
          while (taken.includes(`${slug}-${n}`)) n++
          slug = `${slug}-${n}`
        }
      }

      // ── Inserir casal ─────────────────────────────────────────
      const { data: casalInsert, error: insertError } = await admin
        .from('casais')
        .insert({
          email_cliente: email,
          whatsapp: whatsapp.trim() || null,
          nome_casal: `${nome1.trim()} & ${nome2.trim()}`,
          nome1: nome1.trim(), nome2: nome2.trim(),
          apelido1: apelido1.trim() || null, apelido2: apelido2.trim() || null,
          data_inicio: dataInicio || null,
          frase_favorita: frase.trim() || null,
          carta_para: cartaPara.trim() || null,
          carta_texto: cartaTexto.trim() || null,
          carta_ass: cartaAss.trim() || null,
          musica_nome: musicaNome.trim() || null,
          musica_artista: musicaArtista.trim() || null,
          spotify_track_id: spotifyTrackId || null,
          slug, status: 'pendente',
        })
        .select('id').single()

      if (insertError || !casalInsert) {
        return NextResponse.json({ error: insertError?.message ?? 'Falha ao inserir casal' }, { status: 500 })
      }
      casal_id = casalInsert.id

      // ── Fotos ─────────────────────────────────────────────────
      if (fotosUploaded.length > 0) {
        await admin.from('fotos').insert(fotosUploaded.map(f => ({ casal_id, url: f.url, ordem: f.ordem })))
      }

      // ── Fotos de marcos + marcos ──────────────────────────────
      const marcoFotoUrls: Record<number, string> = {}
      let mfi = 0
      while (formData.has(`marco_foto_${mfi}`)) {
        const file = formData.get(`marco_foto_${mfi}`) as File
        if (file && file.size > 0) {
          const ext = file.name.split('.').pop() ?? 'jpg'
          const path = `temp-${Date.now()}/marco_${mfi}.${ext}`
          const buffer = Buffer.from(await file.arrayBuffer())
          const { data: mData, error: mErr } = await admin.storage.from('fotos-casais').upload(path, buffer, { contentType: file.type, upsert: true })
          if (!mErr && mData) {
            const { data: mPub } = admin.storage.from('fotos-casais').getPublicUrl(mData.path)
            marcoFotoUrls[mfi] = mPub.publicUrl
          }
        }
        mfi++
      }
      const marcos = JSON.parse(marcosJson) as { data: string; titulo: string; desc: string }[]
      const marcosValidos = marcos.filter(m => m.titulo.trim())
      if (marcosValidos.length > 0) {
        await admin.from('marcos').insert(marcosValidos.map((m, i) => ({
          casal_id,
          data_texto: m.data.trim() || null,
          titulo: m.titulo.trim(),
          descricao: m.desc.trim() || null,
          foto_url: marcoFotoUrls[i] || null,
          ordem: i,
        })))
      }
    }

    // ── Criar Payment PIX via MP ──────────────────────────────
    let rawBaseUrl = (process.env.NEXT_PUBLIC_URL || '').trim()
    if (!rawBaseUrl) {
      rawBaseUrl = 'https://www.cartadeamor.site'
    }
    if (!rawBaseUrl.startsWith('http')) {
      rawBaseUrl = `https://${rawBaseUrl}`
    }
    let baseUrl = rawBaseUrl.replace(/\/$/, '')

    // Mercado Pago exige HTTPS e domínio público válido (rejeita localhost)
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      baseUrl = 'https://cartadeamor.site'
    }

    const notificationUrl = `${baseUrl}/api/webhook/mercadopago`
    console.log('[pix] notificationUrl:', notificationUrl)

    const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! })
    const paymentClient = new Payment(mp)

    // Aumentar para 30 minutos para evitar que o banco recuse por expiração rápida
    const expirationDate = new Date(Date.now() + 30 * 60 * 1000)

    // Remover emojis e caracteres especiais que o MP/BACEN pode rejeitar
    const safeNome1 = (nome1 || 'Cliente').replace(/[^a-zA-ZÀ-ÿ\s]/g, '').substring(0, 50).trim() || 'Cliente'
    const safeNome2 = (nome2 || 'Casal').replace(/[^a-zA-ZÀ-ÿ\s]/g, '').substring(0, 50).trim() || 'Casal'

    const payment = await paymentClient.create({
      body: {
        transaction_amount: 19.90,
        payment_method_id: 'pix',
        date_of_expiration: expirationDate.toISOString(),
        payer: {
          email,
          first_name: safeNome1,
          last_name: safeNome2,
          identification: {
            type: 'CPF',
            number: cpfForm
          }
        },
        external_reference: casal_id,
        description: `Página Romântica — ${safeNome1} & ${safeNome2}`,
        notification_url: notificationUrl,
      }
    })

    const txData = payment.point_of_interaction?.transaction_data
    const qrCode       = txData?.qr_code        ?? null
    const qrCodeBase64 = txData?.qr_code_base64 ?? null
    const ticketUrl    = txData?.ticket_url      ?? null

    return NextResponse.json({
      casalId:     casal_id,
      qrCode,
      qrCodeBase64,
      ticketUrl,
      paymentId:   payment.id,
    })

  } catch (err: unknown) {
    console.error('[pix] erro:', err)
    
    // Melhor extração do erro do Mercado Pago
    const e = err as { message?: string; cause?: Array<{ description?: string }>; response?: { message?: string } }
    let errorMsg = e.message || 'Erro desconhecido ao gerar PIX'
    
    if (e.cause && Array.isArray(e.cause)) {
      const causes = e.cause.map(c => c.description).filter(Boolean).join(', ')
      if (causes) errorMsg += ` - Detalhes: ${causes}`
    } else if (e.response?.message) {
      errorMsg = e.response.message
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
