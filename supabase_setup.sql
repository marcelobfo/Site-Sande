
-- 1. Configurações de Aparência (Home)
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS homeherotitlesize numeric DEFAULT 6.5;
UPDATE site_content SET homeherotitlesize = 6.5 WHERE id = 1 AND homeherotitlesize IS NULL;

-- 2. Suporte para Área de Membros (Tabela Products)

-- Adiciona coluna 'materials' para armazenar a lista de aulas (JSON Array)
ALTER TABLE products ADD COLUMN IF NOT EXISTS materials jsonb DEFAULT '[]'::jsonb;
UPDATE products SET materials = '[]'::jsonb WHERE materials IS NULL;

-- Adiciona coluna para link de download direto
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_url text;

-- 3. Controle de Rascunho/Publicado
-- Adiciona coluna status com padrão 'published' para não sumir com os itens atuais
ALTER TABLE products ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
