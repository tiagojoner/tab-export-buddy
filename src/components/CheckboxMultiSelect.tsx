//crm/src/components/CheckboxMultiSelect.tsx

import { useMemo, useState } from "react";
import { CheckCheck, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export type CheckboxMultiSelectOption = {
  id: number;
  nome: string;
};

function normalizar(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function CheckboxMultiSelect({
  options,
  selectedIds,
  onChange,
  emptyMessage = "Nenhuma opção disponível.",
  searchPlaceholder = "Buscar...",
  disabled = false,
}: {
  options: CheckboxMultiSelectOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  emptyMessage?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}) {
  const [busca, setBusca] = useState("");
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim());

    if (!termo) return options;

    return options.filter((item) => normalizar(item.nome).includes(termo));
  }, [busca, options]);

  const todasSelecionadas =
    options.length > 0 && options.every((item) => selected.has(item.id));

  function alternar(id: number, marcado: boolean) {
    const proximo = new Set(selected);

    if (marcado) {
      proximo.add(id);
    } else {
      proximo.delete(id);
    }

    onChange(Array.from(proximo));
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
        <div className="text-sm font-medium">
          {selectedIds.length} de {options.length} selecionado(s)
        </div>

        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || options.length === 0 || todasSelecionadas}
            onClick={() => onChange(options.map((item) => item.id))}
          >
            <CheckCheck className="size-4" />
            Selecionar todos
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || selectedIds.length === 0}
            onClick={() => onChange([])}
          >
            <X className="size-4" />
            Desmarcar todos
          </Button>
        </div>
      </div>

      {options.length > 8 && (
        <div className="border-b p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
              disabled={disabled}
            />
          </div>
        </div>
      )}

      <div className="max-h-72 overflow-y-auto p-2">
        {filtradas.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            {options.length === 0 ? emptyMessage : "Nenhuma opção encontrada."}
          </div>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
            {filtradas.map((item) => {
              const marcado = selected.has(item.id);

              return (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/70"
                >
                  <Checkbox
                    checked={marcado}
                    disabled={disabled}
                    onCheckedChange={(value) => alternar(item.id, value === true)}
                  />
                  <span className="leading-4">{item.nome}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
