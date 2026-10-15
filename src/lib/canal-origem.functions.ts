//crm/src/lib/canal-origem.functions.ts

import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { lerChaveSessao } from "./auth.server";
import { getDb } from "./db.server";

export type CanalOrigemRegistradoCRM = {
  id_registro: number;
  canal: string;
  origem: string;
  usuario_id: number;
  nome_usuario: string;
  setor_usuario: string;
  data_hora_inclusao: string;
};

export type PaginaCanalOrigemCRM = {
  rows: CanalOrigemRegistradoCRM[];
  count: number;
};

type CanalOrigemRow = {
  id_registro: string;
  canal: string;
  origem: string;
  usuario_id: string;
  nome_usuario: string;
  setor_usuario: string;
  data_hora_inclusao: Date | string;
  total_registros: string;
};

function exigirChave(): string {
  const chave = lerChaveSessao();

  if (!chave) {
    throw new Error("Sessão expirada. Informe novamente sua chave de acesso.");
  }

  return chave;
}

function dataIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export const inserirCanalOrigemCRM = createServerFn({
  method: "POST",
})
  .validator((data: { canal: number; origem: number }) => data)
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();

    const rows = await sql<{ status: string; id_registro: string }[]>`
      SELECT
        status,
        id_registro::text AS id_registro
      FROM crm.inserir_canal_origem(
        ${chave},
        ${data.canal},
        ${data.origem}
      )
    `;

    const row = rows[0];

    if (!row) {
      throw new Error("O PostgreSQL não retornou o resultado do cadastro.");
    }

    return {
      status: row.status === "duplicada" ? ("duplicada" as const) : ("criada" as const),
      id: Number(row.id_registro),
    };
  });

export const listarCanaisOrigensCRM = createServerFn({
  method: "POST",
})
  .validator((data: { page: number; pageSize: number }) => data)
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();
    const page = Math.max(data.page, 0);
    const pageSize = [25, 50, 100].includes(data.pageSize) ? data.pageSize : 25;

    const rows = await sql<CanalOrigemRow[]>`
      SELECT
        id_registro::text AS id_registro,
        canal,
        origem,
        usuario_id::text AS usuario_id,
        nome_usuario,
        setor_usuario,
        data_hora_inclusao,
        total_registros::text AS total_registros
      FROM crm.listar_canais_origens_paginados(
        ${chave},
        ${page + 1},
        ${pageSize}
      )
    `;

    return {
      rows: rows.map((row) => ({
        id_registro: Number(row.id_registro),
        canal: row.canal,
        origem: row.origem,
        usuario_id: Number(row.usuario_id),
        nome_usuario: row.nome_usuario,
        setor_usuario: row.setor_usuario,
        data_hora_inclusao: dataIso(row.data_hora_inclusao),
      })),
      count: rows.length > 0 ? Number(rows[0]?.total_registros ?? 0) : 0,
    } satisfies PaginaCanalOrigemCRM;
  });

export const excluirCanalOrigemCRM = createServerFn({
  method: "POST",
})
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();

    const rows = await sql<{ excluiu: boolean }[]>`
      SELECT crm.excluir_canal_origem(${chave}, ${data.id}) AS excluiu
    `;

    if (!rows[0]?.excluiu) {
      throw new Error(
        "Não foi possível excluir o registro. Ele pode já estar excluído ou não pertencer ao usuário atual.",
      );
    }

    return { ok: true };
  });
