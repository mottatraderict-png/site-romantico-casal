import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

function generateSlug(nome1: string, nome2: string) {
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return `${normalize(nome1)}-e-${normalize(nome2)}`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const token = formData.get('token') as string
    const casalId = formData.get('casalId') as string
    const nome1 = (formData.get('nome1') as string) ?? ''
    const nome2 = (formData.get('nome2') as string) ?? ''
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

    const admin = getSupabaseAdmin()

    // Verificar token
    const { data: casal } = await admin
      .from('casais')
      .select('id, status')
      .eq('id', casalId)
      .eq('token', token)
      .single()

    if (!casal || casal.status !== 'pago') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
    }

    // Upload das fotos via admin
    const fotosUploaded: { url: string; caption: string; ordem: number }[] = []
    let fotoIndex = 0
    while (formData.has(`foto_${fotoIndex}`)) {
      const file = formData.get(`foto_${fotoIndex}`) as File
      if (file && file.size > 0) {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${casalId}/${Date.now()}-${fotoIndex}.${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())
        const { data, error } = await admin.storage
          .from('fotos-casais')
          .upload(path, buffer, { contentType: file.type, upsert: true })
        if (!error && data) {
          const { data: pub } = admin.storage.from('fotos-casais').getPublicUrl(data.path)
          fotosUploaded.push({ url: pub.publicUrl, caption: '', ordem: fotoIndex })
        }
      }
      fotoIndex++
    }

    // Gerar slug único
    let slug = generateSlug(nome1 || 'casal', nome2)
    const { data: existing } = await admin
      .from('casais')
      .select('slug')
      .like('slug', `${slug}%`)
      .neq('id', casalId)
    if (existing && existing.length > 0) {
      const taken = existing.map((r: { slug: string }) => r.slug)
      if (taken.includes(slug)) {
        let n = 2
        while (taken.includes(`${slug}-${n}`)) n++
        slug = `${slug}-${n}`
      }
    }

    // Update casal
    const { error: updateError } = await admin
      .from('casais')
      .update({
        slug,
        nome1: nome1.trim(),
        nome2: nome2.trim(),
        apelido1: apelido1.trim() || null,
        apelido2: apelido2.trim() || null,
        data_inicio: dataInicio,
        frase_favorita: frase.trim() || null,
        carta_para: cartaPara.trim() || null,
        carta_texto: cartaTexto.trim() || null,
        carta_ass: cartaAss.trim() || null,
        musica_nome: musicaNome.trim() || null,
        musica_artista: musicaArtista.trim() || null,
        spotify_track_id: spotifyTrackId || null,
        status: 'publicado',
        token: null,
      })
      .eq('id', casalId)

    if (updateError) throw updateError

    // Inserir fotos
    if (fotosUploaded.length > 0) {
      await admin.from('fotos').insert(fotosUploaded.map((f) => ({ ...f, casal_id: casalId })))
    }

    // Inserir marcos
    const marcos = JSON.parse(marcosJson) as { data: string; titulo: string; desc: string }[]
    const marcosValidos = marcos.filter((m) => m.titulo.trim())
    if (marcosValidos.length > 0) {
      await admin.from('marcos').insert(
        marcosValidos.map((m, i) => ({
          casal_id: casalId,
          data_texto: m.data.trim() || null,
          titulo: m.titulo.trim(),
          descricao: m.desc.trim() || null,
          ordem: i,
        }))
      )
    }

    return NextResponse.json({ slug })
  } catch (err) {
    console.error('submit-form error:', err)
    return NextResponse.json({ error: JSON.stringify(err) }, { status: 500 })
  }
}
