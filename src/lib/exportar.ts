import { supabase } from "@/integrations/supabase/client";
import type { Identidade } from "./session";

const COLS = [
  { h: "Canal", k: "canal", w: 18 },
  { h: "Origem", k: "origem", w: 18 },
  { h: "Tipo de Ocorrência", k: "tipo_ocorrencia", w: 22 },
  { h: "Assunto", k: "assunto", w: 28 },
  { h: "Subassunto", k: "subassunto", w: 28 },
  { h: "Área de Interesse", k: "area_interesse", w: 22 },
  { h: "Detalhe da Ocorrência", k: "detalhe_ocorrencia", w: 28 },
  { h: "Grau de Criticidade", k: "criticidade", w: 22 },
  { h: "ID do Registro", k: "id_registro", w: 14 },
  { h: "Data e Hora da Inclusão", k: "data_hora_inclusao", w: 22 },
  { h: "Nome do Usuário", k: "nome_usuario", w: 28 },
  { h: "Setor", k: "setor_usuario", w: 22 },
] as const;

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Busca todos os registros da identificação (paginando além de 1000) e baixa o XLSX. Retorna a quantidade exportada. */
export async function exportarMinhasTabulacoes(id: Identidade): Promise<number> {
  const rows: Record<string, unknown>[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("vw_tabulacoes")
      .select("*")
      .eq("nome_usuario", id.nome)
      .eq("setor_usuario", id.setor)
      .order("data_hora_inclusao", { ascending: true })
      .order("id_registro", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  if (rows.length === 0) return 0;

  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Tabulações");
  ws.columns = COLS.map((c) => ({ header: c.h, key: c.k, width: c.w }));
  for (const r of rows) {
    const line: Record<string, unknown> = {};
    for (const c of COLS) {
      const v = r[c.k];
      line[c.k] = c.k === "data_hora_inclusao" && v ? new Date(v as string) : (v ?? "");
    }
    ws.addRow(line);
  }
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial" };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00995D" } };
  header.alignment = { vertical: "middle" };
  ws.getColumn("data_hora_inclusao").numFmt = "dd/mm/yyyy hh:mm:ss";
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: rows.length + 1, column: COLS.length } };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buf = await wb.xlsx.writeBuffer();
  const d = new Date();
  const data = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const nome = `Tabulacoes_CRM_${slug(id.nome)}_${slug(id.setor)}_${data}.xlsx`;
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return rows.length;
}
