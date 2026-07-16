import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, asc, eq } from 'drizzle-orm';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import type { ConfigurableLookup, ConfigurableLookupsSchema } from './schemas';
import {
  CreateConfigurableLookupDto,
  UpdateConfigurableLookupDto,
} from './dtos';

@Injectable()
export class ConfigurableLookupsService {
  // Tables come from the host-composed schema (SCHEMA_TAG) rather than the
  // module-scope singletons, so a prefixed schema (embedded mode) works
  // transparently.
  private readonly configurableLookups: ConfigurableLookupsSchema['configurableLookups'];

  constructor(
    @Inject(DB_TAG)
    private readonly db: BetterSQLite3Database<ConfigurableLookupsSchema>,
    @Inject(SCHEMA_TAG) schema: ConfigurableLookupsSchema
  ) {
    this.configurableLookups = schema.configurableLookups;
  }

  async findByListKey(
    listKey: string,
    opts: { includeInactive?: boolean } = {}
  ): Promise<ConfigurableLookup[]> {
    const rows = await this.db
      .select()
      .from(this.configurableLookups)
      .where(eq(this.configurableLookups.listKey, listKey))
      .orderBy(asc(this.configurableLookups.sortOrder), asc(this.configurableLookups.id))
      .all();
    return opts.includeInactive ? rows : rows.filter((r) => r.isActive === 1);
  }

  async findAll(): Promise<ConfigurableLookup[]> {
    return this.db
      .select()
      .from(this.configurableLookups)
      .orderBy(
        asc(this.configurableLookups.listKey),
        asc(this.configurableLookups.sortOrder),
        asc(this.configurableLookups.id)
      )
      .all();
  }

  async findById(id: number): Promise<ConfigurableLookup | undefined> {
    return this.db.query.configurableLookups.findFirst({
      where: eq(this.configurableLookups.id, id),
    });
  }

  async findByListAndValue(
    listKey: string,
    value: string
  ): Promise<ConfigurableLookup | undefined> {
    return this.db.query.configurableLookups.findFirst({
      where: and(
        eq(this.configurableLookups.listKey, listKey),
        eq(this.configurableLookups.value, value)
      ),
    });
  }

  async create(
    input: CreateConfigurableLookupDto
  ): Promise<ConfigurableLookup> {
    const existing = await this.findByListAndValue(input.listKey, input.value);
    if (existing) {
      throw new ConflictException(
        `Lookup ${input.listKey}:${input.value} already exists`
      );
    }
    const [row] = await this.db
      .insert(this.configurableLookups)
      .values({
        listKey: input.listKey,
        value: input.value,
        label: input.label,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive === false ? 0 : 1,
        isSystem: 0,
      })
      .returning();
    return row;
  }

  async update(
    id: number,
    input: UpdateConfigurableLookupDto
  ): Promise<ConfigurableLookup> {
    const current = await this.findById(id);
    if (!current) {
      throw new NotFoundException(`Lookup ${id} not found`);
    }
    if (
      current.isSystem === 1 &&
      ((input.value !== undefined && input.value !== current.value) ||
        (input.listKey !== undefined && input.listKey !== current.listKey))
    ) {
      throw new ForbiddenException(
        'System lookup identifiers cannot be changed; only labels and ordering are editable'
      );
    }
    if (current.isSystem === 1 && input.isActive === false) {
      throw new ForbiddenException('System lookups cannot be deactivated');
    }

    const nextListKey = input.listKey ?? current.listKey;
    const nextValue = input.value ?? current.value;
    if (nextListKey !== current.listKey || nextValue !== current.value) {
      const clash = await this.findByListAndValue(nextListKey, nextValue);
      if (clash && clash.id !== id) {
        throw new ConflictException(
          `Lookup ${nextListKey}:${nextValue} already exists`
        );
      }
    }

    const [row] = await this.db
      .update(this.configurableLookups)
      .set({
        listKey: nextListKey,
        value: nextValue,
        label: input.label ?? current.label,
        sortOrder: input.sortOrder ?? current.sortOrder,
        isActive:
          input.isActive === undefined
            ? current.isActive
            : input.isActive
            ? 1
            : 0,
        updatedAt: new Date(),
      })
      .where(eq(this.configurableLookups.id, id))
      .returning();
    return row;
  }

  async delete(id: number): Promise<void> {
    const current = await this.findById(id);
    if (!current) {
      throw new NotFoundException(`Lookup ${id} not found`);
    }
    if (current.isSystem === 1) {
      throw new ForbiddenException(
        'System lookups cannot be deleted; deactivate non-system lookups instead'
      );
    }
    await this.db
      .delete(this.configurableLookups)
      .where(eq(this.configurableLookups.id, id));
  }

  async seedDefaults(
    defaults: ReadonlyArray<{
      listKey: string;
      value: string;
      label: string;
      sortOrder?: number;
    }>
  ): Promise<void> {
    for (const entry of defaults) {
      const existing = await this.findByListAndValue(
        entry.listKey,
        entry.value
      );
      if (existing) continue;
      await this.db.insert(this.configurableLookups).values({
        listKey: entry.listKey,
        value: entry.value,
        label: entry.label,
        sortOrder: entry.sortOrder ?? 0,
        isActive: 1,
        isSystem: 1,
      });
    }
  }
}
