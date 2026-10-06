
-- Cadastros
CREATE TABLE public.canal (id bigint generated always as identity primary key, nome text not null, ativo boolean not null default true);
CREATE TABLE public.origem (id bigint generated always as identity primary key, nome text not null, ativo boolean not null default true);
CREATE TABLE public.tipo_ocorrencia (id bigint generated always as identity primary key, nome text not null, ativo boolean not null default true);
CREATE TABLE public.assunto (id bigint generated always as identity primary key, nome text not null, ativo boolean not null default true);
CREATE TABLE public.subassunto (id bigint generated always as identity primary key, nome text not null, ativo boolean not null default true);
CREATE TABLE public.area_interesse (id bigint generated always as identity primary key, nome text not null, ativo boolean not null default true);
CREATE TABLE public.detalhe_ocorrencia (id bigint generated always as identity primary key, nome text not null, ativo boolean not null default true);
CREATE TABLE public.criticidade (id bigint generated always as identity primary key, nome text not null, ordem int not null default 0, ativo boolean not null default true);

-- Relacionamentos
CREATE TABLE public.canal_origem (id bigint generated always as identity primary key, canal_id bigint not null references public.canal(id), origem_id bigint not null references public.origem(id), ativo boolean not null default true);
CREATE TABLE public.assunto_tipo_ocorrencia (id bigint generated always as identity primary key, assunto_id bigint not null references public.assunto(id), tipo_ocorrencia_id bigint not null references public.tipo_ocorrencia(id), ativo boolean not null default true);
CREATE TABLE public.assunto_subassunto (id bigint generated always as identity primary key, assunto_id bigint not null references public.assunto(id), subassunto_id bigint not null references public.subassunto(id), ativo boolean not null default true);
CREATE TABLE public.assunto_area_interesse (id bigint generated always as identity primary key, assunto_id bigint not null references public.assunto(id), area_interesse_id bigint not null references public.area_interesse(id), ativo boolean not null default true);
CREATE TABLE public.subassunto_detalhe (id bigint generated always as identity primary key, subassunto_id bigint not null references public.subassunto(id), detalhe_ocorrencia_id bigint not null references public.detalhe_ocorrencia(id), ativo boolean not null default true);
CREATE UNIQUE INDEX ux_canal_origem ON public.canal_origem(canal_id, origem_id) WHERE ativo;
CREATE UNIQUE INDEX ux_assunto_tipo ON public.assunto_tipo_ocorrencia(assunto_id, tipo_ocorrencia_id) WHERE ativo;
CREATE UNIQUE INDEX ux_assunto_sub ON public.assunto_subassunto(assunto_id, subassunto_id) WHERE ativo;
CREATE UNIQUE INDEX ux_assunto_area ON public.assunto_area_interesse(assunto_id, area_interesse_id) WHERE ativo;
CREATE UNIQUE INDEX ux_sub_det ON public.subassunto_detalhe(subassunto_id, detalhe_ocorrencia_id) WHERE ativo;

-- Regras de criticidade
CREATE TABLE public.regra_criticidade (id bigint generated always as identity primary key, tipo_ocorrencia_id bigint not null references public.tipo_ocorrencia(id), assunto_id bigint not null references public.assunto(id), subassunto_id bigint references public.subassunto(id), criticidade_id bigint not null references public.criticidade(id), ativo boolean not null default true);
CREATE UNIQUE INDEX ux_regra ON public.regra_criticidade(tipo_ocorrencia_id, assunto_id, coalesce(subassunto_id, 0)) WHERE ativo;

-- Registros
CREATE TABLE public.tabulacoes_registradas (
  canal_id bigint not null references public.canal(id),
  origem_id bigint not null references public.origem(id),
  tipo_ocorrencia_id bigint not null references public.tipo_ocorrencia(id),
  assunto_id bigint not null references public.assunto(id),
  subassunto_id bigint references public.subassunto(id),
  area_interesse_id bigint not null references public.area_interesse(id),
  detalhe_ocorrencia_id bigint references public.detalhe_ocorrencia(id),
  criticidade_id bigint not null references public.criticidade(id),
  id_registro bigint generated always as identity primary key,
  data_hora_inclusao timestamptz not null default now(),
  nome_usuario text not null check (char_length(nome_usuario) between 1 and 150),
  setor_usuario text not null check (char_length(setor_usuario) between 1 and 150)
);
CREATE INDEX ix_tab_usuario ON public.tabulacoes_registradas(nome_usuario, setor_usuario);
CREATE INDEX ix_tab_data ON public.tabulacoes_registradas(data_hora_inclusao desc);

