//crm/src/lib/crm.functions.ts

import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { lerChaveSessao } from "./auth.server";
import { getDb } from "./db.server";

export type OpcaoCRM = {
  id: number;
  nome: string;
};

export type CriticidadeCRM = OpcaoCRM & {
  ordem: number;
};

export type CadastrosCRM = {
  canal: OpcaoCRM[];
  origem: OpcaoCRM[];
  tipo: OpcaoCRM[];
  assunto: OpcaoCRM[];
  subassunto: OpcaoCRM[];
  area: OpcaoCRM[];
  detalhe: OpcaoCRM[];
  criticidade: CriticidadeCRM[];
  rel: {
    canalOrigem: [number, number][];
    assuntoTipo: [number, number][];
    assuntoSub: [number, number][];
    assuntoArea: [number, number][];
    subDetalhe: [number, number][];
  };
};

export type TabulacaoCRM = {
  id_registro: number;
  canal: string;
  origem: string;
  tipo_ocorrencia: string;
  assunto: string;
  subassunto: string | null;
  area_interesse: string;
  detalhe_ocorrencia: string | null;
  criticidade: string;
  data_hora_inclusao: string;
  nome_usuario: string;
  setor_usuario: string;
};

type OpcaoRow = {
  id: string;
  nome: string;
};

type RelacaoRow = {
  tipo: string;
  pai_id: string;
  filho_id: string;
};

type TabulacaoRow = {
  id_registro: string;
  canal: string;
  origem: string;
  tipo_ocorrencia: string;
  assunto: string;
  subassunto: string | null;
  area_interesse: string;
  detalhe_ocorrencia: string | null;
  criticidade: string;
  data_hora_inclusao: Date | string;
  nome_usuario: string;
  setor: string;
};

function exigirChave(): string {
  const chave = lerChaveSessao();

  if (!chave) {
    throw new Error("Sessão expirada. Informe novamente sua chave de acesso.");
  }

  return chave;
}

function ordemCriticidade(nome: string): number {
  const valor = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (valor.includes("urgencia") || valor.includes("emergencia")) {
    return 0;
  }

  if (valor === "alta") {
    return 1;
  }

  if (valor === "normal") {
    return 2;
  }

  if (valor === "baixa") {
    return 3;
  }

  return 99;
}

async function listarOpcoes(
  chave: string,
  cadastro: string,
): Promise<OpcaoCRM[]> {
  const sql = getDb();

  const rows = await sql<OpcaoRow[]>`
    SELECT
      id::text AS id,
      nome
    FROM crm.listar_opcoes(
      ${chave},
      ${cadastro}
    )
  `;

  return rows.map((row) => ({
    id: Number(row.id),
    nome: row.nome,
  }));
}

async function buscarTabulacoes(
  chave: string,
  somenteMinhas: boolean,
): Promise<TabulacaoCRM[]> {
  const sql = getDb();

  const rows = await sql<TabulacaoRow[]>`
    SELECT
      id_registro::text AS id_registro,
      canal,
      origem,
      tipo_ocorrencia,
      assunto,
      subassunto,
      area_interesse,
      detalhe_ocorrencia,
      criticidade,
      data_hora_inclusao,
      nome_usuario,
      setor
    FROM crm.listar_tabulacoes(
      ${chave},
      ${somenteMinhas}
    )
  `;

  return rows.map((row) => ({
    id_registro: Number(row.id_registro),
    canal: row.canal,
    origem: row.origem,
    tipo_ocorrencia: row.tipo_ocorrencia,
    assunto: row.assunto,
    subassunto: row.subassunto,
    area_interesse: row.area_interesse,
    detalhe_ocorrencia: row.detalhe_ocorrencia,
    criticidade: row.criticidade,
    data_hora_inclusao:
      row.data_hora_inclusao instanceof Date
        ? row.data_hora_inclusao.toISOString()
        : String(row.data_hora_inclusao),
    nome_usuario: row.nome_usuario,
    setor_usuario: row.setor,
  }));
}

