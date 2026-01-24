
-- 1. Configurações de Aparência (Home)
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS homeherotitlesize numeric DEFAULT 6.5;
UPDATE site_content SET homeherotitlesize = 6.5 WHERE id = 1 AND homeherotitlesize IS NULL;

-- 2. Suporte para Área de Membros (Tabela Products)

-- Adiciona coluna 'materials' para armazenar a lista de aulas (JSON Array)
-- Tipo JSONB permite guardar [{id, title, type, url}, ...] sem criar outra tabela
ALTER TABLE products ADD COLUMN IF NOT EXISTS materials jsonb DEFAULT '[]'::jsonb;

-- Garante que produtos antigos não fiquem com 'materials' nulo (evita erro no frontend)
UPDATE products SET materials = '[]'::jsonb WHERE materials IS NULL;

-- Adiciona coluna para link de download direto (Backup ou Pack de Arquivos)
ALTER TABLE products ADD COLUMN IF NOT EXISTS download_url text;

-- 3. (Opcional) Segurança - Garante que todos podem ler os produtos (caso RLS esteja ativo)
-- CREATE POLICY "Public products are viewable by everyone" ON products FOR SELECT USING (true);
