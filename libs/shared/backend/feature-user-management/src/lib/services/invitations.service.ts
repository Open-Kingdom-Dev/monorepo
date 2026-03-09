import {
  Injectable,
  Inject,
  Optional,
  Logger,
  BadRequestException,
  BadGatewayException,
  NotFoundException,
} from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { createHmac, randomBytes } from 'crypto';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import {
  UsersService,
  User,
  users,
  UsersTableName,
} from '@open-kingdom/shared-backend-data-access-users';
import { UserRolesService } from './user-roles.service';
import {
  invitations,
  Invitation,
  InvitationsTableName,
} from '../schemas/invitations.schema';
import { roles, RolesTableName } from '../schemas/roles.schema';
import {
  USER_MANAGEMENT_OPTIONS,
  EMAIL_SENDER,
  INVITATION_STATUS,
} from '../types';
import {
  INVITATION_EMAIL_SUBJECT,
  buildInvitationEmailBody,
} from '../templates';
import type {
  UserManagementModuleOptions,
  EmailSender,
  ValidationResult,
} from '../types';

export type InvitationResponse = Omit<Invitation, 'token'>;

type Schema = {
  [UsersTableName]: typeof users;
  [InvitationsTableName]: typeof invitations;
  [RolesTableName]: typeof roles;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_EXPIRY_DAYS = 7;

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    @Inject(DB_TAG) private readonly db: BetterSQLite3Database<Schema>,
    @Inject(USER_MANAGEMENT_OPTIONS)
    private readonly options: UserManagementModuleOptions,
    private readonly usersService: UsersService,
    private readonly userRolesService: UserRolesService,
    @Optional() @Inject(EMAIL_SENDER) private readonly emailSender?: EmailSender
  ) {}

  async invite(
    email: string,
    roleName: string,
    invitedById: number
  ): Promise<InvitationResponse> {
    await this.ensureUserDoesNotExist(email);
    await this.ensureNoPendingInvitation(email);

    const role = await this.resolveRole(roleName);
    const { token, expiresAt } = this.generateToken(email);

    await this.db.insert(invitations).values({
      email,
      token,
      tokenExpiry: expiresAt,
      invitedBy: invitedById,
      invitedAt: Date.now(),
      roleId: role.id,
      status: INVITATION_STATUS.PENDING,
    });

    try {
      await this.sendInvitationEmail(email, token);
    } catch (error) {
      await this.rollbackInvitation(email, token, error);
    }

    return this.stripToken(token);
  }

  async validate(token: string): Promise<ValidationResult> {
    const invitation = await this.findByToken(token);

    if (!invitation || invitation.status !== INVITATION_STATUS.PENDING) {
      return { valid: false };
    }

    if (this.isExpired(invitation.tokenExpiry)) {
      await this.markAsExpired(invitation.id);
      return { valid: false };
    }

    return {
      valid: true,
      email: invitation.email,
      roleId: invitation.roleId,
    };
  }

  async accept(
    token: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<User> {
    const validation = await this.validate(token);

    if (!validation.valid || !validation.email) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    const user = await this.usersService.create({
      email: validation.email,
      password,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
    });

    if (validation.roleId) {
      await this.userRolesService.assignRole(user.id, validation.roleId);
    }

    await this.markAsAccepted(token);

    return user;
  }

  async findAll(): Promise<InvitationResponse[]> {
    const records = await this.db.query.invitations.findMany();
    await this.expireStaleInvitations(records);

    return records
      .filter((r) => r.status !== INVITATION_STATUS.ACCEPTED)
      .map(({ token: _, ...rest }) => rest);
  }

  async cancel(id: number): Promise<void> {
    await this.findInvitationOrFail(id);
    await this.db.delete(invitations).where(eq(invitations.id, id));
  }

  private async ensureUserDoesNotExist(email: string): Promise<void> {
    const existingUser = await this.usersService.findOne(email);

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
  }

  private async ensureNoPendingInvitation(email: string): Promise<void> {
    const existing = await this.db.query.invitations.findFirst({
      where: eq(invitations.email, email),
    });

    if (
      existing?.status === INVITATION_STATUS.PENDING &&
      !this.isExpired(existing.tokenExpiry)
    ) {
      throw new BadRequestException(
        'A pending invitation already exists for this email'
      );
    }
  }

  private async resolveRole(roleName: string) {
    const role = await this.db.query.roles.findFirst({
      where: eq(roles.name, roleName),
    });

    if (!role) {
      throw new BadRequestException(`Role '${roleName}' does not exist`);
    }

    return role;
  }

  private async findInvitationOrFail(id: number): Promise<Invitation> {
    const invitation = await this.db.query.invitations.findFirst({
      where: eq(invitations.id, id),
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }

  private async expireStaleInvitations(records: Invitation[]): Promise<void> {
    for (const record of records) {
      if (
        record.status === INVITATION_STATUS.PENDING &&
        this.isExpired(record.tokenExpiry)
      ) {
        await this.markAsExpired(record.id);
        record.status = INVITATION_STATUS.EXPIRED;
      }
    }
  }

  private isExpired(tokenExpiry: number): boolean {
    return tokenExpiry < Date.now();
  }

  private async findByToken(token: string): Promise<Invitation | undefined> {
    return this.db.query.invitations.findFirst({
      where: eq(invitations.token, token),
    });
  }

  private async markAsExpired(id: number): Promise<void> {
    await this.db
      .update(invitations)
      .set({ status: INVITATION_STATUS.EXPIRED })
      .where(eq(invitations.id, id));
  }

  private async markAsAccepted(token: string): Promise<void> {
    await this.db
      .update(invitations)
      .set({ status: INVITATION_STATUS.ACCEPTED })
      .where(eq(invitations.token, token));
  }

  private async rollbackInvitation(
    email: string,
    token: string,
    error: unknown
  ): Promise<never> {
    const message = error instanceof Error ? error.message : 'Unknown error';

    this.logger.error(
      `Failed to send invitation email to ${email}: ${message}`,
      error instanceof Error ? error.stack : undefined
    );

    await this.db.delete(invitations).where(eq(invitations.token, token));

    throw new BadGatewayException(
      'Invitation could not be sent - email delivery failed'
    );
  }

  private async stripToken(token: string): Promise<InvitationResponse> {
    const invitation = await this.findByToken(token);

    if (!invitation) {
      throw new BadRequestException('Failed to retrieve created invitation');
    }

    const { token: _token, ...rest } = invitation;
    return rest;
  }

  private get expiryDays(): number {
    return this.options.invitationExpiryDays ?? DEFAULT_EXPIRY_DAYS;
  }

  private generateToken(email: string): { token: string; expiresAt: number } {
    const expiresAt = Date.now() + this.expiryDays * MS_PER_DAY;
    const payload = `${email}:${expiresAt}:${randomBytes(16).toString('hex')}`;
    const token = createHmac('sha256', this.options.invitationTokenSecret)
      .update(payload)
      .digest('hex');

    return { token, expiresAt };
  }

  private async sendInvitationEmail(
    email: string,
    token: string
  ): Promise<void> {
    const inviteUrl = `${this.options.frontendBaseUrl}/accept-invitation?token=${token}`;

    this.logger.debug(`Invitation for ${email}: ${inviteUrl}`);

    if (!this.emailSender) {
      this.logger.warn(
        'EmailSender not configured - skipping invitation email'
      );
      return;
    }

    const result = await this.emailSender.send({
      to: email,
      subject: INVITATION_EMAIL_SUBJECT,
      body: buildInvitationEmailBody({
        inviteUrl,
        expiryDays: this.expiryDays,
      }),
    });

    if (!result.success) {
      throw new Error(result.error || 'Email delivery failed');
    }

    this.logger.log(`Invitation email sent to ${email}`);
  }
}
