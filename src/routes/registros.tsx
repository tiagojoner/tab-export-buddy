//crm/src/routes/registros.tsx

import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { CanaisOrigensTable } from "@/components/CanaisOrigensTable";
import { ExportButton } from "@/components/ExportButton";
import { SearchSelect, SearchTextSelect } from "@/components/SearchSelect";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  excluirCanalOrigemCRM,
  listarTodosCanaisOrigensCRM,
  type CanalOrigemRegistradoCRM,
  type FiltrosCanalOrigemCRM,
  type StatusCanalOrigem,
} from "@/lib/canal-origem.functions";
import { carregarCadastros } from "@/lib/cadastros";
import {
  atualizarCriticidadeTabulacaoCRM,
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

const filtrosClassificacaoIniciais: FiltrosTabulacoesCRM = {
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

const filtrosCanalOrigemIniciais: FiltrosCanalOrigemCRM = {
  canal: null,
  origem: null,
  usuario: null,
  setor: "",
  status: "ativas",
};

function Registros({ id }: { id: Identidade }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"classificacao" | "canal-origem">("classificacao");
  const [filtrosClassificacao, setFiltrosClassificacao] =
    useState<FiltrosTabulacoesCRM>(filtrosClassificacaoIniciais);
  const [filtrosCanalOrigem, setFiltrosCanalOrigem] =
    useState<FiltrosCanalOrigemCRM>(filtrosCanalOrigemIniciais);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  const [delClassificacao, setDelClassificacao] = useState<TabulacaoCRM | null>(null);
  const [delCanalOrigem, setDelCanalOrigem] =
    useState<CanalOrigemRegistradoCRM | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editando, setEditando] = useState<TabulacaoCRM | null>(null);
  const [criticidadeEdicao, setCriticidadeEdicao] = useState<number | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const cadastros = useQuery({
    queryKey: ["cadastros"],
    queryFn: carregarCadastros,
    staleTime: 5 * 60_000,
  });

  const filtrosAuxiliares = useQuery({
    queryKey: ["filtros-usuarios-setores"],
    queryFn: listarUsuariosSetoresCRM,
    staleTime: 5 * 60_000,
  });

  const classificacoes = useQuery({
    queryKey: ["registros", "classificacao", filtrosClassificacao, page, pageSize],
    placeholderData: keepPreviousData,
    enabled: view === "classificacao",
    queryFn: () =>
      listarTabulacoesCRM({
        data: {
          somenteMinhas: false,
          filtros: filtrosClassificacao,
          page,
          pageSize,
        },
      }),
  });

  const canaisOrigens = useQuery({
    queryKey: ["registros-canal-origem", filtrosCanalOrigem, page, pageSize],
    placeholderData: keepPreviousData,
    enabled: view === "canal-origem",
    queryFn: () =>
      listarTodosCanaisOrigensCRM({
        data: {
          filtros: filtrosCanalOrigem,
          page,
          pageSize,
        },
      }),
  });

  useEffect(() => {
    setPage(0);
  }, [view, filtrosClassificacao, filtrosCanalOrigem, pageSize]);

  const usuarios = useMemo(
    () =>
      (filtrosAuxiliares.data?.usuarios ?? []).map((usuario) => ({
        id: usuario.id,
        nome: usuario.ativo ? usuario.nome : `${usuario.nome} (inativo)`,
      })),
    [filtrosAuxiliares.data],
  );

  const setores = useMemo(
    () =>
      (filtrosAuxiliares.data?.setores ?? []).map((setor) => ({
        id: setor,
        nome: setor,
      })),
    [filtrosAuxiliares.data?.setores],
  );

  const statusOptions = useMemo(
    () => [
      { id: "ativas", nome: "Ativas" },
      { id: "excluidas", nome: "Inativas" },
    ],
    [],
  );

  async function invalidarDados() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["registros"] }),
      queryClient.invalidateQueries({ queryKey: ["registros-canal-origem"] }),
      queryClient.invalidateQueries({ queryKey: ["cadastro-registros"] }),
      queryClient.invalidateQueries({ queryKey: ["cadastro-canais-origens"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["filtros-usuarios-setores"] }),
    ]);
  }

  async function excluirClassificacao() {
    if (!delClassificacao) return;

    setDeleting(true);

    try {
      await excluirTabulacaoCRM({ data: { id: delClassificacao.id_registro } });
      toast.success("Registro de Classificação marcado como inativo.");
      setDelClassificacao(null);
      await invalidarDados();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir.");
    } finally {
      setDeleting(false);
    }
  }

  async function excluirCanalOrigem() {
    if (!delCanalOrigem) return;

    setDeleting(true);

    try {
      await excluirCanalOrigemCRM({ data: { id: delCanalOrigem.id_registro } });
      toast.success("Registro de Canal e Origem marcado como inativo.");
      setDelCanalOrigem(null);
      await invalidarDados();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir.");
    } finally {
      setDeleting(false);
    }
  }

  function abrirEdicaoCriticidade(row: TabulacaoCRM) {
    const atual = cadastros.data?.criticidade.find(
      (item) => item.nome === row.criticidade,
    );

    setEditando(row);
    setCriticidadeEdicao(atual?.id ?? null);
  }

  async function salvarCriticidade() {
    if (!editando || criticidadeEdicao == null) return;

    setSalvandoEdicao(true);

    try {
      await atualizarCriticidadeTabulacaoCRM({
        data: {
          id: editando.id_registro,
          criticidade: criticidadeEdicao,
        },
      });

      toast.success("Grau de Criticidade atualizado.");
      setEditando(null);
      setCriticidadeEdicao(null);
      await invalidarDados();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Não foi possível editar.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  function setFiltroClassificacao<K extends keyof FiltrosTabulacoesCRM>(
    key: K,
    value: FiltrosTabulacoesCRM[K],
  ) {
    setFiltrosClassificacao((current) => ({ ...current, [key]: value }));
  }

  function setFiltroCanalOrigem<K extends keyof FiltrosCanalOrigemCRM>(
    key: K,
    value: FiltrosCanalOrigemCRM[K],
  ) {
    setFiltrosCanalOrigem((current) => ({ ...current, [key]: value }));
  }

  const cad = cadastros.data;
  const queryAtual = view === "classificacao" ? classificacoes : canaisOrigens;
  const total = queryAtual.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

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
            Consulte Classificações e registros de Canal e Origem. Todos os filtros são opcionais e o status inicia em Ativas.
          </p>
        </div>

        {cad && (
          <ExportButton
            tipo={view}
            filtrosClassificacao={
              view === "classificacao" ? filtrosClassificacao : undefined
            }
            filtrosCanalOrigem={
              view === "canal-origem" ? filtrosCanalOrigem : undefined
            }
          />
        )}
      </div>

      <Tabs
        value={view}
        onValueChange={(value) =>
          setView(value as "classificacao" | "canal-origem")
        }
      >
        <TabsList>
          <TabsTrigger value="classificacao">
            Todas as tabulações - Classificação
          </TabsTrigger>
          <TabsTrigger value="canal-origem">
            Todas as tabulações - Canal e Origem
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {view === "classificacao" && cad && (
          <>
            <SearchSelect
              placeholder="Tipo de Ocorrência"
              options={cad.tipo}
              value={filtrosClassificacao.tipo}
              onChange={(value) => setFiltroClassificacao("tipo", value)}
              clearable
            />
            <SearchSelect
              placeholder="Assunto"
              options={cad.assunto}
              value={filtrosClassificacao.assunto}
              onChange={(value) => setFiltroClassificacao("assunto", value)}
              clearable
            />
            <SearchSelect
              placeholder="Subassunto"
              options={cad.subassunto}
              value={filtrosClassificacao.subassunto}
              onChange={(value) => setFiltroClassificacao("subassunto", value)}
              clearable
            />
            <SearchSelect
              placeholder="Área de Interesse"
              options={cad.area}
              value={filtrosClassificacao.area}
              onChange={(value) => setFiltroClassificacao("area", value)}
              clearable
            />

            <SearchSelect
              placeholder="Detalhe da Ocorrência"
              options={cad.detalhe}
              value={filtrosClassificacao.detalhe}
              onChange={(value) => setFiltroClassificacao("detalhe", value)}
              clearable
            />

            <SearchSelect
              placeholder="Grau de Criticidade"
              options={cad.criticidade}
              value={filtrosClassificacao.criticidade}
              onChange={(value) => setFiltroClassificacao("criticidade", value)}
              clearable
            />
            <SearchTextSelect
              placeholder="Setor"
              options={setores}
              value={filtrosClassificacao.setor || null}
              onChange={(value) => setFiltroClassificacao("setor", value ?? "")}
              clearable
            />
            <SearchSelect
              placeholder="Usuário"
              options={usuarios}
              value={filtrosClassificacao.usuario}
              onChange={(value) => setFiltroClassificacao("usuario", value)}
              clearable
            />
            <SearchTextSelect
              placeholder="Status"
              options={statusOptions}
              value={
                filtrosClassificacao.status === "todas"
                  ? null
                  : filtrosClassificacao.status
              }
              onChange={(value) =>
                setFiltroClassificacao(
                  "status",
                  (value ?? "todas") as StatusTabulacao,
                )
              }
              clearable
            />
            <Button
              variant="outline"
              onClick={() =>
                setFiltrosClassificacao({ ...filtrosClassificacaoIniciais })
              }
            >
              Limpar filtros
            </Button>
          </>
        )}

        {view === "canal-origem" && cad && (
          <>
            <SearchSelect
              placeholder="Canal"
              options={cad.canal}
              value={filtrosCanalOrigem.canal}
              onChange={(value) => setFiltroCanalOrigem("canal", value)}
              clearable
            />
            <SearchSelect
              placeholder="Origem"
              options={cad.origem}
              value={filtrosCanalOrigem.origem}
              onChange={(value) => setFiltroCanalOrigem("origem", value)}
              clearable
            />
            <SearchTextSelect
              placeholder="Setor"
              options={setores}
              value={filtrosCanalOrigem.setor || null}
              onChange={(value) => setFiltroCanalOrigem("setor", value ?? "")}
              clearable
            />
            <SearchSelect
              placeholder="Usuário"
              options={usuarios}
              value={filtrosCanalOrigem.usuario}
              onChange={(value) => setFiltroCanalOrigem("usuario", value)}
              clearable
            />
            <SearchTextSelect
              placeholder="Status"
              options={statusOptions}
              value={
                filtrosCanalOrigem.status === "todas"
                  ? null
                  : filtrosCanalOrigem.status
              }
              onChange={(value) =>
                setFiltroCanalOrigem(
                  "status",
                  (value ?? "todas") as StatusCanalOrigem,
                )
              }
              clearable
            />
            <Button
              variant="outline"
              onClick={() =>
                setFiltrosCanalOrigem({ ...filtrosCanalOrigemIniciais })
              }
            >
              Limpar filtros
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="text-muted-foreground">
          {queryAtual.isFetching ? "Atualizando..." : `${total} registro(s) encontrado(s)`}
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

      {queryAtual.isLoading ? (
        <div className="flex justify-center rounded-xl border bg-card py-20">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : queryAtual.isError ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-destructive">
          Não foi possível consultar os registros no PostgreSQL.
        </div>
      ) : view === "classificacao" && classificacoes.data?.rows.length ? (
        <TabulacoesTable
          rows={classificacoes.data.rows}
          usuarioAtualId={id.usuarioId}
          onExcluir={setDelClassificacao}
          onEditarCriticidade={abrirEdicaoCriticidade}
        />
      ) : view === "canal-origem" && canaisOrigens.data?.rows.length ? (
        <CanaisOrigensTable
          rows={canaisOrigens.data.rows}
          usuarioAtualId={id.usuarioId}
          onExcluir={setDelCanalOrigem}
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

      <AlertDialog
        open={!!delClassificacao}
        onOpenChange={(open) => !open && setDelClassificacao(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta Classificação?</AlertDialogTitle>
            <AlertDialogDescription>
              O registro será marcado como inativo e deixará de ser considerado no Dashboard e nas exportações. ID: <b>{delClassificacao?.id_registro}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirClassificacao} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!delCanalOrigem}
        onOpenChange={(open) => !open && setDelCanalOrigem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este Canal e Origem?</AlertDialogTitle>
            <AlertDialogDescription>
              O registro será marcado como inativo e deixará de ser considerado no Dashboard e nas exportações. ID: <b>{delCanalOrigem?.id_registro}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirCanalOrigem} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!editando}
        onOpenChange={(open) => {
          if (!open) {
            setEditando(null);
            setCriticidadeEdicao(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar Grau de Criticidade</AlertDialogTitle>
            <AlertDialogDescription>
              Somente a criticidade do registro ID <b>{editando?.id_registro}</b> será alterada.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5">
            <Label>Grau de Criticidade</Label>
            <SearchSelect
              options={cad?.criticidade ?? []}
              value={criticidadeEdicao}
              onChange={setCriticidadeEdicao}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvandoEdicao}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={salvarCriticidade}
              disabled={salvandoEdicao || criticidadeEdicao == null}
            >
              {salvandoEdicao ? "Salvando..." : "Salvar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
