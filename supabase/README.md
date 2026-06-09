# Supabase Setup

## Passo a passo

### 1. Criar projeto no Supabase
- Acesse https://supabase.com e crie uma conta
- Clique em "New project"
- Escolha nome, senha e região (South America - São Paulo se disponível)
- Aguarde o projeto inicializar (~2 min)

### 2. Criar as tabelas
- Vá em **SQL Editor** no menu lateral
- Cole e execute o conteúdo de `schema.sql`

### 3. Criar o Storage bucket
- Vá em **Storage** > **New bucket**
- Nome: `fotos-casais`
- Marque como **Public**
- Confirme
- No SQL Editor, execute `storage.sql`

### 4. Pegar as chaves
- Vá em **Project Settings** > **API**
- Copie:
  - `Project URL` → SUPABASE_URL
  - `anon public` → SUPABASE_ANON_KEY
  - `service_role secret` → SUPABASE_SERVICE_ROLE_KEY

### 5. Configurar .env.local
- Copie `.env.local.example` para `.env.local`
- Preencha as variáveis com os valores copiados
