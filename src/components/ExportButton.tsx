//crm/src/components/ExportButton.tsx

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { FiltrosCanalOrigemCRM } from "@/lib/canal-origem.functions";
import type { FiltrosTabulacoesCRM } from "@/lib/crm.functions";
import { exportarCanaisOrigens, exportarClassificacoes } from "@/lib/exportar";
import { useIdentidade } from "@/lib/session";

export function ExportButton({
  tipo,
  filtrosClassificacao,
  filtrosCanalOrigem,
  mostrarDetalhe = false,
}: {
  tipo: "classificacao" | "canal-origem";
  filtrosClassificacao?: FiltrosTabulacoesCRM;
  filtrosCanalOrigem?: FiltrosCanalOrigemCRM;
  mostrarDetalhe?: boolean;
}) {
  const [id] = useIdentidade();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!id) return;

    setBusy(true);

    try {
      const n =
        tipo === "classificacao"
          ? await exportarClassificacoes({
              filtros: filtrosClassificacao!,
              mostrarDetalhe,
            })
          : await exportarCanaisOrigens({
              filtros: filtrosCanalOrigem!,
            });

      if (n === 0) {
        toast.info(
          "Nenhum registro ativo encontrado para exportação com os filtros atuais.",
        );
        return;
      }

      toast.success(`${n} registro(s) ativo(s) exportado(s).`);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível gerar o arquivo Excel.");
    } finally {
      setBusy(false);
    }
  }

  const filtrosDisponiveis =
    tipo === "classificacao" ? !!filtrosClassificacao : !!filtrosCanalOrigem;

  return (
    <Button variant="outline" onClick={run} disabled={busy || !id || !filtrosDisponiveis}>
      {busy ? <Loader2 className="animate-spin" /> : <Download />}
      Exportar Excel
    </Button>
  );
}
