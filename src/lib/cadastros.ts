//crm/src/lib/cadastros.ts

import type { Opcao } from "@/components/SearchSelect";
import {
  carregarCadastrosCRM,
  type CadastrosCRM,
} from "./crm.functions";

export type Cadastros = CadastrosCRM;

export async function carregarCadastros(): Promise<Cadastros> {
  return await carregarCadastrosCRM();
}

/**
 * Regra permissiva:
 * grupo sem relacionamentos ativos libera tudo;
 * caso contrário, restringe aos pares cadastrados.
 */
export function permitidos(
  opts: Opcao[],
  rel: [number, number][],
  pai: number | null,
  side: 0 | 1 = 0,
): Opcao[] {
  if (rel.length === 0) {
    return opts;
  }

  if (pai == null) {
    return [];
  }

  const permitidosIds = new Set(
    rel
      .filter((item) => item[side] === pai)
      .map((item) => item[side === 0 ? 1 : 0]),
  );

  return opts.filter((opcao) => permitidosIds.has(opcao.id));
}
