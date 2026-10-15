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
}: {
  somenteMinhas: boolean;
  filtros: FiltrosTabulacoesCRM;
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
      });

      if (n === 0) {
        toast.info("Não há registros ativos para exportar com os filtros atuais.");
      } else {
        toast.success(`${n} tabulação(ões) ativa(s) exportada(s) com sucesso.`);

        if (filtros.status === "todas") {
          toast.info("Registros excluídos não são incluídos na exportação.");
        }
      }
    } catch (error) {
      toast.error("Não foi possível gerar o arquivo. Tente novamente.");
      console.error(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" onClick={run} disabled={busy || !id}>
      {busy ? <Loader2 className="animate-spin" /> : <Download />}
      Exportar resultados
    </Button>
  );
}
