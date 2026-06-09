import '@/styles/formulario.css'

export default function AguardandoPage() {
  return (
    <div className="form-root">
      <div className="vignette" />
      <div className="token-error">
        <div style={{ fontSize: 56 }}>⏳</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontStyle: 'italic', color: 'var(--cream)' }}>
          Pagamento em processamento
        </h1>
        <p style={{ color: 'var(--text-soft)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.7, maxWidth: 400 }}>
          Seu pagamento está sendo confirmado. Em alguns instantes você receberá um e-mail com o link para criar a página do casal.
        </p>
        <p style={{ color: 'var(--text-soft)', fontStyle: 'italic', fontSize: 13 }}>
          Verifique sua caixa de entrada e a pasta de spam. ♡
        </p>
        <a href="/" style={{ color: 'var(--rose)', fontStyle: 'italic', marginTop: 8 }}>
          Voltar para o início
        </a>
      </div>
    </div>
  )
}
