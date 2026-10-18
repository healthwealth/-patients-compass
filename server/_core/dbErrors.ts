/**
 * Detects unique-constraint violations from Cloudflare D1 (SQLite), including
 * when Drizzle wraps the driver error. Also recognizes the legacy MySQL code so
 * older call sites and tests keep working.
 */
export function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: any = error;
  while (current && !seen.has(current)) {
    seen.add(current);
    if (current.code === "ER_DUP_ENTRY") return true;
    const message = String(current.message ?? "");
    if (/UNIQUE constraint failed|SQLITE_CONSTRAINT/i.test(message)) return true;
    current = current.cause;
  }
  return false;
}

/** Full error text including wrapped causes, for column-specific checks. */
export function errorText(error: unknown): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: any = error;
  while (current && !seen.has(current)) {
    seen.add(current);
    parts.push(String(current.message ?? ""));
    current = current.cause;
  }
  return parts.join(" | ");
}

/**
 * Returns the "table.column" named in a unique-constraint failure, or the legacy
 * MySQL "Duplicate entry ... for key ..." text. Query text is ignored so column
 * names that merely appear in the INSERT statement do not cause false matches.
 */
export function uniqueViolationDetail(error: unknown): string {
  const text = errorText(error);
  const sqlite = /UNIQUE constraint failed: ([^\s|]+)/i.exec(text);
  if (sqlite) return sqlite[1];
  const mysql = /Duplicate entry .*? for key '([^']+)'/i.exec(text);
  return mysql ? mysql[1] : "";
}
