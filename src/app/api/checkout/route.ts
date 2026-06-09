import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getBaseUrl } from '@/lib/baseUrl'
import { MercadoPagoConfig, Preference } from 'mercadopago'

function generateSlug(nome1: string, nome2: string) {
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return `${normalize(nome1)}-e-${normalize(nome2)}`
}

export async function POST(req: NextRequest) {
  try {
    console.log('[checkout] iniciando...')

    const formData = await req.formData()
    const casalIdForm = (formData.get('casal_id') as string)?.trim()

    let casal_id = ''
    let email = ''

    const admin = getSupabaseAdmin()

    if (casalIdForm) {
      const { data: existente, error: exErr } = await admin
        .from('casais')
        .select('id, email_cliente')
        .eq('id', casalIdForm)
        .single()
      if (exErr || !existente) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
      }
      casal_id = existente.id
      email = existente.email_cliente
    } else {
      const fdKeys: string[] = []; formData.forEach((_, k) => fdKeys.push(k))
      console.log('[checkout] formData keys:', fdKeys.join(', '))

      const fotoKeys   = fdKeys.filter(k => k.startsWith('foto_'))
      const marcoFotoKeys = fdKeys.filter(k => k.startsWith('marco_foto_'))
      const marcosRaw  = (formData.get('marcos') as string) ?? '[]'
      console.log('CHECKOUT fotos recebidas:', fotoKeys.length, '| keys:', fotoKeys.join(', '))
      console.log('CHECKOUT marcos JSON:', marcosRaw)
      console.log('CHECKOUT marco_fotos recebidas:', marcoFotoKeys.length)

      email        = (formData.get('email') as string)?.trim() || ''
      const whatsapp     = (formData.get('whatsapp') as string) ?? ''
      const nome1        = (formData.get('nome1') as string) ?? ''
      const nome2        = (formData.get('nome2') as string) ?? ''
      const apelido1     = (formData.get('apelido1') as string) ?? ''
      const apelido2     = (formData.get('apelido2') as string) ?? ''
      const dataInicio   = (formData.get('dataInicio') as string) ?? ''
      const frase        = (formData.get('frase') as string) ?? ''
      const cartaPara    = (formData.get('cartaPara') as string) ?? ''
      const cartaTexto   = (formData.get('cartaTexto') as string) ?? ''
      const cartaAss     = (formData.get('cartaAss') as string) ?? ''
      const musicaNome   = (formData.get('musicaNome') as string) ?? ''
      const musicaArtista = (formData.get('musicaArtista') as string) ?? ''
      const spotifyTrackId = (formData.get('spotifyTrackId') as string) ?? ''
      const marcosJson   = (formData.get('marcos') as string) ?? '[]'

      console.log('[checkout] email:', email, '| nome1:', nome1, '| nome2:', nome2)

      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
      }

    // Verificar env vars
      // Verificar env vars
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      console.log('[checkout] SUPABASE_URL presente:', !!supabaseUrl)
      console.log('[checkout] SERVICE_ROLE_KEY presente:', !!supabaseKey)

    // Upload das fotos
    const fotosUploaded: { url: string; caption: string; ordem: number }[] = []
    let fotoIndex = 0
    while (formData.has(`foto_${fotoIndex}`)) {
      const file = formData.get(`foto_${fotoIndex}`) as File
      if (file && file.size > 0) {
        console.log(`[checkout] upload foto_${fotoIndex}: ${file.name} (${file.size} bytes)`)
        const ext = file.name.split('.').pop() ?? 'jpg'
        const tempId = `temp-${Date.now()}`
        const path = `${tempId}/${fotoIndex}.${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())
        const { data, error } = await admin.storage
          .from('fotos-casais')
          .upload(path, buffer, { contentType: file.type, upsert: true })
        if (error) {
          console.error(`[checkout] erro upload foto_${fotoIndex}:`, JSON.stringify(error))
        } else if (data) {
          const { data: pub } = admin.storage.from('fotos-casais').getPublicUrl(data.path)
          fotosUploaded.push({ url: pub.publicUrl, caption: '', ordem: fotoIndex })
          console.log(`[checkout] foto_${fotoIndex} ok:`, pub.publicUrl)
        }
      }
      fotoIndex++
    }
    console.log('[checkout] fotos uploaded:', fotosUploaded.length)

    // Gerar slug único
    let slug = generateSlug(nome1 || 'casal', nome2 || 'amor')
    console.log('[checkout] slug base:', slug)
    const { data: existing, error: slugError } = await admin.from('casais').select('slug').like('slug', `${slug}%`)
    if (slugError) console.error('[checkout] erro ao buscar slugs:', JSON.stringify(slugError))
    if (existing && existing.length > 0) {
      const taken = existing.map((r: { slug: string }) => r.slug)
      if (taken.includes(slug)) {
        let n = 2
        while (taken.includes(`${slug}-${n}`)) n++
        slug = `${slug}-${n}`
      }
    }
    console.log('[checkout] slug final:', slug)

    // Criar registro no Supabase
    const insertPayload = {
      email_cliente: email,
      whatsapp: whatsapp || null,
      nome_casal: `${nome1.trim()} & ${nome2.trim()}`,
      nome1: nome1.trim(),
      nome2: nome2.trim(),
      apelido1: apelido1.trim() || null,
      apelido2: apelido2.trim() || null,
      data_inicio: dataInicio || null,
      frase_favorita: frase.trim() || null,
      carta_para: cartaPara.trim() || null,
      carta_texto: cartaTexto.trim() || null,
      carta_ass: cartaAss.trim() || null,
      musica_nome: musicaNome.trim() || null,
      musica_artista: musicaArtista.trim() || null,
      spotify_track_id: spotifyTrackId || null,
      slug,
      status: 'pendente',
    }
    console.log('[checkout] inserindo casal...', JSON.stringify(insertPayload))

    const { data: casal, error: insertError } = await admin
      .from('casais')
      .insert(insertPayload)
      .select('id')
      .single()

    if (insertError || !casal) {
      console.error('[checkout] ERRO insert casal:', JSON.stringify(insertError, null, 2))
      return NextResponse.json({
        error: insertError?.message ?? 'Falha ao inserir casal',
        details: insertError?.code,
        hint: insertError?.hint,
      }, { status: 500 })
    }
      casal_id = casal.id
      console.log('[checkout] casal inserido, id:', casal_id)

      // Inserir fotos
      if (fotosUploaded.length > 0) {
        const { error: fotosError } = await admin.from('fotos').insert(
          fotosUploaded.map((f, i) => ({
            casal_id: casal_id,
          url: f.url,
          caption: f.caption || null,
          ordem: i,
        }))
      )
      if (fotosError) console.error('[checkout] erro insert fotos:', JSON.stringify(fotosError))
      else console.log('[checkout] fotos inseridas ok:', fotosUploaded.length)
    }

    // Upload das fotos de marcos — itera por índice original (evita parar em gaps)
    const marcos = JSON.parse(marcosJson) as { data: string; titulo: string; desc: string }[]
    const marcoFotoUrls: Record<number, string> = {}
    for (let i = 0; i < marcos.length; i++) {
      const file = formData.get(`marco_foto_${i}`) as File | null
      if (file && file.size > 0) {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `temp-${Date.now()}/marco_${i}.${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())
        const { data: mData, error: mErr } = await admin.storage
          .from('fotos-casais')
          .upload(path, buffer, { contentType: file.type, upsert: true })
        if (!mErr && mData) {
          const { data: mPub } = admin.storage.from('fotos-casais').getPublicUrl(mData.path)
          marcoFotoUrls[i] = mPub.publicUrl
          console.log(`[checkout] marco_foto_${i} ok`)
        } else if (mErr) {
          console.error(`[checkout] erro marco_foto_${i}:`, JSON.stringify(mErr))
        }
      }
    }

    // Mantém índice original para mapear foto corretamente (não re-numera após filter)
    const marcosInsert = marcos
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.titulo.trim())
      .map(({ m, i }, ordem) => ({
        casal_id: casal_id,
        data_texto: m.data.trim() || null,
        titulo: m.titulo.trim(),
        descricao: m.desc.trim() || null,
        foto_url: marcoFotoUrls[i] || null,  // índice ORIGINAL
        ordem,
      }))

    if (marcosInsert.length > 0) {
      const { error: marcosError } = await admin.from('marcos').insert(marcosInsert)
      if (marcosError) console.error('[checkout] erro insert marcos:', JSON.stringify(marcosError))
      else console.log('[checkout] marcos inseridos ok:', marcosInsert.length)
    }
    }

    // Criar preferência MP com external_reference = casal.id para o webhook achar o casal
    const baseUrl = getBaseUrl()
    const notificationUrl = `${baseUrl}/api/webhook/mercadopago`
    console.log('[checkout] notificationUrl:', notificationUrl)
    let checkoutUrl = 'https://mpago.la/1oVhCHY' // fallback link fixo

    try {
      const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! })
      const preference = new Preference(mp)
      const pref = await preference.create({
        body: {
          items: [{
            id: 'pagina-romantica',
            title: 'Página Romântica do Casal',
            quantity: 1,
            unit_price: 29.90,
            currency_id: 'BRL',
          }],
          payer: { email: email },
          external_reference: casal_id,
          back_urls: {
            success: `${baseUrl}/sucesso?casal_id=${casal_id}`,
            failure: `${baseUrl}/sucesso?casal_id=${casal_id}`,
            pending: `${baseUrl}/sucesso?casal_id=${casal_id}`,
          },
          auto_return: 'approved',
          notification_url: notificationUrl,
        }
      })
      if (pref.init_point) {
        checkoutUrl = pref.init_point
        console.log('[checkout] preferência MP criada, external_reference:', casal_id)
      }
    } catch (mpErr) {
      console.error('[checkout] erro ao criar preferência MP:', JSON.stringify(mpErr, null, 2))
      console.error('[checkout] erro message:', (mpErr as Error)?.message)
      console.error('[checkout] erro stack:', (mpErr as Error)?.stack)
    }

    console.log('[checkout] tudo ok, retornando casal_id e checkoutUrl')
    return NextResponse.json({ checkoutUrl, casalId: casal_id })

  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; hint?: string }
    console.error('[checkout] EXCEPTION:', String(err))
    console.error('[checkout] message:', e?.message)
    console.error('[checkout] code:', e?.code)
    console.error('[checkout] stack:', (err as Error)?.stack)
    return NextResponse.json({
      error: e?.message ?? String(err),
      details: e?.code,
    }, { status: 500 })
  }
}
