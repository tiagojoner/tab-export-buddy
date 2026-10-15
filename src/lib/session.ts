//crm/src/lib/session.ts

import { useEffect, useState } from "react";

export type PerfilUsuario = "ADMINISTRADOR" | "USUARIO";

export type Identidade = {
  usuarioId: number;
  nome: string;
  setor: string;
  perfil: PerfilUsuario;
};

const KEY = "gtc_identidade";
const EVT = "gtc_identidade_change";

export function lerIdentidade(): Identidade | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(KEY);

    if (!raw) {
      return null;
    }

    const value = JSON.parse(raw) as Identidade;

    if (
      !Number.isFinite(value.usuarioId) ||
      !value.nome ||
      !value.setor ||
      !["ADMINISTRADOR", "USUARIO"].includes(value.perfil)
    ) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

export function salvarIdentidade(value: Identidade): void {
  sessionStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(EVT));
}

export function limparIdentidade(): void {
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem("gtc_form");
  sessionStorage.removeItem("gtc_form_classificacao");
  sessionStorage.removeItem("gtc_form_canal_origem");
  window.dispatchEvent(new Event(EVT));
}

/** Retorna [identidade, carregado]. */
export function useIdentidade(): [Identidade | null, boolean] {
  const [identidade, setIdentidade] = useState<Identidade | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const atualizar = () => {
      setIdentidade(lerIdentidade());
    };

    atualizar();
    setCarregado(true);

    window.addEventListener(EVT, atualizar);

    return () => {
      window.removeEventListener(EVT, atualizar);
    };
  }, []);

  return [identidade, carregado];
}