-- Grants + RLS (somente leitura pública; escrita via funções controladas)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['canal','origem','tipo_ocorrencia','assunto','subassunto','area_interesse','detalhe_ocorrencia','criticidade','canal_origem','assunto_tipo_ocorrencia','assunto_subassunto','assunto_area_interesse','subassunto_detalhe','regra_criticidade','tabulacoes_registradas']
  LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "leitura publica" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
  END LOOP;
END $$;

-- View com nomes descritivos
CREATE VIEW public.vw_tabulacoes WITH (security_invoker = true) AS
SELECT t.id_registro, t.data_hora_inclusao, t.nome_usuario, t.setor_usuario,
  t.canal_id, c.nome AS canal, t.origem_id, o.nome AS origem,
  t.tipo_ocorrencia_id, tp.nome AS tipo_ocorrencia, t.assunto_id, a.nome AS assunto,
  t.subassunto_id, s.nome AS subassunto, t.area_interesse_id, ai.nome AS area_interesse,
  t.detalhe_ocorrencia_id, d.nome AS detalhe_ocorrencia, t.criticidade_id, cr.nome AS criticidade, cr.ordem AS criticidade_ordem
FROM public.tabulacoes_registradas t
JOIN public.canal c ON c.id = t.canal_id
JOIN public.origem o ON o.id = t.origem_id
JOIN public.tipo_ocorrencia tp ON tp.id = t.tipo_ocorrencia_id
JOIN public.assunto a ON a.id = t.assunto_id
LEFT JOIN public.subassunto s ON s.id = t.subassunto_id
JOIN public.area_interesse ai ON ai.id = t.area_interesse_id
LEFT JOIN public.detalhe_ocorrencia d ON d.id = t.detalhe_ocorrencia_id
JOIN public.criticidade cr ON cr.id = t.criticidade_id;
GRANT SELECT ON public.vw_tabulacoes TO anon, authenticated, service_role;

-- Cálculo de criticidade
CREATE OR REPLACE FUNCTION public.calcular_criticidade(p_tipo bigint, p_assunto bigint, p_sub bigint)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    (SELECT r.criticidade_id FROM regra_criticidade r JOIN criticidade c ON c.id = r.criticidade_id AND c.ativo
      WHERE r.ativo AND r.tipo_ocorrencia_id = p_tipo AND r.assunto_id = p_assunto
        AND r.subassunto_id IS NOT DISTINCT FROM p_sub LIMIT 1),
    (SELECT id FROM criticidade WHERE nome = 'Normal' ORDER BY ativo DESC LIMIT 1)
  );
$$;

-- Inserção controlada
CREATE OR REPLACE FUNCTION public.inserir_tabulacao(
  p_nome text, p_setor text, p_canal bigint, p_origem bigint, p_tipo bigint, p_assunto bigint,
  p_sub bigint, p_area bigint, p_detalhe bigint)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_crit bigint; v_id bigint;
