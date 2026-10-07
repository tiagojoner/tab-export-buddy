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

export type StatusTabulacao = "ativas" | "excluidas" | "todas";

export type FiltrosTabulacoesCRM = {
  canal: number | null;
  origem: number | null;
  tipo: number | null;
  assunto: number | null;
  subassunto: number | null;
  area: number | null;
  detalhe: number | null;
  criticidade: number | null;
  usuario: number | null;
  setor: string;
  status: StatusTabulacao;
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

export type PaginaTabulacoesCRM = {
  rows: TabulacaoCRM[];
  count: number;
};

export type UsuarioFiltroCRM = {
  id: number;
  nome: string;
  setor: string;
  ativo: boolean;
};

export type FiltrosUsuariosSetoresCRM = {
  usuarios: UsuarioFiltroCRM[];
  setores: string[];
};

export type TabulacaoExportacaoCRM = {
  id_registro: number;
  canal: string;
  origem: string;
  tipo_ocorrencia: string;
  assunto: string;
  subassunto: string | null;
  area_interesse: string;
  detalhe_ocorrencia: string | null;
  criticidade: string;
  nome_usuario: string;
  setor_usuario: string;
  data_hora_inclusao: string;
};

export type DashboardGrupoCRM =
  | "resumo"
  | "setor"
  | "usuario"
  | "canal"
  | "origem"
  | "tipo_ocorrencia"
  | "assunto"
  | "criticidade"
  | "area_interesse";

export type DashboardItemCRM = {
  grupo: DashboardGrupoCRM;
  rotulo: string;
  quantidade: number;
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
  usuario_id: string;
  nome_usuario: string;
  setor_usuario: string;
  data_hora_inclusao: Date | string;
  excluido: boolean;
  excluido_por_id: string | null;
  nome_usuario_exclusao: string | null;
  setor_usuario_exclusao: string | null;
  data_hora_exclusao: Date | string | null;
  total_registros: string;
};

type UsuarioFiltroRow = {
  usuario_id: string;
  nome_completo: string;
  setor: string;
  ativo: boolean;
};

type TabulacaoExportacaoRow = {
  id_registro: string;
  canal: string;
  origem: string;
  tipo_ocorrencia: string;
  assunto: string;
  subassunto: string | null;
  area_interesse: string;
  detalhe_ocorrencia: string | null;
  criticidade: string;
  nome_usuario: string;
  setor_usuario: string;
  data_hora_inclusao: Date | string;
};

type DashboardRow = {
  grupo: DashboardGrupoCRM;
  rotulo: string;
  quantidade: string;
};

const filtrosVazios: FiltrosTabulacoesCRM = {
  canal: null,
  origem: null,
  tipo: null,
  assunto: null,
  subassunto: null,
  area: null,
  detalhe: null,
  criticidade: null,
  usuario: null,
  setor: "",
  status: "ativas",
};

function exigirChave(): string {
  const chave = lerChaveSessao();

  if (!chave) {
    throw new Error("Sessão expirada. Informe novamente sua chave de acesso.");
  }

  return chave;
}

function dataIso(value: Date | string | null): string | null {
  if (value == null) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : String(value);
}

function mapTabulacao(row: TabulacaoRow): TabulacaoCRM {
  return {
    id_registro: Number(row.id_registro),
    canal: row.canal,
    origem: row.origem,
    tipo_ocorrencia: row.tipo_ocorrencia,
    assunto: row.assunto,
    subassunto: row.subassunto,
    area_interesse: row.area_interesse,
    detalhe_ocorrencia: row.detalhe_ocorrencia,
    criticidade: row.criticidade,
    usuario_id: Number(row.usuario_id),
    nome_usuario: row.nome_usuario,
    setor_usuario: row.setor_usuario,
    data_hora_inclusao: dataIso(row.data_hora_inclusao) ?? "",
    excluido: Boolean(row.excluido),
    excluido_por_id:
      row.excluido_por_id == null ? null : Number(row.excluido_por_id),
    nome_usuario_exclusao: row.nome_usuario_exclusao,
    setor_usuario_exclusao: row.setor_usuario_exclusao,
    data_hora_exclusao: dataIso(row.data_hora_exclusao),
  };
}

function mapExportacao(row: TabulacaoExportacaoRow): TabulacaoExportacaoCRM {
  return {
    id_registro: Number(row.id_registro),
    canal: row.canal,
    origem: row.origem,
    tipo_ocorrencia: row.tipo_ocorrencia,
    assunto: row.assunto,
    subassunto: row.subassunto,
    area_interesse: row.area_interesse,
    detalhe_ocorrencia: row.detalhe_ocorrencia,
    criticidade: row.criticidade,
    nome_usuario: row.nome_usuario,
    setor_usuario: row.setor_usuario,
    data_hora_inclusao: dataIso(row.data_hora_inclusao) ?? "",
  };
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
    SELECT id::text AS id, nome
    FROM crm.listar_opcoes(${chave}, ${cadastro})
  `;

  return rows.map((row) => ({
    id: Number(row.id),
    nome: row.nome,
  }));
}

async function buscarPagina(
  chave: string,
  params: {
    somenteMinhas: boolean;
    filtros?: Partial<FiltrosTabulacoesCRM>;
    page?: number;
    pageSize?: number;
  },
): Promise<PaginaTabulacoesCRM> {
  const sql = getDb();
  const filtros = { ...filtrosVazios, ...(params.filtros ?? {}) };
  const page = Math.max(params.page ?? 0, 0);
  const requestedPageSize = params.pageSize ?? 50;
  const pageSize = [25, 50, 100].includes(requestedPageSize)
    ? requestedPageSize
    : 50;

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
    FROM crm.listar_tabulacoes_paginadas(
      ${chave},
      ${params.somenteMinhas},
      ${filtros.canal},
      ${filtros.origem},
      ${filtros.tipo},
      ${filtros.assunto},
      ${filtros.subassunto},
      ${filtros.area},
      ${filtros.detalhe},
      ${filtros.criticidade},
      ${filtros.usuario},
      ${filtros.setor || null},
      ${filtros.status},
      ${page + 1},
      ${pageSize}
    )
  `;

  return {
    rows: rows.map(mapTabulacao),
    count: rows.length > 0 ? Number(rows[0].total_registros) : 0,
  };
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
      SELECT tipo, pai_id::text AS pai_id, filho_id::text AS filho_id
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
    const par: [number, number] = [Number(row.pai_id), Number(row.filho_id)];

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
    .sort((a, b) => a.ordem - b.ordem || sortNome(a, b));

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
      criticidade: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();

    const rows = await sql<{ id: string }[]>`
      SELECT crm.inserir_tabulacao(
        ${chave},
        ${data.canal},
        ${data.origem},
        ${data.tipo},
        ${data.assunto},
        ${data.subassunto},
        ${data.area},
        ${data.detalhe},
        ${data.criticidade}
      )::text AS id
    `;

    const id = rows[0]?.id;

    if (!id) {
      throw new Error("O PostgreSQL não retornou o ID da tabulação.");
    }

    return { id: Number(id) };
  });

