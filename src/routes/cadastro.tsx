//crm/src/routes/cadastro.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Eraser,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ExportButton } from "@/components/ExportButton";
import { SearchSelect } from "@/components/SearchSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  calcularCriticidadeCRM,
  inserirTabulacaoCRM,
  listarRecentesCRM,
} from "@/lib/crm.functions";
import {
  carregarCadastros,
  permitidos,
} from "@/lib/cadastros";
import type { Identidade } from "@/lib/session";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      {
        title:
          "Cadastro de Tabulações — Gestor de Tabulações CRM",
      },
      {
        name: "description",
        content:
          "Registre as combinações de classificação utilizadas no CRM.",
      },
      {
        property: "og:title",
        content: "Cadastro de Tabulações",
      },
      {
        property: "og:description",
        content:
          "Registre as combinações de classificação utilizadas no CRM.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary",
      },
    ],
  }),

  component: () => (
    <AppShell>
      {(id) => <Cadastro id={id} />}
    </AppShell>
  ),
});

type Form = {
  canal: number | null;
  origem: number | null;
  tipo: number | null;
  assunto: number | null;
  sub: number | null;
  area: number | null;
  detalhe: number | null;
};

const vazio: Form = {
  canal: null,
  origem: null,
  tipo: null,
  assunto: null,
  sub: null,
  area: null,
  detalhe: null,
};

