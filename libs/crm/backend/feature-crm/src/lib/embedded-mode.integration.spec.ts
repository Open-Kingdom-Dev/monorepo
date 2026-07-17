/**
 * Embedded-mode integration test.
 *
 * Boots the CRM the way an embedding host does — WITHOUT any OpenKingdom auth:
 * no JWT/passport module, no user-management, no email, no guards. The host's
 * own middleware stamps `req.user = { id }` (the AuthenticatedRequest contract
 * from util-rbac) and `FeatureCrmModule.forRoot({ seed: 'lookups' })` seeds
 * dropdown data without the RBAC stack.
 *
 * The database is created from DDL generated with drizzle-kit's programmatic
 * API — the same recipe embedded hosts use, since migrations are not shipped
 * in the packages. Note: a real temp FILE is used, not ':memory:' —
 * DatabaseSetupModule opens its own connection, and each connection to
 * ':memory:' would see a different empty database.
 */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
} from 'drizzle-kit/api';

import { DatabaseSetupModule } from '@open-kingdom/shared-backend-data-access-database-setup';
import { createUsersSchema } from '@open-kingdom/shared-backend-data-access-users';
import { createConfigurableLookupsSchema } from '@open-kingdom/shared-backend-data-access-configurable-lookups';
import { createActivityLogSchema } from '@open-kingdom/shared-backend-data-access-activity-log';
import { createContactsSchema } from '@open-kingdom/crm-backend-data-access-contacts';
import { createOpportunitiesSchema } from '@open-kingdom/crm-backend-data-access-opportunities';
import type { AuthenticatedRequest } from '@open-kingdom/shared-backend-util-rbac';

import { FeatureCrmModule } from './feature-crm.module';

// A PREFIXED composition — the embedded host mounts the CRM's tables inside a
// database it may share with its own (SQL names become `emb_users` etc.; the
// db.query keys and every service are oblivious). Factories receive their
// same-prefix dependency tables, so composition follows FK order.
const PREFIX = 'emb_';
const usersSchema = createUsersSchema(PREFIX);
const contactsSchema = createContactsSchema(
  { users: usersSchema.users },
  PREFIX
);
const schema = {
  ...usersSchema,
  ...createConfigurableLookupsSchema(PREFIX),
  ...createActivityLogSchema({ users: usersSchema.users }, PREFIX),
  ...contactsSchema,
  ...createOpportunitiesSchema(
    { users: usersSchema.users, ...contactsSchema },
    PREFIX
  ),
};

describe('embedded mode (no OpenKingdom auth stack)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ok-embedded-'));
    const dbFile = join(tmpDir, 'embedded.db');

    // Host DDL recipe: generate CREATE statements from the composed schema.
    const prev = await generateSQLiteDrizzleJson({});
    const cur = await generateSQLiteDrizzleJson(schema, prev.id, 'snake_case');
    const statements = await generateSQLiteMigration(prev, cur);
    const bootstrap = new Database(dbFile);
    for (const statement of statements) bootstrap.exec(statement);
    // The host's identity perimeter provisions local users itself — note the
    // NULL password (externally-owned identity, no local credential) and the
    // prefixed SQL table name.
    bootstrap
      .prepare(
        `INSERT INTO emb_users (first_name, last_name, email, password) VALUES (?, ?, ?, NULL)`
      )
      .run('Host', 'User', 'host@example.test');
    bootstrap.close();

    const moduleRef = await Test.createTestingModule({
      imports: [
        DatabaseSetupModule.register({ schema, filename: dbFile }),
        FeatureCrmModule.forRoot({ seed: 'lookups' }),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // The host's auth middleware: identity was already verified upstream;
    // stamp the id the CRM controllers use for ownership.
    app.use((req: AuthenticatedRequest, _res: unknown, next: () => void) => {
      req.user = { id: 1, email: 'host@example.test' };
      next();
    });
    app.setGlobalPrefix('api');
    await app.init();
    await app.listen(0);
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${
      typeof address === 'object' && address ? address.port : 0
    }`;
  });

  afterAll(async () => {
    await app?.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const json = async (
    path: string,
    init?: RequestInit
  ): Promise<{ status: number; body: any }> => {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON response */
    }
    return { status: res.status, body };
  };

  it('seeds the CRM lookup lists without user-management', async () => {
    const { status, body } = await json('/api/configurable-lookups');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(20);
  });

  it('creates records owned by the host-stamped identity', async () => {
    const { status, body } = await json('/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Ada', lastName: 'Lovelace' }),
    });
    expect(status).toBe(201);
    expect(body.ownerId).toBe(1);
  });

  it('runs the lead-conversion workflow end to end', async () => {
    const lead = await json('/api/leads', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Grace Hopper',
        companyName: 'Navy Labs',
        email: 'grace@navy.test',
      }),
    });
    expect(lead.status).toBe(201);

    const converted = await json(`/api/leads/${lead.body.id}/convert`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    expect([200, 201]).toContain(converted.status);
    expect(converted.body.contact.id).toBeDefined();
    expect(converted.body.opportunity.id).toBeDefined();
  });

  it('serves the dashboard for the stamped user', async () => {
    const { status, body } = await json('/api/crm/dashboard');
    expect(status).toBe(200);
    expect(Array.isArray(body.pipeline)).toBe(true);
  });
});
