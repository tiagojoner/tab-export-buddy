//crm/src/lib/db.server.ts

import { readFileSync } from "node:fs";
import postgres from "postgres";

let client: ReturnType<typeof postgres> | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não configurada: ${name}`);
  }

  return value;
}

function getDatabasePassword(): string {
  const directPassword = process.env.PGPASSWORD?.trim();

  if (directPassword) {
    return directPassword;
  }

  const passwordFile = process.env.PGPASSWORD_FILE?.trim();

  if (passwordFile) {
    const password = readFileSync(passwordFile, "utf8").trim();

    if (password) {
      return password;
    }
  }

  throw new Error(
    "Senha do PostgreSQL não configurada. Informe PGPASSWORD ou PGPASSWORD_FILE.",
  );
}

export function getDb() {
  if (client) {
    return client;
  }

  client = postgres({
    host: requiredEnv("PGHOST"),
    port: Number(process.env.PGPORT ?? "5432"),
    database: requiredEnv("PGDATABASE"),
    username: requiredEnv("PGUSER"),
    password: getDatabasePassword(),
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return client;
}
