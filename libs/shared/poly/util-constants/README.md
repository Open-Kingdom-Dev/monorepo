# @open-kingdom/shared-poly-util-constants

Shared constants used across both backend (NestJS) and frontend (React) packages in the OpenKingdom monorepo, preventing magic string duplication for cross-package injection tokens and configuration keys.

---

## Exports

| Export   | Type     | Value  | Description                                              |
| -------- | -------- | ------ | -------------------------------------------------------- |
| `DB_TAG` | `string` | `'DB'` | NestJS injection token for the Drizzle database instance |

---

## Usage

### Backend: Providing the database (NestJS + Drizzle)

```typescript
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';

// In DatabaseSetupModule.register() — the module provides the Drizzle DB with this token:
DatabaseSetupModule.register({
  schema: mySchema,
  tag: DB_TAG, // 'DB'
});
```

### Backend: Injecting the database into a service

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
class MyService {
  constructor(@Inject(DB_TAG) private db: NodePgDatabase<typeof schema>) {}

  async findAll() {
    return this.db.select().from(schema.users);
  }
}
```

### Why this constant exists

`DatabaseSetupModule` provides the Drizzle DB instance under a string injection token. Any service that needs the database must inject it using the same token string. Without a shared constant, both sides use a magic string literal `'DB'` — a typo on either side would produce a silent runtime DI failure. Importing from this package ensures both are always in sync.

---

## Testing

```bash
nx test shared-poly-util-constants
```
