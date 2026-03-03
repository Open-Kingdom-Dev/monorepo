# @open-kingdom/shared-poly-util-date

Shared date utility functions that work in both Node.js and browser environments, providing common date formatting helpers with no external library dependencies.

---

## Exports

| Export                  | Signature                                    | Description                                                                                                                                      |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `formatDate(timestamp)` | `(timestamp: number \| undefined) => string` | Formats a Unix millisecond timestamp as a locale date string using `toLocaleDateString()`; returns `'—'` (em-dash) if `timestamp` is `undefined` |

---

## Usage

```typescript
import { formatDate } from '@open-kingdom/shared-poly-util-date';

// With a valid timestamp:
formatDate(1709337600000); // '3/2/2026' (locale-dependent)

// With undefined (e.g., missing data):
formatDate(undefined); // '—'

// Typical usage with Invitation data:
const expiry = formatDate(invitation.tokenExpiry);
const invitedAt = formatDate(invitation.invitedAt);
```

---

## Behavior Details

- Uses `new Date(timestamp).toLocaleDateString()` — output format depends on the runtime's locale
- The placeholder `'—'` (Unicode em-dash `\u2014`) is returned when `timestamp` is `undefined`
- No external dependencies — uses only the native `Date` API

---

## No External Dependencies

This library has no dependencies beyond the JavaScript runtime's built-in `Date` object. It is safe to import in any environment (browser, Node.js, Deno, edge runtimes).

---

## Testing

```bash
nx test shared-poly-util-date
```
