//crm/src/routes/parametrizacao.tsx

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/parametrizacao")({
  beforeLoad: () => {
    throw redirect({ to: "/cadastros" });
  },
  component: () => null,
});
