import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { ClipboardList, LogOut, Table2, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { limparIdentidade, useIdentidade, type Identidade } from "@/lib/session";

const nav = [
  { to: "/cadastro", label: "Cadastro de Tabulações", icon: ClipboardList },
  { to: "/registros", label: "Tabulações Registradas", icon: Table2 },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: (id: Identidade) => ReactNode }) {
  const [id, loaded] = useIdentidade();
  const navigate = useNavigate();
  useEffect(() => {
    if (loaded && !id) navigate({ to: "/" });
  }, [loaded, id, navigate]);

  if (!id)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="font-semibold text-primary">Gestor de Tabulações CRM</div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right">
              <div className="font-medium">{id.nome}</div>
              <div className="text-muted-foreground">{id.setor}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                limparIdentidade();
                navigate({ to: "/" });
              }}
            >
              <LogOut /> Trocar usuário
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "!border-primary !text-primary font-medium" }}
            >
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children(id)}</main>
    </div>
  );
}
