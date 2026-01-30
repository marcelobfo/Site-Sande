
-- 1. Configurações de Aparência (Home)
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS homeherotitlesize numeric DEFAULT 6.5;
UPDATE site_content SET homeherotitlesize = 6.5 WHERE id = 1 AND homeherotitlesize IS NULL;

-- 2. Suporte para Área de Membros
ALTER TABLE products ADD COLUMN IF NOT EXISTS materials jsonb DEFAULT '[]'::jsonb;
UPDATE products SET materials = '[]'::jsonb WHERE materials IS NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
ALTER TABLE products ADD COLUMN IF NOT EXISTS payment_active boolean DEFAULT true;

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

-- 5. Estrutura do Fórum (Comunidade)

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

-- Tabela de Enquetes (Polls) - 1 por tópico (opcional)
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

-- Habilitar Realtime para o Fórum
ALTER PUBLICATION supabase_realtime ADD TABLE forum_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_poll_votes;

-- 6. Criar Produto Principal (Clube) para Vinculação Correta
-- ID: 9e30a57d-14a0-4386-8a5f-0f8a85f40000 (UUID válido para evitar erro de tipo)
INSERT INTO products (id, title, description, price, category, image_url, status, payment_active)
VALUES (
  '9e30a57d-14a0-4386-8a5f-0f8a85f40000',
  'Clube Professora Protagonista',
  'Acesso anual completo a todos os materiais, aulas de edição e suporte exclusivo. Transforme sua prática pedagógica com recursos ilimitados.',
  397.00,
  'Assinatura',
  'https://metodoprotagonizar.com.br/wp-content/uploads/2024/05/Banner-Clube.png',
  'published',
  true
) ON CONFLICT (id) DO NOTHING;
