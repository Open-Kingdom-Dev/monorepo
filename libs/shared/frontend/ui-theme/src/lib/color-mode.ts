import { useCallback, useSyncExternalStore } from 'react';

type ColorMode = 'light' | 'dark';

const STORAGE_KEY = 'theme-mode';

export function getColorMode(): ColorMode {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem(STORAGE_KEY) as ColorMode) || 'light';
}

export function setColorMode(mode: ColorMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
  document.documentElement.classList.toggle('dark', mode === 'dark');
  window.dispatchEvent(new Event('color-mode-change'));
}

function subscribe(callback: () => void) {
  window.addEventListener('color-mode-change', callback);
  return () => window.removeEventListener('color-mode-change', callback);
}

export function useColorMode() {
  const mode = useSyncExternalStore(subscribe, getColorMode, () => 'light' as ColorMode);
  const setMode = useCallback((m: ColorMode) => setColorMode(m), []);
  return { mode, setMode } as const;
}
