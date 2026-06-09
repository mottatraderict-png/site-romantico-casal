import AdminClient from './AdminClient'

export const metadata = {
  title: 'Painel · Romântico do Casal',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminClient />
}
