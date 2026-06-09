import { redirect } from 'next/navigation'

// O checkout só funciona embutido no fluxo do formulário (precisa dos dados
// coletados em /criar). Acessar /checkout diretamente redireciona para o início.
export default function CheckoutPage() {
  redirect('/criar')
}
