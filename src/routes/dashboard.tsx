//crm/src/routes/dashboard.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
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

const cores = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function compactar(data: DashboardItemCRM[], max = 10): DashboardItemCRM[] {
  const ordenado = [...data].sort((a, b) => b.quantidade - a.quantidade);

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
}: {
  titulo: string;
  data: DashboardItemCRM[];
}) {
  const visual = compactar(data);

  return (
    <div className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 font-semibold">{titulo}</h2>

      {visual.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados ativos.</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={visual}
              dataKey="quantidade"
              nameKey="rotulo"
              cx="50%"
              cy="45%"
              outerRadius={105}
              label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
            >
              {visual.map((item, index) => (
                <Cell
                  key={`${item.rotulo}-${index}`}
                  fill={cores[index % cores.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, "Registros"]} />
            <Legend verticalAlign="bottom" height={60} />
          </PieChart>
        </ResponsiveContainer>
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
        <GraficoPizza titulo="Quantidade por setor" data={grupos.get("setor") ?? []} />
        <GraficoPizza titulo="Quantidade por usuário" data={grupos.get("usuario") ?? []} />
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
