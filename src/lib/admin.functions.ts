//crm/src/lib/admin.functions.ts

import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { lerChaveSessao } from "./auth.server";
import { getDb } from "./db.server";

export type CadastroAdminTipo =
  | "assunto"
  | "subassunto"
  | "detalhe_ocorrencia";

export type CadastroAdminItem = {
  id: number;
  nome: string;
  ativo: boolean;
  criadoPor: number;
  criadoPorNome: string;
  criadoEm: string;
  alteradoPor: number | null;
  alteradoPorNome: string | null;
  alteradoEm: string | null;
};

export type RelacionamentoAdminItem = {
  id: number;
  nome: string;
  criadoPor: number;
  criadoPorNome: string;
  criadoEm: string;
  alteradoPor: number | null;
  alteradoPorNome: string | null;
  alteradoEm: string | null;
};

type CadastroAdminRow = {
  id: string;
  nome: string;
  ativo: boolean;
  criado_por: string;
  criado_por_nome: string;
  criado_em: string;
  alterado_por: string | null;
  alterado_por_nome: string | null;
  alterado_em: string | null;
};

type RelacionamentoAdminRow = {
  id: string;
  nome: string;
  criado_por: string;
  criado_por_nome: string;
  criado_em: string;
  alterado_por: string | null;
  alterado_por_nome: string | null;
  alterado_em: string | null;
};

function exigirChave(): string {
  const chave = lerChaveSessao();

  if (!chave) {
    throw new Error("Sessão expirada. Informe novamente sua chave de acesso.");
  }

  return chave;
}

function mapCadastro(row: CadastroAdminRow): CadastroAdminItem {
  return {
    id: Number(row.id),
    nome: row.nome,
    ativo: Boolean(row.ativo),
    criadoPor: Number(row.criado_por),
    criadoPorNome: row.criado_por_nome,
    criadoEm: row.criado_em,
    alteradoPor: row.alterado_por == null ? null : Number(row.alterado_por),
    alteradoPorNome: row.alterado_por_nome,
    alteradoEm: row.alterado_em,
  };
}

function mapRelacionamento(row: RelacionamentoAdminRow): RelacionamentoAdminItem {
  return {
    id: Number(row.id),
    nome: row.nome,
    criadoPor: Number(row.criado_por),
    criadoPorNome: row.criado_por_nome,
    criadoEm: row.criado_em,
    alteradoPor: row.alterado_por == null ? null : Number(row.alterado_por),
    alteradoPorNome: row.alterado_por_nome,
    alteradoEm: row.alterado_em,
  };
}

export const carregarCadastrosAdminCRM = createServerFn({
  method: "GET",
}).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");

  const chave = exigirChave();
  const sql = getDb();

  const [assuntosRows, subassuntosRows, detalhesRows] = await Promise.all([
    sql<CadastroAdminRow[]>`
      SELECT
        id::text AS id,
        nome,
        ativo,
        criado_por::text AS criado_por,
        criado_por_nome,
        criado_em::text AS criado_em,
        alterado_por::text AS alterado_por,
        alterado_por_nome,
        alterado_em::text AS alterado_em
      FROM crm.listar_cadastro_admin(${chave}, 'assunto')
    `,
    sql<CadastroAdminRow[]>`
      SELECT
        id::text AS id,
        nome,
        ativo,
        criado_por::text AS criado_por,
        criado_por_nome,
        criado_em::text AS criado_em,
        alterado_por::text AS alterado_por,
        alterado_por_nome,
        alterado_em::text AS alterado_em
      FROM crm.listar_cadastro_admin(${chave}, 'subassunto')
    `,
    sql<CadastroAdminRow[]>`
      SELECT
        id::text AS id,
        nome,
        ativo,
        criado_por::text AS criado_por,
        criado_por_nome,
        criado_em::text AS criado_em,
        alterado_por::text AS alterado_por,
        alterado_por_nome,
        alterado_em::text AS alterado_em
      FROM crm.listar_cadastro_admin(${chave}, 'detalhe_ocorrencia')
    `,
  ]);

  return {
    assuntos: assuntosRows.map(mapCadastro),
    subassuntos: subassuntosRows.map(mapCadastro),
    detalhes: detalhesRows.map(mapCadastro),
  };
});

