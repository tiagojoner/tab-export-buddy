//crm/src/routes/cadastros.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Loader2, Plus, Save, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { CheckboxMultiSelect } from "@/components/CheckboxMultiSelect";
import { SearchSelect } from "@/components/SearchSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  carregarCadastrosAdminCRM,
  carregarRelacionamentosAssuntoAdminCRM,
  carregarRelacionamentosSubassuntoAdminCRM,
  salvarCadastroAdminCRM,
  salvarRelacionamentosAssuntoAdminCRM,
  salvarRelacionamentosSubassuntoAdminCRM,
  type CadastroAdminItem,
  type CadastroAdminTipo,
  type RelacionamentoAdminItem,
} from "@/lib/admin.functions";
import type { Identidade } from "@/lib/session";

export const Route = createFileRoute("/cadastros")({
  head: () => ({
    meta: [
      { title: "Cadastro — Gestor de Tabulações CRM" },
      {
        name: "description",
        content:
          "Gestão administrativa de Assuntos, Subassuntos, Detalhes da Ocorrência e seus relacionamentos.",
      },
    ],
  }),
  component: () => <AppShell>{(id) => <Cadastros id={id} />}</AppShell>,
});

type Edicao = {
  cadastro: CadastroAdminTipo;
  item: CadastroAdminItem | null;
};

