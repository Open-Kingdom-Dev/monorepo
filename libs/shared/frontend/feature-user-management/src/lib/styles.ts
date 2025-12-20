/**
 * Styles for user management components.
 * Uses Tailwind classes with dark mode support.
 */
export const styles = {
  // Layout
  card: 'bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6',
  cardHeader: 'text-xl font-semibold text-neutral-900 dark:text-neutral-100',

  // Typography
  text: 'text-neutral-700 dark:text-neutral-300',
  textMuted: 'text-neutral-500 dark:text-neutral-400',
  textSmall: 'text-sm text-neutral-600 dark:text-neutral-400',

  // Form elements
  label:
    'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1',
  input:
    'w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
  inputGroup: 'space-y-1',

  // Buttons
  buttonPrimary:
    'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  buttonDanger:
    'px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors',
  buttonSecondary:
    'px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium transition-colors',

  // Status badges
  badgePending:
    'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  badgeActive:
    'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  badgeAdmin:
    'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  badgeUser:
    'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  badgeGuest:
    'inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',

  // Table
  table: 'w-full',
  tableHeader: 'border-b border-neutral-200 dark:border-neutral-700',
  tableHeaderCell:
    'py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400',
  tableBody: 'divide-y divide-neutral-200 dark:divide-neutral-700',
  tableRow: 'hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors',
  tableCell: 'py-3 px-4 text-sm text-neutral-900 dark:text-neutral-100',
  tableCellActions: 'py-3 px-4 text-right',

  // Modal
  modalOverlay:
    'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50',
  modalContent:
    'bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4',
  modalHeader:
    'text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4',
  modalFooter:
    'flex gap-3 justify-end pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700',

  // Tabs
  tabList:
    'flex gap-1 border-b border-neutral-200 dark:border-neutral-700 mb-6',
  tab: 'px-4 py-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors',
  tabActive:
    'px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-px',
  tabHeader: 'flex justify-end mb-4',

  // States
  loading: 'text-sm text-neutral-500 dark:text-neutral-400 py-8 text-center',
  empty: 'text-sm text-neutral-500 dark:text-neutral-400 py-8 text-center',
  error: 'text-sm text-red-600 dark:text-red-400',
  success: 'text-sm text-green-600 dark:text-green-400',
  warning: 'text-sm text-amber-600 dark:text-amber-400',
  message: 'py-8 text-center',
  messageTitle: 'text-lg font-semibold mb-2',

  // Page header
  pageHeader: 'flex justify-between items-center mb-6',
  pageTitle: 'text-xl font-semibold text-neutral-900 dark:text-neutral-100',
};
