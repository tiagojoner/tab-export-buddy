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
};

export type StatusTabulacao = "ativas" | "excluidas" | "todas";

export type FiltrosTabulacoesCRM = {
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

export type DashboardResumoAdesaoCRM = {
  classificacoesAtivas: number;
  canaisOrigensAtivos: number;
  minhasClassificacoes: number;
  meusCanaisOrigens: number;
  usuariosAtivos: number;
  usuariosParticipantesClassificacao: number;
  usuariosSemClassificacao: number;
  usuariosParticipantesCanalOrigem: number;
  usuariosSemCanalOrigem: number;
  setoresAtivos: number;
  setoresParticipantesClassificacao: number;
  setoresSemClassificacao: number;
  setoresParticipantesCanalOrigem: number;
  setoresSemCanalOrigem: number;
};

export type DashboardUsuarioAdesaoCRM = {
  usuarioId: number;
  nomeUsuario: string;
  setor: string;
  classificacoesAtivas: number;
  canaisOrigensAtivos: number;
  ultimaClassificacao: string | null;
  ultimoCanalOrigem: string | null;
};

export type DashboardSetorAdesaoCRM = {
  setor: string;
  totalUsuarios: number;
  usuariosParticipantesClassificacao: number;
  usuariosSemClassificacao: number;
  usuariosParticipantesCanalOrigem: number;
  usuariosSemCanalOrigem: number;
  totalClassificacoes: number;
  totalCanaisOrigens: number;
  ultimaClassificacao: string | null;
  ultimoCanalOrigem: string | null;
};

export type DashboardAdesaoCRM = {
  resumo: DashboardResumoAdesaoCRM;
  usuarios: DashboardUsuarioAdesaoCRM[];
  setores: DashboardSetorAdesaoCRM[];
};

type OpcaoRow = {
  id: string;
  nome: string;
};

type TabulacaoRow = {
  id_registro: string;
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

type DashboardResumoAdesaoRow = {
  classificacoes_ativas: string;
  canais_origens_ativos: string;
  minhas_classificacoes: string;
  meus_canais_origens: string;
  usuarios_ativos: string;
  usuarios_participantes_classificacao: string;
  usuarios_sem_classificacao: string;
  usuarios_participantes_canal_origem: string;
  usuarios_sem_canal_origem: string;
  setores_ativos: string;
  setores_participantes_classificacao: string;
  setores_sem_classificacao: string;
  setores_participantes_canal_origem: string;
  setores_sem_canal_origem: string;
};

type DashboardUsuarioAdesaoRow = {
  usuario_id: string;
  nome_usuario: string;
  setor: string;
  classificacoes_ativas: string;
  canais_origens_ativos: string;
  ultima_classificacao: Date | string | null;
  ultimo_canal_origem: Date | string | null;
};

type DashboardSetorAdesaoRow = {
  setor: string;
  total_usuarios: string;
  usuarios_participantes_classificacao: string;
  usuarios_sem_classificacao: string;
  usuarios_participantes_canal_origem: string;
  usuarios_sem_canal_origem: string;
  total_classificacoes: string;
  total_canais_origens: string;
  ultima_classificacao: Date | string | null;
  ultimo_canal_origem: Date | string | null;
};

const filtrosVazios: FiltrosTabulacoesCRM = {
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
      tipo_ocorrencia,
      area_interesse,
      assunto,
      subassunto,
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
    FROM crm.listar_classificacoes_paginadas(
      ${chave},
      ${params.somenteMinhas},
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
    count: rows.length > 0 ? Number(rows[0]?.total_registros ?? 0) : 0,
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
  ] = await Promise.all([
    listarOpcoes(chave, "canal"),
    listarOpcoes(chave, "origem"),
    listarOpcoes(chave, "tipo_ocorrencia"),
    listarOpcoes(chave, "assunto"),
    listarOpcoes(chave, "subassunto"),
    listarOpcoes(chave, "area_interesse"),
    listarOpcoes(chave, "detalhe_ocorrencia"),
    listarOpcoes(chave, "criticidade"),
  ]);

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
  } satisfies CadastrosCRM;
});

export const listarSubassuntosRelacionadosCRM = createServerFn({
  method: "POST",
})
  .validator((data: { assuntoId: number }) => data)
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();

    const rows = await sql<OpcaoRow[]>`
      SELECT id::text AS id, nome
      FROM crm.listar_subassuntos_relacionados(
        ${chave},
        ${data.assuntoId}
      )
    `;

    return rows.map((row) => ({
      id: Number(row.id),
      nome: row.nome,
    })) satisfies OpcaoCRM[];
  });

export type CombinacaoClassificacaoCRM = {
  subassuntoId: number | null;
  detalheId: number | null;
};

