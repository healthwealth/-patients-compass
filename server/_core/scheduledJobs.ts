/**
 * Scheduled work for the Cloudflare deployment (replaces Manus "Heartbeat" cron).
 *
 * One Cron Trigger fires at the top of every hour (see wrangler.jsonc). The
 * Worker checks this table and calls each due `/api/scheduled/*` handler with
 * the CRON_SECRET header. All handlers are idempotent, so a retried or
 * duplicated run never double-sends.
 *
 * Times are UTC. 09:00 UTC is 2am Pacific in summer / 1am in winter.
 */

export type ScheduledJob = {
  name: string;
  path: string;
  /** Hour of day (0–23, UTC) the job runs. */
  hourUtc: number;
  /** Optional day of week (0 = Sunday, UTC). Omit for daily. */
  dayOfWeekUtc?: number;
  description: string;
};

export const SCHEDULED_JOBS: ScheduledJob[] = [
  { name: "daily-analytics-snapshot", path: "/api/scheduled/analytics-snapshot", hourUtc: 0, description: "Capture daily analytics snapshot" },
  { name: "welcome-email-1", path: "/api/scheduled/email-1", hourUtc: 9, description: "Welcome email 1 (Day 0)" },
  { name: "trial-expiration", path: "/api/scheduled/trial-expiration", hourUtc: 9, description: "Trial ends tomorrow reminder" },
  { name: "onboarding", path: "/api/scheduled/onboarding", hourUtc: 9, description: "Onboarding emails (days 1, 3, 5)" },
  { name: "welcome-email-2", path: "/api/scheduled/email-2", hourUtc: 10, description: "Welcome email 2 (Day 2)" },
  { name: "welcome-email-3", path: "/api/scheduled/email-3", hourUtc: 11, description: "Welcome email 3 (Day 5)" },
  { name: "re-engagement", path: "/api/scheduled/re-engagement", hourUtc: 15, description: "Re-engagement for members inactive 7+ days (max once a week each)" },
  { name: "weekly-digest", path: "/api/scheduled/weekly-digest", hourUtc: 15, dayOfWeekUtc: 0, description: "Sunday weekly digest" },
];

export function jobsDueAt(date: Date): ScheduledJob[] {
  const hour = date.getUTCHours();
  const day = date.getUTCDay();
  return SCHEDULED_JOBS.filter(job => job.hourUtc === hour && (job.dayOfWeekUtc === undefined || job.dayOfWeekUtc === day));
}
