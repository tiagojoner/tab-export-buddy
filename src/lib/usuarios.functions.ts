// crm/src/lib/usuarios.functions.ts

import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import {
  lerChaveSessao,
  limparChaveSessao,
  salvarChaveSessao,
} from "./auth.server";
import { getDb } from "./db.server";

export type UsuarioCRM = {
  usuarioId: number;
  nome: string;
  setor: string;
};

type UsuarioRow = {
  usuario_id: string;
  nome_completo: string;
  setor: string;
};

const CHAVE_REGEX = /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/;

function normalizarChave(chave: string): string {
  return chave.trim().toUpperCase();
}

async function buscarUsuario(chave: string): Promise<UsuarioCRM | null> {
  const sql = getDb();

  const rows = await sql<UsuarioRow[]>`
    SELECT
      usuario_id::text AS usuario_id,
      nome_completo,
      setor
    FROM crm.identificar_usuario(${chave})
  `;

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    usuarioId: Number(row.usuario_id),
    nome: row.nome_completo,
    setor: row.setor,
  };
}

function erroPareceChaveInvalida(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("chave") ||
    message.includes("credencial") ||
    message.includes("acesso")
  );
}

export const identificarUsuario = createServerFn({ method: "POST" })
  .validator((data: { chave: string }) => data)
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = normalizarChave(data.chave);

    if (!CHAVE_REGEX.test(chave)) {
      return {
        ok: false as const,
        mensagem: "Informe uma chave válida no formato XXX-XXX-XXX.",
      };
    }

    try {
      const usuario = await buscarUsuario(chave);

      if (!usuario) {
        return {
          ok: false as const,
          mensagem: "Chave inválida ou inativa.",
        };
      }

      salvarChaveSessao(chave);

      return {
        ok: true as const,
        usuario,
      };
    } catch (error) {
      if (erroPareceChaveInvalida(error)) {
        return {
          ok: false as const,
          mensagem: "Chave inválida ou inativa.",
        };
      }

      console.error("Erro ao identificar usuário no PostgreSQL:", error);

      throw new Error("Não foi possível consultar o PostgreSQL.");
    }
  });

export const obterUsuarioAtual = createServerFn({ method: "GET" }).handler(
  async () => {
    setResponseHeader("Cache-Control", "no-store");

    const chave = lerChaveSessao();

    if (!chave) {
      return null;
    }

    try {
      const usuario = await buscarUsuario(chave);

      if (!usuario) {
        limparChaveSessao();
        return null;
      }

      return usuario;
    } catch (error) {
      console.error("Erro ao recuperar usuário da sessão:", error);
      limparChaveSessao();
      return null;
    }
  },
);

export const encerrarSessao = createServerFn({ method: "POST" }).handler(
  async () => {
    setResponseHeader("Cache-Control", "no-store");
    limparChaveSessao();

    return {
      ok: true,
    };
  },
);
