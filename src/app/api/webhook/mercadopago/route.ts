import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getSupabaseAdmin } from '@/lib/supabase'
import { enviarEmailPagina } from '@/lib/email'
import crypto from 'crypto'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verificarAssinatura(req: NextRequest, _body: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  if (!secret) return true // sem secret configurado, aceita tudo

  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''
  const urlParams = new URL(req.url).searchParams
  const dataId = urlParams.get('data.id') ?? urlParams.get('id') ?? ''

  let ts = '', v1 = ''
  for (const part of xSignature.split(',')) {
    const [key, val] = part.split('=')
    if (key?.trim() === 'ts') ts = val?.trim() ?? ''
    if (key?.trim() === 'v1') v1 = val?.trim() ?? ''
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  return hmac === v1
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    console.log('Webhook recebido:', JSON.stringify(bodyText.slice(0, 500)))
    console.log('[webhook] headers x-signature:', req.headers.get('x-signature'), '| x-request-id:', req.headers.get('x-request-id'))

    if (!verificarAssinatura(req, bodyText)) {
      console.warn('[webhook] assinatura inválida')
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    const body = JSON.parse(bodyText)

    // Suporta dois formatos:
    // Novo (Webhooks): { type: "payment", data: { id: "123" } }
    // Antigo (IPN):    { topic: "payment", resource: "163201707488" }
    const type      = body?.type ?? body?.topic ?? body?.action
    const paymentId = body?.data?.id ?? body?.id ?? body?.resource

    console.log('[webhook] type:', type, '| paymentId:', paymentId)

    if (!paymentId || (type !== 'payment' && !type?.includes('payment'))) {
      console.log('[webhook] ignorando — não é evento de pagamento')
      return NextResponse.json({ ok: true })
    }

    const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! })
    const paymentClient = new Payment(mp)
    const payment = await paymentClient.get({ id: paymentId })

    console.log('[webhook] payment.status:', payment.status, '| payer.email:', payment.payer?.email)

    if (payment.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    const admin = getSupabaseAdmin()

    // Busca por external_reference (fluxo antigo) ou por e-mail do pagador (link fixo)
    let casal = null

    if (payment.external_reference) {
      const { data } = await admin
        .from('casais')
        .select('id, status, email_cliente, nome1, nome2, slug')
        .eq('id', payment.external_reference)
        .single()
      casal = data
      console.log('[webhook] busca por external_reference:', payment.external_reference, '| encontrou:', !!casal)
    }

    if (!casal && payment.payer?.email) {
      const { data } = await admin
        .from('casais')
        .select('id, status, email_cliente, nome1, nome2, slug')
        .eq('email_cliente', payment.payer.email)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      casal = data
      console.log('[webhook] busca por email:', payment.payer.email, '| encontrou:', !!casal)
    }

    if (!casal) {
      console.warn('[webhook] casal não encontrado')
      return NextResponse.json({ ok: true })
    }

    if (casal.status !== 'pendente') {
      console.log('[webhook] casal já publicado, ignorando')
      return NextResponse.json({ ok: true })
    }

    // Publicar a página
    await admin
      .from('casais')
      .update({ status: 'publicado', payment_id: String(paymentId) })
      .eq('id', casal.id)

    console.log('[webhook] casal publicado:', casal.slug)

    // Enviar e-mail com o link
    if (casal.email_cliente && casal.slug) {
      try {
        await enviarEmailPagina(casal.email_cliente, casal.nome1 ?? '', casal.nome2 ?? '', casal.slug)
        console.log('[webhook] e-mail enviado para:', casal.email_cliente)
      } catch (emailErr) {
        console.error('[webhook] erro ao enviar e-mail:', emailErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook] EXCEPTION:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
