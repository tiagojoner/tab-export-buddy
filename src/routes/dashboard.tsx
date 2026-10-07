//crm/src/routes/dashboard.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CircleAlert,
  Database,
  Loader2,
  Users,
  UserRoundCheck,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  carregarDashboardAdesaoCRM,
  type DashboardSetorAdesaoCRM,
  type DashboardUsuarioAdesaoCRM,
} from "@/lib/crm.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gestor de Tabulações CRM" },
      {
        name: "description",
        content: "Acompanhamento da adesão de usuários e setores às tabulações do CRM.",
      },
      { property: "og:title", content: "Dashboard" },
      {
        property: "og:description",
        content: "Acompanhamento da adesão de usuários e setores às tabulações do CRM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell>{() => <Dashboard />}</AppShell>,
});

type FiltroParticipacao = "todos" | "com" | "sem";

function percentual(parte: number, total: number): string {
  if (total <= 0) return "0%";

  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format((parte / total) * 100)}%`;
}

function formatarData(value: string | null, vazio = "Nunca cadastrou"): string {
  if (!value) return vazio;

  return new Date(value).toLocaleString("pt-BR");
}

function CardIndicador({
  titulo,
  valor,
  apoio,
  icone,
  previa,
  acao,
  onClick,
}: {
  titulo: string;
  valor: ReactNode;
  apoio?: string;
  icone: ReactNode;
  previa?: string[];
  acao?: string;
  onClick?: () => void;
}) {
  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">{titulo}</div>
          <div className="mt-1 text-2xl font-semibold text-primary">{valor}</div>
          {apoio && <div className="mt-1 text-xs text-muted-foreground">{apoio}</div>}
        </div>
        <div className="rounded-lg bg-muted p-2 text-muted-foreground">{icone}</div>
      </div>

      {previa && previa.length > 0 && (
        <div className="mt-3 space-y-1 border-t pt-3 text-xs text-muted-foreground">
          {previa.slice(0, 3).map((item) => (
            <div key={item} className="truncate" title={item}>
              {item}
            </div>
          ))}
          {previa.length > 3 && <div>+{previa.length - 3} outro(s)</div>}
        </div>
      )}

      {acao && (
        <div className="mt-3 text-xs font-medium text-primary">{acao}</div>
      )}
    </>
  );

  const classe =
    "rounded-xl border bg-card p-4 text-left shadow-sm transition-colors";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${classe} w-full hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      >
        {conteudo}
      </button>
    );
  }

  return <div className={classe}>{conteudo}</div>;
}

function Dashboard() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: carregarDashboardAdesaoCRM,
  });

  const [filtroUsuarios, setFiltroUsuarios] =
    useState<FiltroParticipacao>("todos");
  const [filtroSetores, setFiltroSetores] =
    useState<FiltroParticipacao>("todos");

  const usuariosRef = useRef<HTMLDivElement>(null);
  const setoresRef = useRef<HTMLDivElement>(null);

  const usuariosFiltrados = useMemo(() => {
    const usuarios = query.data?.usuarios ?? [];

    if (filtroUsuarios === "com") {
      return usuarios.filter((item) => item.quantidadeAtivas > 0);
    }

    if (filtroUsuarios === "sem") {
      return usuarios.filter((item) => item.quantidadeAtivas === 0);
    }

    return usuarios;
  }, [filtroUsuarios, query.data?.usuarios]);

  const setoresFiltrados = useMemo(() => {
    const setores = query.data?.setores ?? [];

    if (filtroSetores === "com") {
      return setores.filter((item) => item.usuariosParticipantes > 0);
    }

    if (filtroSetores === "sem") {
      return setores.filter((item) => item.usuariosParticipantes === 0);
    }

    return setores;
  }, [filtroSetores, query.data?.setores]);

  function irParaUsuarios(filtro: FiltroParticipacao) {
    setFiltroUsuarios(filtro);
    requestAnimationFrame(() => {
      usuariosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function irParaSetores(filtro: FiltroParticipacao) {
    setFiltroSetores(filtro);
    requestAnimationFrame(() => {
      setoresRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-destructive">
        Não foi possível carregar os indicadores de adesão no PostgreSQL.
      </div>
    );
  }

  const { resumo, usuarios, setores } = query.data;
  const usuariosSemCadastro = usuarios.filter((item) => item.quantidadeAtivas === 0);
  const setoresSemCadastro = setores.filter((item) => item.usuariosParticipantes === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe a participação dos usuários e setores na construção das tabulações.
        </p>
      </div>

      {(resumo.usuariosSemCadastro > 0 || resumo.setoresSemCadastro > 0) ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            <div className="font-medium">Há participação pendente.</div>
            <div className="mt-1">
              {resumo.usuariosSemCadastro > 0 && (
                <>
                  {resumo.usuariosSemCadastro} usuário(s) ativo(s) ainda não possuem
                  cadastro ativo.
                </>
              )}
              {resumo.usuariosSemCadastro > 0 && resumo.setoresSemCadastro > 0 && " "}
              {resumo.setoresSemCadastro > 0 && (
                <>
                  {resumo.setoresSemCadastro} setor(es) ainda não possuem nenhuma
                  tabulação ativa.
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950">
          Todos os usuários e setores ativos já possuem participação no cadastramento.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <CardIndicador
          titulo="Tabulações ativas"
          valor={resumo.totalAtivas}
          apoio="Volume total atual da base."
          icone={<Database className="size-5" />}
        />

        <CardIndicador
          titulo="Minhas tabulações"
          valor={resumo.minhasTabulacoes}
          apoio="Registros ativos do usuário logado."
          icone={<UserRoundCheck className="size-5" />}
        />

        <CardIndicador
          titulo="Usuários participantes"
          valor={`${resumo.usuariosParticipantes} de ${resumo.usuariosAtivos}`}
          apoio={`${percentual(
            resumo.usuariosParticipantes,
            resumo.usuariosAtivos,
          )} dos usuários ativos`}
          icone={<Users className="size-5" />}
          acao="Ver usuários participantes"
          onClick={() => irParaUsuarios("com")}
        />

        <CardIndicador
          titulo="Usuários sem cadastros"
          valor={resumo.usuariosSemCadastro}
          apoio="Usuários ativos com 0 tabulações ativas."
          icone={<Users className="size-5" />}
          previa={usuariosSemCadastro.map(
            (item) => `${item.nomeUsuario} · ${item.setor}`,
          )}
          acao="Ver usuários sem cadastro"
          onClick={() => irParaUsuarios("sem")}
        />

        <CardIndicador
          titulo="Setores participantes"
          valor={`${resumo.setoresParticipantes} de ${resumo.setoresAtivos}`}
          apoio={`${percentual(
            resumo.setoresParticipantes,
            resumo.setoresAtivos,
          )} dos setores com usuários ativos`}
          icone={<Building2 className="size-5" />}
          acao="Ver setores participantes"
          onClick={() => irParaSetores("com")}
        />

        <CardIndicador
          titulo="Setores sem cadastros"
          valor={resumo.setoresSemCadastro}
          apoio="Setores sem qualquer tabulação ativa."
          icone={<Building2 className="size-5" />}
          previa={setoresSemCadastro.map((item) => item.setor)}
          acao="Ver setores sem cadastro"
          onClick={() => irParaSetores("sem")}
        />
      </div>

      <div ref={usuariosRef} className="scroll-mt-4 rounded-xl border bg-card p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Participação por usuário</h2>
            <p className="text-sm text-muted-foreground">
              Prioriza quem possui 0 registros e, depois, quem possui menor participação.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filtroUsuarios === "todos" ? "default" : "outline"}
              onClick={() => setFiltroUsuarios("todos")}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={filtroUsuarios === "com" ? "default" : "outline"}
              onClick={() => setFiltroUsuarios("com")}
            >
              Com cadastros
            </Button>
            <Button
              size="sm"
              variant={filtroUsuarios === "sem" ? "default" : "outline"}
              onClick={() => setFiltroUsuarios("sem")}
            >
              Sem cadastros
            </Button>
          </div>
        </div>

        <div className="max-h-[460px] overflow-auto rounded-md border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Usuário</th>
                <th className="px-3 py-2 font-medium">Setor</th>
                <th className="px-3 py-2 text-right font-medium">Tabulações</th>
                <th className="px-3 py-2 font-medium">Último cadastro</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((item: DashboardUsuarioAdesaoCRM) => (
                <tr key={item.usuarioId} className="border-t">
                  <td className="px-3 py-2 font-medium">{item.nomeUsuario}</td>
                  <td className="px-3 py-2">{item.setor}</td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={
                        item.quantidadeAtivas === 0
                          ? "font-semibold text-destructive"
                          : "font-medium"
                      }
                    >
                      {item.quantidadeAtivas}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {formatarData(item.ultimoCadastro)}
                  </td>
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                    Nenhum usuário encontrado para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div ref={setoresRef} className="scroll-mt-4 rounded-xl border bg-card p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Participação por setor</h2>
            <p className="text-sm text-muted-foreground">
              Destaca primeiro os setores com maior quantidade de usuários sem cadastro.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filtroSetores === "todos" ? "default" : "outline"}
              onClick={() => setFiltroSetores("todos")}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={filtroSetores === "com" ? "default" : "outline"}
              onClick={() => setFiltroSetores("com")}
            >
              Com cadastros
            </Button>
            <Button
              size="sm"
              variant={filtroSetores === "sem" ? "default" : "outline"}
              onClick={() => setFiltroSetores("sem")}
            >
              Sem cadastros
            </Button>
          </div>
        </div>

        <div className="max-h-[460px] overflow-auto rounded-md border">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Setor</th>
                <th className="px-3 py-2 text-right font-medium">Usuários</th>
                <th className="px-3 py-2 text-right font-medium">Participantes</th>
                <th className="px-3 py-2 text-right font-medium">Sem cadastro</th>
                <th className="px-3 py-2 text-right font-medium">Tabulações</th>
                <th className="px-3 py-2 font-medium">Último cadastro</th>
              </tr>
            </thead>
            <tbody>
              {setoresFiltrados.map((item: DashboardSetorAdesaoCRM) => (
                <tr key={item.setor} className="border-t">
                  <td className="px-3 py-2 font-medium">{item.setor}</td>
                  <td className="px-3 py-2 text-right">{item.totalUsuarios}</td>
                  <td className="px-3 py-2 text-right">{item.usuariosParticipantes}</td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={
                        item.usuariosSemCadastro > 0
                          ? "font-semibold text-destructive"
                          : "font-medium"
                      }
                    >
                      {item.usuariosSemCadastro}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">{item.totalTabulacoes}</td>
                  <td className="px-3 py-2">
                    {formatarData(item.ultimoCadastro, "Nenhum cadastro")}
                  </td>
                </tr>
              ))}
              {setoresFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    Nenhum setor encontrado para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
