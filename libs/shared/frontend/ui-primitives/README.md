# `@open-kingdom/shared-frontend-ui-primitives`

The application's headless UI primitive set — `Button`, `Input`, `Label`, `Badge`, `Card`, `Dialog`, `AlertDialog`, `Select`, and `Tabs`. Each primitive is a thin Tailwind-styled wrapper over the corresponding Radix UI primitive (or, for `Button`/`Input`/`Label`/`Badge`/`Card`, plain native elements styled to match), following the shadcn-style "copy the source, own the styles" pattern but bundled as a workspace library so app authors don't manually copy files.

All primitives consume the design tokens defined in `shared-frontend-ui-theme` (`bg-background`, `text-foreground`, `bg-muted`, `border-border`, `ring-ring`, etc.) so light/dark mode and brand recolouring happen at the theme layer, not here.

---

## Exports

### Layout

| Export                                                                            | Description                                                                                                       |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | Card container with header / body / footer slots. Plain divs styled with the `bg-card` / `border-border` palette. |

### Form

| Export           | Type                            | Description                                                                                                                                                         |
| ---------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`         | `forwardRef<HTMLButtonElement>` | Sized, themed button. Variants via `buttonVariants` (cva): `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default`, `sm`, `lg`, `icon`. |
| `ButtonProps`    | `interface`                     | Extends `ButtonHTMLAttributes` with `variant`, `size`, and `asChild` (Radix `Slot`).                                                                                |
| `buttonVariants` | `cva(…)`                        | Style helper, exported for use in other primitives that want button styling without the element.                                                                    |
| `Input`          | `forwardRef<HTMLInputElement>`  | Text input with focus ring and disabled styles.                                                                                                                     |
| `Label`          | Radix `Label`                   | Form label component.                                                                                                                                               |
| `Badge`          | `BadgeProps` div                | Small status pill. Variants: `default`, `secondary`, `destructive`, `outline`.                                                                                      |
| `BadgeProps`     | `interface`                     | Extends `HTMLAttributes<HTMLDivElement>` with `variant`.                                                                                                            |
| `badgeVariants`  | `cva(…)`                        | Style helper.                                                                                                                                                       |

### Select (Radix)

| Export                                                                                                                   | Description      |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator` | Dropdown select. |

### Dialog (Radix)

| Export                                                                                                                                                         | Description   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `Dialog`, `DialogPortal`, `DialogOverlay`, `DialogClose`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` | Modal dialog. |

### AlertDialog (Radix)

| Export                                                                                                                                                                                                                                 | Description                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `AlertDialog`, `AlertDialogPortal`, `AlertDialogOverlay`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel` | Confirmation dialog. Use this — not `Dialog` — for destructive or irreversible actions where the user must explicitly confirm or cancel. |

### Tabs (Radix)

| Export                                           | Description                                                                                                                                                                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Tabbed panel. `Tabs` is the controlled root; `TabsList` is the trigger row; `TabsTrigger` and `TabsContent` are matched by `value` prop. Used by `shared-frontend-ui-record-detail` to render the tabbed body of a record-detail page. |

---

## Composition Notes

Every component is a `forwardRef` and accepts a `className` prop that is merged onto the rendered element via the `cn()` utility from `shared-frontend-ui-theme`. This means callers can override or extend the default styling without forking the component:

```tsx
<Button className="w-full" variant="outline" size="lg">
  Save
</Button>
```

The Radix-based components (`Dialog`, `AlertDialog`, `Select`, `Tabs`) re-export the underlying Radix sub-components verbatim — anything you can do with Radix directly, you can do here. The wrappers only add Tailwind classes.

### `asChild` and the Radix `Slot` pattern

`Button` accepts `asChild` (forwarded to Radix `Slot`), which lets you apply button styling to a different element — e.g. a `<Link>`:

```tsx
import { Link } from 'react-router';

<Button asChild variant="outline">
  <Link to="/admin">Admin</Link>
</Button>;
```

The result is an `<a>` (rendered by `<Link>`) with all the button styles applied. This is the recommended pattern for "link that looks like a button" — never wrap a `<button>` around an `<a>` or vice versa.

---

## Usage Examples

### Form row

```tsx
import { Button, Input, Label } from '@open-kingdom/shared-frontend-ui-primitives';

<form onSubmit={onSubmit} className="space-y-4">
  <div className="space-y-1">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" name="email" required />
  </div>
  <Button type="submit">Sign in</Button>
</form>;
```

### Confirmation dialog

```tsx
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, Button } from '@open-kingdom/shared-frontend-ui-primitives';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete account?</AlertDialogTitle>
      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>;
```

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@open-kingdom/shared-frontend-ui-primitives';

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…overview body…</TabsContent>
  <TabsContent value="activity">…activity body…</TabsContent>
</Tabs>;
```

### Select

```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@open-kingdom/shared-frontend-ui-primitives';

<Select value={stage} onValueChange={setStage}>
  <SelectTrigger>
    <SelectValue placeholder="Pick a stage" />
  </SelectTrigger>
  <SelectContent>
    {OPPORTUNITY_STAGES.map((s) => (
      <SelectItem key={s} value={s}>
        {s}
      </SelectItem>
    ))}
  </SelectContent>
</Select>;
```

---

## Tailwind Setup

These primitives reference semantic palette classes from `shared-frontend-ui-theme` (`bg-background`, `text-foreground`, `bg-muted`, `border-border`, `ring-ring`, etc.). The host application's Tailwind config must extend the base config from `ui-theme` and include this library's source files in its `content` glob:

```js
// tailwind.config.js
const baseConfig = require('@open-kingdom/shared-frontend-ui-theme/tailwind.config.js');

module.exports = {
  presets: [baseConfig],
  content: [
    './src/**/*.{ts,tsx}',
    '../../node_modules/@open-kingdom/shared-frontend-ui-primitives/src/**/*.{ts,tsx}',
    // …other @open-kingdom/* libs the app uses
  ],
};
```

---

## Testing

```bash
nx test shared-frontend-ui-primitives
```
