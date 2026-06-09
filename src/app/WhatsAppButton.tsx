import './whatsapp.css'

const NUMERO = '5546999247368'
const MENSAGEM = 'Olá! Preciso de ajuda com a minha página romântica 🌹'

export default function WhatsAppButton() {
  const href = `https://wa.me/${NUMERO}?text=${encodeURIComponent(MENSAGEM)}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-fab"
      aria-label="Suporte via WhatsApp"
      title="Fale com o suporte no WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
        <path
          fill="#fff"
          d="M16.04 4C9.93 4 5 8.93 5 15.04c0 2.13.6 4.13 1.64 5.85L5 28l7.3-1.6a11.02 11.02 0 0 0 3.74.66h.01C22.15 27.06 27 22.13 27 16.02 27 9.92 22.14 4 16.04 4Zm6.43 15.6c-.27.76-1.57 1.46-2.17 1.5-.58.04-1.12.25-3.77-.79-3.18-1.25-5.2-4.5-5.36-4.71-.16-.21-1.28-1.7-1.28-3.25 0-1.55.81-2.31 1.1-2.63.27-.3.6-.37.8-.37.2 0 .4 0 .58.01.2.01.46-.07.72.55.27.63.92 2.18 1 2.34.08.16.13.35.02.56-.1.21-.16.34-.32.53-.16.19-.34.42-.48.56-.16.16-.33.34-.14.66.19.32.84 1.39 1.81 2.25 1.24 1.11 2.29 1.45 2.61 1.61.32.16.5.13.69-.08.19-.21.8-.93 1.01-1.25.21-.32.42-.27.71-.16.29.11 1.84.87 2.16 1.03.32.16.53.24.61.37.08.13.08.76-.19 1.52Z"
        />
      </svg>
    </a>
  )
}
