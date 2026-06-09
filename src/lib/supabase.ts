import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Instâncias singleton — criadas na primeira chamada, não no import
let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabaseAdmin
}

// Proxies que delegam ao singleton — compatíveis com o código existente
// e seguros para build (não chamam createClient no nível do módulo)
// Nota: bind(client) é essencial para que métodos como .from() funcionem corretamente
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    const value = (client as unknown as Record<string, unknown>)[prop as string]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    if (typeof value === 'function') return (value as Function).bind(client)
    return value
  },
})

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    const value = (client as unknown as Record<string, unknown>)[prop as string]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    if (typeof value === 'function') return (value as Function).bind(client)
    return value
  },
})
