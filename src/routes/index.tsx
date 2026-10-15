// /root/app-nxtai/crm/src/routes/index.tsx

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  lerIdentidade,
  salvarIdentidade,
} from "@/lib/session";
import {
  identificarUsuario,
  obterUsuarioAtual,
} from "@/lib/usuarios.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Gestor de Tabulações CRM — Identificação",
      },
      {
        name: "description",
        content:
          "Sistema colaborativo para levantamento e consolidação das classificações de ocorrências do CRM.",
      },
      {
        property: "og:title",
        content: "Gestor de Tabulações CRM",
      },
      {
        property: "og:description",
        content:
          "Levantamento colaborativo das tabulações de ocorrências do CRM.",
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
  component: Index,
});

function formatarChave(value: string): string {
  const limpa = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 9);

  return limpa.match(/.{1,3}/g)?.join("-") ?? "";
}

function Index() {
  const navigate = useNavigate();

  const [chave, setChave] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function verificar() {
      const identidadeLocal = lerIdentidade();

      if (identidadeLocal) {
        navigate({ to: "/cadastro" });
        return;
      }

      try {
        const usuario = await obterUsuarioAtual();

        if (!ativo || !usuario) {
          return;
        }

        salvarIdentidade({
          usuarioId: usuario.usuarioId,
          nome: usuario.nome,
          setor: usuario.setor,
        });

        navigate({ to: "/cadastro" });
      } finally {
        if (ativo) {
          setVerificandoSessao(false);
        }
      }
    }

    void verificar();

    return () => {
      ativo = false;
    };
  }, [navigate]);

  const chaveValida =
    /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(chave);

  async function entrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!chaveValida || enviando) {
      return;
    }

    setErro(null);
    setEnviando(true);

    try {
      const resultado = await identificarUsuario({
        data: {
          chave,
        },
      });

      if (!resultado.ok) {
        setErro(resultado.mensagem);
        return;
      }

      salvarIdentidade({
        usuarioId: resultado.usuario.usuarioId,
        nome: resultado.usuario.nome,
        setor: resultado.usuario.setor,
      });

      navigate({ to: "/cadastro" });
    } catch (error) {
      console.error(error);
      setErro(
        "Não foi possível validar a chave neste momento. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (verificandoSessao) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm"
        onSubmit={entrar}
      >
        <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
          <ClipboardList />
        </div>

        <h1 className="text-2xl font-semibold">
          Gestor de Tabulações CRM
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Informe sua chave de acesso para iniciar o cadastro das
          tabulações de CRM.
        </p>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="chave">Chave de acesso *</Label>

            <Input
              id="chave"
              value={chave}
              maxLength={11}
              autoComplete="off"
              spellCheck={false}
              placeholder="XXX-XXX-XXX"
              onChange={(event) => {
                setChave(formatarChave(event.target.value));
                setErro(null);
              }}
            />

            <p className="text-xs text-muted-foreground">
              Utilize a chave individual fornecida para acesso ao sistema.
            </p>
          </div>

          {erro && (
            <div
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {erro}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!chaveValida || enviando}
          >
            {enviando && <Loader2 className="animate-spin" />}
            Entrar
          </Button>
        </div>
      </form>
    </div>
  );
}