function normalizar(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function rotuloCadastro(cadastro: CadastroAdminTipo) {
  if (cadastro === "assunto") return "Assunto";
  if (cadastro === "subassunto") return "Subassunto";
  return "Detalhe da Ocorrência";
}

function formatarDataHora(value: string | null) {
  if (!value) return "—";

  const data = new Date(value);

  if (Number.isNaN(data.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function UltimaAlteracao({
  nome,
  data,
}: {
  nome: string | null;
  data: string | null;
}) {
  if (!nome || !data) {
    return <span className="text-muted-foreground">Sem alteração</span>;
  }

  return (
    <div>
      <div>{nome}</div>
      <div className="text-xs text-muted-foreground">{formatarDataHora(data)}</div>
    </div>
  );
}

function ListaCadastro({
  cadastro,
  items,
  busca,
  onBusca,
  onNovo,
  onEditar,
}: {
  cadastro: CadastroAdminTipo;
  items: CadastroAdminItem[];
  busca: string;
  onBusca: (value: string) => void;
  onNovo: (cadastro: CadastroAdminTipo) => void;
  onEditar: (cadastro: CadastroAdminTipo, item: CadastroAdminItem) => void;
}) {
  const rotulo = rotuloCadastro(cadastro);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={busca}
          onChange={(event) => onBusca(event.target.value)}
          placeholder={`Buscar ${rotulo}...`}
          className="max-w-md"
        />

        <Button onClick={() => onNovo(cadastro)}>
          <Plus />
          Novo {rotulo}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {items.length} registro(s) encontrado(s)
      </div>

      <div className="max-h-[62vh] overflow-auto rounded-xl border bg-card">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="sticky top-0 z-10 bg-secondary text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="w-24 px-3 py-2 font-medium">Status</th>
              <th className="w-52 px-3 py-2 font-medium">Criado por</th>
              <th className="w-40 px-3 py-2 font-medium">Criado em</th>
              <th className="w-56 px-3 py-2 font-medium">Última alteração</th>
              <th className="w-20 px-3 py-2 text-center font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2">{item.nome}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      item.ativo
                        ? "font-medium text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    {item.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-3 py-2">{item.criadoPorNome}</td>
                <td className="px-3 py-2">{formatarDataHora(item.criadoEm)}</td>
                <td className="px-3 py-2">
                  <UltimaAlteracao
                    nome={item.alteradoPorNome}
                    data={item.alteradoEm}
                  />
                </td>
                <td className="px-3 py-1 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${item.nome}`}
                    onClick={() => onEditar(cadastro, item)}
                  >
                    <Edit3 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-10 text-center text-muted-foreground"
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabelaRastreabilidadeRelacionamentos({
  titulo,
  items,
}: {
  titulo: string;
  items: RelacionamentoAdminItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-5 space-y-2">
      <div>
        <h3 className="text-sm font-semibold">Rastreabilidade dos vínculos salvos</h3>
        <p className="text-xs text-muted-foreground">
          Autoria de criação e última alteração dos relacionamentos atualmente cadastrados.
        </p>
      </div>

      <div className="max-h-72 overflow-auto rounded-lg border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="sticky top-0 bg-secondary text-left">
            <tr>
              <th className="px-3 py-2 font-medium">{titulo}</th>
              <th className="w-52 px-3 py-2 font-medium">Criado por</th>
              <th className="w-40 px-3 py-2 font-medium">Criado em</th>
              <th className="w-56 px-3 py-2 font-medium">Última alteração</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2">{item.nome}</td>
                <td className="px-3 py-2">{item.criadoPorNome}</td>
                <td className="px-3 py-2">{formatarDataHora(item.criadoEm)}</td>
                <td className="px-3 py-2">
                  <UltimaAlteracao
                    nome={item.alteradoPorNome}
                    data={item.alteradoEm}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cadastros({ id }: { id: Identidade }) {
  const queryClient = useQueryClient();
  const [aba, setAba] = useState("assunto");
  const [buscaAssunto, setBuscaAssunto] = useState("");
  const [buscaSubassunto, setBuscaSubassunto] = useState("");
  const [buscaDetalhe, setBuscaDetalhe] = useState("");

  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [ativoEdicao, setAtivoEdicao] = useState(true);
  const [salvandoItem, setSalvandoItem] = useState(false);

  const [assuntoRelacionamento, setAssuntoRelacionamento] =
    useState<number | null>(null);
  const [subassuntosRelacionados, setSubassuntosRelacionados] = useState<
    number[]
  >([]);
  const [salvandoRelacionamentoAssunto, setSalvandoRelacionamentoAssunto] =
    useState(false);

  const [subassuntoRelacionamento, setSubassuntoRelacionamento] =
    useState<number | null>(null);
  const [detalhesRelacionados, setDetalhesRelacionados] = useState<number[]>([]);
  const [salvandoRelacionamentoDetalhe, setSalvandoRelacionamentoDetalhe] =
    useState(false);

  const dados = useQuery({
    queryKey: ["cadastros-admin"],
    queryFn: carregarCadastrosAdminCRM,
    enabled: id.perfil === "ADMINISTRADOR",
    staleTime: 60_000,
  });

  const relacionamentosAssunto = useQuery({
    queryKey: ["relacionamentos-assunto-admin", assuntoRelacionamento],
    enabled: id.perfil === "ADMINISTRADOR" && assuntoRelacionamento != null,
    queryFn: () =>
      carregarRelacionamentosAssuntoAdminCRM({
        data: { assuntoId: assuntoRelacionamento! },
      }),
  });

  const relacionamentosSubassunto = useQuery({
    queryKey: ["relacionamentos-subassunto-admin", subassuntoRelacionamento],
    enabled: id.perfil === "ADMINISTRADOR" && subassuntoRelacionamento != null,
    queryFn: () =>
      carregarRelacionamentosSubassuntoAdminCRM({
        data: { subassuntoId: subassuntoRelacionamento! },
      }),
  });

  useEffect(() => {
    if (assuntoRelacionamento == null) {
      setSubassuntosRelacionados([]);
      return;
    }

    if (relacionamentosAssunto.data) {
      setSubassuntosRelacionados(
        relacionamentosAssunto.data.map((item) => item.id),
      );
    }
  }, [assuntoRelacionamento, relacionamentosAssunto.data]);

  useEffect(() => {
    if (subassuntoRelacionamento == null) {
      setDetalhesRelacionados([]);
      return;
    }

    if (relacionamentosSubassunto.data) {
      setDetalhesRelacionados(
        relacionamentosSubassunto.data.map((item) => item.id),
      );
    }
  }, [subassuntoRelacionamento, relacionamentosSubassunto.data]);

  const assuntos = dados.data?.assuntos ?? [];
  const subassuntos = dados.data?.subassuntos ?? [];
  const detalhes = dados.data?.detalhes ?? [];

  const assuntosAtivos = useMemo(
    () => assuntos.filter((item) => item.ativo),
    [assuntos],
  );

  const subassuntosAtivos = useMemo(
    () => subassuntos.filter((item) => item.ativo),
    [subassuntos],
  );

  const detalhesAtivos = useMemo(
    () => detalhes.filter((item) => item.ativo),
    [detalhes],
  );

  const assuntosFiltrados = useMemo(() => {
    const termo = normalizar(buscaAssunto.trim());
    return termo
      ? assuntos.filter((item) => normalizar(item.nome).includes(termo))
      : assuntos;
  }, [assuntos, buscaAssunto]);

  const subassuntosFiltrados = useMemo(() => {
    const termo = normalizar(buscaSubassunto.trim());
    return termo
      ? subassuntos.filter((item) => normalizar(item.nome).includes(termo))
      : subassuntos;
  }, [subassuntos, buscaSubassunto]);

  const detalhesFiltrados = useMemo(() => {
    const termo = normalizar(buscaDetalhe.trim());
    return termo
      ? detalhes.filter((item) => normalizar(item.nome).includes(termo))
      : detalhes;
  }, [detalhes, buscaDetalhe]);

  if (id.perfil !== "ADMINISTRADOR") {
    return (
      <div className="mx-auto max-w-xl rounded-xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 text-destructive" />
          <div>
            <h1 className="font-semibold">Acesso restrito</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta área está disponível somente para usuários Administradores.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (dados.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (dados.isError || !dados.data) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-destructive">
        Não foi possível carregar os cadastros administrativos.
      </div>
    );
  }

  function abrirNovo(cadastro: CadastroAdminTipo) {
    setEdicao({ cadastro, item: null });
    setNomeEdicao("");
    setAtivoEdicao(true);
  }

  function abrirEdicao(cadastro: CadastroAdminTipo, item: CadastroAdminItem) {
    setEdicao({ cadastro, item });
    setNomeEdicao(item.nome);
    setAtivoEdicao(item.ativo);
  }

  async function salvarItem() {
    if (!edicao || !nomeEdicao.trim()) return;

    setSalvandoItem(true);

    try {
      const resultado = await salvarCadastroAdminCRM({
        data: {
          cadastro: edicao.cadastro,
          id: edicao.item?.id ?? null,
          nome: nomeEdicao.trim(),
          ativo: ativoEdicao,
        },
      });

      if (!resultado.ok) {
        toast.error("Já existe um cadastro com este nome.");
        return;
      }

      toast.success(`${rotuloCadastro(edicao.cadastro)} salvo com sucesso.`);
      setEdicao(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cadastros-admin"] }),
        queryClient.invalidateQueries({ queryKey: ["cadastros"] }),
        queryClient.invalidateQueries({ queryKey: ["subassuntos-relacionados"] }),
        queryClient.invalidateQueries({
          queryKey: ["detalhes-por-subassuntos"],
        }),
      ]);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o cadastro.",
      );
    } finally {
      setSalvandoItem(false);
    }
  }

  async function salvarRelacionamentosAssunto() {
    if (assuntoRelacionamento == null) return;

    setSalvandoRelacionamentoAssunto(true);

    try {
      const resultado = await salvarRelacionamentosAssuntoAdminCRM({
        data: {
          assuntoId: assuntoRelacionamento,
          subassuntoIds: subassuntosRelacionados,
        },
      });

      toast.success(
        `${resultado.quantidade} relacionamento(s) salvo(s) para o Assunto selecionado.`,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["relacionamentos-assunto-admin"],
        }),
        queryClient.invalidateQueries({ queryKey: ["subassuntos-relacionados"] }),
        queryClient.invalidateQueries({
          queryKey: ["detalhes-por-subassuntos"],
        }),
      ]);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar os relacionamentos.",
      );
    } finally {
      setSalvandoRelacionamentoAssunto(false);
    }
  }

  async function salvarRelacionamentosSubassunto() {
    if (subassuntoRelacionamento == null) return;

    setSalvandoRelacionamentoDetalhe(true);

    try {
      const resultado = await salvarRelacionamentosSubassuntoAdminCRM({
        data: {
          subassuntoId: subassuntoRelacionamento,
          detalheIds: detalhesRelacionados,
        },
      });

      toast.success(
        `${resultado.quantidade} relacionamento(s) salvo(s) para o Subassunto selecionado.`,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["relacionamentos-subassunto-admin"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["detalhes-por-subassuntos"],
        }),
      ]);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar os relacionamentos.",
      );
    } finally {
      setSalvandoRelacionamentoDetalhe(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Cadastro</h1>
        <p className="text-sm text-muted-foreground">
          Gestão administrativa de Assuntos, Subassuntos, Detalhes da Ocorrência e seus relacionamentos.
        </p>
      </div>

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="assunto">Assuntos</TabsTrigger>
          <TabsTrigger value="subassunto">Subassuntos</TabsTrigger>
          <TabsTrigger value="detalhe">Detalhes da Ocorrência</TabsTrigger>
          <TabsTrigger value="rel-assunto-subassunto">
            Assunto x Subassunto
          </TabsTrigger>
          <TabsTrigger value="rel-subassunto-detalhe">
            Subassunto x Detalhe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assunto" className="pt-2">
          <ListaCadastro
            cadastro="assunto"
            items={assuntosFiltrados}
            busca={buscaAssunto}
            onBusca={setBuscaAssunto}
            onNovo={abrirNovo}
            onEditar={abrirEdicao}
          />
        </TabsContent>

        <TabsContent value="subassunto" className="pt-2">
          <ListaCadastro
            cadastro="subassunto"
            items={subassuntosFiltrados}
            busca={buscaSubassunto}
            onBusca={setBuscaSubassunto}
            onNovo={abrirNovo}
            onEditar={abrirEdicao}
          />
        </TabsContent>

        <TabsContent value="detalhe" className="pt-2">
          <ListaCadastro
            cadastro="detalhe_ocorrencia"
            items={detalhesFiltrados}
            busca={buscaDetalhe}
            onBusca={setBuscaDetalhe}
            onNovo={abrirNovo}
            onEditar={abrirEdicao}
          />
        </TabsContent>

        <TabsContent value="rel-assunto-subassunto" className="space-y-4 pt-2">
          <div className="rounded-xl border bg-card p-5">
            <div className="max-w-xl space-y-1.5">
              <Label>Assunto *</Label>
              <SearchSelect
                options={assuntosAtivos}
                value={assuntoRelacionamento}
                onChange={(value) => {
                  setAssuntoRelacionamento(value);
                  setSubassuntosRelacionados([]);
                }}
                clearable
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {assuntoRelacionamento == null
              ? 0
              : (relacionamentosAssunto.data?.length ?? 0)}{" "}
            registro(s) encontrado(s)
          </div>

          {assuntoRelacionamento != null && (
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-3">
                <h2 className="font-semibold">Subassuntos vinculados</h2>
                <p className="text-sm text-muted-foreground">
                  Marque todos os Subassuntos que pertencem ao Assunto selecionado.
                </p>
              </div>

              {relacionamentosAssunto.isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <CheckboxMultiSelect
                    options={subassuntosAtivos}
                    selectedIds={subassuntosRelacionados}
                    onChange={setSubassuntosRelacionados}
                    searchPlaceholder="Buscar Subassunto..."
                    emptyMessage="Nenhum Subassunto ativo disponível."
                  />

                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={salvarRelacionamentosAssunto}
                      disabled={salvandoRelacionamentoAssunto}
                    >
                      {salvandoRelacionamentoAssunto ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Save />
                      )}
                      Salvar relacionamentos
                    </Button>
                  </div>

                  <TabelaRastreabilidadeRelacionamentos
                    titulo="Subassunto"
                    items={relacionamentosAssunto.data ?? []}
                  />
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rel-subassunto-detalhe" className="space-y-4 pt-2">
          <div className="rounded-xl border bg-card p-5">
            <div className="max-w-xl space-y-1.5">
              <Label>Subassunto *</Label>
              <SearchSelect
                options={subassuntosAtivos}
                value={subassuntoRelacionamento}
                onChange={(value) => {
                  setSubassuntoRelacionamento(value);
                  setDetalhesRelacionados([]);
                }}
                clearable
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {subassuntoRelacionamento == null
              ? 0
              : (relacionamentosSubassunto.data?.length ?? 0)}{" "}
            registro(s) encontrado(s)
          </div>

          {subassuntoRelacionamento != null && (
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-3">
                <h2 className="font-semibold">Detalhes da Ocorrência vinculados</h2>
                <p className="text-sm text-muted-foreground">
                  Marque todos os Detalhes da Ocorrência que pertencem ao Subassunto selecionado.
                </p>
              </div>

              {relacionamentosSubassunto.isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <CheckboxMultiSelect
                    options={detalhesAtivos}
                    selectedIds={detalhesRelacionados}
                    onChange={setDetalhesRelacionados}
                    searchPlaceholder="Buscar Detalhe da Ocorrência..."
                    emptyMessage="Nenhum Detalhe da Ocorrência ativo disponível."
                  />

                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={salvarRelacionamentosSubassunto}
                      disabled={salvandoRelacionamentoDetalhe}
                    >
                      {salvandoRelacionamentoDetalhe ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Save />
                      )}
                      Salvar relacionamentos
                    </Button>
                  </div>

                  <TabelaRastreabilidadeRelacionamentos
                    titulo="Detalhe da Ocorrência"
                    items={relacionamentosSubassunto.data ?? []}
                  />
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!edicao} onOpenChange={(open) => !open && setEdicao(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {edicao?.item ? "Editar" : "Novo"}{" "}
              {edicao ? rotuloCadastro(edicao.cadastro) : "Cadastro"}
            </DialogTitle>
            <DialogDescription>
              Informe o nome e defina se o cadastro ficará ativo para uso nas tabulações.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={nomeEdicao}
                onChange={(event) => setNomeEdicao(event.target.value)}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Ativo</div>
                <div className="text-xs text-muted-foreground">
                  Cadastros inativos deixam de aparecer para novas tabulações.
                </div>
              </div>
              <Switch checked={ativoEdicao} onCheckedChange={setAtivoEdicao} />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEdicao(null)}
              disabled={salvandoItem}
            >
              Cancelar
            </Button>
            <Button
              onClick={salvarItem}
              disabled={salvandoItem || !nomeEdicao.trim()}
            >
              {salvandoItem ? <Loader2 className="animate-spin" /> : <Save />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
