// crm/src/lib/auth.server.ts

import { getCookie, setCookie } from "@tanstack/react-start/server";

const COOKIE_NAME = "crm_chave";
const SESSION_SECONDS = 60 * 60 * 12;

export function lerChaveSessao(): string | null {
  return getCookie(COOKIE_NAME) ?? null;
}

export function salvarChaveSessao(chave: string): void {
  setCookie(COOKIE_NAME, chave, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/crm",
    maxAge: SESSION_SECONDS,
  });
}

export function limparChaveSessao(): void {
  setCookie(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/crm",
    maxAge: 0,
  });
}
