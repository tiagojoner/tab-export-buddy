//crm/src/routes/cadastro.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, Eraser, Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SearchSelect } from "@/components/SearchSelect";
import { TabulacoesTable } from "@/components/TabulacoesTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { carregarCadastros, permitidos } from "@/lib/cadastros";
import {
  excluirTabulacaoCRM,
  inserirTabulacaoCRM,
  listarTabulacoesCRM,
  type FiltrosTabulacoesCRM,
  type TabulacaoCRM,
} from "@/lib/crm.functions";
import type { Identidade } from "@/lib/session";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro de Tabulações — Gestor de Tabulações CRM" },
      {
        name: "description",
        content: "Registre as combinações de classificação utilizadas no CRM.",
      },
      { property: "og:title", content: "Cadastro de Tabulações" },
      {
        property: "og:description",
        content: "Registre as combinações de classificação utilizadas no CRM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell>{(id) => <Cadastro id={id} />}</AppShell>,
});

type Form = {
  canal: number | null;
  origem: number | null;
  tipo: number | null;
  assunto: number | null;
  sub: number | null;
  area: number | null;
  detalhe: number | null;
  criticidade: number | null;
};

const vazio: Form = {
  canal: null,
  origem: null,
  tipo: null,
  assunto: null,
  sub: null,
  area: null,
  detalhe: null,
  criticidade: null,
};

