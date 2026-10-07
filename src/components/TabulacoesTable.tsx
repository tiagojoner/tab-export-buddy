//crm/src/components/TabulacoesTable.tsx

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TabulacaoCRM } from "@/lib/crm.functions";

function formatarData(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export function TabulacoesTable({
  rows,
  usuarioAtualId,
  onExcluir,
  mostrarAuditoriaExclusao = true,
}: {
  rows: TabulacaoCRM[];
  usuarioAtualId: number;
  onExcluir?: (row: TabulacaoCRM) => void;
  mostrarAuditoriaExclusao?: boolean;
}) {
  const minWidth = mostrarAuditoriaExclusao ? "min-w-[2180px]" : "min-w-[1660px]";

  return (
    <div className="max-h-[62vh] w-full overflow-auto rounded-xl border bg-card">
      <table className={`${minWidth} w-full text-[11.5px] leading-4`}>
        <thead className="sticky top-0 z-40 bg-secondary text-left text-secondary-foreground">
          <tr>
            <th className="sticky left-0 z-50 w-[105px] min-w-[105px] bg-secondary px-2 py-2 font-medium">Canal</th>
            <th className="sticky left-[105px] z-50 w-[125px] min-w-[125px] bg-secondary px-2 py-2 font-medium">Origem</th>
            <th className="sticky left-[230px] z-50 w-[110px] min-w-[110px] bg-secondary px-2 py-2 font-medium">Tipo</th>
            <th className="sticky left-[340px] z-50 w-[175px] min-w-[175px] bg-secondary px-2 py-2 font-medium">Assunto</th>
            <th className="sticky left-[515px] z-50 w-[175px] min-w-[175px] bg-secondary px-2 py-2 font-medium">Subassunto</th>
            <th className="sticky left-[690px] z-50 w-[165px] min-w-[165px] bg-secondary px-2 py-2 font-medium">Área de Interesse</th>
            <th className="min-w-[190px] px-2 py-2 font-medium">Detalhe da Ocorrência</th>
            <th className="min-w-[145px] px-2 py-2 font-medium">Grau de Criticidade</th>
            <th className="min-w-[175px] px-2 py-2 font-medium">Nome Usuário</th>
            <th className="min-w-[150px] px-2 py-2 font-medium">Setor Usuário</th>
            <th className="min-w-[150px] px-2 py-2 font-medium">Data/Hora Criação</th>

            {mostrarAuditoriaExclusao && (
              <>
                <th className="min-w-[85px] px-2 py-2 font-medium">Status</th>
                <th className="min-w-[175px] px-2 py-2 font-medium">Excluído por</th>
                <th className="min-w-[150px] px-2 py-2 font-medium">Setor exclusão</th>
                <th className="min-w-[150px] px-2 py-2 font-medium">Data/Hora exclusão</th>
              </>
            )}

            <th className="min-w-[68px] px-2 py-2 text-center font-medium">Ações</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const bg = row.excluido ? "bg-muted" : "bg-card";
            const podeExcluir =
              !row.excluido && row.usuario_id === usuarioAtualId && onExcluir;

            return (
              <tr key={row.id_registro} className="border-t align-top">
                <td className={`sticky left-0 z-20 w-[105px] min-w-[105px] ${bg} px-2 py-2`}>{row.canal}</td>
                <td className={`sticky left-[105px] z-20 w-[125px] min-w-[125px] ${bg} px-2 py-2`}>{row.origem}</td>
                <td className={`sticky left-[230px] z-20 w-[110px] min-w-[110px] ${bg} px-2 py-2`}>{row.tipo_ocorrencia}</td>
                <td className={`sticky left-[340px] z-20 w-[175px] min-w-[175px] ${bg} px-2 py-2`}>{row.assunto}</td>
                <td className={`sticky left-[515px] z-20 w-[175px] min-w-[175px] ${bg} px-2 py-2`}>{row.subassunto ?? "—"}</td>
                <td className={`sticky left-[690px] z-20 w-[165px] min-w-[165px] ${bg} px-2 py-2`}>{row.area_interesse}</td>
                <td className="px-2 py-2">{row.detalhe_ocorrencia ?? "—"}</td>
                <td className="px-2 py-2">{row.criticidade}</td>
                <td className="px-2 py-2">{row.nome_usuario}</td>
                <td className="px-2 py-2">{row.setor_usuario}</td>
                <td className="whitespace-nowrap px-2 py-2">{formatarData(row.data_hora_inclusao)}</td>

                {mostrarAuditoriaExclusao && (
                  <>
                    <td className="px-2 py-2">
                      <span className={row.excluido ? "font-medium text-destructive" : "font-medium text-primary"}>
                        {row.excluido ? "Excluído" : "Ativo"}
                      </span>
                    </td>
                    <td className="px-2 py-2">{row.nome_usuario_exclusao ?? "—"}</td>
                    <td className="px-2 py-2">{row.setor_usuario_exclusao ?? "—"}</td>
                    <td className="whitespace-nowrap px-2 py-2">{formatarData(row.data_hora_exclusao)}</td>
                  </>
                )}

                <td className="px-2 py-1 text-center">
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
