//crm/src/routes/parametrizacao.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { atualizarParametroDetalheCRM } from "@/lib/admin.functions";
import { carregarCadastros } from "@/lib/cadastros";
import type { Identidade } from "@/lib/session";

export const Route = createFileRoute("/parametrizacao")({
  head: () => ({
    meta: [
      { title: "Parametrização — Gestor de Tabulações CRM" },
      {
        name: "description",
        content: "Parametrizações administrativas do Gestor de Tabulações CRM.",
      },
    ],
  }),
  component: () => <AppShell>{(id) => <Parametrizacao id={id} />}</AppShell>,
});

function Parametrizacao({ id }: { id: Identidade }) {
  const queryClient = useQueryClient();
  const [exibirDetalhe, setExibirDetalhe] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const cadastros = useQuery({
    queryKey: ["cadastros"],
    queryFn: carregarCadastros,
    enabled: id.perfil === "ADMINISTRADOR",
    staleTime: 60_000,
  });

  useEffect(() => {
    if (cadastros.data) {
      setExibirDetalhe(cadastros.data.configuracao.exibirDetalheOcorrencia);
    }
  }, [cadastros.data]);

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

  async function salvar() {
    setSalvando(true);

    try {
      await atualizarParametroDetalheCRM({ data: { ativo: exibirDetalhe } });
      toast.success("Parametrização atualizada com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["cadastros"] });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Não foi possível atualizar a parametrização.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Parametrização</h1>
        <p className="text-sm text-muted-foreground">
          Configurações administrativas que controlam o comportamento do sistema.
        </p>
      </div>

      {cadastros.isLoading ? (
        <div className="flex justify-center rounded-xl border bg-card py-20">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : cadastros.isError ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-destructive">
          Não foi possível carregar a parametrização atual.
        </div>
      ) : (
        <div className="max-w-3xl rounded-xl border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="font-semibold">Exibir Detalhe da Ocorrência</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Quando ativado, o campo aparece no cadastro da classificação, na listagem
                de registros e na exportação Excel. Quando desativado, o campo fica oculto,
                mas os dados já existentes são preservados no banco.
              </p>
            </div>

            <Switch checked={exibirDetalhe} onCheckedChange={setExibirDetalhe} />
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? <Loader2 className="animate-spin" /> : <Save />}
              Salvar parametrização
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
