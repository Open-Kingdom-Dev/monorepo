export const RELATED_ENTITY_TYPES = ['contact', 'company', 'lead', 'opportunity'] as const;

export type RelatedEntityType = (typeof RELATED_ENTITY_TYPES)[number];

export function isRelatedEntityType(value: unknown): value is RelatedEntityType {
  return typeof value === 'string' && (RELATED_ENTITY_TYPES as readonly string[]).includes(value);
}
