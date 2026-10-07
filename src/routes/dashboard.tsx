//crm/src/routes/dashboard.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import {
  carregarDashboardCRM,
  type DashboardGrupoCRM,
  type DashboardItemCRM,
} from "@/lib/crm.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gestor de Tabulações CRM" },
      {
        name: "description",
        content: "Acompanhamento das tabulações ativas do CRM.",
      },
      { property: "og:title", content: "Dashboard" },
      {
        property: "og:description",
        content: "Acompanhamento das tabulações ativas do CRM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell>{() => <Dashboard />}</AppShell>,
});

const coresPastel = [
  "#A8DADC",
  "#F4B6C2",
  "#B8E0D2",
  "#FFD6A5",
  "#CDB4DB",
  "#BDE0FE",
  "#FFCAD4",
  "#D8E2DC",
  "#E9C46A",
  "#CDEAC0",
  "#F6BD60",
  "#B5EAD7",
  "#FFDAC1",
  "#C7CEEA",
  "#E2F0CB",
  "#F1C0E8",
];

function ordenar(data: DashboardItemCRM[]): DashboardItemCRM[] {
  return [...data].sort(
    (a, b) =>
      b.quantidade - a.quantidade || a.rotulo.localeCompare(b.rotulo, "pt-BR"),
  );
}

function compactar(data: DashboardItemCRM[], max = 10): DashboardItemCRM[] {
  const ordenado = ordenar(data);

  if (ordenado.length <= max) {
    return ordenado;
  }

  const principais = ordenado.slice(0, max - 1);
  const outros = ordenado
    .slice(max - 1)
    .reduce((soma, item) => soma + item.quantidade, 0);

  return [
    ...principais,
    {
      grupo: ordenado[0].grupo,
      rotulo: "Outros",
      quantidade: outros,
    },
  ];
}

function GraficoPizza({
  titulo,
  data,
  mostrarZeros = false,
}: {
  titulo: string;
  data: DashboardItemCRM[];
  mostrarZeros?: boolean;
}) {
  const ordenado = ordenar(data);
  const positivos = ordenado.filter((item) => item.quantidade > 0);
  const visual = mostrarZeros ? positivos : compactar(positivos);
  const legenda = mostrarZeros ? ordenado : visual;

  return (
    <div className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 font-semibold">{titulo}</h2>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados cadastrados.</p>
      ) : (
        <>
          {visual.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={visual}
                  dataKey="quantidade"
                  nameKey="rotulo"
                  cx="50%"
                  cy="50%"
                  outerRadius={105}
                  labelLine={false}
                  label={({ value }) => {
                    const quantidade = Number(value ?? 0);
                    return quantidade > 0 ? String(quantidade) : "";
                  }}
                >
                  {visual.map((item, index) => (
                    <Cell
                      key={`${item.rotulo}-${index}`}
                      fill={coresPastel[index % coresPastel.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [Number(value ?? 0), "Registros"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
              Nenhum registro ativo para este agrupamento.
            </div>
          )}

          <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1 text-xs">
            {legenda.map((item, index) => (
              <div
                key={`${item.rotulo}-${index}`}
                className="flex items-center justify-between gap-3 rounded px-1 py-0.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{
                      backgroundColor: coresPastel[index % coresPastel.length],
                    }}
                  />
                  <span className="truncate" title={item.rotulo}>
                    {item.rotulo}
                  </span>
                </div>
                <span
                  className={
                    item.quantidade === 0
                      ? "shrink-0 font-medium text-muted-foreground"
                      : "shrink-0 font-medium"
                  }
                >
                  {item.quantidade} registro(s)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Dashboard() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: carregarDashboardCRM,
  });

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
        Não foi possível carregar o Dashboard no PostgreSQL.
      </div>
    );
  }

  const grupos = new Map<DashboardGrupoCRM, DashboardItemCRM[]>();

  for (const item of query.data) {
    const atual = grupos.get(item.grupo) ?? [];
    atual.push(item);
    grupos.set(item.grupo, atual);
  }

  const resumo = new Map(
    (grupos.get("resumo") ?? []).map((item) => [item.rotulo, item.quantidade]),
  );

  const Kpi = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-primary">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores calculados somente sobre tabulações ativas.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Total de tabulações ativas"
          value={resumo.get("total_ativas") ?? 0}
        />
        <Kpi
          label="Minhas tabulações"
          value={resumo.get("minhas_tabulacoes") ?? 0}
        />
        <Kpi
          label="Usuários com registros"
          value={resumo.get("total_usuarios") ?? 0}
        />
        <Kpi
          label="Setores com registros"
          value={resumo.get("total_setores") ?? 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <GraficoPizza
          titulo="Quantidade por setor"
          data={grupos.get("setor") ?? []}
          mostrarZeros
        />
        <GraficoPizza
          titulo="Quantidade por usuário"
          data={grupos.get("usuario") ?? []}
          mostrarZeros
        />
        <GraficoPizza titulo="Quantidade por canal" data={grupos.get("canal") ?? []} />
        <GraficoPizza titulo="Quantidade por origem" data={grupos.get("origem") ?? []} />
        <GraficoPizza
          titulo="Quantidade por tipo de ocorrência"
          data={grupos.get("tipo_ocorrencia") ?? []}
        />
        <GraficoPizza titulo="Quantidade por assunto" data={grupos.get("assunto") ?? []} />
        <GraficoPizza
          titulo="Quantidade por criticidade"
          data={grupos.get("criticidade") ?? []}
        />
        <GraficoPizza
          titulo="Quantidade por área de interesse"
          data={grupos.get("area_interesse") ?? []}
        />
      </div>
    </div>
  );
}
