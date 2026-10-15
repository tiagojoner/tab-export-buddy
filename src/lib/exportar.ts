//crm/src/lib/exportar.ts

import {
  exportarCanaisOrigensCRM,
  type CanalOrigemExportacaoCRM,
  type FiltrosCanalOrigemCRM,
} from "./canal-origem.functions";
import {
  exportarTabulacoesCRM,
  type FiltrosTabulacoesCRM,
  type TabulacaoExportacaoCRM,
} from "./crm.functions";

type ColunaClassificacao = {
  h: string;
  k: keyof TabulacaoExportacaoCRM;
  w: number;
};

type ColunaCanalOrigem = {
  h: string;
  k: keyof CanalOrigemExportacaoCRM;
  w: number;
};

const COLS_CLASSIFICACAO: ColunaClassificacao[] = [
  { h: "Tipo de Ocorrência", k: "tipo_ocorrencia", w: 22 },
  { h: "Assunto", k: "assunto", w: 34 },
  { h: "Subassunto", k: "subassunto", w: 38 },
  { h: "Área de Interesse", k: "area_interesse", w: 30 },
  { h: "Grau de Criticidade", k: "criticidade", w: 22 },
  { h: "Nome do Usuário", k: "nome_usuario", w: 28 },
  { h: "Setor do Usuário", k: "setor_usuario", w: 28 },
  { h: "Data e Hora da Criação", k: "data_hora_inclusao", w: 22 },
  { h: "ID do Registro", k: "id_registro", w: 14 },
];

const COLS_CANAL_ORIGEM: ColunaCanalOrigem[] = [
  { h: "Canal", k: "canal", w: 24 },
  { h: "Origem", k: "origem", w: 38 },
  { h: "Nome do Usuário", k: "nome_usuario", w: 28 },
  { h: "Setor do Usuário", k: "setor_usuario", w: 28 },
  { h: "Data e Hora da Criação", k: "data_hora_inclusao", w: 22 },
  { h: "ID do Registro", k: "id_registro", w: 14 },
];

function dataArquivo() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

async function baixarWorkbook<T extends object>({
  rows,
  colunas,
  aba,
  nomeArquivo,
}: {
  rows: T[];
  colunas: { h: string; k: keyof T; w: number }[];
  aba: string;
  nomeArquivo: string;
}) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(aba);

  ws.columns = colunas.map((c) => ({
    header: c.h,
    key: String(c.k),
    width: c.w,
  }));

  for (const r of rows) {
    const line: Record<string, unknown> = {};

    for (const c of colunas) {
      const v = r[c.k];
      line[String(c.k)] =
        c.k === "data_hora_inclusao" && v ? new Date(v as string) : (v ?? "");
    }

    ws.addRow(line);
  }

  const header = ws.getRow(1);
  header.font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    name: "Arial",
  };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF00995D" },
  };
  header.alignment = { vertical: "middle" };

  ws.getColumn("data_hora_inclusao").numFmt = "dd/mm/yyyy hh:mm:ss";
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: rows.length + 1, column: colunas.length },
  };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportarClassificacoes({
  filtros,
  mostrarDetalhe,
}: {
  filtros: FiltrosTabulacoesCRM;
  mostrarDetalhe: boolean;
}): Promise<number> {
  const rows = (await exportarTabulacoesCRM({
    data: {
      somenteMinhas: false,
      filtros,
    },
  })) as TabulacaoExportacaoCRM[];

  if (rows.length === 0) return 0;

  const colunas = [...COLS_CLASSIFICACAO];

  if (mostrarDetalhe) {
    colunas.splice(4, 0, {
      h: "Detalhe da Ocorrência",
      k: "detalhe_ocorrencia",
      w: 34,
    });
  }

  await baixarWorkbook<TabulacaoExportacaoCRM>({
    rows,
    colunas,
    aba: "Classificação",
    nomeArquivo: `Tabulacoes_CRM_Classificacao_${dataArquivo()}.xlsx`,
  });

  return rows.length;
}

export async function exportarCanaisOrigens({
  filtros,
}: {
  filtros: FiltrosCanalOrigemCRM;
}): Promise<number> {
  const rows = (await exportarCanaisOrigensCRM({
    data: { filtros },
  })) as CanalOrigemExportacaoCRM[];

  if (rows.length === 0) return 0;

  await baixarWorkbook<CanalOrigemExportacaoCRM>({
    rows,
    colunas: COLS_CANAL_ORIGEM,
    aba: "Canal e Origem",
    nomeArquivo: `Tabulacoes_CRM_Canal_Origem_${dataArquivo()}.xlsx`,
  });

  return rows.length;
}
