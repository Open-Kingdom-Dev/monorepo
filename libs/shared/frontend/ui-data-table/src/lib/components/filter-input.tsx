import { useState } from 'react';
import { useDebouncedEffect, useUpdateEffect } from '@react-hookz/web';
import { Input } from '@open-kingdom/shared-frontend-ui-primitives';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';

export const DEBOUNCE_MS = 200;

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  debounceMs?: number;
}

/**
 * Debounced text input. Component-local state mirrors the external value so
 * typing stays smooth regardless of how expensive downstream filtering is;
 * `useDebouncedEffect` is the only path that writes back.
 */
export function FilterInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
  debounceMs = DEBOUNCE_MS,
}: Props) {
  const [local, setLocal] = useState(value);

  // Sync external updates into the local mirror (e.g. when persisted state
  // hydrates after mount). `useUpdateEffect` skips the initial render so we
  // don't bounce the value back to the identical default.
  useUpdateEffect(() => {
    setLocal(value);
  }, [value]);

  // Push local input back up after the user stops typing.
  useDebouncedEffect(
    () => {
      if (local === value) return;
      onChange(local);
    },
    [local],
    debounceMs
  );

  return (
    <Input
      value={local}
      onChange={(e) => setLocal(e.currentTarget.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={cn('h-8', className)}
    />
  );
}
