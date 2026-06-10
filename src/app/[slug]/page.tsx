import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { supabaseAdmin } from '@/lib/supabase'
import { CasalCompleto } from '@/lib/types'
import { getBaseUrl } from '@/lib/baseUrl'
import CasalPageClient from './CasalPageClient'

async function getCasal(slug: string): Promise<CasalCompleto | null> {
  const { data: casal, error } = await supabaseAdmin
    .from('casais')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'publicado')
    .single()

  if (error || !casal) return null

  // Busca fotos e marcos em queries separadas (mais robusto que nested select)
  const [{ data: fotos }, { data: marcos }] = await Promise.all([
    supabaseAdmin.from('fotos').select('*').eq('casal_id', casal.id).order('ordem'),
    supabaseAdmin.from('marcos').select('*').eq('casal_id', casal.id).order('ordem'),
  ])

  return {
    ...casal,
    fotos:  fotos  ?? [],
    marcos: marcos ?? [],
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const casal = await getCasal(params.slug)
  if (!casal) return { title: 'Página não encontrada' }

  const title = `${casal.nome1} & ${casal.nome2} ♡`
  const description = `A história de amor de ${casal.nome1} e ${casal.nome2} — juntos desde ${new Date(casal.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`

  const url = `${getBaseUrl()}/${casal.slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: casal.fotos[0] ? [{ url: casal.fotos[0].url, width: 1200, height: 630 }] : [],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function CasalPage({ params }: { params: { slug: string } }) {
  const casal = await getCasal(params.slug)
  if (!casal) notFound()

  // QR Code do link da página (para compartilhar)
  const link = `${getBaseUrl()}/${casal.slug}`
  let qrDataUrl = ''
  try {
    qrDataUrl = await QRCode.toDataURL(link, {
      width: 400, margin: 2,
      color: { dark: '#c02744', light: '#ffffff' },
    })
  } catch { /* segue sem QR se falhar */ }

  return <CasalPageClient casal={casal} qrDataUrl={qrDataUrl} pageLink={link} />
}
