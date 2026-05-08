export const ACTIVITY_TYPES = ['note', 'call', 'meeting', 'email', 'task'] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export function isActivityType(value: unknown): value is ActivityType {
  return typeof value === 'string' && (ACTIVITY_TYPES as readonly string[]).includes(value);
}

export const ACTIVITY_TYPES_WITH_DUE_DATE: readonly ActivityType[] = ['task', 'call', 'meeting'] as const;

export function supportsDueDate(type: ActivityType): boolean {
  return (ACTIVITY_TYPES_WITH_DUE_DATE as readonly string[]).includes(type);
}
