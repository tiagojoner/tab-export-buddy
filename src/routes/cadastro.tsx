import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Eraser } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ExportButton } from "@/components/ExportButton";
import { SearchSelect } from "@/components/SearchSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { carregarCadastros, permitidos } from "@/lib/cadastros";
import type { Identidade } from "@/lib/session";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro de Tabulações — Gestor de Tabulações CRM" },
      { name: "description", content: "Registre as combinações de classificação utilizadas no CRM." },
      { property: "og:title", content: "Cadastro de Tabulações" },
      { property: "og:description", content: "Registre as combinações de classificação utilizadas no CRM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell>{(id) => <Cadastro id={id} />}</AppShell>,
});

type Form = { canal: number | null; origem: number | null; tipo: number | null; assunto: number | null; sub: number | null; area: number | null; detalhe: number | null };
const vazio: Form = { canal: null, origem: null, tipo: null, assunto: null, sub: null, area: null, detalhe: null };

function Cadastro({ id }: { id: Identidade }) {
  const qc = useQueryClient();
  const { data: cad, isLoading } = useQuery({ queryKey: ["cadastros"], queryFn: carregarCadastros, staleTime: 5 * 60_000 });
  const [f, setF] = useState<Form>(vazio);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try { const raw = sessionStorage.getItem("gtc_form"); if (raw) setF({ ...vazio, ...JSON.parse(raw) }); } catch { /* ignore */ }
  }, []);
  useEffect(() => { sessionStorage.setItem("gtc_form", JSON.stringify(f)); }, [f]);

  const opts = useMemo(() => {
    if (!cad) return null;
    return {
      origem: permitidos(cad.origem, cad.rel.canalOrigem, f.canal, 0),
      assunto: permitidos(cad.assunto, cad.rel.assuntoTipo, f.tipo, 1),
      sub: permitidos(cad.subassunto, cad.rel.assuntoSub, f.assunto, 0),
      area: permitidos(cad.area, cad.rel.assuntoArea, f.assunto, 0),
      detalhe: permitidos(cad.detalhe, cad.rel.subDetalhe, f.sub, 0),
    };
  }, [cad, f.canal, f.tipo, f.assunto, f.sub]);

  // Limpa somente dependentes que ficaram inválidos
  useEffect(() => {
    if (!opts || !cad) return;
    const has = (list: { id: number }[], v: number | null) => v == null || list.some((o) => o.id === v);
    const n = { ...f };
    if (!has(cad.canal, n.canal)) n.canal = null;
    if (!has(cad.tipo, n.tipo)) n.tipo = null;
    if (!has(opts.origem, n.origem)) n.origem = null;
    if (!has(opts.assunto, n.assunto)) n.assunto = null;
    if (!has(opts.sub, n.sub)) n.sub = null;
    if (!has(opts.area, n.area)) n.area = null;
    if (!has(opts.detalhe, n.detalhe)) n.detalhe = null;
    if (JSON.stringify(n) !== JSON.stringify(f)) setF(n);
  }, [opts, cad, f]);

  const crit = useQuery({
    queryKey: ["crit", f.tipo, f.assunto, f.sub],
    enabled: f.tipo != null && f.assunto != null,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("calcular_criticidade", { p_tipo: f.tipo!, p_assunto: f.assunto!, p_sub: f.sub as number });
      if (error) throw error;
      return data as number;
    },
  });
  const critNome = cad?.criticidade.find((c) => c.id === crit.data)?.nome;

  const recentes = useQuery({
    queryKey: ["recentes", id.nome, id.setor],
    queryFn: async () => {
      const { data, error, count } = await supabase.from("vw_tabulacoes")
        .select("id_registro,assunto,subassunto,tipo_ocorrencia,criticidade,data_hora_inclusao", { count: "exact" })
        .eq("nome_usuario", id.nome).eq("setor_usuario", id.setor)
        .order("data_hora_inclusao", { ascending: false }).limit(5);
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const obrig = f.canal && f.origem && f.tipo && f.assunto && f.area;
  async function adicionar() {
    if (!obrig) { toast.error("Preencha todos os campos obrigatórios."); return; }
    setSaving(true);
    const { error } = await supabase.rpc("inserir_tabulacao", {
      p_nome: id.nome, p_setor: id.setor, p_canal: f.canal!, p_origem: f.origem!, p_tipo: f.tipo!,
      p_assunto: f.assunto!, p_sub: f.sub as number, p_area: f.area!, p_detalhe: f.detalhe as number,
    });
    setSaving(false);
    if (error) { toast.error(error.message || "Erro ao gravar."); return; }
    toast.success("Tabulação adicionada com sucesso.");
    qc.invalidateQueries({ queryKey: ["recentes"] });
    qc.invalidateQueries({ queryKey: ["registros"] });
  }

  if (isLoading || !cad || !opts)
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  const set = (k: keyof Form) => (v: number | null) => setF((p) => ({ ...p, [k]: v }));
  const Campo = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
    <div className="space-y-1.5"><Label>{label}{req && <span className="text-destructive"> *</span>}</Label>{children}</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Cadastro de Tabulações</h1>
          <p className="text-sm text-muted-foreground">{recentes.data?.count ?? 0} tabulação(ões) cadastrada(s) por você.</p>
        </div>
        <ExportButton />
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Campo label="Canal" req><SearchSelect options={cad.canal} value={f.canal} onChange={set("canal")} /></Campo>
          <Campo label="Origem" req><SearchSelect options={opts.origem} value={f.origem} onChange={set("origem")} /></Campo>
          <Campo label="Tipo de Ocorrência" req><SearchSelect options={cad.tipo} value={f.tipo} onChange={set("tipo")} /></Campo>
          <Campo label="Assunto" req><SearchSelect options={opts.assunto} value={f.assunto} onChange={set("assunto")} /></Campo>
          <Campo label="Subassunto"><SearchSelect options={opts.sub} value={f.sub} onChange={set("sub")} clearable /></Campo>
          <Campo label="Área de Interesse" req><SearchSelect options={opts.area} value={f.area} onChange={set("area")} /></Campo>
          <Campo label="Detalhe da Ocorrência"><SearchSelect options={opts.detalhe} value={f.detalhe} onChange={set("detalhe")} clearable /></Campo>
          <Campo label="Grau de Criticidade (automático)">
            <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
              {crit.isFetching ? <Loader2 className="size-4 animate-spin" /> : critNome ?? <span className="text-muted-foreground">Selecione Tipo e Assunto</span>}
            </div>
          </Campo>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={adicionar} disabled={saving || !obrig}>
            {saving ? <Loader2 className="animate-spin" /> : <Plus />} Adicionar Tabulação
          </Button>
          <Button variant="outline" onClick={() => setF(vazio)} disabled={saving}><Eraser /> Limpar campos</Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Últimas tabulações</h2>
          <Link to="/registros" className="text-sm text-primary hover:underline">Ver todos os registros</Link>
        </div>
        {recentes.data?.rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr><th className="py-2">Assunto</th><th>Subassunto</th><th>Tipo</th><th>Criticidade</th><th>Data/hora</th></tr></thead>
              <tbody>
                {recentes.data.rows.map((r) => (
                  <tr key={r.id_registro} className="border-t">
                    <td className="py-2">{r.assunto}</td><td>{r.subassunto ?? "—"}</td><td>{r.tipo_ocorrencia}</td><td>{r.criticidade}</td>
                    <td>{r.data_hora_inclusao ? new Date(r.data_hora_inclusao).toLocaleString("pt-BR") : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted-foreground">Nenhuma tabulação cadastrada ainda.</p>}
      </div>
    </div>
  );
}
