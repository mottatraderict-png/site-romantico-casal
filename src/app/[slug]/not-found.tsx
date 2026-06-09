import '@/styles/casal.css'

export default function NotFound() {
  return (
    <div className="casal-root" style={{ minHeight: '100vh' }}>
      <div className="vignette" />
      <div className="not-found">
        <div style={{ fontSize: 48 }}>🌹</div>
        <h1>Página não encontrada</h1>
        <p>Esse link pode ter expirado ou o endereço está incorreto.</p>
        <a href="/" style={{ color: 'var(--rose)', fontStyle: 'italic', marginTop: 8 }}>
          Criar minha página →
        </a>
      </div>
    </div>
  )
}
