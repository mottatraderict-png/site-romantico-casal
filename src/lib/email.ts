import { Resend } from 'resend'
import QRCode from 'qrcode'
import { getBaseUrl } from '@/lib/baseUrl'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = () => (process.env.RESEND_FROM || 'Carta de Amor <contato@cartadeamor.site>').trim()
const REPLY_TO = () => (process.env.RESEND_REPLY_TO || 'contato@cartadeamor.site').trim()
const BASE_URL = getBaseUrl

export async function enviarEmailPagina(
  email: string,
  nome1: string,
  nome2: string,
  slug: string
) {
  const resend = getResend()
  const link = `${BASE_URL()}/${slug}`
  const domainLabel = BASE_URL().replace(/^https?:\/\//, '')

  // Gera o QR Code do link como PNG (anexo inline via cid)
  let qrBuffer: Buffer | null = null
  try {
    const dataUrl = await QRCode.toDataURL(link, {
      width: 400, margin: 2, color: { dark: '#c02744', light: '#ffffff' },
    })
    qrBuffer = Buffer.from(dataUrl.split(',')[1], 'base64')
  } catch { /* segue sem QR */ }

  // Versão texto-plano — essencial para reduzir score de spam
  const text = `Olá!

A página romântica de ${nome1} & ${nome2} está no ar. 💌

Acesse e compartilhe com quem você ama:
${link}

Guarde este link — é dele que você vai compartilhar a surpresa.

Com carinho,
Equipe ${domainLabel}`

  await resend.emails.send({
    from: FROM(),
    to: email,
    replyTo: REPLY_TO(),
    subject: `${nome1} & ${nome2}, a página de vocês está pronta 💌`,
    text,
    headers: {
      'List-Unsubscribe': `<mailto:${REPLY_TO()}?subject=unsubscribe>`,
    },
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Sua página está pronta</title>
</head>
<body style="margin:0;padding:0;background:#fdf8f5;font-family:Georgia,'Times New Roman',serif;-webkit-text-size-adjust:100%">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f5;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #f0dde2;border-radius:14px;overflow:hidden;max-width:560px;width:100%;box-shadow:0 4px 20px rgba(192,39,74,0.06)">
        <tr><td style="padding:48px 40px;text-align:center">
          <div style="font-size:42px;margin:0 0 16px;line-height:1">🌹</div>
          <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;font-style:italic;color:#1e0a0f;margin:0 0 8px">${nome1} &amp; ${nome2}</h1>
          <p style="font-family:Georgia,serif;font-size:15px;color:#6a3840;font-style:italic;margin:0 0 32px">a página de vocês está no ar ♡</p>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px">
            <tr><td style="border-radius:8px;background:#c02744">
              <a href="${link}" target="_blank" style="display:inline-block;background:#c02744;color:#ffffff;text-decoration:none;padding:16px 38px;border-radius:8px;font-family:Georgia,serif;font-size:16px;font-style:italic;letter-spacing:0.02em">
                Ver minha página &rarr;
              </a>
            </td></tr>
          </table>

          <p style="font-family:Georgia,serif;font-size:12px;color:#a87880;font-style:italic;margin:0 0 6px">Link direto:</p>
          <p style="font-family:Georgia,serif;font-size:14px;margin:0 0 28px;word-break:break-all">
            <a href="${link}" target="_blank" style="color:#c02744;text-decoration:underline">${link}</a>
          </p>

          ${qrBuffer ? `
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px">
            <tr><td style="text-align:center">
              <p style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#a87880;margin:0 0 12px">QR Code para compartilhar</p>
              <img src="cid:qrcode-pagina" alt="QR Code da página" width="180" height="180" style="display:block;margin:0 auto;border:8px solid #ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(192,39,74,0.1)" />
              <p style="font-family:Georgia,serif;font-size:12px;color:#a87880;font-style:italic;margin:10px 0 0">imprima ou mostre na tela para a pessoa amada ♡</p>
            </td></tr>
          </table>
          ` : ''}

          <p style="font-family:Georgia,serif;font-size:13px;color:#6a3840;font-style:italic;line-height:1.7;margin:0">
            Guarde este link — é dele que você vai compartilhar<br>a surpresa com quem você ama. ♡
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;text-align:center;border-top:1px solid #f3e6db;background:#fdf8f5">
          <p style="font-family:Georgia,serif;font-size:11px;color:#a87880;margin:0">feito com amor · ${domainLabel}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    attachments: qrBuffer
      ? [{ filename: 'qrcode.png', content: qrBuffer, contentId: 'qrcode-pagina' }]
      : undefined,
  })
}
