/**
 * Grid Constants
 * Constants related to grid functionality
 */

/**
 * Default grid configuration values
 */
export const DEFAULT_GRID_PAGE_SIZE = 20;
export const DEFAULT_GRID_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const DEFAULT_GRID_ROW_HEIGHT = 42;
export const DEFAULT_GRID_HEADER_HEIGHT = 42;
export const DEFAULT_COLUMN_MIN_WIDTH = 100;
export const DEFAULT_TOOLTIP_SHOW_DELAY = 500;
export const DEFAULT_CHECKBOX_COLUMN_WIDTH = 50;

/**
 * Grid selection modes
 */
export const GRID_SELECTION_MODE_SINGLE = 'single' as const;
export const GRID_SELECTION_MODE_MULTIPLE = 'multiple' as const;

/**
 * Grid selection types
 */
export const GRID_SELECTION_TYPE_FULL_ROW = 'fullRow';
export const GRID_SELECTION_TYPE_CHECKBOX = 'checkbox';

/**
 * Grid column types
 */
export const GRID_COLUMN_TYPE_TEXT = 'text';
export const GRID_COLUMN_TYPE_NUMBER = 'number';
export const GRID_COLUMN_TYPE_DATE = 'date';
export const GRID_COLUMN_TYPE_BOOLEAN = 'boolean';
export const GRID_COLUMN_TYPE_OBJECT = 'object';

/**
 * Grid filter types
 */
export const GRID_FILTER_TYPE_TEXT = 'text';
export const GRID_FILTER_TYPE_NUMBER = 'number';
export const GRID_FILTER_TYPE_DATE = 'date';
export const GRID_FILTER_TYPE_SET = 'set';
export const GRID_FILTER_TYPE_CUSTOM = 'custom';

/**
 * Grid sort directions
 */
export const GRID_SORT_ASC = 'asc';
export const GRID_SORT_DESC = 'desc';

/**
 * Grid themes
 */
export const GRID_THEME_LIGHT = 'light';
export const GRID_THEME_DARK = 'dark';
export const GRID_THEME_AUTO = 'auto';
export const GRID_DOM_LAYOUT = 'autoHeight' as const;

/**
 * Grid pinning positions
 */
export const GRID_PIN_LEFT = 'left';
export const GRID_PIN_RIGHT = 'right';

/**
 * Grid group display types
 */
export const GRID_GROUP_DISPLAY_SINGLE_COLUMN = 'singleColumn';
export const GRID_GROUP_DISPLAY_MULTIPLE_COLUMNS = 'multipleColumns';
export const GRID_GROUP_DISPLAY_GROUP_ROWS = 'groupRows';
