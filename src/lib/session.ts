import { useEffect, useState } from "react";

export type Identidade = { nome: string; setor: string };
const KEY = "gtc_identidade";
const EVT = "gtc_identidade_change";

export function lerIdentidade(): Identidade | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Identidade;
    return v.nome && v.setor ? v : null;
  } catch {
    return null;
  }
}

export function salvarIdentidade(v: Identidade) {
  sessionStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new Event(EVT));
}

export function limparIdentidade() {
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem("gtc_form");
  window.dispatchEvent(new Event(EVT));
}

/** Returns [identidade, carregado]. */
export function useIdentidade(): [Identidade | null, boolean] {
  const [id, setId] = useState<Identidade | null>(null);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const upd = () => setId(lerIdentidade());
    upd();
    setOk(true);
    window.addEventListener(EVT, upd);
    return () => window.removeEventListener(EVT, upd);
  }, []);
  return [id, ok];
}
