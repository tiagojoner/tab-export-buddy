import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lerIdentidade, salvarIdentidade } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestor de Tabulações CRM — Identificação" },
      { name: "description", content: "Sistema colaborativo para levantamento e consolidação das classificações de ocorrências do CRM." },
      { property: "og:title", content: "Gestor de Tabulações CRM" },
      { property: "og:description", content: "Levantamento colaborativo das tabulações de ocorrências do CRM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("");
  useEffect(() => {
    if (lerIdentidade()) navigate({ to: "/cadastro" });
  }, [navigate]);
  const valido = nome.trim() && setor.trim();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valido) return;
          salvarIdentidade({ nome: nome.trim(), setor: setor.trim() });
          navigate({ to: "/cadastro" });
        }}
      >
        <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
          <ClipboardList />
        </div>
        <h1 className="text-2xl font-semibold">Gestor de Tabulações CRM</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sistema colaborativo para levantamento e consolidação das classificações de ocorrências utilizadas pelas áreas de atendimento.
        </p>
        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input id="nome" maxLength={150} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="setor">Setor da empresa *</Label>
            <Input id="setor" maxLength={150} value={setor} onChange={(e) => setSetor(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={!valido}>Iniciar cadastro</Button>
        </div>
      </form>
    </div>
  );
}
