//crm/src/components/TabulacoesTable.tsx

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { TabulacaoCRM } from "@/lib/crm.functions";

function formatarData(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export function TabulacoesTable({
  rows,
  usuarioAtualId,
  modoAdministrador = false,
  permitirSelecao = false,
  selecionados = [],
  onSelecionadosChange,
  onExcluir,
  onEditarCriticidade,
  mostrarAuditoriaExclusao = true,
}: {
  rows: TabulacaoCRM[];
  usuarioAtualId: number;
  modoAdministrador?: boolean;
  permitirSelecao?: boolean;
  selecionados?: number[];
  onSelecionadosChange?: (ids: number[]) => void;
  onExcluir?: (row: TabulacaoCRM) => void;
  onEditarCriticidade?: (row: TabulacaoCRM) => void;
  mostrarAuditoriaExclusao?: boolean;
}) {
  const larguraSelecao = permitirSelecao ? 52 : 0;
  const larguraBase = 1810 + larguraSelecao;
  const larguraAuditoria = mostrarAuditoriaExclusao ? 560 : 0;
  const minWidth = larguraBase + larguraAuditoria;
  const idsPagina = rows.map((row) => row.id_registro);
  const selecionadosPagina = idsPagina.filter((id) => selecionados.includes(id));
  const todosSelecionados =
    idsPagina.length > 0 && selecionadosPagina.length === idsPagina.length;
  const algunsSelecionados =
    selecionadosPagina.length > 0 && selecionadosPagina.length < idsPagina.length;

  function alternarTodos(checked: boolean | "indeterminate") {
    if (!onSelecionadosChange) return;
    onSelecionadosChange(checked === true ? idsPagina : []);
  }

  function alternarRegistro(id: number, checked: boolean | "indeterminate") {
    if (!onSelecionadosChange) return;

    if (checked === true) {
      onSelecionadosChange(Array.from(new Set([...selecionados, id])));
      return;
    }

    onSelecionadosChange(selecionados.filter((item) => item !== id));
  }

  return (
    <div className="max-h-[62vh] w-full overflow-auto rounded-xl border bg-card">
      <table className="w-full text-[11.5px] leading-4" style={{ minWidth }}>
        <thead className="sticky top-0 z-20 bg-secondary text-left text-secondary-foreground">
          <tr>
            {permitirSelecao && (
              <th className="w-[52px] min-w-[52px] px-2 py-2 text-center font-medium">
                <Checkbox
                  checked={todosSelecionados ? true : algunsSelecionados ? "indeterminate" : false}
                  onCheckedChange={alternarTodos}
                  aria-label="Selecionar todos os registros desta página"
                />
              </th>
            )}
            <th className="w-[120px] min-w-[120px] px-2 py-2 font-medium">
              Tipo
            </th>
            <th className="w-[250px] min-w-[250px] px-2 py-2 font-medium">
              Área de Interesse
            </th>
            <th className="w-[285px] min-w-[285px] px-2 py-2 font-medium">
              Assunto
            </th>
            <th className="w-[320px] min-w-[320px] px-2 py-2 font-medium">
              Subassunto
            </th>
            <th className="w-[320px] min-w-[320px] px-2 py-2 font-medium">
              Detalhe da Ocorrência
            </th>
            <th className="min-w-[145px] px-2 py-2 font-medium">
              Grau de Criticidade
            </th>
            <th className="min-w-[175px] px-2 py-2 font-medium">
              Nome Usuário
            </th>
            <th className="min-w-[165px] px-2 py-2 font-medium">
              Setor Usuário
            </th>
            <th className="min-w-[155px] px-2 py-2 font-medium">
              Data/Hora Criação
            </th>

            {mostrarAuditoriaExclusao && (
              <>
                <th className="min-w-[85px] px-2 py-2 font-medium">Status</th>
                <th className="min-w-[175px] px-2 py-2 font-medium">
                  Excluído por
                </th>
                <th className="min-w-[150px] px-2 py-2 font-medium">
                  Setor exclusão
                </th>
                <th className="min-w-[150px] px-2 py-2 font-medium">
                  Data/Hora exclusão
                </th>
              </>
            )}

            <th className="min-w-[92px] px-2 py-2 text-center font-medium">
              Ações
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const registroProprio = row.usuario_id === usuarioAtualId;
            const podeExcluir =
              !modoAdministrador && !row.excluido && registroProprio && onExcluir;
            const podeEditar =
              !row.excluido && registroProprio && onEditarCriticidade;

            return (
              <tr
                key={row.id_registro}
                className={
                  row.excluido
                    ? "border-t bg-muted align-top"
                    : "border-t bg-card align-top"
                }
              >
                {permitirSelecao && (
                  <td className="px-2 py-2 text-center">
                    <Checkbox
                      checked={selecionados.includes(row.id_registro)}
                      onCheckedChange={(checked) =>
                        alternarRegistro(row.id_registro, checked)
                      }
                      aria-label={`Selecionar registro ${row.id_registro}`}
                    />
                  </td>
                )}
                <td className="px-2 py-2">{row.tipo_ocorrencia}</td>
                <td className="px-2 py-2">{row.area_interesse}</td>
                <td className="px-2 py-2">{row.assunto}</td>
                <td className="px-2 py-2">{row.subassunto ?? "—"}</td>
                <td className="px-2 py-2">
                  {row.detalhe_ocorrencia ?? "—"}
                </td>
                <td className="px-2 py-2">{row.criticidade}</td>
                <td className="px-2 py-2">{row.nome_usuario}</td>
                <td className="px-2 py-2">{row.setor_usuario}</td>
                <td className="whitespace-nowrap px-2 py-2">
                  {formatarData(row.data_hora_inclusao)}
                </td>

                {mostrarAuditoriaExclusao && (
                  <>
                    <td className="px-2 py-2">
                      <span
                        className={
                          row.excluido
                            ? "font-medium text-destructive"
                            : "font-medium text-primary"
                        }
                      >
                        {row.excluido ? "Inativo" : "Ativo"}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      {row.nome_usuario_exclusao ?? "—"}
                    </td>
                    <td className="px-2 py-2">
                      {row.setor_usuario_exclusao ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">
                      {formatarData(row.data_hora_exclusao)}
                    </td>
                  </>
                )}

                <td className="px-2 py-1 text-center">
                  {podeEditar || podeExcluir ? (
                    <div className="flex items-center justify-center gap-1">
                      {podeEditar && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar criticidade do registro ${row.id_registro}`}
                          onClick={() => onEditarCriticidade(row)}
                        >
                          <Pencil className="size-4 text-primary" />
                        </Button>
                      )}

                      {podeExcluir && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir registro ${row.id_registro}`}
                          onClick={() => onExcluir(row)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
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
