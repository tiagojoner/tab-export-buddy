//crm/src/routes/dashboard.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Cable, CircleAlert, Database, Loader2, Users } from "lucide-react";
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

type FiltroParticipacao =
  | "todos"
  | "com-classificacao"
  | "sem-classificacao"
  | "com-canal-origem"
  | "sem-canal-origem";

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
  acao,
  onClick,
}: {
  titulo: string;
  valor: ReactNode;
  apoio?: string;
  icone: ReactNode;
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

      {acao && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition-colors group-hover:decoration-primary">
          {acao}
          <span aria-hidden="true">→</span>
        </div>
      )}
    </>
  );

  const classe = "group rounded-xl border bg-card p-4 text-left shadow-sm transition-all";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${classe} w-full cursor-pointer hover:border-primary/40 hover:bg-muted/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
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

  const [filtroUsuarios, setFiltroUsuarios] = useState<FiltroParticipacao>("todos");
  const [filtroSetores, setFiltroSetores] = useState<FiltroParticipacao>("todos");
  const usuariosRef = useRef<HTMLDivElement>(null);
  const setoresRef = useRef<HTMLDivElement>(null);
  const [destaqueTabela, setDestaqueTabela] = useState<"usuarios" | "setores" | null>(null);
  const destaqueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const usuariosFiltrados = useMemo(() => {
    const usuarios = query.data?.usuarios ?? [];

    switch (filtroUsuarios) {
      case "com-classificacao":
        return usuarios.filter((item) => item.classificacoesAtivas > 0);
      case "sem-classificacao":
        return usuarios.filter((item) => item.classificacoesAtivas === 0);
      case "com-canal-origem":
        return usuarios.filter((item) => item.canaisOrigensAtivos > 0);
      case "sem-canal-origem":
        return usuarios.filter((item) => item.canaisOrigensAtivos === 0);
      default:
        return usuarios;
    }
  }, [filtroUsuarios, query.data?.usuarios]);

  const setoresFiltrados = useMemo(() => {
    const setores = query.data?.setores ?? [];

    switch (filtroSetores) {
      case "com-classificacao":
        return setores.filter((item) => item.usuariosParticipantesClassificacao > 0);
      case "sem-classificacao":
        return setores.filter((item) => item.usuariosParticipantesClassificacao === 0);
      case "com-canal-origem":
        return setores.filter((item) => item.usuariosParticipantesCanalOrigem > 0);
      case "sem-canal-origem":
        return setores.filter((item) => item.usuariosParticipantesCanalOrigem === 0);
      default:
        return setores;
    }
  }, [filtroSetores, query.data?.setores]);

  function destacarTabela(tipo: "usuarios" | "setores") {
    if (destaqueTimerRef.current) clearTimeout(destaqueTimerRef.current);

    setDestaqueTabela(tipo);
    destaqueTimerRef.current = setTimeout(() => {
      setDestaqueTabela(null);
      destaqueTimerRef.current = null;
    }, 1600);
  }

  function irParaUsuarios(filtro: FiltroParticipacao) {
    setFiltroUsuarios(filtro);
    destacarTabela("usuarios");
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        usuariosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      ),
    );
  }

  function irParaSetores(filtro: FiltroParticipacao) {
    setFiltroSetores(filtro);
    destacarTabela("setores");
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setoresRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      ),
    );
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

  const { resumo } = query.data;
  const haPendencia =
    resumo.usuariosSemClassificacao > 0 ||
    resumo.usuariosSemCanalOrigem > 0 ||
    resumo.setoresSemClassificacao > 0 ||
    resumo.setoresSemCanalOrigem > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe separadamente a participação em Classificação e em Canal e Origem.
        </p>
      </div>

      {haPendencia ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            <div className="font-medium">Há participação pendente.</div>
            <div className="mt-1">
              Classificação: {resumo.usuariosSemClassificacao} usuário(s) e {resumo.setoresSemClassificacao} setor(es) sem cadastro ativo. Canal e Origem: {resumo.usuariosSemCanalOrigem} usuário(s) e {resumo.setoresSemCanalOrigem} setor(es) sem cadastro ativo.
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950">
          Todos os usuários e setores ativos já possuem participação nos dois tipos de cadastro.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <CardIndicador
          titulo="Classificações ativas"
          valor={resumo.classificacoesAtivas}
          apoio={`${resumo.minhasClassificacoes} cadastrada(s) por você.`}
          icone={<Database className="size-5" />}
        />

        <CardIndicador
          titulo="Canal e Origem ativos"
          valor={resumo.canaisOrigensAtivos}
          apoio={`${resumo.meusCanaisOrigens} cadastrado(s) por você.`}
          icone={<Cable className="size-5" />}
        />

        <CardIndicador
          titulo="Usuários — Classificação"
          valor={`${resumo.usuariosParticipantesClassificacao} de ${resumo.usuariosAtivos}`}
          apoio={`${percentual(resumo.usuariosParticipantesClassificacao, resumo.usuariosAtivos)} dos usuários ativos`}
          icone={<Users className="size-5" />}
          acao="Ver participação em Classificação"
          onClick={() => irParaUsuarios("com-classificacao")}
        />

        <CardIndicador
          titulo="Usuários — Canal e Origem"
          valor={`${resumo.usuariosParticipantesCanalOrigem} de ${resumo.usuariosAtivos}`}
          apoio={`${percentual(resumo.usuariosParticipantesCanalOrigem, resumo.usuariosAtivos)} dos usuários ativos`}
          icone={<Users className="size-5" />}
          acao="Ver participação em Canal e Origem"
          onClick={() => irParaUsuarios("com-canal-origem")}
        />

        <CardIndicador
          titulo="Setores — Classificação"
          valor={`${resumo.setoresParticipantesClassificacao} de ${resumo.setoresAtivos}`}
          apoio={`${percentual(resumo.setoresParticipantesClassificacao, resumo.setoresAtivos)} dos setores ativos`}
          icone={<Building2 className="size-5" />}
          acao="Ver setores com Classificação"
          onClick={() => irParaSetores("com-classificacao")}
        />

        <CardIndicador
          titulo="Setores — Canal e Origem"
          valor={`${resumo.setoresParticipantesCanalOrigem} de ${resumo.setoresAtivos}`}
          apoio={`${percentual(resumo.setoresParticipantesCanalOrigem, resumo.setoresAtivos)} dos setores ativos`}
          icone={<Building2 className="size-5" />}
          acao="Ver setores com Canal e Origem"
          onClick={() => irParaSetores("com-canal-origem")}
        />
      </div>

      <div
        ref={usuariosRef}
        className={`scroll-mt-4 rounded-xl border bg-card p-4 transition-all duration-300 md:p-6 ${
          destaqueTabela === "usuarios"
            ? "animate-pulse border-primary ring-2 ring-primary/50 ring-offset-2 shadow-lg"
            : ""
        }`}
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Participação por usuário</h2>
            <p className="text-sm text-muted-foreground">
              Compare lado a lado quantidades e últimas inclusões dos dois tipos de cadastro.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={filtroUsuarios === "todos" ? "default" : "outline"} onClick={() => setFiltroUsuarios("todos")}>Todos</Button>
            <Button size="sm" variant={filtroUsuarios === "com-classificacao" ? "default" : "outline"} onClick={() => setFiltroUsuarios("com-classificacao")}>Com Classificação</Button>
            <Button size="sm" variant={filtroUsuarios === "sem-classificacao" ? "default" : "outline"} onClick={() => setFiltroUsuarios("sem-classificacao")}>Sem Classificação</Button>
            <Button size="sm" variant={filtroUsuarios === "com-canal-origem" ? "default" : "outline"} onClick={() => setFiltroUsuarios("com-canal-origem")}>Com Canal/Origem</Button>
            <Button size="sm" variant={filtroUsuarios === "sem-canal-origem" ? "default" : "outline"} onClick={() => setFiltroUsuarios("sem-canal-origem")}>Sem Canal/Origem</Button>
          </div>
        </div>

        <div className="max-h-[460px] overflow-auto rounded-md border">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Usuário</th>
                <th className="px-3 py-2 font-medium">Setor</th>
                <th className="px-3 py-2 text-right font-medium">Classificações</th>
                <th className="px-3 py-2 text-right font-medium">Canal/Origem</th>
                <th className="px-3 py-2 font-medium">Última Classificação</th>
                <th className="px-3 py-2 font-medium">Último Canal/Origem</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((item: DashboardUsuarioAdesaoCRM) => (
                <tr key={item.usuarioId} className="border-t">
                  <td className="px-3 py-2 font-medium">{item.nomeUsuario}</td>
                  <td className="px-3 py-2">{item.setor}</td>
                  <td className={`px-3 py-2 text-right ${item.classificacoesAtivas === 0 ? "font-semibold text-destructive" : "font-medium"}`}>{item.classificacoesAtivas}</td>
                  <td className={`px-3 py-2 text-right ${item.canaisOrigensAtivos === 0 ? "font-semibold text-destructive" : "font-medium"}`}>{item.canaisOrigensAtivos}</td>
                  <td className="px-3 py-2">{formatarData(item.ultimaClassificacao)}</td>
                  <td className="px-3 py-2">{formatarData(item.ultimoCanalOrigem)}</td>
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    Nenhum usuário encontrado para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        ref={setoresRef}
        className={`scroll-mt-4 rounded-xl border bg-card p-4 transition-all duration-300 md:p-6 ${
          destaqueTabela === "setores"
            ? "animate-pulse border-primary ring-2 ring-primary/50 ring-offset-2 shadow-lg"
            : ""
        }`}
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Participação por setor</h2>
            <p className="text-sm text-muted-foreground">
              Compare adesão, volume e últimas inclusões de Classificação e Canal/Origem.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={filtroSetores === "todos" ? "default" : "outline"} onClick={() => setFiltroSetores("todos")}>Todos</Button>
            <Button size="sm" variant={filtroSetores === "com-classificacao" ? "default" : "outline"} onClick={() => setFiltroSetores("com-classificacao")}>Com Classificação</Button>
            <Button size="sm" variant={filtroSetores === "sem-classificacao" ? "default" : "outline"} onClick={() => setFiltroSetores("sem-classificacao")}>Sem Classificação</Button>
            <Button size="sm" variant={filtroSetores === "com-canal-origem" ? "default" : "outline"} onClick={() => setFiltroSetores("com-canal-origem")}>Com Canal/Origem</Button>
            <Button size="sm" variant={filtroSetores === "sem-canal-origem" ? "default" : "outline"} onClick={() => setFiltroSetores("sem-canal-origem")}>Sem Canal/Origem</Button>
          </div>
        </div>

        <div className="max-h-[460px] overflow-auto rounded-md border">
          <table className="w-full min-w-[1420px] text-sm">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Setor</th>
                <th className="px-3 py-2 text-right font-medium">Usuários</th>
                <th className="px-3 py-2 text-right font-medium">Partic. Classificação</th>
                <th className="px-3 py-2 text-right font-medium">Sem Classificação</th>
                <th className="px-3 py-2 text-right font-medium">Partic. Canal/Origem</th>
                <th className="px-3 py-2 text-right font-medium">Sem Canal/Origem</th>
                <th className="px-3 py-2 text-right font-medium">Classificações</th>
                <th className="px-3 py-2 text-right font-medium">Canal/Origem</th>
                <th className="px-3 py-2 font-medium">Última Classificação</th>
                <th className="px-3 py-2 font-medium">Último Canal/Origem</th>
              </tr>
            </thead>
            <tbody>
              {setoresFiltrados.map((item: DashboardSetorAdesaoCRM) => (
                <tr key={item.setor} className="border-t">
                  <td className="px-3 py-2 font-medium">{item.setor}</td>
                  <td className="px-3 py-2 text-right">{item.totalUsuarios}</td>
                  <td className="px-3 py-2 text-right">{item.usuariosParticipantesClassificacao}</td>
                  <td className={`px-3 py-2 text-right ${item.usuariosSemClassificacao > 0 ? "font-semibold text-destructive" : "font-medium"}`}>{item.usuariosSemClassificacao}</td>
                  <td className="px-3 py-2 text-right">{item.usuariosParticipantesCanalOrigem}</td>
                  <td className={`px-3 py-2 text-right ${item.usuariosSemCanalOrigem > 0 ? "font-semibold text-destructive" : "font-medium"}`}>{item.usuariosSemCanalOrigem}</td>
                  <td className="px-3 py-2 text-right">{item.totalClassificacoes}</td>
                  <td className="px-3 py-2 text-right">{item.totalCanaisOrigens}</td>
                  <td className="px-3 py-2">{formatarData(item.ultimaClassificacao, "Nenhum cadastro")}</td>
                  <td className="px-3 py-2">{formatarData(item.ultimoCanalOrigem, "Nenhum cadastro")}</td>
                </tr>
              ))}
              {setoresFiltrados.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
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
