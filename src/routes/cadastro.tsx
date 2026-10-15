//crm/src/routes/cadastro.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Eraser,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { CanaisOrigensTable } from "@/components/CanaisOrigensTable";
import { CheckboxMultiSelect } from "@/components/CheckboxMultiSelect";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  excluirCanalOrigemCRM,
  inserirCanaisOrigensCRM,
  listarCanaisOrigensCRM,
  type CanalOrigemRegistradoCRM,
} from "@/lib/canal-origem.functions";
import { carregarCadastros } from "@/lib/cadastros";
import {
  atualizarCriticidadeTabulacaoCRM,
  excluirTabulacaoCRM,
  inserirClassificacoesCRM,
  listarSubassuntosRelacionadosCRM,
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
        content: "Registre canais, origens e classificações utilizadas no CRM.",
      },
      { property: "og:title", content: "Cadastro de Tabulações" },
      {
        property: "og:description",
        content: "Registre canais, origens e classificações utilizadas no CRM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell>{(id) => <Cadastro id={id} />}</AppShell>,
});

type FormClassificacao = {
  tipo: number | null;
  assunto: number | null;
  area: number | null;
  detalhe: number | null;
  criticidade: number | null;
};

type FormCanalOrigem = {
  canal: number | null;
  origens: number[];
};

const classificacaoVazia: FormClassificacao = {
  tipo: null,
  assunto: null,
  area: null,
  detalhe: null,
  criticidade: null,
};

const canalOrigemVazio: FormCanalOrigem = {
  canal: null,
  origens: [],
};

