//crm/src/routes/registros.tsx

import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ExportButton } from "@/components/ExportButton";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { carregarCadastros } from "@/lib/cadastros";
import {
  excluirTabulacaoCRM,
  listarTabulacoesCRM,
  listarUsuariosSetoresCRM,
  type FiltrosTabulacoesCRM,
  type StatusTabulacao,
  type TabulacaoCRM,
} from "@/lib/crm.functions";
import type { Identidade } from "@/lib/session";

export const Route = createFileRoute("/registros")({
  head: () => ({
    meta: [
      { title: "Tabulações Registradas — Gestor de Tabulações CRM" },
      {
        name: "description",
        content: "Consulte, filtre e exporte as tabulações registradas.",
      },
      { property: "og:title", content: "Tabulações Registradas" },
      {
        property: "og:description",
        content: "Consulte, filtre e exporte as tabulações registradas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell>{(id) => <Registros id={id} />}</AppShell>,
});

const filtrosIniciais: FiltrosTabulacoesCRM = {
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

function Registros({ id }: { id: Identidade }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"minhas" | "todas">("minhas");
  const [filtros, setFiltros] = useState<FiltrosTabulacoesCRM>(filtrosIniciais);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [del, setDel] = useState<TabulacaoCRM | null>(null);
  const [deleting, setDeleting] = useState(false);

  const cadastros = useQuery({
    queryKey: ["cadastros"],
    queryFn: carregarCadastros,
    staleTime: 5 * 60_000,
  });

  const filtrosAuxiliares = useQuery({
    queryKey: ["filtros-usuarios-setores"],
    queryFn: listarUsuariosSetoresCRM,
    staleTime: 5 * 60_000,
    enabled: view === "todas",
  });

  useEffect(() => {
    setPage(0);
  }, [view, filtros, pageSize]);

  const query = useQuery({
    queryKey: ["registros", view, filtros, page, pageSize],
    placeholderData: keepPreviousData,
    queryFn: () =>
      listarTabulacoesCRM({
        data: {
          somenteMinhas: view === "minhas",
          filtros,
          page,
          pageSize,
        },
      }),
  });

  const usuarios = useMemo(
    () =>
      (filtrosAuxiliares.data?.usuarios ?? []).map((usuario) => ({
        id: usuario.id,
        nome: usuario.ativo ? usuario.nome : `${usuario.nome} (inativo)`,
      })),
    [filtrosAuxiliares.data],
  );

  async function excluir() {
    if (!del) return;

    setDeleting(true);

    try {
      await excluirTabulacaoCRM({ data: { id: del.id_registro } });
      toast.success("Registro marcado como excluído.");
      setDel(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["registros"] }),
        queryClient.invalidateQueries({ queryKey: ["recentes"] }),
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

  function setFiltro<K extends keyof FiltrosTabulacoesCRM>(
    key: K,
    value: FiltrosTabulacoesCRM[K],
  ) {
    setFiltros((current) => ({ ...current, [key]: value }));
  }

  function trocarView(value: string) {
    setView(value as "minhas" | "todas");
    setFiltros((current) => ({
      ...current,
      setor: "",
      usuario: null,
    }));
  }

  const total = query.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const cad = cadastros.data;

  useEffect(() => {
    if (page > 0 && page >= pages) {
      setPage(pages - 1);
    }
  }, [page, pages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Tabulações Registradas</h1>
          <p className="text-sm text-muted-foreground">
            Consulte registros ativos e excluídos. Registros excluídos nunca são exportados.
          </p>
        </div>

        <ExportButton somenteMinhas={view === "minhas"} filtros={filtros} />
      </div>

      <Tabs value={view} onValueChange={trocarView}>
        <TabsList>
          <TabsTrigger value="minhas">Minhas Tabulações</TabsTrigger>
          <TabsTrigger value="todas">Todas as Tabulações</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {cad && (
          <>
            <SearchSelect
              placeholder="Canal"
              options={cad.canal}
              value={filtros.canal}
              onChange={(value) => setFiltro("canal", value)}
              clearable
            />
            <SearchSelect
              placeholder="Origem"
              options={cad.origem}
              value={filtros.origem}
              onChange={(value) => setFiltro("origem", value)}
              clearable
            />
            <SearchSelect
              placeholder="Tipo de Ocorrência"
              options={cad.tipo}
              value={filtros.tipo}
              onChange={(value) => setFiltro("tipo", value)}
              clearable
            />
            <SearchSelect
              placeholder="Assunto"
              options={cad.assunto}
              value={filtros.assunto}
              onChange={(value) => setFiltro("assunto", value)}
              clearable
            />
            <SearchSelect
              placeholder="Subassunto"
              options={cad.subassunto}
              value={filtros.subassunto}
              onChange={(value) => setFiltro("subassunto", value)}
              clearable
            />
            <SearchSelect
              placeholder="Área de Interesse"
              options={cad.area}
              value={filtros.area}
              onChange={(value) => setFiltro("area", value)}
              clearable
            />
            <SearchSelect
              placeholder="Detalhe da Ocorrência"
              options={cad.detalhe}
              value={filtros.detalhe}
              onChange={(value) => setFiltro("detalhe", value)}
              clearable
            />
            <SearchSelect
              placeholder="Grau de Criticidade"
              options={cad.criticidade}
              value={filtros.criticidade}
              onChange={(value) => setFiltro("criticidade", value)}
              clearable
            />
          </>
        )}

        {view === "todas" && (
          <>
            <select
              className="h-10 rounded-md border border-input bg-card px-3 text-sm"
              value={filtros.setor}
              onChange={(event) => setFiltro("setor", event.target.value)}
              aria-label="Filtrar por setor"
            >
              <option value="">Todos os setores</option>
              {(filtrosAuxiliares.data?.setores ?? []).map((setor) => (
                <option key={setor} value={setor}>
                  {setor}
                </option>
              ))}
            </select>

            <SearchSelect
              placeholder="Usuário"
              options={usuarios}
              value={filtros.usuario}
              onChange={(value) => setFiltro("usuario", value)}
              clearable
            />
          </>
        )}

        <select
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
          value={filtros.status}
          onChange={(event) =>
            setFiltro("status", event.target.value as StatusTabulacao)
          }
          aria-label="Status dos registros"
        >
          <option value="ativas">Ativas</option>
          <option value="excluidas">Excluídas</option>
          <option value="todas">Ativas e excluídas</option>
        </select>

        <Button variant="outline" onClick={() => setFiltros({ ...filtrosIniciais })}>
          Limpar filtros
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="text-muted-foreground">
          {query.isFetching ? "Atualizando..." : `${total} registro(s) encontrado(s)`}
        </div>

        <label className="flex items-center gap-2">
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
      </div>

      {query.isLoading ? (
        <div className="flex justify-center rounded-xl border bg-card py-20">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : query.isError ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-destructive">
          Não foi possível consultar os registros no PostgreSQL.
        </div>
      ) : query.data?.rows.length ? (
        <TabulacoesTable
          rows={query.data.rows}
          usuarioAtualId={id.usuarioId}
          onExcluir={setDel}
        />
      ) : (
        <div className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
          Nenhum registro encontrado com os filtros atuais.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
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

      <AlertDialog open={!!del} onOpenChange={(open) => !open && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta tabulação?</AlertDialogTitle>
            <AlertDialogDescription>
              O registro será marcado como excluído e deixará de ser considerado no
              Dashboard e nas exportações. ID: <b>{del?.id_registro}</b>.
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
