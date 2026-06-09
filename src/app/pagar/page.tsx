import { getSupabaseAdmin } from '@/lib/supabase'
import PagarClient from './PagarClient'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Finalizar Pagamento | Romântico do Casal' }

export default async function PagarPage({ searchParams }: { searchParams: { casal_id?: string } }) {
  const casal_id = searchParams.casal_id
  if (!casal_id) redirect('/')

  const admin = getSupabaseAdmin()
  const { data } = await admin.from('casais').select('id, nome1, nome2, email_cliente, data_inicio, status').eq('id', casal_id).single()
  
  if (!data || data.status === 'publicado') {
    if (data?.status === 'publicado') {
      redirect(`/buscar?email=${data.email_cliente}`)
    }
    redirect('/')
  }

  return <PagarClient casalId={data.id} nome1={data.nome1} nome2={data.nome2} email={data.email_cliente} />
}
