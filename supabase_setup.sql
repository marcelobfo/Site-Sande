
-- 1. Configurações de Aparência (Home)
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS homeherotitlesize numeric DEFAULT 6.5;
UPDATE site_content SET homeherotitlesize = 6.5 WHERE id = 1 AND homeherotitlesize IS NULL;

-- 1.1 Correção de Campos Faltantes (Clube e Geral)
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS clubedescription text;
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS clubetitle text DEFAULT 'Clube Professora Protagonista';

-- 1.2 Novos Campos para o Banner do Clube (Preço Riscado, Benefícios, Vendas e Link)
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS clubeoldprice numeric;
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS clubefeatures text DEFAULT E'Acesso a Todos os Materiais (+300)\nNovidades Toda Semana\nAulas de Edição no Canva';
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS clubesalesactive boolean DEFAULT true;
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS clubelink text;

-- 2. Suporte para Área de Membros
ALTER TABLE products ADD COLUMN IF NOT EXISTS materials jsonb DEFAULT '[]'::jsonb;
UPDATE products SET materials = '[]'::jsonb WHERE materials IS NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
ALTER TABLE products ADD COLUMN IF NOT EXISTS payment_active boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS forum_active boolean DEFAULT false;

-- 3. Vídeo em Destaque do Produto (Instruções)
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_video_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_video_type text DEFAULT 'youtube';

-- 4. Função de Segurança para Gerenciar Admins
CREATE OR REPLACE FUNCTION set_admin_role(target_email text, is_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
    UPDATE auth.users
    SET raw_user_meta_data = 
      CASE 
        WHEN is_admin THEN jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"')
        ELSE jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"user"')
      END
    WHERE email = target_email;
  ELSE
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
END;
$$;

-- 5. Estrutura do Fórum
CREATE TABLE IF NOT EXISTS forum_topics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  category text DEFAULT 'Geral',
  created_at timestamptz DEFAULT now(),
  likes int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid REFERENCES forum_topics(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_admin boolean DEFAULT false,
  reactions jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS forum_polls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid REFERENCES forum_topics(id) ON DELETE CASCADE,
  question text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_poll_options (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id uuid REFERENCES forum_polls(id) ON DELETE CASCADE,
  option_text text NOT NULL
);

CREATE TABLE IF NOT EXISTS forum_poll_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id uuid REFERENCES forum_polls(id) ON DELETE CASCADE,
  option_id uuid REFERENCES forum_poll_options(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  UNIQUE(poll_id, user_email)
);

CREATE TABLE IF NOT EXISTS product_forum_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id text NOT NULL,
  user_email text NOT NULL,
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  reactions jsonb DEFAULT '{}'::jsonb,
  reply_to uuid REFERENCES product_forum_messages(id)
);

ALTER TABLE product_forum_messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  author text NOT NULL,
  category text NOT NULL,
  image_url text,
  publish_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- 6. Habilitar Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'forum_topics') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_topics;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'forum_posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'forum_poll_votes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_poll_votes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'product_forum_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE product_forum_messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'blog_posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE blog_posts;
  END IF;
END $$;

-- 7. Tabela de Leads e Correções
CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  name text,
  email text,
  status text DEFAULT 'Novo'
);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS value numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cpf_cnpj text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address_number text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS complement text;

-- Habilitar Realtime especificamente para Leads
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'leads') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leads;
  END IF;
END $$;

-- 8. CORREÇÃO DE LEADS FANTASMAS (Normaliza status)
UPDATE leads SET status = 'Novo' WHERE status IS NULL OR status = '';
UPDATE leads SET status = 'Aguardando Pagamento' WHERE status ILIKE '%pending%' OR status ILIKE '%aguardando%';
UPDATE leads SET status = 'Pago' WHERE status ILIKE '%paid%' OR status ILIKE '%pago%';
