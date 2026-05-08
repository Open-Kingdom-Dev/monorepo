import * as React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@open-kingdom/shared-frontend-ui-primitives';
import { useLeadConversionControllerConvertMutation } from '@open-kingdom/shared-frontend-data-access-api-client';

export interface ConvertLeadModalProps {
  leadId: number;
  defaultTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConverted?: () => void;
}

export function ConvertLeadModal({
  leadId,
  defaultTitle,
  open,
  onOpenChange,
  onConverted,
}: ConvertLeadModalProps) {
  const [createOpportunity, setCreateOpportunity] = React.useState(true);
  const [title, setTitle] = React.useState(defaultTitle ?? '');
  const [estimatedValue, setEstimatedValue] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const [convert, { isLoading }] = useLeadConversionControllerConvertMutation();

  React.useEffect(() => {
    if (open) {
      setTitle(defaultTitle ?? '');
      setEstimatedValue('');
      setError(null);
      setCreateOpportunity(true);
    }
  }, [open, defaultTitle]);

  const handleConvert = async () => {
    setError(null);
    try {
      const parsedValue = estimatedValue.trim()
        ? Number(estimatedValue)
        : undefined;
      if (parsedValue !== undefined && Number.isNaN(parsedValue)) {
        setError('Estimated value must be a number');
        return;
      }
      await convert({
        id: leadId,
        convertLeadRequestDto: {
          createOpportunity,
          opportunityTitle: createOpportunity && title.trim() ? title.trim() : undefined,
          opportunityEstimatedValue: createOpportunity ? parsedValue : undefined,
        },
      }).unwrap();
      onOpenChange(false);
      onConverted?.();
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null && 'data' in e
            ? String((e as { data?: unknown }).data ?? 'Conversion failed')
            : 'Conversion failed';
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert lead</DialogTitle>
          <DialogDescription>
            Turn this lead into a contact
            {` `}
            {createOpportunity ? 'and opportunity' : ''}. A company will be
            created from the lead’s company name if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={createOpportunity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCreateOpportunity(e.target.checked)
              }
            />
            Create an opportunity
          </label>
          {createOpportunity && (
            <>
              <div className="flex flex-col gap-1">
                <Label htmlFor="opp-title">Opportunity title</Label>
                <Input
                  id="opp-title"
                  value={title}
                  placeholder="Defaults to company + lead name"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTitle(e.target.value)
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="opp-value">Estimated value</Label>
                <Input
                  id="opp-value"
                  value={estimatedValue}
                  placeholder="Leave blank if unknown"
                  inputMode="decimal"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEstimatedValue(e.target.value)
                  }
                />
              </div>
            </>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={isLoading} onClick={handleConvert}>
            {isLoading ? 'Converting…' : 'Convert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
