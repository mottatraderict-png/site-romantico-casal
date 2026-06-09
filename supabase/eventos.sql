-- Tabela de eventos de funil (analytics próprio do painel admin)
-- Execute no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS eventos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo       text NOT NULL,          -- 'page_view' | 'form_open' | 'checkout_reached'
  path       text,                   -- rota onde ocorreu
  referrer   text,                   -- de onde veio
  session_id text,                   -- id anônimo do visitante (localStorage)
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_tipo    ON eventos(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_created ON eventos(created_at);

-- RLS: somente service role (backend) acessa
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eventos_service_all"
  ON eventos FOR ALL
  USING (auth.role() = 'service_role');
