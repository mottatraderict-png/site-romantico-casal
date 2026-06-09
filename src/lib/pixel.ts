/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    fbq: (...args: any[]) => void
  }
}

export function pixelTrack(event: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', event, params)
  }
}

// Eventos usados no projeto:
// ViewContent  — ao abrir /criar e /
// InitiateCheckout — ao chegar no step 6 (resumo)
// Lead         — ao clicar em "Enviar e pagar"
// Purchase     — ao carregar /sucesso