const filtrosCadastro: FiltrosTabulacoesCRM = {
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

function Cadastro({ id }: { id: Identidade }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form>(vazio);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<TabulacaoCRM | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicada, setDuplicada] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const cadastros = useQuery({
    queryKey: ["cadastros"],
    queryFn: carregarCadastros,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const cad = cadastros.data;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("gtc_form");
      if (raw) {
        setForm({ ...vazio, ...JSON.parse(raw) });
      }
    } catch {
      // Ignora formulário inválido salvo anteriormente.
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("gtc_form", JSON.stringify(form));
  }, [form]);

  const opts = useMemo(() => {
    if (!cad) return null;

    return {
      origem: permitidos(cad.origem, cad.rel.canalOrigem, form.canal, 0),
      assunto: permitidos(cad.assunto, cad.rel.assuntoTipo, form.tipo, 1),
      sub: permitidos(cad.subassunto, cad.rel.assuntoSub, form.assunto, 0),
      area: permitidos(cad.area, cad.rel.assuntoArea, form.assunto, 0),
      detalhe: permitidos(cad.detalhe, cad.rel.subDetalhe, form.sub, 0),
    };
  }, [cad, form.canal, form.tipo, form.assunto, form.sub]);

  useEffect(() => {
    if (!opts || !cad) return;

    const existe = (lista: { id: number }[], valor: number | null) =>
      valor == null || lista.some((item) => item.id === valor);

    const novo = { ...form };

    if (!existe(cad.canal, novo.canal)) novo.canal = null;
    if (!existe(cad.tipo, novo.tipo)) novo.tipo = null;
    if (!existe(cad.criticidade, novo.criticidade)) novo.criticidade = null;
    if (!existe(opts.origem, novo.origem)) novo.origem = null;
    if (!existe(opts.assunto, novo.assunto)) novo.assunto = null;
    if (!existe(opts.sub, novo.sub)) novo.sub = null;
    if (!existe(opts.area, novo.area)) novo.area = null;
    if (!existe(opts.detalhe, novo.detalhe)) novo.detalhe = null;

    if (JSON.stringify(novo) !== JSON.stringify(form)) {
      setForm(novo);
    }
  }, [opts, cad, form]);

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  const tabulacoes = useQuery({
    queryKey: ["cadastro-registros", id.usuarioId, page, pageSize],
    placeholderData: keepPreviousData,
    retry: 1,
    queryFn: () =>
      listarTabulacoesCRM({
        data: {
          somenteMinhas: true,
          filtros: filtrosCadastro,
          page,
          pageSize,
        },
      }),
  });

  const total = tabulacoes.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > 0 && page >= pages) {
      setPage(pages - 1);
    }
  }, [page, pages]);

  const obrigatoriosPreenchidos =
    form.canal != null &&
    form.origem != null &&
    form.tipo != null &&
    form.assunto != null &&
    form.area != null &&
    form.criticidade != null;

  async function adicionar() {
    if (!obrigatoriosPreenchidos) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);

    try {
      const resultado = await inserirTabulacaoCRM({
        data: {
          canal: form.canal!,
          origem: form.origem!,
          tipo: form.tipo!,
          assunto: form.assunto!,
          subassunto: form.sub,
          area: form.area!,
          detalhe: form.detalhe,
          criticidade: form.criticidade!,
        },
      });

      if (resultado.status === "duplicada") {
        setDuplicada(true);
        return;
      }

      toast.success("Tabulação adicionada com sucesso.");
      setPage(0);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cadastro-registros"] }),
        queryClient.invalidateQueries({ queryKey: ["registros"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["filtros-usuarios-setores"] }),
      ]);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao gravar a tabulação.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function excluir() {
    if (!del) return;

    setDeleting(true);

    try {
      await excluirTabulacaoCRM({ data: { id: del.id_registro } });
      toast.success("Registro marcado como excluído.");
      setDel(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cadastro-registros"] }),
        queryClient.invalidateQueries({ queryKey: ["registros"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["filtros-usuarios-setores"] }),
      ]);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Não foi possível excluir.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (cadastros.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (cadastros.isError || !cad || !opts) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 text-destructive" />
          <div className="space-y-3">
            <div>
              <h1 className="font-semibold">Não foi possível carregar os cadastros</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                O sistema não conseguiu consultar os dados do CRM no PostgreSQL.
              </p>
            </div>
            <Button variant="outline" onClick={() => void cadastros.refetch()}>
              <RefreshCw />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const set =
    (campo: keyof Form) =>
    (valor: number | null) =>
      setForm((anterior) => ({ ...anterior, [campo]: valor }));

  const Campo = ({
    label,
    req,
    children,
  }: {
    label: string;
    req?: boolean;
    children: ReactNode;
  }) => (
    <div className="space-y-1.5">
      <Label>
        {label}
        {req && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Cadastro de Tabulações</h1>
        <p className="text-sm text-muted-foreground">
          {total} tabulação(ões) ativa(s) cadastrada(s) por você.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Campo label="Canal" req>
            <SearchSelect options={cad.canal} value={form.canal} onChange={set("canal")} />
          </Campo>

          <Campo label="Origem" req>
            <SearchSelect options={opts.origem} value={form.origem} onChange={set("origem")} />
          </Campo>

          <Campo label="Tipo de Ocorrência" req>
            <SearchSelect options={cad.tipo} value={form.tipo} onChange={set("tipo")} />
          </Campo>

          <Campo label="Área de Interesse" req>
            <SearchSelect options={opts.area} value={form.area} onChange={set("area")} />
          </Campo>

          <Campo label="Assunto" req>
            <SearchSelect options={opts.assunto} value={form.assunto} onChange={set("assunto")} />
          </Campo>

          <Campo label="Subassunto">
            <SearchSelect options={opts.sub} value={form.sub} onChange={set("sub")} clearable />
          </Campo>

          <Campo label="Detalhe da Ocorrência">
            <SearchSelect options={opts.detalhe} value={form.detalhe} onChange={set("detalhe")} clearable />
          </Campo>

          <Campo label="Grau de Criticidade" req>
            <SearchSelect
              options={cad.criticidade}
              value={form.criticidade}
              onChange={set("criticidade")}
            />
          </Campo>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={adicionar} disabled={saving || !obrigatoriosPreenchidos}>
            {saving ? <Loader2 className="animate-spin" /> : <Plus />}
            Adicionar Tabulação
          </Button>

          <Button variant="outline" onClick={() => setForm(vazio)} disabled={saving}>
            <Eraser />
            Limpar campos
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 md:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Últimas tabulações</h2>
            <p className="text-sm text-muted-foreground">
              {tabulacoes.isFetching ? "Atualizando..." : `${total} registro(s) ativo(s)`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Por página</span>
              <select
                className="h-8 rounded-md border border-input bg-card px-2"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>

            <Link to="/registros" className="text-sm text-primary hover:underline">
              Ver todos os registros
            </Link>
          </div>
        </div>

        {tabulacoes.isError ? (
          <p className="text-sm text-destructive">
            Não foi possível carregar suas tabulações.
          </p>
        ) : tabulacoes.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : tabulacoes.data?.rows.length ? (
          <TabulacoesTable
            rows={tabulacoes.data.rows}
            usuarioAtualId={id.usuarioId}
            onExcluir={setDel}
            mostrarAuditoriaExclusao={false}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma tabulação cadastrada ainda.
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">Total: {total} registro(s)</span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </Button>

            <span>
              Página {page + 1} de {pages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= pages}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={duplicada} onOpenChange={setDuplicada}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tabulação já cadastrada</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe uma tabulação ativa com a mesma combinação de Canal,
              Origem, Tipo, Assunto, Subassunto, Área de Interesse, Detalhe da
              Ocorrência e Grau de Criticidade para o seu usuário e setor. Nenhum
              novo registro foi criado e os campos selecionados foram mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDuplicada(false)}>
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!del} onOpenChange={(open) => !open && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta tabulação?</AlertDialogTitle>
            <AlertDialogDescription>
              O registro será marcado como excluído e deixará de ser considerado
              no Dashboard e nas exportações. ID: <b>{del?.id_registro}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluir} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
