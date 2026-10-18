export function formatReorderAnnouncement(title: string, action: "grabbed" | "moved" | "dropped", position: number, total: number) {
  return `${title} ${action}, position ${position} of ${total}.`;
}

export function formatReorderSuccessToast(title: string, position: number) {
  return `${title} moved to position ${position}.`;
}