BEGIN
  p_nome := btrim(coalesce(p_nome,'')); p_setor := btrim(coalesce(p_setor,''));
  IF p_nome = '' OR p_setor = '' THEN RAISE EXCEPTION 'Identificação obrigatória'; END IF;
  IF char_length(p_nome) > 150 OR char_length(p_setor) > 150 THEN RAISE EXCEPTION 'Identificação muito longa'; END IF;
  IF p_canal IS NULL OR p_origem IS NULL OR p_tipo IS NULL OR p_assunto IS NULL OR p_area IS NULL THEN
    RAISE EXCEPTION 'Campos obrigatórios não preenchidos'; END IF;
  IF NOT EXISTS (SELECT 1 FROM canal WHERE id=p_canal AND ativo) OR NOT EXISTS (SELECT 1 FROM origem WHERE id=p_origem AND ativo)
     OR NOT EXISTS (SELECT 1 FROM tipo_ocorrencia WHERE id=p_tipo AND ativo) OR NOT EXISTS (SELECT 1 FROM assunto WHERE id=p_assunto AND ativo)
     OR NOT EXISTS (SELECT 1 FROM area_interesse WHERE id=p_area AND ativo)
     OR (p_sub IS NOT NULL AND NOT EXISTS (SELECT 1 FROM subassunto WHERE id=p_sub AND ativo))
     OR (p_detalhe IS NOT NULL AND NOT EXISTS (SELECT 1 FROM detalhe_ocorrencia WHERE id=p_detalhe AND ativo)) THEN
    RAISE EXCEPTION 'Cadastro inválido ou inativo'; END IF;
  IF p_detalhe IS NOT NULL AND p_sub IS NULL AND EXISTS (SELECT 1 FROM subassunto_detalhe WHERE ativo) THEN
    RAISE EXCEPTION 'Detalhe exige Subassunto'; END IF;
  IF EXISTS (SELECT 1 FROM canal_origem WHERE ativo) AND NOT EXISTS (SELECT 1 FROM canal_origem WHERE ativo AND canal_id=p_canal AND origem_id=p_origem) THEN
    RAISE EXCEPTION 'Origem incompatível com o Canal'; END IF;
  IF EXISTS (SELECT 1 FROM assunto_tipo_ocorrencia WHERE ativo) AND NOT EXISTS (SELECT 1 FROM assunto_tipo_ocorrencia WHERE ativo AND assunto_id=p_assunto AND tipo_ocorrencia_id=p_tipo) THEN
    RAISE EXCEPTION 'Assunto incompatível com o Tipo de Ocorrência'; END IF;
  IF p_sub IS NOT NULL AND EXISTS (SELECT 1 FROM assunto_subassunto WHERE ativo) AND NOT EXISTS (SELECT 1 FROM assunto_subassunto WHERE ativo AND assunto_id=p_assunto AND subassunto_id=p_sub) THEN
    RAISE EXCEPTION 'Subassunto incompatível com o Assunto'; END IF;
  IF EXISTS (SELECT 1 FROM assunto_area_interesse WHERE ativo) AND NOT EXISTS (SELECT 1 FROM assunto_area_interesse WHERE ativo AND assunto_id=p_assunto AND area_interesse_id=p_area) THEN
    RAISE EXCEPTION 'Área de Interesse incompatível com o Assunto'; END IF;
  IF p_detalhe IS NOT NULL AND p_sub IS NOT NULL AND EXISTS (SELECT 1 FROM subassunto_detalhe WHERE ativo) AND NOT EXISTS (SELECT 1 FROM subassunto_detalhe WHERE ativo AND subassunto_id=p_sub AND detalhe_ocorrencia_id=p_detalhe) THEN
    RAISE EXCEPTION 'Detalhe incompatível com o Subassunto'; END IF;
  v_crit := calcular_criticidade(p_tipo, p_assunto, p_sub);
  IF v_crit IS NULL THEN RAISE EXCEPTION 'Criticidade Normal não cadastrada'; END IF;
  INSERT INTO tabulacoes_registradas(canal_id, origem_id, tipo_ocorrencia_id, assunto_id, subassunto_id, area_interesse_id, detalhe_ocorrencia_id, criticidade_id, nome_usuario, setor_usuario)
  VALUES (p_canal, p_origem, p_tipo, p_assunto, p_sub, p_area, p_detalhe, v_crit, p_nome, p_setor) RETURNING id_registro INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.excluir_tabulacao(p_id bigint)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM tabulacoes_registradas WHERE id_registro = p_id;
$$;

REVOKE ALL ON FUNCTION public.calcular_criticidade(bigint,bigint,bigint) FROM public;
REVOKE ALL ON FUNCTION public.inserir_tabulacao(text,text,bigint,bigint,bigint,bigint,bigint,bigint,bigint) FROM public;
REVOKE ALL ON FUNCTION public.excluir_tabulacao(bigint) FROM public;
GRANT EXECUTE ON FUNCTION public.calcular_criticidade(bigint,bigint,bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.inserir_tabulacao(text,text,bigint,bigint,bigint,bigint,bigint,bigint,bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.excluir_tabulacao(bigint) TO anon, authenticated;

-- Dados mínimos para teste
INSERT INTO public.criticidade(nome, ordem) VALUES ('Urgência / Emergência',0),('Alta',1),('Normal',2),('Baixa',3);
INSERT INTO public.canal(nome) VALUES ('Telefone'),('E-mail'),('Chat');
INSERT INTO public.origem(nome) VALUES ('Beneficiário'),('Prestador');
INSERT INTO public.tipo_ocorrencia(nome) VALUES ('Reclamação'),('Solicitação'),('Informação');
INSERT INTO public.assunto(nome) VALUES ('Autorização'),('Financeiro'),('Cadastro');
INSERT INTO public.subassunto(nome) VALUES ('Prazo'),('Segunda via'),('Atualização de dados');
INSERT INTO public.area_interesse(nome) VALUES ('Atendimento'),('Faturamento');
INSERT INTO public.detalhe_ocorrencia(nome) VALUES ('Primeiro contato'),('Reincidência');
