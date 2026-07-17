import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, asc, desc, eq, isNull, lte } from 'drizzle-orm';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';

import type { ActivityLogEntry, ActivityLogSchema } from './schemas';
import {
  CompleteActivityLogEntryDto,
  CreateActivityLogEntryDto,
  UpdateActivityLogEntryDto,
} from './dtos';
import {
  ACTIVITY_LOG_OPTIONS,
  DataAccessActivityLogOptions,
} from './data-access-activity-log.options';

@Injectable()
export class ActivityLogService {
  private readonly allowedRelatedTypes: ReadonlySet<string> | null;
  private readonly allowedActivityTypes: ReadonlySet<string> | null;
  // Tables come from the host-composed schema (SCHEMA_TAG) rather than the
  // module-scope singletons, so a prefixed schema (embedded mode) works
  // transparently.
  private readonly activityLog: ActivityLogSchema['activityLog'];

  constructor(
    @Inject(DB_TAG)
    private readonly db: BetterSQLite3Database<ActivityLogSchema>,
    @Inject(SCHEMA_TAG) schema: ActivityLogSchema,
    @Optional()
    @Inject(ACTIVITY_LOG_OPTIONS)
    options: DataAccessActivityLogOptions | null = null
  ) {
    this.activityLog = schema.activityLog;
    this.allowedRelatedTypes = options?.allowedRelatedTypes
      ? new Set(options.allowedRelatedTypes)
      : null;
    this.allowedActivityTypes = options?.allowedActivityTypes
      ? new Set(options.allowedActivityTypes)
      : null;
  }

  isAllowedRelatedType(value: string): boolean {
    return (
      this.allowedRelatedTypes === null || this.allowedRelatedTypes.has(value)
    );
  }

  isAllowedActivityType(value: string): boolean {
    return (
      this.allowedActivityTypes === null || this.allowedActivityTypes.has(value)
    );
  }

  async findForRecord(
    relatedType: string,
    relatedId: number
  ): Promise<ActivityLogEntry[]> {
    return this.db
      .select()
      .from(this.activityLog)
      .where(
        and(
          eq(this.activityLog.relatedType, relatedType),
          eq(this.activityLog.relatedId, relatedId)
        )
      )
      .orderBy(desc(this.activityLog.createdAt))
      .all();
  }

  async findOpenForOwner(ownerId: number): Promise<ActivityLogEntry[]> {
    return this.db
      .select()
      .from(this.activityLog)
      .where(
        and(
          eq(this.activityLog.ownerId, ownerId),
          isNull(this.activityLog.completedAt)
        )
      )
      .orderBy(asc(this.activityLog.dueAt), asc(this.activityLog.id))
      .all();
  }

  async findOverdueForOwner(
    ownerId: number,
    now: Date = new Date()
  ): Promise<ActivityLogEntry[]> {
    return this.db
      .select()
      .from(this.activityLog)
      .where(
        and(
          eq(this.activityLog.ownerId, ownerId),
          isNull(this.activityLog.completedAt),
          lte(this.activityLog.dueAt, now)
        )
      )
      .orderBy(asc(this.activityLog.dueAt), asc(this.activityLog.id))
      .all();
  }

  async findById(id: number): Promise<ActivityLogEntry | undefined> {
    return this.db.query.activityLog.findFirst({
      where: eq(this.activityLog.id, id),
    });
  }

  async create(
    input: CreateActivityLogEntryDto,
    ownerId: number
  ): Promise<ActivityLogEntry> {
    if (!this.isAllowedRelatedType(input.relatedType)) {
      throw new BadRequestException(
        `Unknown relatedType '${input.relatedType}'`
      );
    }
    if (!this.isAllowedActivityType(input.type)) {
      throw new BadRequestException(`Unknown activity type '${input.type}'`);
    }
    const [row] = await this.db
      .insert(this.activityLog)
      .values({
        relatedType: input.relatedType,
        relatedId: input.relatedId,
        type: input.type,
        subject: input.subject,
        description: input.description ?? null,
        dueAt: input.dueAt ?? null,
        ownerId,
      })
      .returning();
    return row;
  }

  async update(
    id: number,
    input: UpdateActivityLogEntryDto
  ): Promise<ActivityLogEntry> {
    const current = await this.findById(id);
    if (!current) {
      throw new NotFoundException(`Activity ${id} not found`);
    }
    const [row] = await this.db
      .update(this.activityLog)
      .set({
        subject: input.subject ?? current.subject,
        description:
          input.description === undefined
            ? current.description
            : input.description,
        dueAt: input.dueAt === undefined ? current.dueAt : input.dueAt,
        updatedAt: new Date(),
      })
      .where(eq(this.activityLog.id, id))
      .returning();
    return row;
  }

  async complete(
    id: number,
    input: CompleteActivityLogEntryDto = {}
  ): Promise<ActivityLogEntry> {
    const current = await this.findById(id);
    if (!current) {
      throw new NotFoundException(`Activity ${id} not found`);
    }
    const description = input.outcomeNotes
      ? [current.description, input.outcomeNotes].filter(Boolean).join('\n\n')
      : current.description;
    const [row] = await this.db
      .update(this.activityLog)
      .set({
        completedAt: new Date(),
        description,
        updatedAt: new Date(),
      })
      .where(eq(this.activityLog.id, id))
      .returning();
    return row;
  }

  async delete(id: number): Promise<void> {
    const current = await this.findById(id);
    if (!current) {
      throw new NotFoundException(`Activity ${id} not found`);
    }
    await this.db.delete(this.activityLog).where(eq(this.activityLog.id, id));
  }
}
