-- Criar bucket público para fotos dos casais
-- Execute isso no SQL Editor do Supabase após criar o bucket no painel

-- 1. Crie o bucket "fotos-casais" no painel: Storage > New bucket
--    Nome: fotos-casais
--    Public: SIM (marque como público)

-- 2. Política de upload (só via service role / backend)
-- Já coberta pelo service_role key no backend.

-- 3. Política de leitura pública (necessária mesmo em bucket público para URLs diretas)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-casais', 'fotos-casais', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir leitura pública
CREATE POLICY "fotos_casais_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos-casais');

-- Permitir upload via service role
CREATE POLICY "fotos_casais_service_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'fotos-casais' AND auth.role() = 'service_role');

CREATE POLICY "fotos_casais_service_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'fotos-casais' AND auth.role() = 'service_role');
