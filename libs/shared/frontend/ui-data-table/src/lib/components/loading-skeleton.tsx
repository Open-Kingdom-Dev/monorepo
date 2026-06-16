import {
  Skeleton,
  TableCell,
  TableRow,
} from '@open-kingdom/shared-frontend-ui-primitives';

interface Props {
  columnCount: number;
  rowCount: number;
}

export function LoadingSkeleton({ columnCount, rowCount }: Props) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={rowIndex} role="status">
          {Array.from({ length: columnCount }).map((__, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full max-w-[12rem]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
