// Domínio canônico do projeto. Nunca expomos *.vercel.app em links públicos
// (QR codes, e-mails, metadados) — é gatilho de spam e quebra o branding.
// Usamos o www porque o apex (cartadeamor.site) ainda não resolve no DNS.
export const CANONICAL_DOMAIN = 'www.cartadeamor.site'

/** Retorna a base URL pública canônica, sempre https e sem barra final. */
export function getBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_URL || '').trim()
  if (!url) url = `https://${CANONICAL_DOMAIN}`
  if (!url.startsWith('http')) url = `https://${url}`
  url = url.replace(/\/$/, '')
  if (url.includes('vercel.app') || url.includes('localhost') || url.includes('127.0.0.1')) {
    url = `https://${CANONICAL_DOMAIN}`
  }
  // Apex (cartadeamor.site sem www) ainda não resolve no DNS — força o www.
  url = url.replace('https://cartadeamor.site', 'https://www.cartadeamor.site')
  return url
}
