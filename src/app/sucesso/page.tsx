import QRCode from 'qrcode'
import SucessoClient from './SucessoClient'

export default async function SucessoPage({ searchParams }: { searchParams: { slug?: string; email?: string; casal_id?: string; mp?: string } }) {
  const slug = searchParams.slug

  // Com slug: mostra página completa com QR code (fluxo antigo / direto)
  if (slug) {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://site-romantico-casal.vercel.app'
    const link = `${baseUrl}/${slug}`
    const qrDataUrl = await QRCode.toDataURL(link, {
      width: 400, margin: 3,
      color: { dark: '#1C1410', light: '#FAF7F2' },
    })
    return <SucessoClient slug={slug} qrDataUrl={qrDataUrl} casalId={null} mpUrl={null} />
  }

  // Com casal_id: veio do formulário — faz polling até pagamento ser confirmado
  const casalId = searchParams.casal_id ?? null
  const mpUrl   = searchParams.mp ?? null
  return <SucessoClient slug={null} qrDataUrl={null} casalId={casalId} mpUrl={mpUrl} />
}
