//crm/src/lib/usuarios.functions.ts

import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import {
  lerChaveSessao,
  limparChaveSessao,
  salvarChaveSessao,
} from "./auth.server";
import { getDb } from "./db.server";
import type { PerfilUsuario } from "./session";

export type UsuarioCRM = {
  usuarioId: number;
  nome: string;
  setor: string;
  perfil: PerfilUsuario;
};

type UsuarioRow = {
  usuario_id: string;
  nome_completo: string;
  setor: string;
  perfil: PerfilUsuario;
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
      setor,
      perfil
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
    perfil: row.perfil,
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

async function chavePertenceAUsuarioInativo(chave: string): Promise<boolean> {
  const sql = getDb();

  const rows = await sql<{ inativo: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM crm.usuarios u
      WHERE u.chave_acesso = ${chave}
        AND u.ativo = FALSE
    ) AS inativo
  `;

  return rows[0]?.inativo === true;
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
        const usuarioInativo = await chavePertenceAUsuarioInativo(chave);

        return {
          ok: false as const,
          mensagem: usuarioInativo
            ? "Seu acesso ao Gestor de Tabulações CRM está inativo. O período de registro das tabulações foi encerrado. Em caso de necessidade de acesso, entre em contato com a equipe responsável."
            : "Chave inválida. Verifique os dados informados.",
        };
      }

      salvarChaveSessao(chave);

      return {
        ok: true as const,
        usuario,
      };
    } catch (error) {
      if (erroPareceChaveInvalida(error)) {
        const usuarioInativo = await chavePertenceAUsuarioInativo(chave);

        return {
          ok: false as const,
          mensagem: usuarioInativo
            ? "Seu acesso ao Gestor de Tabulações CRM está inativo. O período de registro das tabulações foi encerrado. Em caso de necessidade de acesso, entre em contato com a equipe responsável."
            : "Chave inválida. Verifique os dados informados.",
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
