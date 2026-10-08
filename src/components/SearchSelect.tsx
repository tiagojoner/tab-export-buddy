//crm/src/components/SearchSelect.tsx

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type Opcao = { id: number; nome: string };
export type OpcaoTexto = { id: string; nome: string };

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filtrarOpcoes<T extends { nome: string }>(options: T[], q: string) {
  const n = norm(q.trim());
  const list = n ? options.filter((o) => norm(o.nome).includes(n)) : options;

  return {
    filtered: list.slice(0, 200),
    total: list.length,
  };
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  clearable,
  disabled,
}: {
  options: Opcao[];
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = options.find((o) => o.id === value);

  const { filtered, total } = useMemo(
    () => filtrarOpcoes(options, q),
    [options, q],
  );

  return (
    <div className="flex gap-1">
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setQ("");
        }}
      >
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-card px-3 text-left text-sm disabled:opacity-50"
          >
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected?.nome ?? placeholder}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-2"
          align="start"
        >
          <Input
            autoFocus
            placeholder="Pesquisar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="mt-2 max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">
                Nenhuma opção encontrada.
              </div>
            )}

            {filtered.map((o) => (
              <button
                type="button"
                key={o.id}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                  setQ("");
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <Check
                  className={cn(
                    "size-4",
                    o.id === value ? "text-primary" : "invisible",
                  )}
                />
                {o.nome}
              </button>
            ))}

            {total > filtered.length && (
              <div className="p-2 text-xs text-muted-foreground">
                Mostrando {filtered.length} de {total}. Refine a pesquisa.
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {clearable && value != null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-md border px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Limpar"
          title="Limpar"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function SearchTextSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  clearable,
  disabled,
}: {
  options: OpcaoTexto[];
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = options.find((o) => o.id === value);

  const { filtered, total } = useMemo(
    () => filtrarOpcoes(options, q),
    [options, q],
  );

  return (
    <div className="flex gap-1">
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setQ("");
        }}
      >
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-card px-3 text-left text-sm disabled:opacity-50"
          >
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected?.nome ?? placeholder}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-2"
          align="start"
        >
          <Input
            autoFocus
            placeholder="Pesquisar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="mt-2 max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">
                Nenhuma opção encontrada.
              </div>
            )}

            {filtered.map((o) => (
              <button
                type="button"
                key={o.id}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                  setQ("");
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <Check
                  className={cn(
                    "size-4",
                    o.id === value ? "text-primary" : "invisible",
                  )}
                />
                {o.nome}
              </button>
            ))}

            {total > filtered.length && (
              <div className="p-2 text-xs text-muted-foreground">
                Mostrando {filtered.length} de {total}. Refine a pesquisa.
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {clearable && value != null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-md border px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Limpar"
          title="Limpar"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
