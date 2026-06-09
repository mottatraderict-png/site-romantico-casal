import { Metadata } from 'next'
import CheckoutClient from './CheckoutClient'

export const metadata: Metadata = {
  title: 'Checkout · Página Romântica do Casal',
}

// Esta página é acessada diretamente via client-side navigation a partir do formulário.
// O CheckoutClient recebe os dados via props do FormularioClient.
export default function CheckoutPage() {
  return (
    <CheckoutClient
      nome1=""
      nome2=""
      dataInicio=""
      fotosCount={0}
      marcosCount={0}
      temCarta={false}
      temMusica=""
      formData={null}
      onBack={() => { if (typeof window !== 'undefined') window.history.back() }}
    />
  )
}