export const listarRecentesCRM = createServerFn({
  method: "GET",
}).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");

  const pagina = await buscarPagina(exigirChave(), {
    somenteMinhas: true,
    filtros: { status: "ativas" },
    page: 0,
    pageSize: 25,
  });

  return {
    count: pagina.count,
    rows: pagina.rows.slice(0, 5),
  } satisfies PaginaTabulacoesCRM;
});

export const listarTabulacoesCRM = createServerFn({
  method: "POST",
})
  .validator(
    (data: {
      somenteMinhas: boolean;
      filtros: FiltrosTabulacoesCRM;
      page: number;
      pageSize: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    return await buscarPagina(exigirChave(), data);
  });

export const listarUsuariosSetoresCRM = createServerFn({
  method: "GET",
}).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");

  const chave = exigirChave();
  const sql = getDb();

  const rows = await sql<UsuarioFiltroRow[]>`
    SELECT
      usuario_id::text AS usuario_id,
      nome_completo,
      setor,
      ativo
    FROM crm.listar_usuarios_setores(${chave})
  `;

  const usuarios: UsuarioFiltroCRM[] = rows.map((row) => ({
    id: Number(row.usuario_id),
    nome: row.nome_completo,
    setor: row.setor,
    ativo: Boolean(row.ativo),
  }));

  const setores = Array.from(new Set(usuarios.map((item) => item.setor))).sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );

  return {
    usuarios,
    setores,
  } satisfies FiltrosUsuariosSetoresCRM;
});

export const excluirTabulacaoCRM = createServerFn({
  method: "POST",
})
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();

    const rows = await sql<{ excluiu: boolean }[]>`
      SELECT crm.excluir_tabulacao(${chave}, ${data.id}) AS excluiu
    `;

    if (!rows[0]?.excluiu) {
      throw new Error(
        "Não foi possível excluir o registro. Ele pode já estar excluído ou não pertencer ao usuário atual.",
      );
    }

    return { ok: true };
  });

export const exportarTabulacoesCRM = createServerFn({
  method: "POST",
})
  .validator(
    (data: {
      somenteMinhas: boolean;
      filtros: FiltrosTabulacoesCRM;
    }) => data,
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();
    const filtros = data.filtros;

    const rows = await sql<TabulacaoExportacaoRow[]>`
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
        nome_usuario,
        setor_usuario,
        data_hora_inclusao
      FROM crm.exportar_tabulacoes(
        ${chave},
        ${data.somenteMinhas},
        ${filtros.canal},
        ${filtros.origem},
        ${filtros.tipo},
        ${filtros.assunto},
        ${filtros.subassunto},
        ${filtros.area},
        ${filtros.detalhe},
        ${filtros.criticidade},
        ${filtros.usuario},
        ${filtros.setor || null}
      )
    `;

    return rows.map(mapExportacao);
  });

export const carregarDashboardCRM = createServerFn({
  method: "GET",
}).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");

  const chave = exigirChave();
  const sql = getDb();

  const rows = await sql<DashboardRow[]>`
    SELECT grupo, rotulo, quantidade::text AS quantidade
    FROM crm.dashboard_tabulacoes(${chave})
  `;

  return rows.map(
    (row) =>
      ({
        grupo: row.grupo,
        rotulo: row.rotulo,
        quantidade: Number(row.quantidade),
      }) satisfies DashboardItemCRM,
  );
});
