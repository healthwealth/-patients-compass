export type FunnelCsvStage = { label: string; count: number; conversionFromPrevious: number; conversionFromStart: number };
export type FunnelCsvInput = { periodDays: number; stages: FunnelCsvStage[] };

const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

/** Formats aggregate-only funnel metrics; callers must not pass user-level records. */
export function buildConversionFunnelCsv(funnel: FunnelCsvInput) {
  const rows: (string | number)[][] = [
    ["Patients Compass application conversion funnel"],
    [`Reporting window: last ${funnel.periodDays} days`],
    [],
    ["Stage", "Aggregate count", "Conversion from previous (%)", "Conversion from start (%)"],
    ...funnel.stages.map((stage) => [stage.label, stage.count, stage.conversionFromPrevious, stage.conversionFromStart]),
  ];
  return rows.map((row) => row.map(escapeCell).join(",")).join("\n");
}
