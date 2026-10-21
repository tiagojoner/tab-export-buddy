//crm/src/components/DetalhesPorSubassunto.tsx

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckboxMultiSelect } from "@/components/CheckboxMultiSelect";

export type GrupoDetalhesSubassunto = {
  subassuntoId: number;
  subassuntoNome: string;
  detalhes: {
    id: number;
    nome: string;
  }[];
};

export function DetalhesPorSubassunto({
  grupos,
  selecionados,
  onChange,
  disabled = false,
}: {
  grupos: GrupoDetalhesSubassunto[];
  selecionados: Record<number, number[]>;
  onChange: (subassuntoId: number, detalheIds: number[]) => void;
  disabled?: boolean;
}) {
  if (grupos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum Subassunto selecionado para exibir Detalhes da Ocorrência.
      </div>
    );
  }

  const defaultOpen = grupos.slice(0, Math.min(2, grupos.length)).map((grupo) =>
    String(grupo.subassuntoId),
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Accordion type="multiple" defaultValue={defaultOpen}>
        {grupos.map((grupo) => {
          const selecionadosGrupo = selecionados[grupo.subassuntoId] ?? [];

          return (
            <AccordionItem
              key={grupo.subassuntoId}
              value={String(grupo.subassuntoId)}
              className="px-4 last:border-b-0"
            >
              <AccordionTrigger className="gap-3 hover:no-underline">
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-2 text-left">
                  <span className="truncate font-medium">
                    {grupo.subassuntoNome}
                  </span>
                  <span className="shrink-0 text-xs font-normal text-muted-foreground">
                    {selecionadosGrupo.length} de {grupo.detalhes.length} detalhe(s) selecionado(s)
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent>
                {grupo.detalhes.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                    Nenhum Detalhe da Ocorrência está relacionado a este Subassunto.
                    A tabulação será cadastrada sem Detalhe da Ocorrência.
                  </div>
                ) : (
                  <CheckboxMultiSelect
                    options={grupo.detalhes}
                    selectedIds={selecionadosGrupo}
                    onChange={(ids) => onChange(grupo.subassuntoId, ids)}
                    searchPlaceholder="Buscar Detalhe da Ocorrência..."
                    emptyMessage="Nenhum Detalhe da Ocorrência disponível."
                    disabled={disabled}
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
