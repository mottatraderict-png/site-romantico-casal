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

    const email         = (formData.get('email') as string)?.trim()
    const whatsapp      = (formData.get('whatsapp') as string) ?? ''
    const nome1         = (formData.get('nome1') as string) ?? ''
    const nome2         = (formData.get('nome2') as string) ?? ''
    const apelido1      = (formData.get('apelido1') as string) ?? ''
    const apelido2      = (formData.get('apelido2') as string) ?? ''
    const dataInicio    = (formData.get('dataInicio') as string) ?? ''
    const frase         = (formData.get('frase') as string) ?? ''
    const cartaPara     = (formData.get('cartaPara') as string) ?? ''
    const cartaTexto    = (formData.get('cartaTexto') as string) ?? ''
    const cartaAss      = (formData.get('cartaAss') as string) ?? ''
    const musicaNome    = (formData.get('musicaNome') as string) ?? ''
    const musicaArtista = (formData.get('musicaArtista') as string) ?? ''
    const spotifyTrackId = (formData.get('spotifyTrackId') as string) ?? ''
    const marcosJson    = (formData.get('marcos') as string) ?? '[]'

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

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
    const { data: casal, error: insertError } = await admin
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

    if (insertError || !casal) {
      return NextResponse.json({ error: insertError?.message ?? 'Falha ao inserir casal' }, { status: 500 })
    }

    // ── Fotos ─────────────────────────────────────────────────
    if (fotosUploaded.length > 0) {
      await admin.from('fotos').insert(fotosUploaded.map(f => ({ casal_id: casal.id, url: f.url, ordem: f.ordem })))
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
        casal_id: casal.id,
        data_texto: m.data.trim() || null,
        titulo: m.titulo.trim(),
        descricao: m.desc.trim() || null,
        foto_url: marcoFotoUrls[i] || null,
        ordem: i,
      })))
    }

    // ── Criar Payment PIX via MP ──────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://site-romantico-casal.vercel.app'

    const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! })
    const paymentClient = new Payment(mp)

    const payment = await paymentClient.create({
      body: {
        transaction_amount: 19.90,
        payment_method_id: 'pix',
        payer: { email },
        external_reference: casal.id,
        description: `Página Romântica — ${nome1} & ${nome2}`,
        notification_url: `${baseUrl}/api/webhook/mercadopago`,
      }
    })

    const txData = payment.point_of_interaction?.transaction_data
    const qrCode       = txData?.qr_code        ?? null
    const qrCodeBase64 = txData?.qr_code_base64 ?? null
    const ticketUrl    = txData?.ticket_url      ?? null

    return NextResponse.json({
      casalId:     casal.id,
      qrCode,
      qrCodeBase64,
      ticketUrl,
      paymentId:   payment.id,
    })

  } catch (err: any) {
    console.error('[pix] erro:', err)
    const errorMsg = err?.message || (err?.response?.message) || (typeof err === 'object' ? JSON.stringify(err) : String(err))
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
