import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Loader2, Trash2, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ExportButton } from "@/components/ExportButton";
import { SearchSelect } from "@/components/SearchSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { carregarCadastros } from "@/lib/cadastros";
import type { Identidade } from "@/lib/session";

export const Route = createFileRoute("/registros")({
  head: () => ({
    meta: [
      { title: "Tabulações Registradas — Gestor de Tabulações CRM" },
      { name: "description", content: "Consulte, filtre e exporte as tabulações registradas." },
      { property: "og:title", content: "Tabulações Registradas" },
      { property: "og:description", content: "Consulte, filtre e exporte as tabulações registradas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell>{(id) => <Registros id={id} />}</AppShell>,
});

const PAGE = 25;
type Filtros = { canal: number | null; origem: number | null; tipo: number | null; assunto: number | null; crit: number | null };

function Registros({ id }: { id: Identidade }) {
  const qc = useQueryClient();
  const [view, setView] = useState<"minhas" | "todas">("minhas");
  const [busca, setBusca] = useState("");
  const [buscaDeb, setBuscaDeb] = useState("");
  const [setor, setSetor] = useState("");
  const [usuario, setUsuario] = useState("");
  const [fl, setFl] = useState<Filtros>({ canal: null, origem: null, tipo: null, assunto: null, crit: null });
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [del, setDel] = useState<{ id: number; assunto: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { const t = setTimeout(() => setBuscaDeb(busca), 350); return () => clearTimeout(t); }, [busca]);
  useEffect(() => setPage(0), [view, buscaDeb, setor, usuario, fl, asc]);

  const { data: cad } = useQuery({ queryKey: ["cadastros"], queryFn: carregarCadastros, staleTime: 5 * 60_000 });

  const q = useQuery({
    queryKey: ["registros", view, id, buscaDeb, setor, usuario, fl, asc, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let r = supabase.from("vw_tabulacoes").select("*", { count: "exact" });
      if (view === "minhas") r = r.eq("nome_usuario", id.nome).eq("setor_usuario", id.setor);
      else {
        if (setor.trim()) r = r.ilike("setor_usuario", `%${setor.trim()}%`);
        if (usuario.trim()) r = r.ilike("nome_usuario", `%${usuario.trim()}%`);
      }
      if (fl.canal) r = r.eq("canal_id", fl.canal);
      if (fl.origem) r = r.eq("origem_id", fl.origem);
      if (fl.tipo) r = r.eq("tipo_ocorrencia_id", fl.tipo);
      if (fl.assunto) r = r.eq("assunto_id", fl.assunto);
      if (fl.crit) r = r.eq("criticidade_id", fl.crit);
      const s = buscaDeb.trim().replace(/[,()%*]/g, " ");
      if (s) {
        const p = `%${s}%`;
        r = r.or(["canal", "origem", "tipo_ocorrencia", "assunto", "subassunto", "area_interesse", "detalhe_ocorrencia", "criticidade", "nome_usuario", "setor_usuario"].map((c) => `${c}.ilike.${p}`).join(","));
      }
      const { data, error, count } = await r
        .order("data_hora_inclusao", { ascending: asc }).order("id_registro", { ascending: asc })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  async function excluir() {
    if (!del) return;
    setDeleting(true);
    const { error } = await supabase.rpc("excluir_tabulacao", { p_id: del.id });
    setDeleting(false);
    setDel(null);
    if (error) { toast.error("Não foi possível excluir."); return; }
    toast.success("Registro excluído.");
    qc.invalidateQueries({ queryKey: ["registros"] });
    qc.invalidateQueries({ queryKey: ["recentes"] });
  }

  const total = q.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const setF = (k: keyof Filtros) => (v: number | null) => setFl((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Tabulações Registradas</h1>
        {view === "minhas" && <ExportButton />}
      </div>
      <Tabs value={view} onValueChange={(v) => setView(v as "minhas" | "todas")}>
        <TabsList><TabsTrigger value="minhas">Minhas Tabulações</TabsTrigger><TabsTrigger value="todas">Todas as Tabulações</TabsTrigger></TabsList>
      </Tabs>

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-3 lg:grid-cols-4">
        <Input placeholder="Pesquisar texto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        {view === "todas" && <>
          <Input placeholder="Filtrar por setor" value={setor} onChange={(e) => setSetor(e.target.value)} />
          <Input placeholder="Filtrar por usuário" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        </>}
        {cad && <>
          <SearchSelect placeholder="Canal" options={cad.canal} value={fl.canal} onChange={setF("canal")} clearable />
          <SearchSelect placeholder="Origem" options={cad.origem} value={fl.origem} onChange={setF("origem")} clearable />
          <SearchSelect placeholder="Tipo de Ocorrência" options={cad.tipo} value={fl.tipo} onChange={setF("tipo")} clearable />
          <SearchSelect placeholder="Assunto" options={cad.assunto} value={fl.assunto} onChange={setF("assunto")} clearable />
          <SearchSelect placeholder="Criticidade" options={cad.criticidade} value={fl.crit} onChange={setF("crit")} clearable />
        </>}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="bg-secondary text-left text-secondary-foreground">
            <tr>
              {["Canal", "Origem", "Tipo de Ocorrência", "Assunto", "Subassunto", "Área de Interesse", "Detalhe da Ocorrência", "Grau de Criticidade", "ID do Registro"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
              <th className="px-3 py-2 font-medium">
                <button className="flex items-center gap-1" onClick={() => setAsc((a) => !a)}>Data e Hora da Inclusão <ArrowUpDown className="size-3" /></button>
              </th>
              <th className="px-3 py-2 font-medium">Nome do Usuário</th><th className="px-3 py-2 font-medium">Setor</th><th />
            </tr>
          </thead>
          <tbody>
            {q.isLoading && <tr><td colSpan={13} className="py-10 text-center"><Loader2 className="mx-auto animate-spin text-primary" /></td></tr>}
            {!q.isLoading && q.data?.rows.length === 0 && <tr><td colSpan={13} className="py-10 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>}
            {q.data?.rows.map((r) => (
              <tr key={r.id_registro} className="border-t">
                <td className="px-3 py-2">{r.canal}</td><td className="px-3 py-2">{r.origem}</td><td className="px-3 py-2">{r.tipo_ocorrencia}</td>
                <td className="px-3 py-2">{r.assunto}</td><td className="px-3 py-2">{r.subassunto ?? "—"}</td><td className="px-3 py-2">{r.area_interesse}</td>
                <td className="px-3 py-2">{r.detalhe_ocorrencia ?? "—"}</td><td className="px-3 py-2">{r.criticidade}</td><td className="px-3 py-2">{r.id_registro}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.data_hora_inclusao ? new Date(r.data_hora_inclusao).toLocaleString("pt-BR") : ""}</td>
                <td className="px-3 py-2">{r.nome_usuario}</td><td className="px-3 py-2">{r.setor_usuario}</td>
                <td className="px-3 py-2">
                  <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setDel({ id: r.id_registro!, assunto: r.assunto ?? "" })}>
                    <Trash2 className="text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">Total: {total} registro(s)</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span>Página {page + 1} de {pages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      </div>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tabulação?</AlertDialogTitle>
            <AlertDialogDescription>Assunto: <b>{del?.assunto}</b> — ID do registro: <b>{del?.id}</b>. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluir} disabled={deleting}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
