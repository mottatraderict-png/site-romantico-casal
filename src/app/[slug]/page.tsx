import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { CasalCompleto } from '@/lib/types'
import CasalPageClient from './CasalPageClient'

async function getCasal(slug: string): Promise<CasalCompleto | null> {
  const { data: casal, error } = await supabaseAdmin
    .from('casais')
    .select('*, fotos(*), marcos(*)')
    .eq('slug', slug)
    .eq('status', 'publicado')
    .single()

  if (error || !casal) return null

  return {
    ...casal,
    fotos:  (casal.fotos  ?? []),
    marcos: (casal.marcos ?? []),
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const casal = await getCasal(params.slug)
  if (!casal) return { title: 'Página não encontrada' }

  const title = `${casal.nome1} & ${casal.nome2} ♡`
  const description = `A história de amor de ${casal.nome1} e ${casal.nome2} — juntos desde ${new Date(casal.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
  const url = `${process.env.NEXT_PUBLIC_URL}/${casal.slug}`

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
  return <CasalPageClient casal={casal} />
}
