//crm/src/components/CanaisOrigensTable.tsx

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CanalOrigemRegistradoCRM } from "@/lib/canal-origem.functions";

function formatarData(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export function CanaisOrigensTable({
  rows,
  usuarioAtualId,
  onExcluir,
  mostrarAuditoriaExclusao = true,
}: {
  rows: CanalOrigemRegistradoCRM[];
  usuarioAtualId: number;
  onExcluir?: (row: CanalOrigemRegistradoCRM) => void;
  mostrarAuditoriaExclusao?: boolean;
}) {
  const minWidth = mostrarAuditoriaExclusao ? 1540 : 980;

  return (
    <div className="max-h-[62vh] w-full overflow-auto rounded-xl border bg-card">
      <table className="w-full text-[11.5px] leading-4" style={{ minWidth }}>
        <thead className="sticky top-0 z-30 bg-secondary text-left text-secondary-foreground">
          <tr>
            <th className="w-[180px] min-w-[180px] px-3 py-2 font-medium">Canal</th>
            <th className="w-[320px] min-w-[320px] px-3 py-2 font-medium">Origem</th>
            <th className="min-w-[180px] px-3 py-2 font-medium">Nome Usuário</th>
            <th className="min-w-[180px] px-3 py-2 font-medium">Setor Usuário</th>
            <th className="min-w-[155px] px-3 py-2 font-medium">Data/Hora Criação</th>

            {mostrarAuditoriaExclusao && (
              <>
                <th className="min-w-[90px] px-3 py-2 font-medium">Status</th>
                <th className="min-w-[180px] px-3 py-2 font-medium">Excluído por</th>
                <th className="min-w-[180px] px-3 py-2 font-medium">Setor exclusão</th>
                <th className="min-w-[155px] px-3 py-2 font-medium">Data/Hora exclusão</th>
              </>
            )}

            <th className="w-[86px] min-w-[86px] px-3 py-2 text-center font-medium">Ações</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const registroProprio = row.usuario_id === usuarioAtualId;
            const podeExcluir = !row.excluido && registroProprio && onExcluir;

            return (
              <tr key={row.id_registro} className={row.excluido ? "border-t bg-muted/60" : "border-t"}>
                <td className="px-3 py-2">{row.canal}</td>
                <td className="px-3 py-2">{row.origem}</td>
                <td className="px-3 py-2">{row.nome_usuario}</td>
                <td className="px-3 py-2">{row.setor_usuario}</td>
                <td className="whitespace-nowrap px-3 py-2">{formatarData(row.data_hora_inclusao)}</td>

                {mostrarAuditoriaExclusao && (
                  <>
                    <td className="px-3 py-2">
                      <span className={row.excluido ? "font-medium text-destructive" : "font-medium text-primary"}>
                        {row.excluido ? "Inativo" : "Ativo"}
                      </span>
                    </td>
                    <td className="px-3 py-2">{row.nome_usuario_exclusao ?? "—"}</td>
                    <td className="px-3 py-2">{row.setor_usuario_exclusao ?? "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatarData(row.data_hora_exclusao)}</td>
                  </>
                )}

                <td className="px-3 py-1 text-center">
                  {podeExcluir ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir registro ${row.id_registro}`}
                      onClick={() => onExcluir(row)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