export const carregarCadastrosCRM = createServerFn({
  method: "GET",
}).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");

  const chave = exigirChave();
  const sql = getDb();

  const [
    canal,
    origem,
    tipo,
    assunto,
    subassunto,
    area,
    detalhe,
    criticidadeBase,
    relacionamentos,
  ] = await Promise.all([
    listarOpcoes(chave, "canal"),
    listarOpcoes(chave, "origem"),
    listarOpcoes(chave, "tipo_ocorrencia"),
    listarOpcoes(chave, "assunto"),
    listarOpcoes(chave, "subassunto"),
    listarOpcoes(chave, "area_interesse"),
    listarOpcoes(chave, "detalhe_ocorrencia"),
    listarOpcoes(chave, "criticidade"),

    sql<RelacaoRow[]>`
      SELECT
        tipo,
        pai_id::text AS pai_id,
        filho_id::text AS filho_id
      FROM crm.listar_relacionamentos(${chave})
    `,
  ]);

  const rel = {
    canalOrigem: [] as [number, number][],
    assuntoTipo: [] as [number, number][],
    assuntoSub: [] as [number, number][],
    assuntoArea: [] as [number, number][],
    subDetalhe: [] as [number, number][],
  };

  for (const row of relacionamentos) {
    const par: [number, number] = [
      Number(row.pai_id),
      Number(row.filho_id),
    ];

    if (row.tipo === "canal_origem") {
      rel.canalOrigem.push(par);
    } else if (row.tipo === "assunto_tipo") {
      rel.assuntoTipo.push(par);
    } else if (row.tipo === "assunto_sub") {
      rel.assuntoSub.push(par);
    } else if (row.tipo === "assunto_area") {
      rel.assuntoArea.push(par);
    } else if (row.tipo === "sub_detalhe") {
      rel.subDetalhe.push(par);
    }
  }

  const sortNome = (a: OpcaoCRM, b: OpcaoCRM) =>
    a.nome.localeCompare(b.nome, "pt-BR");

  const criticidade: CriticidadeCRM[] = criticidadeBase
    .map((item) => ({
      ...item,
      ordem: ordemCriticidade(item.nome),
    }))
    .sort((a, b) => a.ordem - b.ordem);

  return {
    canal: canal.sort(sortNome),
    origem: origem.sort(sortNome),
    tipo: tipo.sort(sortNome),
    assunto: assunto.sort(sortNome),
    subassunto: subassunto.sort(sortNome),
    area: area.sort(sortNome),
    detalhe: detalhe.sort(sortNome),
    criticidade,
    rel,
  } satisfies CadastrosCRM;
});

export const calcularCriticidadeCRM = createServerFn({
  method: "POST",
})
  .validator(
    (data: {
      tipo: number;
      assunto: number;
      subassunto: number | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    exigirChave();

    const sql = getDb();

    const rows = await sql<{ id: string | null }[]>`
      SELECT
        crm.calcular_criticidade(
          ${data.tipo},
          ${data.assunto},
          ${data.subassunto}
        )::text AS id
    `;

    const id = rows[0]?.id;

    return id ? Number(id) : null;
  });

export const listarRecentesCRM = createServerFn({
  method: "GET",
}).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");

  const chave = exigirChave();

  const rows = await buscarTabulacoes(chave, true);

  rows.sort((a, b) => {
    const dataA = new Date(a.data_hora_inclusao).getTime();
    const dataB = new Date(b.data_hora_inclusao).getTime();

    if (dataA !== dataB) {
      return dataB - dataA;
    }

    return b.id_registro - a.id_registro;
  });

  return {
    count: rows.length,
    rows: rows.slice(0, 5),
  };
});

export const inserirTabulacaoCRM = createServerFn({
  method: "POST",
})
  .validator(
    (data: {
      canal: number;
      origem: number;
      tipo: number;
      assunto: number;
      subassunto: number | null;
      area: number;
      detalhe: number | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();

    const rows = await sql<{ id: string }[]>`
      SELECT
        crm.inserir_tabulacao(
          ${chave},
          ${data.canal},
          ${data.origem},
          ${data.tipo},
          ${data.assunto},
          ${data.subassunto},
          ${data.area},
          ${data.detalhe}
        )::text AS id
    `;

    const id = rows[0]?.id;

    if (!id) {
      throw new Error("O PostgreSQL não retornou o ID da tabulação.");
    }

    return {
      id: Number(id),
    };
  });
