'use client'

import { useEffect } from 'react'
import { trackTimeOnPage } from '@/lib/track'

// Mede o tempo que o visitante passa na página e envia ao sair.
// Não conta o /admin (não faz sentido medir o próprio painel).
export default function TimeTracker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) return
    const cleanup = trackTimeOnPage()
    return cleanup
  }, [])
  return null
}
