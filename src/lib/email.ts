import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = () => (process.env.RESEND_FROM || 'contato@cartadeamor.site').trim()
const BASE_URL = () => {
  let rawUrl = (process.env.NEXT_PUBLIC_URL || '').trim()
  if (!rawUrl) {
    const vercelUrl = (process.env.VERCEL_URL || '').trim()
    rawUrl = vercelUrl ? `https://${vercelUrl}` : 'https://cartadeamor.site'
  }
  if (!rawUrl.startsWith('http')) {
    rawUrl = `https://${rawUrl}`
  }
  return rawUrl.replace(/\/$/, '')
}

export async function enviarEmailPagina(
  email: string,
  nome1: string,
  nome2: string,
  slug: string
) {
  const resend = getResend()
  const link = `${BASE_URL()}/${slug}`

  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: `A página de ${nome1} & ${nome2} está no ar ♡`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0608;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0608;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#130a0c;border:1px solid rgba(200,80,106,0.2);border-radius:8px;overflow:hidden;max-width:560px;width:100%">
        <tr><td style="padding:48px 40px;text-align:center">
          <p style="font-family:Georgia,serif;font-size:40px;margin:0 0 16px">🌹</p>
          <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;font-style:italic;color:#f5ede6;margin:0 0 8px">${nome1} &amp; ${nome2}</h1>
          <p style="font-family:Georgia,serif;font-size:15px;color:#b89a9e;font-style:italic;margin:0 0 32px">a página de vocês está no ar ♡</p>

          <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#c8506a,#9a3050);color:white;text-decoration:none;padding:16px 36px;border-radius:6px;font-family:Georgia,serif;font-size:15px;font-style:italic;letter-spacing:0.05em;margin-bottom:32px">
            Ver minha página →
          </a>

          <p style="font-family:Georgia,serif;font-size:12px;color:#7a5a60;font-style:italic;margin:0 0 6px">Link direto:</p>
          <p style="font-family:Georgia,serif;font-size:13px;color:#e8899a;font-style:italic;margin:0 0 28px;word-break:break-all">${link}</p>

          <p style="font-family:Georgia,serif;font-size:13px;color:#b89a9e;font-style:italic;line-height:1.7;margin:0">
            Guarda esse link — é dele que você vai compartilhar<br>com quem você ama. ♡
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;text-align:center;border-top:1px solid rgba(200,80,106,0.1)">
          <p style="font-family:Georgia,serif;font-size:11px;color:rgba(184,154,158,0.4);margin:0">feito com amor · ${BASE_URL().replace('https://', '')}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}