function Cadastro({ id }: { id: Identidade }) {
  const queryClient = useQueryClient();

  const cadastros = useQuery({
    queryKey: ["cadastros"],
    queryFn: carregarCadastros,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const cad = cadastros.data;

  const [form, setForm] = useState<Form>(vazio);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("gtc_form");

      if (raw) {
        setForm({
          ...vazio,
          ...JSON.parse(raw),
        });
      }
    } catch {
      // Ignora formulário inválido salvo anteriormente.
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      "gtc_form",
      JSON.stringify(form),
    );
  }, [form]);

  const opts = useMemo(() => {
    if (!cad) {
      return null;
    }

    return {
      origem: permitidos(
        cad.origem,
        cad.rel.canalOrigem,
        form.canal,
        0,
      ),

      assunto: permitidos(
        cad.assunto,
        cad.rel.assuntoTipo,
        form.tipo,
        1,
      ),

      sub: permitidos(
        cad.subassunto,
        cad.rel.assuntoSub,
        form.assunto,
        0,
      ),

      area: permitidos(
        cad.area,
        cad.rel.assuntoArea,
        form.assunto,
        0,
      ),

      detalhe: permitidos(
        cad.detalhe,
        cad.rel.subDetalhe,
        form.sub,
        0,
      ),
    };
  }, [
    cad,
    form.canal,
    form.tipo,
    form.assunto,
    form.sub,
  ]);

  useEffect(() => {
    if (!opts || !cad) {
      return;
    }

    const existe = (
      lista: { id: number }[],
      valor: number | null,
    ) =>
      valor == null ||
      lista.some((item) => item.id === valor);

    const novo = {
      ...form,
    };

    if (!existe(cad.canal, novo.canal)) {
      novo.canal = null;
    }

    if (!existe(cad.tipo, novo.tipo)) {
      novo.tipo = null;
    }

    if (!existe(opts.origem, novo.origem)) {
      novo.origem = null;
    }

    if (!existe(opts.assunto, novo.assunto)) {
      novo.assunto = null;
    }

    if (!existe(opts.sub, novo.sub)) {
      novo.sub = null;
    }

    if (!existe(opts.area, novo.area)) {
      novo.area = null;
    }

    if (!existe(opts.detalhe, novo.detalhe)) {
      novo.detalhe = null;
    }

    if (
      JSON.stringify(novo) !== JSON.stringify(form)
    ) {
      setForm(novo);
    }
  }, [opts, cad, form]);

  const criticidade = useQuery({
    queryKey: [
      "criticidade",
      form.tipo,
      form.assunto,
      form.sub,
    ],

    enabled:
      form.tipo != null &&
      form.assunto != null,

    queryFn: () =>
      calcularCriticidadeCRM({
        data: {
          tipo: form.tipo!,
          assunto: form.assunto!,
          subassunto: form.sub,
        },
      }),
  });

  const criticidadeNome = cad?.criticidade.find(
    (item) => item.id === criticidade.data,
  )?.nome;

  const recentes = useQuery({
    queryKey: [
      "recentes",
      id.usuarioId,
    ],

    queryFn: listarRecentesCRM,
    retry: 1,
  });

  const obrigatoriosPreenchidos =
    form.canal != null &&
    form.origem != null &&
    form.tipo != null &&
    form.assunto != null &&
    form.area != null;

  async function adicionar() {
    if (!obrigatoriosPreenchidos) {
      toast.error(
        "Preencha todos os campos obrigatórios.",
      );
      return;
    }

    setSaving(true);

    try {
      await inserirTabulacaoCRM({
        data: {
          canal: form.canal!,
          origem: form.origem!,
          tipo: form.tipo!,
          assunto: form.assunto!,
          subassunto: form.sub,
          area: form.area!,
          detalhe: form.detalhe,
        },
      });

      toast.success(
        "Tabulação adicionada com sucesso.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["recentes"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["registros"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao gravar a tabulação.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (cadastros.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (cadastros.isError || !cad || !opts) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 text-destructive" />

          <div className="space-y-3">
            <div>
              <h1 className="font-semibold">
                Não foi possível carregar os cadastros
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                O sistema não conseguiu consultar os dados
                do CRM no PostgreSQL.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                void cadastros.refetch();
              }}
            >
              <RefreshCw />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const set =
    (campo: keyof Form) =>
    (valor: number | null) =>
      setForm((anterior) => ({
        ...anterior,
        [campo]: valor,
      }));

  const Campo = ({
    label,
    req,
    children,
  }: {
    label: string;
    req?: boolean;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <Label>
        {label}
        {req && (
          <span className="text-destructive">
            {" "}
            *
          </span>
        )}
      </Label>

      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            Cadastro de Tabulações
          </h1>

          <p className="text-sm text-muted-foreground">
            {recentes.data?.count ?? 0} tabulação(ões)
            cadastrada(s) por você.
          </p>
        </div>

        <ExportButton />
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Campo label="Canal" req>
            <SearchSelect
              options={cad.canal}
              value={form.canal}
              onChange={set("canal")}
            />
          </Campo>

          <Campo label="Origem" req>
            <SearchSelect
              options={opts.origem}
              value={form.origem}
              onChange={set("origem")}
            />
          </Campo>

          <Campo label="Tipo de Ocorrência" req>
            <SearchSelect
              options={cad.tipo}
              value={form.tipo}
              onChange={set("tipo")}
            />
          </Campo>

          <Campo label="Assunto" req>
            <SearchSelect
              options={opts.assunto}
              value={form.assunto}
              onChange={set("assunto")}
            />
          </Campo>

          <Campo label="Subassunto">
            <SearchSelect
              options={opts.sub}
              value={form.sub}
              onChange={set("sub")}
              clearable
            />
          </Campo>

          <Campo label="Área de Interesse" req>
            <SearchSelect
              options={opts.area}
              value={form.area}
              onChange={set("area")}
            />
          </Campo>

          <Campo label="Detalhe da Ocorrência">
            <SearchSelect
              options={opts.detalhe}
              value={form.detalhe}
              onChange={set("detalhe")}
              clearable
            />
          </Campo>

          <Campo label="Grau de Criticidade (automático)">
            <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
              {criticidade.isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                criticidadeNome ?? (
                  <span className="text-muted-foreground">
                    Selecione Tipo e Assunto
                  </span>
                )
              )}
            </div>
          </Campo>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            onClick={adicionar}
            disabled={
              saving ||
              !obrigatoriosPreenchidos
            }
          >
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Plus />
            )}

            Adicionar Tabulação
          </Button>

          <Button
            variant="outline"
            onClick={() => setForm(vazio)}
            disabled={saving}
          >
            <Eraser />
            Limpar campos
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">
            Últimas tabulações
          </h2>

          <Link
            to="/registros"
            className="text-sm text-primary hover:underline"
          >
            Ver todos os registros
          </Link>
        </div>

        {recentes.isError ? (
          <p className="text-sm text-destructive">
            Não foi possível carregar suas últimas
            tabulações.
          </p>
        ) : recentes.data?.rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">
                    Assunto
                  </th>
                  <th>Subassunto</th>
                  <th>Tipo</th>
                  <th>Criticidade</th>
                  <th>Data/hora</th>
                </tr>
              </thead>

              <tbody>
                {recentes.data.rows.map((row) => (
                  <tr
                    key={row.id_registro}
                    className="border-t"
                  >
                    <td className="py-2">
                      {row.assunto}
                    </td>

                    <td>
                      {row.subassunto ?? "—"}
                    </td>

                    <td>
                      {row.tipo_ocorrencia}
                    </td>

                    <td>
                      {row.criticidade}
                    </td>

                    <td>
                      {row.data_hora_inclusao
                        ? new Date(
                            row.data_hora_inclusao,
                          ).toLocaleString("pt-BR")
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma tabulação cadastrada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
