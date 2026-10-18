export const EMAIL_LINK_COOLDOWN_SECONDS = 60;
export const MAX_OAUTH_AUTO_RETRIES = 2;

export function decrementCooldown(seconds: number): number {
  return Math.max(0, Math.floor(seconds) - 1);
}

export function shouldAutoRetry(reason: string | null, retryCount: number): boolean {
  return reason === "provider" && retryCount < MAX_OAUTH_AUTO_RETRIES;
}

export function nextOAuthRetryCount(retryCount: number): number {
  return Math.min(MAX_OAUTH_AUTO_RETRIES, Math.max(0, Math.floor(retryCount)) + 1);
}

export function retryStatus(retryCount: number, retrying: boolean): string {
  if (retryCount >= MAX_OAUTH_AUTO_RETRIES) {
    return "Automatic retries are complete. Use the email sign-in link option to continue.";
  }
  return retrying
    ? `Automatic retry ${retryCount} of ${MAX_OAUTH_AUTO_RETRIES} is starting…`
    : `Automatic retry ${retryCount + 1} of ${MAX_OAUTH_AUTO_RETRIES} will start shortly…`;
}
