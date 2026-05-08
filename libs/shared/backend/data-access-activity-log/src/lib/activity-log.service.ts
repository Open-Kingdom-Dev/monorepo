import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, asc, desc, eq, isNull, lte } from 'drizzle-orm';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';

import { ActivityLogEntry, activityLog } from './schemas';
import {
  CompleteActivityLogEntryDto,
  CreateActivityLogEntryDto,
  UpdateActivityLogEntryDto,
} from './dtos';
import {
  ACTIVITY_LOG_OPTIONS,
  DataAccessActivityLogOptions,
} from './data-access-activity-log.options';

type schema = {
  activityLog: typeof activityLog;
};

@Injectable()
export class ActivityLogService {
  private readonly allowedRelatedTypes: ReadonlySet<string> | null;
  private readonly allowedActivityTypes: ReadonlySet<string> | null;

  constructor(
    @Inject(DB_TAG) private readonly db: BetterSQLite3Database<schema>,
    @Optional()
    @Inject(ACTIVITY_LOG_OPTIONS)
    options: DataAccessActivityLogOptions | null = null
  ) {
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
      .from(activityLog)
      .where(
        and(
          eq(activityLog.relatedType, relatedType),
          eq(activityLog.relatedId, relatedId)
        )
      )
      .orderBy(desc(activityLog.createdAt))
      .all();
  }

  async findOpenForOwner(ownerId: number): Promise<ActivityLogEntry[]> {
    return this.db
      .select()
      .from(activityLog)
      .where(
        and(eq(activityLog.ownerId, ownerId), isNull(activityLog.completedAt))
      )
      .orderBy(asc(activityLog.dueAt), asc(activityLog.id))
      .all();
  }

  async findOverdueForOwner(
    ownerId: number,
    now: Date = new Date()
  ): Promise<ActivityLogEntry[]> {
    return this.db
      .select()
      .from(activityLog)
      .where(
        and(
          eq(activityLog.ownerId, ownerId),
          isNull(activityLog.completedAt),
          lte(activityLog.dueAt, now)
        )
      )
      .orderBy(asc(activityLog.dueAt), asc(activityLog.id))
      .all();
  }

  async findById(id: number): Promise<ActivityLogEntry | undefined> {
    return this.db.query.activityLog.findFirst({
      where: eq(activityLog.id, id),
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
      .insert(activityLog)
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
      .update(activityLog)
      .set({
        subject: input.subject ?? current.subject,
        description:
          input.description === undefined
            ? current.description
            : input.description,
        dueAt: input.dueAt === undefined ? current.dueAt : input.dueAt,
        updatedAt: new Date(),
      })
      .where(eq(activityLog.id, id))
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
      .update(activityLog)
      .set({
        completedAt: new Date(),
        description,
        updatedAt: new Date(),
      })
      .where(eq(activityLog.id, id))
      .returning();
    return row;
  }

  async delete(id: number): Promise<void> {
    const current = await this.findById(id);
    if (!current) {
      throw new NotFoundException(`Activity ${id} not found`);
    }
    await this.db.delete(activityLog).where(eq(activityLog.id, id));
  }
}
