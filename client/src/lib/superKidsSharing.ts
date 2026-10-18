export const SUPER_KIDS_SHARE_TITLE = "Healthy Habits for Super Kids";

export function buildSuperKidsShareMessage(childName: string): string {
  const name = childName.trim();
  return name
    ? `We made a Healthy Habits certificate for ${name}! Explore this free printable activity pack for playful family learning.`
    : "Explore Healthy Habits for Super Kids—a free printable activity pack for playful family learning at home.";
}

export function buildPinterestShareUrl(input: { pageUrl: string; imageUrl: string; message: string }): string {
  return `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(input.pageUrl)}&media=${encodeURIComponent(input.imageUrl)}&description=${encodeURIComponent(input.message)}`;
}
