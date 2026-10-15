//crm/src/components/ExportButton.tsx

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { FiltrosTabulacoesCRM } from "@/lib/crm.functions";
import { exportarTabulacoes } from "@/lib/exportar";
import { useIdentidade } from "@/lib/session";

export function ExportButton({
  somenteMinhas,
  filtros,
  mostrarDetalhe,
}: {
  somenteMinhas: boolean;
  filtros: FiltrosTabulacoesCRM;
  mostrarDetalhe: boolean;
}) {
  const [id] = useIdentidade();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!id) return;

    if (filtros.status === "excluidas") {
      toast.info("Registros excluídos não são exportados.");
      return;
    }

    setBusy(true);

    try {
      const n = await exportarTabulacoes({
        id,
        somenteMinhas,
        filtros,
        mostrarDetalhe,
      });

      if (n === 0) {
        toast.info("Nenhum registro ativo encontrado para exportação.");
        return;
      }

      toast.success(`${n} registro(s) exportado(s).`);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível gerar o arquivo Excel.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" onClick={run} disabled={busy || !id}>
      {busy ? <Loader2 className="animate-spin" /> : <Download />}
      Exportar Excel
    </Button>
  );
}
