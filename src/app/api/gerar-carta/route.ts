import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY?.trim() })
  const { q1, q2, q3, tom, para, ass } = await req.json()

  const tomDescricao: Record<string, string> = {
    romantico: 'romântica e apaixonada, cheia de sentimento',
    poetico: 'poética e metafórica, com imagens bonitas',
    simples: 'simples e direta, como se fosse uma conversa verdadeira',
    intenso: 'intensa e emocionante, que faça a pessoa sentir tudo de uma vez',
  }

  const prompt = `Você é um escritor especialista em cartas de amor. Escreva uma carta de amor ${tomDescricao[tom] ?? tomDescricao.romantico}.

Informações sobre o relacionamento:
${q1 ? `- Sobre o casal: ${q1}` : ''}
${q2 ? `- Momento marcante: ${q2}` : ''}
${q3 ? `- O que admira: ${q3}` : ''}

Saudação da carta: "${para || 'Meu amor'}"
Assinatura: "${ass || 'Com amor'}"

Regras:
- Escreva APENAS o corpo da carta (sem a saudação e sem a assinatura — elas já estão separadas)
- Entre 120 e 200 palavras
- Em português brasileiro, tom natural, não exagerado
- Não use clichês vazios — use os detalhes específicos que foram contados
- Não use markdown, asteriscos ou formatação especial
- Termine de forma que dê vontade de ler de novo`

  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 600,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    })

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) controller.enqueue(encoder.encode(text))
          }
        } catch (e) {
          controller.enqueue(encoder.encode(`ERRO: ${String(e)}`))
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
    })
  } catch (e) {
    return new Response(`ERRO: ${String(e)}`, { status: 500, headers: { 'Content-Type': 'text/plain' } })
  }
}
