// Generates migrations/0001_id_offset.sql (run: npx tsx scripts/generate-id-offset-migration.ts > migrations/0001_id_offset.sql)
import * as schema from "../drizzle/schema";
import { getTableColumns, getTableName, is } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
const OFFSET = 1_000_000_000;
const lines: string[] = [
  "-- Start new ids far above anything that came from the Manus database, so rows",
  "-- created on the new site never collide with rows imported later from Manus.",
  "-- (SQLite AUTOINCREMENT remembers the highest id ever used, even after delete.)",
];
for (const value of Object.values(schema) as unknown[]) {
  if (!is(value, SQLiteTable)) continue;
  const table = value as SQLiteTable;
  const name = getTableName(table);
  const cols = getTableColumns(table) as Record<string, any>;
  const id = cols.id;
  if (!id || !(id as any).autoIncrement) continue;
  const names = ["`id`"]; const vals = [String(OFFSET)];
  for (const [, col] of Object.entries(cols)) {
    if (col.name === "id" || !col.notNull || col.hasDefault) continue;
    names.push("`" + col.name + "`");
    const t = String(col.columnType);
    vals.push(t === "SQLiteText" || t === "SQLiteTextJson" ? (col.enumValues?.length ? `'${col.enumValues[0]}'` : "'__id_offset__'") : "0");
  }
  lines.push(`INSERT INTO \`${name}\` (${names.join(", ")}) VALUES (${vals.join(", ")});`);
  lines.push(`DELETE FROM \`${name}\` WHERE \`id\` = ${OFFSET};`);
}
console.log(lines.join("\n"));
