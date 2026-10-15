//crm/src/lib/cadastros.ts

import {
  carregarCadastrosCRM,
  type CadastrosCRM,
} from "./crm.functions";

export type Cadastros = CadastrosCRM;

export async function carregarCadastros(): Promise<Cadastros> {
  return await carregarCadastrosCRM();
}
