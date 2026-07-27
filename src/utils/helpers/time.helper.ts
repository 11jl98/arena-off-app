export function getDurationInHours(
  slots: { startTime: string; endTime: string }[]
): number {
  if (slots.length === 0) return 0;
  const [sh, sm] = slots[0].startTime.split(':').map(Number);
  const [eh, em] = slots[slots.length - 1].endTime.split(':').map(Number);
  const minutes = eh * 60 + em - sh * 60 - sm;
  return Math.max(0, minutes / 60);
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}
