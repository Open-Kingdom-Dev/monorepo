/**
 * Grid Configuration Constants
 */

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Column defaults
export const DEFAULT_MIN_WIDTH = 100;
export const DEFAULT_TOOLTIP_DELAY = 500;

// Layout
export const DOM_LAYOUT_AUTO_HEIGHT = 'autoHeight' as const;

// Row selection modes (for new API)
export const ROW_SELECTION_SINGLE = 'singleRow' as const;
export const ROW_SELECTION_MULTI = 'multiRow' as const;
