import { supabase } from "@/integrations/supabase/client";
import type { Opcao } from "@/components/SearchSelect";

/* eslint-disable @typescript-eslint/no-explicit-any */
async function fetchAll(table: string, cols: string, activeOnly = true): Promise<any[]> {
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    let q = (supabase.from as any)(table).select(cols).range(from, from + 999);
    if (activeOnly) q = q.eq("ativo", true);
    const { data, error } = await q;
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const sortNome = (a: Opcao, b: Opcao) => a.nome.localeCompare(b.nome, "pt-BR");

export type Cadastros = {
  canal: Opcao[]; origem: Opcao[]; tipo: Opcao[]; assunto: Opcao[]; subassunto: Opcao[];
  area: Opcao[]; detalhe: Opcao[]; criticidade: (Opcao & { ordem: number })[];
  rel: {
    canalOrigem: [number, number][]; assuntoTipo: [number, number][]; assuntoSub: [number, number][];
    assuntoArea: [number, number][]; subDetalhe: [number, number][];
  };
};

export async function carregarCadastros(): Promise<Cadastros> {
  const [canal, origem, tipo, assunto, subassunto, area, detalhe, criticidade, co, at, as, aa, sd] =
    await Promise.all([
      fetchAll("canal", "id,nome"), fetchAll("origem", "id,nome"), fetchAll("tipo_ocorrencia", "id,nome"),
      fetchAll("assunto", "id,nome"), fetchAll("subassunto", "id,nome"), fetchAll("area_interesse", "id,nome"),
      fetchAll("detalhe_ocorrencia", "id,nome"), fetchAll("criticidade", "id,nome,ordem"),
      fetchAll("canal_origem", "canal_id,origem_id"), fetchAll("assunto_tipo_ocorrencia", "assunto_id,tipo_ocorrencia_id"),
      fetchAll("assunto_subassunto", "assunto_id,subassunto_id"), fetchAll("assunto_area_interesse", "assunto_id,area_interesse_id"),
      fetchAll("subassunto_detalhe", "subassunto_id,detalhe_ocorrencia_id"),
    ]);
  return {
    canal: canal.sort(sortNome), origem: origem.sort(sortNome), tipo: tipo.sort(sortNome),
    assunto: assunto.sort(sortNome), subassunto: subassunto.sort(sortNome), area: area.sort(sortNome),
    detalhe: detalhe.sort(sortNome), criticidade: criticidade.sort((a, b) => a.ordem - b.ordem),
    rel: {
      canalOrigem: co.map((r) => [r.canal_id, r.origem_id]),
      assuntoTipo: at.map((r) => [r.assunto_id, r.tipo_ocorrencia_id]),
      assuntoSub: as.map((r) => [r.assunto_id, r.subassunto_id]),
      assuntoArea: aa.map((r) => [r.assunto_id, r.area_interesse_id]),
      subDetalhe: sd.map((r) => [r.subassunto_id, r.detalhe_ocorrencia_id]),
    },
  };
}

/** Regra permissiva: grupo sem relacionamentos ativos libera tudo; caso contrário, restringe aos pares cadastrados. */
export function permitidos(opts: Opcao[], rel: [number, number][], pai: number | null, side: 0 | 1 = 0): Opcao[] {
  if (rel.length === 0) return opts;
  if (pai == null) return [];
  const ok = new Set(rel.filter((r) => r[side] === pai).map((r) => r[side === 0 ? 1 : 0]));
  return opts.filter((o) => ok.has(o.id));
}
