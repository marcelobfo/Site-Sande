
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
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_video_type text DEFAULT 'youtube'; -- Novo campo

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

-- CORREÇÃO CRÍTICA: Garante que as colunas existam mesmo se a tabela já foi criada antes
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

-- 6. Estrutura da Comunidade Específica do Produto
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

-- CORREÇÃO CRÍTICA: Garante que as colunas existam na tabela de mensagens do produto
ALTER TABLE product_forum_messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;

-- 7. Blog Posts (Criação da Tabela e Inserção de Conteúdo)
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

-- Habilitar Realtime
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

-- 8. Inserção de Artigos do Blog (Conteúdo Rico)
DELETE FROM blog_posts; -- Limpa posts antigos para reinserir os novos corretamente

INSERT INTO blog_posts (title, category, author, image_url, publish_date, content)
VALUES
(
  '3 Metodologias Ativas para aplicar amanhã na sua aula',
  'Metodologias Ativas',
  'Sande Almeida',
  'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=1000&auto=format&fit=crop',
  CURRENT_DATE,
  '# Transforme sua aula sem complicação

Professora, eu sei que às vezes a rotina escolar nos consome e a ideia de "inovar" parece sinônimo de "trabalho extra". Mas a verdade sobre as **Metodologias Ativas** é que elas existem para *facilitar* a sua vida e engajar seus alunos, não para te sobrecarregar.

Hoje, trago 3 estratégias simples que você pode aplicar já na sua próxima aula, sem precisar de tecnologias complexas.

## 1. Rotação por Estações (Adaptada)

Você não precisa de tablets em todas as mesas. O conceito aqui é **movimento**.
*   **Estação 1:** Leitura de um texto curto (pode ser o livro didático).
*   **Estação 2:** Discussão em dupla sobre uma pergunta chave.
*   **Estação 3:** Criação de um desenho ou mapa mental sobre o tema.

Divida a turma, marque 15 minutos e faça-os rodar. O simples fato de mudar de lugar e de estímulo já desperta o cérebro!

## 2. Sala de Aula Invertida (Flipped Classroom)

Ao invés de gastar 40 minutos explicando a teoria no quadro, peça que eles assistam a um vídeo curto (pode ser seu ou do YouTube) em casa.
Na sala, use o tempo para **resolver problemas** ou fazer um debate.
*   *Dica de Protagonista:* Se eles não assistirem em casa, exiba o vídeo nos primeiros 10 minutos e use o restante para a prática. Não desista da metodologia!

## 3. Aprendizagem Baseada em Problemas (PBL)

Comece a aula com uma pergunta intrigante, não com a resposta.
Exemplo em História: Ao invés de "Hoje vamos falar sobre a Revolução Industrial", tente: "O que aconteceria com a sua vida se as máquinas parassem de funcionar hoje?".
Conecte o conteúdo com a realidade deles.

### Conclusão

Ser protagonista é testar, errar e ajustar. Escolha uma dessas dicas e aplique amanhã. Depois me conte lá no Instagram como foi!

*Com carinho,*
*Sande.*'
),
(
  'O Segredo do Canva: Materiais Pedagógicos Irresistíveis',
  'Dicas Práticas',
  'Sande Almeida',
  'https://images.unsplash.com/photo-1626785774573-4b799312c95d?q=80&w=1000&auto=format&fit=crop',
  CURRENT_DATE - 2,
  '# Por que o design importa na educação?

Muitas professoras me perguntam: *"Sande, preciso mesmo me preocupar se a folhinha está bonita?"*
E a minha resposta é sempre: **Sim, porque a estética comunica cuidado.**

Quando você entrega um material bem formatado, visualmente limpo e atrativo, você está dizendo ao aluno (e à família dele) que aquela aula foi planejada com carinho e profissionalismo.

## O Canva é o seu melhor amigo

Você não precisa ser designer gráfica. O Canva oferece modelos prontos que salvam horas do nosso planejamento.

### 3 Elementos Essenciais em um Bom Material

1.  **Hierarquia Visual:** O título deve ser maior que o texto. Use negrito para destacar palavras-chave. Isso ajuda alunos com dificuldade de leitura a escanear o conteúdo.
2.  **Respiro (Espaço em Branco):** Não entupa a folha de texto. O cérebro precisa de pausas visuais para processar a informação. Menos é mais!
3.  **Imagens com Propósito:** Não use imagens apenas para "enfeitar". Use ícones e ilustrações que ajudem a explicar o conceito.

> "A organização do material reflete a organização do pensamento."

No **Clube Professora Protagonista**, temos um módulo inteiro onde ensino o passo a passo de como criar jogos, flashcards e provas incríveis em minutos. Se você quer elevar o nível dos seus materiais, o Canva é a ferramenta.'
),
(
  'Engajamento: Como conquistar a atenção da "Geração TikTok"',
  'Inovação',
  'Sande Almeida',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000&auto=format&fit=crop',
  CURRENT_DATE - 5,
  '# A batalha pela atenção

Seus alunos parecem estar em outro planeta? A culpa não é só deles, e nem sua. Estamos competindo com algoritmos bilionários desenhados para viciar. Mas nós temos algo que o TikTok não tem: **conexão humana real.**

Para engajar a geração atual, precisamos falar a língua deles, sem perder a essência pedagógica.

## Estratégias de Conexão

### 1. Gamificação (Sem precisar de computador)
Transforme a revisão da prova em um "Passa ou Repassa". Crie um sistema de pontuação e recompensas simples (como 5 minutos a mais de intervalo). O espírito competitivo saudável acorda qualquer turma.

### 2. Micro-learning (Aprendizado em Pílulas)
A atenção deles é curta. Fragmente sua aula em blocos de 10 a 15 minutos.
*   10 min: Explicação
*   10 min: Vídeo/Música
*   15 min: Atividade Mão na Massa
*   10 min: Fechamento

### 3. Traga o mundo deles para dentro
Eles gostam de um jogo específico? Use os personagens nos problemas de matemática. Estão ouvindo uma música viral? Analise a letra na aula de português. Mostre que você se importa com o universo deles.

### O Aluno Protagonista
Quando o aluno sente que a aula também "pertence" a ele, o comportamento muda. Dê cargos, responsabilidades e voz ativa.

Vamos juntas transformar essa sala de aula em um espaço de vida!'
);

-- 9. Correção e Vinculação de Produtos
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

UPDATE leads SET product_id = '9e30a57d-14a0-4386-8a5f-0f8a85f40000' WHERE product_id = 'CLUBE-ANUAL';
