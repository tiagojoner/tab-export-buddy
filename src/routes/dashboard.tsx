import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gestor de Tabulações CRM" },
      { name: "description", content: "Acompanhamento da coleta de tabulações por setor, criticidade e tipo." },
      { property: "og:title", content: "Dashboard da coleta" },
      { property: "og:description", content: "Acompanhamento da coleta de tabulações do CRM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell>{() => <Dashboard />}</AppShell>,
});

type Row = { nome_usuario: string | null; setor_usuario: string | null; criticidade: string | null; criticidade_ordem: number | null; tipo_ocorrencia: string | null };

async function carregar() {
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("vw_tabulacoes")
      .select("nome_usuario,setor_usuario,criticidade,criticidade_ordem,tipo_ocorrencia").range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

function contar(rows: Row[], k: keyof Row) {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(String(r[k] ?? "—"), (m.get(String(r[k] ?? "—")) ?? 0) + 1));
  return [...m.entries()].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);
}

function Grafico({ titulo, data }: { titulo: string; data: { nome: string; total: number }[] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 font-semibold">{titulo}</h2>
      {data.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="total" name="Registros" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: carregar });
  if (isLoading || !data) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  const participantes = new Set(data.map((r) => `${r.nome_usuario}||${r.setor_usuario}`)).size;
  const setores = new Set(data.map((r) => r.setor_usuario)).size;
  const ordem = new Map(data.map((r) => [r.criticidade ?? "—", r.criticidade_ordem ?? 99]));
  const porCrit = contar(data, "criticidade").sort((a, b) => (ordem.get(a.nome) ?? 99) - (ordem.get(b.nome) ?? 99));

  const Kpi = ({ l, v }: { l: string; v: number }) => (
    <div className="rounded-xl border bg-card p-4"><div className="text-sm text-muted-foreground">{l}</div><div className="mt-1 text-2xl font-semibold text-primary">{v}</div></div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi l="Total de tabulações" v={data.length} />
        <Kpi l="Participantes distintos" v={participantes} />
        <Kpi l="Setores participantes" v={setores} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {porCrit.map((c) => <Kpi key={c.nome} l={c.nome} v={c.total} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Grafico titulo="Registros por setor" data={contar(data, "setor_usuario")} />
        <Grafico titulo="Registros por criticidade" data={porCrit} />
        <Grafico titulo="Registros por tipo de ocorrência" data={contar(data, "tipo_ocorrencia")} />
      </div>
    </div>
  );
}
