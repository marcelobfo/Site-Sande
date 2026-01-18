
-- COPIE E COLE ESTE COMANDO NO SQL EDITOR DO SEU SUPABASE PARA CORRIGIR O ERRO

-- Adiciona a coluna de tamanho da fonte caso ela não exista
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS homeherotitlesize numeric DEFAULT 6.5;

-- Atualiza a linha existente (id=1) para ter o valor padrão, caso esteja nulo
UPDATE site_content SET homeherotitlesize = 6.5 WHERE id = 1 AND homeherotitlesize IS NULL;
