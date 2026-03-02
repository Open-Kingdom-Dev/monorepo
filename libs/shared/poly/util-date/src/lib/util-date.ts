const PLACEHOLDER = '—';

export function formatDate(timestamp: number | undefined): string {
  return timestamp ? new Date(timestamp).toLocaleDateString() : PLACEHOLDER;
}