export const salvarCadastroAdminCRM = createServerFn({
  method: "POST",
})
  .validator(
    (data: {
      cadastro: CadastroAdminTipo;
      id: number | null;
      nome: string;
      ativo: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();

    try {
      const rows = await sql<{ id: string }[]>`
        SELECT crm.salvar_cadastro_admin(
          ${chave},
          ${data.cadastro},
          ${data.id},
          ${data.nome},
          ${data.ativo}
        )::text AS id
      `;

      const id = rows[0]?.id;

      if (!id) {
        throw new Error("O PostgreSQL não retornou o ID do cadastro.");
      }

      return { ok: true, id: Number(id) };
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : String(error ?? "");

      if (mensagem.includes("CADASTRO_DUPLICADO")) {
        return {
          ok: false as const,
          motivo: "duplicado" as const,
        };
      }

      throw error;
    }
  });

export const carregarRelacionamentosAssuntoAdminCRM = createServerFn({
  method: "POST",
})
  .validator((data: { assuntoId: number }) => data)
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();

    const rows = await sql<RelacionamentoAdminRow[]>`
      SELECT
        subassunto_id::text AS id,
        nome,
        criado_por::text AS criado_por,
        criado_por_nome,
        criado_em::text AS criado_em,
        alterado_por::text AS alterado_por,
        alterado_por_nome,
        alterado_em::text AS alterado_em
      FROM crm.listar_relacionamentos_assunto_admin(
        ${chave},
        ${data.assuntoId}
      )
    `;

    return rows.map(mapRelacionamento);
  });

export const salvarRelacionamentosAssuntoAdminCRM = createServerFn({
  method: "POST",
})
  .validator(
    (data: {
      assuntoId: number;
      subassuntoIds: number[];
    }) => data,
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();

    const arrayLiteral = `{${data.subassuntoIds.join(",")}}`;

    const rows = await sql<{ quantidade: number }[]>`
      SELECT crm.salvar_relacionamentos_assunto_admin(
        ${chave},
        ${data.assuntoId},
        ${arrayLiteral}::bigint[]
      ) AS quantidade
    `;

    return {
      ok: true,
      quantidade: Number(rows[0]?.quantidade ?? 0),
    };
  });

export const carregarRelacionamentosSubassuntoAdminCRM = createServerFn({
  method: "POST",
})
  .validator((data: { subassuntoId: number }) => data)
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();

    const rows = await sql<RelacionamentoAdminRow[]>`
      SELECT
        detalhe_ocorrencia_id::text AS id,
        nome,
        criado_por::text AS criado_por,
        criado_por_nome,
        criado_em::text AS criado_em,
        alterado_por::text AS alterado_por,
        alterado_por_nome,
        alterado_em::text AS alterado_em
      FROM crm.listar_relacionamentos_subassunto_admin(
        ${chave},
        ${data.subassuntoId}
      )
    `;

    return rows.map(mapRelacionamento);
  });

export const salvarRelacionamentosSubassuntoAdminCRM = createServerFn({
  method: "POST",
})
  .validator(
    (data: {
      subassuntoId: number;
      detalheIds: number[];
    }) => data,
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();
    const arrayLiteral = `{${data.detalheIds.join(",")}}`;

    const rows = await sql<{ quantidade: number }[]>`
      SELECT crm.salvar_relacionamentos_subassunto_admin(
        ${chave},
        ${data.subassuntoId},
        ${arrayLiteral}::bigint[]
      ) AS quantidade
    `;

    return {
      ok: true,
      quantidade: Number(rows[0]?.quantidade ?? 0),
    };
  });
