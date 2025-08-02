import type { MetaFunction, LinksFunction } from 'react-router';

/**
 * Application metadata configuration
 * Business logic for how the app should appear in browsers and search engines
 */
export const getAppMeta: MetaFunction = () => [
  {
    title: 'New Nx React Router App',
  },
];

/**
 * Application resource links configuration  
 * Business logic for fonts, stylesheets, and preconnections
 */
export const getAppLinks: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  {
    rel: 'stylesheet',
    href: '/styles.css',
  }
];

/**
 * Get application title
 * Centralized business logic for app branding
 */
export function getAppTitle(): string {
  return 'New Nx React Router App';
}

/**
 * Get font configuration
 * Business logic for typography choices
 */
export function getFontConfig() {
  return {
    fontFamily: 'Inter',
    weights: '100..900',
    supports: {
      italic: true,
      optical: true,
    }
  };
}

/**
 * Validate application configuration
 * Business logic to ensure proper app setup
 */
export function validateAppConfig(): boolean {
  const title = getAppTitle();
  const fontConfig = getFontConfig();
  
  return (
    title.length > 0 &&
    fontConfig.fontFamily === 'Inter' &&
    fontConfig.supports.italic === true
  );
} 