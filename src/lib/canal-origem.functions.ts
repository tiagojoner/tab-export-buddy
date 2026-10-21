//crm/src/lib/canal-origem.functions.ts

import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { lerChaveSessao } from "./auth.server";
import { getDb } from "./db.server";

export type StatusCanalOrigem = "ativas" | "excluidas" | "todas";

export type FiltrosCanalOrigemCRM = {
  canal: number | null;
  origem: number | null;
  usuario: number | null;
  setor: string;
  status: StatusCanalOrigem;
};

export type CanalOrigemRegistradoCRM = {
  id_registro: number;
  canal: string;
  origem: string;
  usuario_id: number;
  nome_usuario: string;
  setor_usuario: string;
  data_hora_inclusao: string;
  excluido: boolean;
  excluido_por_id: number | null;
  nome_usuario_exclusao: string | null;
  setor_usuario_exclusao: string | null;
  data_hora_exclusao: string | null;
};

export type PaginaCanalOrigemCRM = {
  rows: CanalOrigemRegistradoCRM[];
  count: number;
};

export type CanalOrigemExportacaoCRM = {
  id_registro: number;
  canal: string;
  origem: string;
  nome_usuario: string;
  setor_usuario: string;
  data_hora_inclusao: string;
};

type CanalOrigemRow = {
  id_registro: string;
  canal: string;
  origem: string;
  usuario_id: string;
  nome_usuario: string;
  setor_usuario: string;
  data_hora_inclusao: Date | string;
  excluido?: boolean;
  excluido_por_id?: string | null;
  nome_usuario_exclusao?: string | null;
  setor_usuario_exclusao?: string | null;
  data_hora_exclusao?: Date | string | null;
  total_registros: string;
};

type CanalOrigemExportacaoRow = {
  id_registro: string;
  canal: string;
  origem: string;
  nome_usuario: string;
  setor_usuario: string;
  data_hora_inclusao: Date | string;
};

function exigirChave(): string {
  const chave = lerChaveSessao();

  if (!chave) {
    throw new Error("Sessão expirada. Informe novamente sua chave de acesso.");
  }

  return chave;
}

function dataIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapCanalOrigem(row: CanalOrigemRow): CanalOrigemRegistradoCRM {
  return {
    id_registro: Number(row.id_registro),
    canal: row.canal,
    origem: row.origem,
    usuario_id: Number(row.usuario_id),
    nome_usuario: row.nome_usuario,
    setor_usuario: row.setor_usuario,
    data_hora_inclusao: dataIso(row.data_hora_inclusao) ?? "",
    excluido: Boolean(row.excluido),
    excluido_por_id:
      row.excluido_por_id == null ? null : Number(row.excluido_por_id),
    nome_usuario_exclusao: row.nome_usuario_exclusao ?? null,
    setor_usuario_exclusao: row.setor_usuario_exclusao ?? null,
    data_hora_exclusao: dataIso(row.data_hora_exclusao),
  };
}

export const inserirCanaisOrigensCRM = createServerFn({
  method: "POST",
})
  .validator((data: { canal: number; origens: number[] }) => data)
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();
    const origensUnicas = Array.from(new Set(data.origens));
    const arrayLiteral = `{${origensUnicas.join(",")}}`;

    const rows = await sql<{ inseridos: number; duplicados: number }[]>`
      SELECT inseridos, duplicados
      FROM crm.inserir_canais_origens(
        ${chave},
        ${data.canal},
        ${arrayLiteral}::bigint[]
      )
    `;

    return {
      inseridos: Number(rows[0]?.inseridos ?? 0),
      duplicados: Number(rows[0]?.duplicados ?? 0),
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
      rows: rows.map(mapCanalOrigem),
      count: rows.length > 0 ? Number(rows[0]?.total_registros ?? 0) : 0,
    } satisfies PaginaCanalOrigemCRM;
  });

export const listarTodosCanaisOrigensCRM = createServerFn({
  method: "POST",
})
  .validator(
    (data: {
      filtros: FiltrosCanalOrigemCRM;
      page: number;
      pageSize: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();
    const page = Math.max(data.page, 0);
    const pageSize = [25, 50, 100].includes(data.pageSize) ? data.pageSize : 50;
    const filtros = data.filtros;

    const rows = await sql<CanalOrigemRow[]>`
      SELECT
        id_registro::text AS id_registro,
        canal,
        origem,
        usuario_id::text AS usuario_id,
        nome_usuario,
        setor_usuario,
        data_hora_inclusao,
        excluido,
        excluido_por_id::text AS excluido_por_id,
        nome_usuario_exclusao,
        setor_usuario_exclusao,
        data_hora_exclusao,
        total_registros::text AS total_registros
      FROM crm.listar_canais_origens_todos_paginados(
        ${chave},
        ${filtros.canal},
        ${filtros.origem},
        ${filtros.usuario},
        ${filtros.setor || null},
        ${filtros.status},
        ${page + 1},
        ${pageSize}
      )
    `;

    return {
      rows: rows.map(mapCanalOrigem),
      count: rows.length > 0 ? Number(rows[0]?.total_registros ?? 0) : 0,
    } satisfies PaginaCanalOrigemCRM;
  });

export const exportarCanaisOrigensCRM = createServerFn({
  method: "POST",
})
  .validator((data: { filtros: FiltrosCanalOrigemCRM }) => data)
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();
    const filtros = data.filtros;

    const rows = await sql<CanalOrigemExportacaoRow[]>`
      SELECT
        id_registro::text AS id_registro,
        canal,
        origem,
        nome_usuario,
        setor_usuario,
        data_hora_inclusao
      FROM crm.exportar_canais_origens(
        ${chave},
        ${filtros.canal},
        ${filtros.origem},
        ${filtros.usuario},
        ${filtros.setor || null}
      )
    `;

    return rows.map((row) => ({
      id_registro: Number(row.id_registro),
      canal: row.canal,
      origem: row.origem,
      nome_usuario: row.nome_usuario,
      setor_usuario: row.setor_usuario,
      data_hora_inclusao: dataIso(row.data_hora_inclusao) ?? "",
    })) satisfies CanalOrigemExportacaoCRM[];
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