export type DetalhePorSubassuntoCRM = {
  subassuntoId: number;
  detalheId: number;
  nome: string;
};

export const listarDetalhesPorSubassuntosCRM = createServerFn({
  method: "POST",
})
  .validator((data: { subassuntoIds: number[] }) => data)
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();
    const ids = Array.from(new Set(data.subassuntoIds));

    if (ids.length === 0) return [] satisfies DetalhePorSubassuntoCRM[];

    const arrayLiteral = `{${ids.join(",")}}`;
    const rows = await sql<{
      subassunto_id: string;
      detalhe_ocorrencia_id: string;
      nome: string;
    }[]>`
      SELECT
        subassunto_id::text AS subassunto_id,
        detalhe_ocorrencia_id::text AS detalhe_ocorrencia_id,
        nome
      FROM crm.listar_detalhes_por_subassuntos(
        ${chave},
        ${arrayLiteral}::bigint[]
      )
    `;

    return rows.map((row) => ({
      subassuntoId: Number(row.subassunto_id),
      detalheId: Number(row.detalhe_ocorrencia_id),
      nome: row.nome,
    })) satisfies DetalhePorSubassuntoCRM[];
  });

export const inserirClassificacoesCRM = createServerFn({
  method: "POST",
})
  .validator(
    (data: {
      tipo: number;
      assunto: number;
      combinacoes: CombinacaoClassificacaoCRM[];
      area: number;
      criticidade: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();
    const combinacoes = Array.from(
      new Map(
        data.combinacoes.map((item) => [
          `${item.subassuntoId ?? "null"}:${item.detalheId ?? "null"}`,
          item,
        ]),
      ).values(),
    );

    if (combinacoes.length === 0) {
      throw new Error("Nenhuma combinação de Subassunto/Detalhe foi informada.");
    }

    // A função de banco V3 recebe dois arrays posicionais. O valor 0 representa
    // NULL e é convertido no PostgreSQL. Isso evita depender da serialização
    // JSON entre o client/server function e o banco.
    const subassuntosLiteral = `{${combinacoes
      .map((item) => item.subassuntoId ?? 0)
      .join(",")}}`;
    const detalhesLiteral = `{${combinacoes
      .map((item) => item.detalheId ?? 0)
      .join(",")}}`;

    const rows = await sql<{ inseridos: number; duplicados: number }[]>`
      SELECT inseridos, duplicados
      FROM crm.inserir_classificacoes_v3(
        ${chave},
        ${data.tipo},
        ${data.assunto},
        ${subassuntosLiteral}::bigint[],
        ${detalhesLiteral}::bigint[],
        ${data.area},
        ${data.criticidade}
      )
    `;

    return {
      inseridos: Number(rows[0]?.inseridos ?? 0),
      duplicados: Number(rows[0]?.duplicados ?? 0),
    };
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

export const atualizarCriticidadeTabulacaoCRM = createServerFn({
  method: "POST",
})
  .validator((data: { id: number; criticidade: number }) => data)
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = exigirChave();
    const sql = getDb();

    const rows = await sql<{ atualizou: boolean }[]>`
      SELECT crm.atualizar_criticidade_tabulacao(
        ${chave},
        ${data.id},
        ${data.criticidade}
      ) AS atualizou
    `;

    if (!rows[0]?.atualizou) {
      throw new Error(
        "Não foi possível editar a criticidade. O registro pode estar excluído ou não pertencer ao usuário atual.",
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
        tipo_ocorrencia,
        area_interesse,
        assunto,
        subassunto,
        detalhe_ocorrencia,
        criticidade,
        nome_usuario,
        setor_usuario,
        data_hora_inclusao
      FROM crm.exportar_classificacoes(
        ${chave},
        ${data.somenteMinhas},
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

export const carregarDashboardAdesaoCRM = createServerFn({
  method: "GET",
}).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");

  const chave = exigirChave();
  const sql = getDb();

  const [resumoRows, usuariosRows, setoresRows] = await Promise.all([
    sql<DashboardResumoAdesaoRow[]>`
      SELECT
        classificacoes_ativas::text AS classificacoes_ativas,
        canais_origens_ativos::text AS canais_origens_ativos,
        minhas_classificacoes::text AS minhas_classificacoes,
        meus_canais_origens::text AS meus_canais_origens,
        usuarios_ativos::text AS usuarios_ativos,
        usuarios_participantes_classificacao::text AS usuarios_participantes_classificacao,
        usuarios_sem_classificacao::text AS usuarios_sem_classificacao,
        usuarios_participantes_canal_origem::text AS usuarios_participantes_canal_origem,
        usuarios_sem_canal_origem::text AS usuarios_sem_canal_origem,
        setores_ativos::text AS setores_ativos,
        setores_participantes_classificacao::text AS setores_participantes_classificacao,
        setores_sem_classificacao::text AS setores_sem_classificacao,
        setores_participantes_canal_origem::text AS setores_participantes_canal_origem,
        setores_sem_canal_origem::text AS setores_sem_canal_origem
      FROM crm.dashboard_adesao_v2_resumo(${chave})
    `,
    sql<DashboardUsuarioAdesaoRow[]>`
      SELECT
        usuario_id::text AS usuario_id,
        nome_usuario,
        setor,
        classificacoes_ativas::text AS classificacoes_ativas,
        canais_origens_ativos::text AS canais_origens_ativos,
        ultima_classificacao,
        ultimo_canal_origem
      FROM crm.dashboard_adesao_v2_usuarios(${chave})
    `,
    sql<DashboardSetorAdesaoRow[]>`
      SELECT
        setor,
        total_usuarios::text AS total_usuarios,
        usuarios_participantes_classificacao::text AS usuarios_participantes_classificacao,
        usuarios_sem_classificacao::text AS usuarios_sem_classificacao,
        usuarios_participantes_canal_origem::text AS usuarios_participantes_canal_origem,
        usuarios_sem_canal_origem::text AS usuarios_sem_canal_origem,
        total_classificacoes::text AS total_classificacoes,
        total_canais_origens::text AS total_canais_origens,
        ultima_classificacao,
        ultimo_canal_origem
      FROM crm.dashboard_adesao_v2_setores(${chave})
    `,
  ]);

  const resumoRow = resumoRows[0];

  const resumo: DashboardResumoAdesaoCRM = {
    classificacoesAtivas: Number(resumoRow?.classificacoes_ativas ?? 0),
    canaisOrigensAtivos: Number(resumoRow?.canais_origens_ativos ?? 0),
    minhasClassificacoes: Number(resumoRow?.minhas_classificacoes ?? 0),
    meusCanaisOrigens: Number(resumoRow?.meus_canais_origens ?? 0),
    usuariosAtivos: Number(resumoRow?.usuarios_ativos ?? 0),
    usuariosParticipantesClassificacao: Number(
      resumoRow?.usuarios_participantes_classificacao ?? 0,
    ),
    usuariosSemClassificacao: Number(resumoRow?.usuarios_sem_classificacao ?? 0),
    usuariosParticipantesCanalOrigem: Number(
      resumoRow?.usuarios_participantes_canal_origem ?? 0,
    ),
    usuariosSemCanalOrigem: Number(resumoRow?.usuarios_sem_canal_origem ?? 0),
    setoresAtivos: Number(resumoRow?.setores_ativos ?? 0),
    setoresParticipantesClassificacao: Number(
      resumoRow?.setores_participantes_classificacao ?? 0,
    ),
    setoresSemClassificacao: Number(resumoRow?.setores_sem_classificacao ?? 0),
    setoresParticipantesCanalOrigem: Number(
      resumoRow?.setores_participantes_canal_origem ?? 0,
    ),
    setoresSemCanalOrigem: Number(resumoRow?.setores_sem_canal_origem ?? 0),
  };

  const usuarios: DashboardUsuarioAdesaoCRM[] = usuariosRows.map((row) => ({
    usuarioId: Number(row.usuario_id),
    nomeUsuario: row.nome_usuario,
    setor: row.setor,
    classificacoesAtivas: Number(row.classificacoes_ativas),
    canaisOrigensAtivos: Number(row.canais_origens_ativos),
    ultimaClassificacao: dataIso(row.ultima_classificacao),
    ultimoCanalOrigem: dataIso(row.ultimo_canal_origem),
  }));

  const setores: DashboardSetorAdesaoCRM[] = setoresRows.map((row) => ({
    setor: row.setor,
    totalUsuarios: Number(row.total_usuarios),
    usuariosParticipantesClassificacao: Number(
      row.usuarios_participantes_classificacao,
    ),
    usuariosSemClassificacao: Number(row.usuarios_sem_classificacao),
    usuariosParticipantesCanalOrigem: Number(
      row.usuarios_participantes_canal_origem,
    ),
    usuariosSemCanalOrigem: Number(row.usuarios_sem_canal_origem),
    totalClassificacoes: Number(row.total_classificacoes),
    totalCanaisOrigens: Number(row.total_canais_origens),
    ultimaClassificacao: dataIso(row.ultima_classificacao),
    ultimoCanalOrigem: dataIso(row.ultimo_canal_origem),
  }));

  return {
    resumo,
    usuarios,
    setores,
  } satisfies DashboardAdesaoCRM;
});