const filtrosCadastro: FiltrosTabulacoesCRM = {
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

function normalizar(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function Cadastro({ id }: { id: Identidade }) {
  const queryClient = useQueryClient();
  const [aba, setAba] = useState("canal-origem");

  const [formCanalOrigem, setFormCanalOrigem] =
    useState<FormCanalOrigem>(canalOrigemVazio);
  const [form, setForm] = useState<FormClassificacao>(classificacaoVazia);
  const [subassuntosSelecionados, setSubassuntosSelecionados] = useState<number[]>([]);

  const [savingCanalOrigem, setSavingCanalOrigem] = useState(false);
  const [savingClassificacao, setSavingClassificacao] = useState(false);
  const [confirmarSemSubassunto, setConfirmarSemSubassunto] = useState(false);

  const [delCanalOrigem, setDelCanalOrigem] =
    useState<CanalOrigemRegistradoCRM | null>(null);
  const [del, setDel] = useState<TabulacaoCRM | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editando, setEditando] = useState<TabulacaoCRM | null>(null);
  const [criticidadeEdicao, setCriticidadeEdicao] = useState<number | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [pageCanalOrigem, setPageCanalOrigem] = useState(0);
  const [pageSizeCanalOrigem, setPageSizeCanalOrigem] = useState(25);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const cadastros = useQuery({
    queryKey: ["cadastros"],
    queryFn: carregarCadastros,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const cad = cadastros.data;

  const subassuntosRelacionados = useQuery({
    queryKey: ["subassuntos-relacionados", form.assunto],
    enabled: form.assunto != null,
    staleTime: 5 * 60_000,
    queryFn: () =>
      listarSubassuntosRelacionadosCRM({
        data: { assuntoId: form.assunto! },
      }),
  });

  const canaisOrigens = useQuery({
    queryKey: [
      "cadastro-canais-origens",
      id.usuarioId,
      pageCanalOrigem,
      pageSizeCanalOrigem,
    ],
    placeholderData: keepPreviousData,
    retry: 1,
    queryFn: () =>
      listarCanaisOrigensCRM({
        data: {
          page: pageCanalOrigem,
          pageSize: pageSizeCanalOrigem,
        },
      }),
  });

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

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("gtc_form_canal_origem");
      if (raw) {
        const salvo = JSON.parse(raw) as {
          canal?: number | null;
          origem?: number | null;
          origens?: number[];
        };

        setFormCanalOrigem({
          canal: salvo.canal ?? null,
          origens: Array.isArray(salvo.origens)
            ? salvo.origens
            : salvo.origem != null
              ? [salvo.origem]
              : [],
        });
      }
    } catch {
      // Ignora formulário inválido salvo anteriormente.
    }

    try {
      const raw = sessionStorage.getItem("gtc_form_classificacao");
      if (raw) {
        setForm({ ...classificacaoVazia, ...JSON.parse(raw) });
      }
    } catch {
      // Ignora formulário inválido salvo anteriormente.
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      "gtc_form_canal_origem",
      JSON.stringify(formCanalOrigem),
    );
  }, [formCanalOrigem]);

  useEffect(() => {
    sessionStorage.setItem("gtc_form_classificacao", JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (!cad) return;

    const existe = (lista: { id: number }[], valor: number | null) =>
      valor == null || lista.some((item) => item.id === valor);

    setFormCanalOrigem((atual) => ({
      canal: existe(cad.canal, atual.canal) ? atual.canal : null,
      origens: atual.origens.filter((origemId) =>
        cad.origem.some((item) => item.id === origemId),
      ),
    }));

    setForm((atual) => {
      const normal = cad.criticidade.find(
        (item) => normalizar(item.nome) === "normal",
      );

      return {
        tipo: existe(cad.tipo, atual.tipo) ? atual.tipo : null,
        assunto: existe(cad.assunto, atual.assunto) ? atual.assunto : null,
        area: existe(cad.area, atual.area) ? atual.area : null,
        detalhe:
          cad.configuracao.exibirDetalheOcorrencia &&
          existe(cad.detalhe, atual.detalhe)
            ? atual.detalhe
            : null,
        criticidade: existe(cad.criticidade, atual.criticidade)
          ? (atual.criticidade ?? normal?.id ?? null)
          : (normal?.id ?? null),
      };
    });
  }, [cad]);

  useEffect(() => {
    if (form.assunto == null) {
      setSubassuntosSelecionados([]);
      return;
    }

    if (subassuntosRelacionados.data) {
      setSubassuntosSelecionados(
        subassuntosRelacionados.data.map((item) => item.id),
      );
    }
  }, [form.assunto, subassuntosRelacionados.data]);

  useEffect(() => {
    setPageCanalOrigem(0);
  }, [pageSizeCanalOrigem]);

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  const totalCanalOrigem = canaisOrigens.data?.count ?? 0;
  const pagesCanalOrigem = Math.max(
    1,
    Math.ceil(totalCanalOrigem / pageSizeCanalOrigem),
  );

  const total = tabulacoes.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageCanalOrigem > 0 && pageCanalOrigem >= pagesCanalOrigem) {
      setPageCanalOrigem(pagesCanalOrigem - 1);
    }
  }, [pageCanalOrigem, pagesCanalOrigem]);

  useEffect(() => {
    if (page > 0 && page >= pages) {
      setPage(pages - 1);
    }
  }, [page, pages]);

  const normalId = useMemo(
    () =>
      cad?.criticidade.find((item) => normalizar(item.nome) === "normal")?.id ??
      null,
    [cad?.criticidade],
  );

  const obrigatoriosCanalOrigem =
    formCanalOrigem.canal != null && formCanalOrigem.origens.length > 0;

  const obrigatoriosClassificacao =
    form.tipo != null &&
    form.assunto != null &&
    form.area != null &&
    form.criticidade != null;

  async function invalidarDados() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["cadastro-registros"] }),
      queryClient.invalidateQueries({ queryKey: ["registros"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["filtros-usuarios-setores"] }),
    ]);
  }

  async function adicionarCanalOrigem() {
    if (formCanalOrigem.canal == null) {
      toast.error("Selecione um Canal.");
      return;
    }

    if (formCanalOrigem.origens.length === 0) {
      toast.error("Selecione pelo menos uma Origem.");
      return;
    }

    setSavingCanalOrigem(true);

    try {
      const resultado = await inserirCanaisOrigensCRM({
        data: {
          canal: formCanalOrigem.canal,
          origens: formCanalOrigem.origens,
        },
      });

      if (resultado.inseridos > 0 && resultado.duplicados === 0) {
        toast.success(
          `${resultado.inseridos} combinação(ões) de Canal e Origem adicionada(s) com sucesso.`,
        );
      } else if (resultado.inseridos > 0) {
        toast.warning(
          `${resultado.inseridos} combinação(ões) adicionada(s). ${resultado.duplicados} já estavam cadastrada(s) por você e não foram duplicadas.`,
        );
      } else if (resultado.duplicados > 0) {
        toast.warning(
          "Todas as combinações selecionadas já estavam cadastradas por você.",
        );
      }

      setPageCanalOrigem(0);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cadastro-canais-origens"] }),
        queryClient.invalidateQueries({ queryKey: ["registros-canal-origem"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["filtros-usuarios-setores"] }),
      ]);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao gravar as combinações de Canal e Origem.",
      );
    } finally {
      setSavingCanalOrigem(false);
    }
  }

  async function salvarClassificacao() {
    if (!obrigatoriosClassificacao) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSavingClassificacao(true);

    try {
      const resultado = await inserirClassificacoesCRM({
        data: {
          tipo: form.tipo!,
          assunto: form.assunto!,
          subassuntos: subassuntosSelecionados,
          area: form.area!,
          detalhe: cad?.configuracao.exibirDetalheOcorrencia
            ? form.detalhe
            : null,
          criticidade: form.criticidade!,
        },
      });

      setPage(0);

      if (resultado.inseridos > 0 && resultado.duplicados === 0) {
        toast.success(
          `${resultado.inseridos} tabulação(ões) adicionada(s) com sucesso.`,
        );
      } else if (resultado.inseridos > 0) {
        toast.warning(
          `${resultado.inseridos} tabulação(ões) adicionada(s). ${resultado.duplicados} já haviam sido inserida(s) por você e não foram duplicadas.`,
        );
      } else if (resultado.duplicados > 0) {
        toast.warning("Esta tabulação já foi inserida por você.");
      }

      await invalidarDados();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao gravar a tabulação.",
      );
    } finally {
      setSavingClassificacao(false);
    }
  }

  async function adicionarClassificacao() {
    if (!obrigatoriosClassificacao) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (subassuntosSelecionados.length === 0) {
      setConfirmarSemSubassunto(true);
      return;
    }

    await salvarClassificacao();
  }

  async function excluirCanalOrigem() {
    if (!delCanalOrigem) return;

    setDeleting(true);

    try {
      await excluirCanalOrigemCRM({ data: { id: delCanalOrigem.id_registro } });
      toast.success("Registro de Canal e Origem excluído.");
      setDelCanalOrigem(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cadastro-canais-origens"] }),
        queryClient.invalidateQueries({ queryKey: ["registros-canal-origem"] }),
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

  async function excluir() {
    if (!del) return;

    setDeleting(true);

    try {
      await excluirTabulacaoCRM({ data: { id: del.id_registro } });
      toast.success("Registro marcado como excluído.");
      setDel(null);
      await invalidarDados();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Não foi possível excluir.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function abrirEdicaoCriticidade(row: TabulacaoCRM) {
    const atual = cad?.criticidade.find((item) => item.nome === row.criticidade);
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
      toast.error(
        error instanceof Error ? error.message : "Não foi possível editar.",
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  if (cadastros.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (cadastros.isError || !cad) {
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
          Canal/Origem e Classificação da Ocorrência são coletados de forma independente.
        </p>
      </div>

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList>
          <TabsTrigger value="canal-origem">Canal e Origem</TabsTrigger>
          <TabsTrigger value="classificacao">Classificação da Ocorrência</TabsTrigger>
        </TabsList>

        <TabsContent value="canal-origem" className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Campo label="Canal" req>
                <SearchSelect
                  options={cad.canal}
                  value={formCanalOrigem.canal}
                  onChange={(value) =>
                    setFormCanalOrigem((atual) => ({ ...atual, canal: value }))
                  }
                  clearable
                />
              </Campo>

              <div className="space-y-1.5 md:col-span-2">
                <Label>
                  Origens
                  <span className="text-destructive"> *</span>
                </Label>
                <CheckboxMultiSelect
                  options={cad.origem}
                  selectedIds={formCanalOrigem.origens}
                  onChange={(origens) =>
                    setFormCanalOrigem((atual) => ({ ...atual, origens }))
                  }
                  searchPlaceholder="Buscar Origem..."
                  emptyMessage="Nenhuma Origem disponível."
                  disabled={savingCanalOrigem}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                onClick={adicionarCanalOrigem}
                disabled={savingCanalOrigem || !obrigatoriosCanalOrigem}
              >
                {savingCanalOrigem ? <Loader2 className="animate-spin" /> : <Plus />}
                Adicionar Canal e Origens
              </Button>

              <Button
                variant="outline"
                onClick={() => setFormCanalOrigem(canalOrigemVazio)}
                disabled={savingCanalOrigem}
              >
                <Eraser />
                Limpar campos
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 md:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Canais e Origens cadastrados</h2>
                <p className="text-sm text-muted-foreground">
                  {canaisOrigens.isFetching
                    ? "Atualizando..."
                    : `${totalCanalOrigem} registro(s) ativo(s) cadastrado(s) por você.`}
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Por página</span>
                <select
                  className="h-8 rounded-md border border-input bg-card px-2"
                  value={pageSizeCanalOrigem}
                  onChange={(event) =>
                    setPageSizeCanalOrigem(Number(event.target.value))
                  }
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>

            {canaisOrigens.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : canaisOrigens.isError ? (
              <p className="text-sm text-destructive">
                Não foi possível carregar os registros de Canal e Origem.
              </p>
            ) : canaisOrigens.data?.rows.length ? (
              <CanaisOrigensTable
                rows={canaisOrigens.data.rows}
                usuarioAtualId={id.usuarioId}
                onExcluir={setDelCanalOrigem}
                mostrarAuditoriaExclusao={false}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum Canal e Origem cadastrado ainda.
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                Total: {totalCanalOrigem} registro(s)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageCanalOrigem === 0}
                  onClick={() => setPageCanalOrigem((current) => current - 1)}
                >
                  Anterior
                </Button>
                <span>
                  Página {pageCanalOrigem + 1} de {pagesCanalOrigem}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageCanalOrigem + 1 >= pagesCanalOrigem}
                  onClick={() => setPageCanalOrigem((current) => current + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="classificacao" className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Campo label="Tipo de Ocorrência" req>
                <SearchSelect
                  options={cad.tipo}
                  value={form.tipo}
                  onChange={(value) =>
                    setForm((atual) => ({ ...atual, tipo: value }))
                  }
                  clearable
                />
              </Campo>

              <Campo label="Área de Interesse" req>
                <SearchSelect
                  options={cad.area}
                  value={form.area}
                  onChange={(value) =>
                    setForm((atual) => ({ ...atual, area: value }))
                  }
                  clearable
                />
              </Campo>

              <Campo label="Assunto" req>
                <SearchSelect
                  options={cad.assunto}
                  value={form.assunto}
                  onChange={(value) => {
                    setSubassuntosSelecionados([]);
                    setForm((atual) => ({ ...atual, assunto: value }));
                  }}
                  clearable
                />
              </Campo>

              <Campo label="Grau de Criticidade" req>
                <SearchSelect
                  options={cad.criticidade}
                  value={form.criticidade}
                  onChange={(value) =>
                    setForm((atual) => ({ ...atual, criticidade: value }))
                  }
                />
              </Campo>

              <div className="space-y-1.5 md:col-span-2">
                <Label>Subassuntos relacionados</Label>

                {form.assunto == null ? (
                  <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    Selecione um Assunto para visualizar os Subassuntos relacionados.
                  </div>
                ) : subassuntosRelacionados.isLoading ? (
                  <div className="flex justify-center rounded-lg border py-10">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                ) : (
                  <CheckboxMultiSelect
                    options={subassuntosRelacionados.data ?? []}
                    selectedIds={subassuntosSelecionados}
                    onChange={setSubassuntosSelecionados}
                    searchPlaceholder="Buscar Subassunto..."
                    emptyMessage="Este Assunto não possui Subassuntos relacionados. A inclusão poderá ser feita sem Subassunto."
                  />
                )}
              </div>

              {cad.configuracao.exibirDetalheOcorrencia && (
                <Campo label="Detalhe da Ocorrência">
                  <SearchSelect
                    options={cad.detalhe}
                    value={form.detalhe}
                    onChange={(value) =>
                      setForm((atual) => ({ ...atual, detalhe: value }))
                    }
                    clearable
                  />
                </Campo>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                onClick={adicionarClassificacao}
                disabled={savingClassificacao || !obrigatoriosClassificacao}
              >
                {savingClassificacao ? <Loader2 className="animate-spin" /> : <Plus />}
                Adicionar Tabulação
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setForm({ ...classificacaoVazia, criticidade: normalId });
                  setSubassuntosSelecionados([]);
                }}
                disabled={savingClassificacao}
              >
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
                  {tabulacoes.isFetching
                    ? "Atualizando..."
                    : `${total} registro(s) ativo(s) cadastrado(s) por você.`}
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
                onEditarCriticidade={abrirEdicaoCriticidade}
                mostrarDetalhe={cad.configuracao.exibirDetalheOcorrencia}
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
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={confirmarSemSubassunto}
        onOpenChange={setConfirmarSemSubassunto}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nenhum Subassunto selecionado</AlertDialogTitle>
            <AlertDialogDescription>
              Nenhum Subassunto está selecionado. Deseja mesmo assim prosseguir?
              Será criada uma tabulação sem Subassunto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmarSemSubassunto(false);
                void salvarClassificacao();
              }}
            >
              Sim, prosseguir
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
              O registro será marcado como excluído. Canal: <b>{delCanalOrigem?.canal}</b> · Origem:{" "}
              <b>{delCanalOrigem?.origem}</b>.
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
              options={cad.criticidade}
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
