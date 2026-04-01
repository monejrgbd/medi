export function formatQueueNumber(n: number | null | undefined, queueType: string): string {
  if (n == null) return '';
  switch (queueType) {
    case 'fifo': return String(n);
    case 'priority': return `P${n}`;
    case 'appointment_priority':
    case 'appointment_fifo': return `A${n}`;
    case 'critical_appointment_fifo': return `C${n}`;
    default: return String(n);
  }
}
