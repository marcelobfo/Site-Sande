
-- 1. Configurações de Aparência (Home)
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS homeherotitlesize numeric DEFAULT 6.5;
UPDATE site_content SET homeherotitlesize = 6.5 WHERE id = 1 AND homeherotitlesize IS NULL;

-- 1.1 Correção de Campos Faltantes (Clube e Geral)
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS clubedescription text;
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS clubetitle text DEFAULT 'Clube Professora Protagonista';

-- 2. Suporte para Área de Membros
ALTER TABLE products ADD COLUMN IF NOT EXISTS materials jsonb DEFAULT '[]'::jsonb;
UPDATE products SET materials = '[]'::jsonb WHERE materials IS NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
ALTER TABLE products ADD COLUMN IF NOT EXISTS payment_active boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS forum_active boolean DEFAULT false;

-- 3. Vídeo em Destaque do Produto (Instruções)
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_video_url text;

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

-- 5. Estrutura do Fórum (Comunidade Global)

-- Tabela de Tópicos
CREATE TABLE IF NOT EXISTS forum_topics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  category text DEFAULT 'Geral',
  created_at timestamptz DEFAULT now(),
  likes int DEFAULT 0
);

-- Tabela de Mensagens (Posts)
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid REFERENCES forum_topics(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_admin boolean DEFAULT false
);

-- Tabela de Enquetes (Polls)
CREATE TABLE IF NOT EXISTS forum_polls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid REFERENCES forum_topics(id) ON DELETE CASCADE,
  question text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Opções da Enquete
CREATE TABLE IF NOT EXISTS forum_poll_options (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id uuid REFERENCES forum_polls(id) ON DELETE CASCADE,
  option_text text NOT NULL
);

-- Votos da Enquete
CREATE TABLE IF NOT EXISTS forum_poll_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id uuid REFERENCES forum_polls(id) ON DELETE CASCADE,
  option_id uuid REFERENCES forum_poll_options(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  UNIQUE(poll_id, user_email) -- Um voto por pessoa por enquete
);

-- 6. Estrutura da Comunidade Específica do Produto (Novo)
CREATE TABLE IF NOT EXISTS product_forum_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id text NOT NULL, -- Ligado ao ID do produto
  user_email text NOT NULL,
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  reactions jsonb DEFAULT '{}'::jsonb, -- { "emoji": ["email1", "email2"] }
  reply_to uuid REFERENCES product_forum_messages(id)
);

-- Habilitar Realtime (Safe Execution)
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
END $$;

-- 7. Criar Produto Principal (Clube) para Vinculação Correta
INSERT INTO products (id, title, description, price, category, image_url, status, payment_active, forum_active)
VALUES (
  '9e30a57d-14a0-4386-8a5f-0f8a85f40000',
  'Clube Professora Protagonista',
  'Acesso anual completo a todos os materiais, aulas de edição e suporte exclusivo. Transforme sua prática pedagógica com recursos ilimitados.',
  397.00,
  'Assinatura',
  'https://metodoprotagonizar.com.br/wp-content/uploads/2024/05/Banner-Clube.png',
  'published',
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- 8. Correção de Dados Legados
UPDATE leads 
SET product_id = '9e30a57d-14a0-4386-8a5f-0f8a85f40000' 
WHERE product_id = 'CLUBE-ANUAL';

-- 9. Correção Específica para Marcelo (Outlook)
-- Atualiza qualquer compra que tenha "Clube" no nome ou ID antigo para o ID correto e Status Pago
UPDATE leads
SET 
  product_id = '9e30a57d-14a0-4386-8a5f-0f8a85f40000',
  status = 'Pago'
WHERE 
  email ILIKE 'marcelobfo@outlook%' 
  AND (product_id = 'CLUBE-ANUAL' OR product_name ILIKE '%Clube%');
