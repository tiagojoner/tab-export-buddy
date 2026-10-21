//crm/src/components/DetalhesPorSubassunto.tsx

import { useMemo, useState } from "react";

import { CheckboxMultiSelect } from "@/components/CheckboxMultiSelect";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type GrupoDetalhesSubassunto = {
  subassuntoId: number;
  subassuntoNome: string;
  detalhes: {
    id: number;
    nome: string;
  }[];
};

type AbaDetalhes = "selecionados" | "sem-selecao";

function ListaGrupos({
  grupos,
  selecionados,
  onChange,
  disabled,
  vazia,
}: {
  grupos: GrupoDetalhesSubassunto[];
  selecionados: Record<number, number[]>;
  onChange: (subassuntoId: number, detalheIds: number[]) => void;
  disabled: boolean;
  vazia: string;
}) {
  if (grupos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        {vazia}
      </div>
    );
  }

  const defaultOpen = grupos.slice(0, 1).map((grupo) =>
    String(grupo.subassuntoId),
  );

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Accordion type="multiple" defaultValue={defaultOpen}>
        {grupos.map((grupo) => {
          const selecionadosGrupo = selecionados[grupo.subassuntoId] ?? [];
          const possuiRelacionados = grupo.detalhes.length > 0;

          return (
            <AccordionItem
              key={grupo.subassuntoId}
              value={String(grupo.subassuntoId)}
              className="px-3 last:border-b-0"
            >
              <AccordionTrigger className="gap-3 py-2.5 font-normal hover:no-underline">
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-2 text-left">
                  <span className="truncate">{grupo.subassuntoNome}</span>
                  <span className="shrink-0 text-xs font-normal text-muted-foreground">
                    {possuiRelacionados
                      ? `${selecionadosGrupo.length} de ${grupo.detalhes.length} detalhe(s) selecionado(s)`
                      : "Nenhum detalhe relacionado"}
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pb-3">
                {!possuiRelacionados ? (
                  <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
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
  const [aba, setAba] = useState<AbaDetalhes>("selecionados");

  const gruposComSelecao = useMemo(
    () =>
      grupos.filter(
        (grupo) => (selecionados[grupo.subassuntoId]?.length ?? 0) > 0,
      ),
    [grupos, selecionados],
  );

  const gruposSemSelecao = useMemo(
    () =>
      grupos.filter(
        (grupo) => (selecionados[grupo.subassuntoId]?.length ?? 0) === 0,
      ),
    [grupos, selecionados],
  );

  if (grupos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum Subassunto selecionado para exibir Detalhes da Ocorrência.
      </div>
    );
  }

  return (
    <Tabs
      value={aba}
      onValueChange={(value) => setAba(value as AbaDetalhes)}
      className="space-y-2"
    >
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto">
        <TabsTrigger value="selecionados" className="shrink-0">
          Com detalhes selecionados ({gruposComSelecao.length})
        </TabsTrigger>
        <TabsTrigger value="sem-selecao" className="shrink-0">
          Sem detalhes selecionados ({gruposSemSelecao.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="selecionados" className="mt-0">
        <ListaGrupos
          grupos={gruposComSelecao}
          selecionados={selecionados}
          onChange={onChange}
          disabled={disabled}
          vazia="Nenhum Subassunto possui Detalhe da Ocorrência selecionado."
        />
      </TabsContent>

      <TabsContent value="sem-selecao" className="mt-0">
        <ListaGrupos
          grupos={gruposSemSelecao}
          selecionados={selecionados}
          onChange={onChange}
          disabled={disabled}
          vazia="Todos os Subassuntos selecionados possuem Detalhes da Ocorrência selecionados."
        />
      </TabsContent>
    </Tabs>
  );
}
