-- Tabela principal de casais
CREATE TABLE casais (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text UNIQUE NOT NULL,
  token            text UNIQUE,
  nome1            text NOT NULL,
  nome2            text NOT NULL,
  apelido1         text,
  apelido2         text,
  data_inicio      date NOT NULL,
  frase_favorita   text,
  carta_para       text,
  carta_texto      text,
  carta_ass        text,
  musica_nome      text,
  musica_artista   text,
  spotify_track_id text,
  email_cliente    text,
  payment_id       text,
  status           text DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'publicado')),
  criado_em        timestamp DEFAULT now()
);

-- Tabela de fotos
CREATE TABLE fotos (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  casal_id  uuid REFERENCES casais(id) ON DELETE CASCADE,
  url       text NOT NULL,
  caption   text,
  ordem     int DEFAULT 0
);

-- Tabela de marcos (linha do tempo)
CREATE TABLE marcos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  casal_id   uuid REFERENCES casais(id) ON DELETE CASCADE,
  data_texto text,
  titulo     text NOT NULL,
  descricao  text,
  ordem      int DEFAULT 0
);

-- Índices úteis
CREATE INDEX idx_casais_slug   ON casais(slug);
CREATE INDEX idx_casais_token  ON casais(token);
CREATE INDEX idx_casais_status ON casais(status);
CREATE INDEX idx_fotos_casal   ON fotos(casal_id, ordem);
CREATE INDEX idx_marcos_casal  ON marcos(casal_id, ordem);

-- RLS (Row Level Security)
ALTER TABLE casais ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcos ENABLE ROW LEVEL SECURITY;

-- Políticas: leitura pública só para publicados
CREATE POLICY "casais_publicados_publicos"
  ON casais FOR SELECT
  USING (status = 'publicado');

-- Service role tem acesso total (backend usa service role key)
CREATE POLICY "service_role_casais"
  ON casais FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_fotos"
  ON fotos FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_marcos"
  ON marcos FOR ALL
  USING (auth.role() = 'service_role');

-- Leitura pública de fotos e marcos (só se casal for publicado)
CREATE POLICY "fotos_publicas"
  ON fotos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM casais
      WHERE casais.id = fotos.casal_id
        AND casais.status = 'publicado'
    )
  );

CREATE POLICY "marcos_publicos"
  ON marcos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM casais
      WHERE casais.id = marcos.casal_id
        AND casais.status = 'publicado'
    )
  );
