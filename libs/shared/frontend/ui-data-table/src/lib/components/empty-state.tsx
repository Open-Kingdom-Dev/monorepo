import { Inbox } from 'lucide-react';
import { cn } from '@open-kingdom/shared-frontend-ui-theme';
import type { EmptyState as EmptyStateData } from '../data-table.types';

interface Props {
  state?: EmptyStateData;
  className?: string;
}

const DEFAULT_EMPTY: EmptyStateData = {
  icon: <Inbox className="h-10 w-10" aria-hidden="true" />,
  title: 'No results',
  description: 'Nothing to show here yet.',
};

export function EmptyState({ state = DEFAULT_EMPTY, className }: Props) {
  return (
    <div
      role="status"
      className={cn(
        'flex min-h-[12rem] flex-col items-center justify-center gap-2 p-8 text-center',
        className
      )}
    >
      {state.icon && <div className="text-muted-foreground">{state.icon}</div>}

      <p className="text-sm font-medium text-foreground">{state.title}</p>

      {state.description && (
        <p className="text-sm text-muted-foreground">{state.description}</p>
      )}

      {state.action && <div className="mt-2">{state.action}</div>}
    </div>
  );
}
