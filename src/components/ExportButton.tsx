import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportarMinhasTabulacoes } from "@/lib/exportar";
import { useIdentidade } from "@/lib/session";

export function ExportButton() {
  const [id] = useIdentidade();
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!id) return;
    setBusy(true);
    try {
      const n = await exportarMinhasTabulacoes(id);
      if (n === 0) toast.info("Não há tabulações registradas para exportar.");
      else toast.success(`${n} tabulação(ões) exportada(s) com sucesso.`);
    } catch (e) {
      toast.error("Não foi possível gerar o arquivo. Tente novamente.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button variant="outline" onClick={run} disabled={busy || !id}>
      {busy ? <Loader2 className="animate-spin" /> : <Download />}
      Exportar minhas tabulações
    </Button>
  );
}
