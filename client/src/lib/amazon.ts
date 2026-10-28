/**
 * Amazon Associates tracking ID for thepatientscompass.com.
 * Every Amazon link on the site goes through withAmazonTag(), so changing
 * this one value updates them all. Leave empty to link without a tag.
 */
export const AMAZON_TAG = "patientscompass-20";

/** Adds the Associates tag to an amazon.com link (short amzn.to links already carry one). */
export function withAmazonTag(url: string): string {
  if (!AMAZON_TAG) return url;
  try {
    const parsed = new URL(url);
    if (!/(^|\.)amazon\.com$/i.test(parsed.hostname)) return url;
    parsed.searchParams.set("tag", AMAZON_TAG);
    return parsed.toString();
  } catch {
    return url;
  }
}
