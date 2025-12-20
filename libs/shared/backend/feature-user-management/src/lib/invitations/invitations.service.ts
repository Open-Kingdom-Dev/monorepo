import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { UsersService } from '@open-kingdom/shared-backend-data-access-users';
import { EmailService } from '@open-kingdom/shared-backend-feature-email';
import {
  invitations,
  InvitationsTableName,
  type Invitation,
} from './entities/index.js';
import { InvitationTokenService } from './invitation-token.service.js';
import {
  INVITATIONS_MODULE_OPTIONS,
  type InvitationsModuleOptions,
} from './invitations.types.js';
import {
  getValidationError,
  validateInvitation,
  isValidationError,
  toSuccessResponse,
} from './invitations.utils.js';
import type {
  InviteUserDto,
  InviteUserResponseDto,
  AcceptInvitationResponseDto,
  ValidateTokenResponseDto,
} from './dto/index.js';
import { invitationEmailTemplate } from './templates/index.js';

type Schema = { [InvitationsTableName]: typeof invitations };

@Injectable()
export class InvitationsService {
  constructor(
    @Inject(DB_TAG) private readonly db: BetterSQLite3Database<Schema>,
    @Inject(INVITATIONS_MODULE_OPTIONS)
    private readonly options: InvitationsModuleOptions,
    private readonly tokenService: InvitationTokenService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService
  ) {}

  // Public API

  async listPending(): Promise<Invitation[]> {
    return this.db
      .select()
      .from(invitations)
      .where(eq(invitations.status, 'pending'));
  }

  async delete(invitationId: number): Promise<void> {
    await this.db.delete(invitations).where(eq(invitations.id, invitationId));
  }

  async invite(
    dto: InviteUserDto,
    inviterId: number
  ): Promise<InviteUserResponseDto> {
    await this.ensureEmailNotRegistered(dto.email);
    await this.ensureNoPendingInvitation(dto.email);

    const invitation = await this.createInvitation(dto, inviterId);
    const token = this.tokenService.generateToken(dto.email, invitation.id);

    await this.updateToken(invitation.id, token);
    await this.sendInvitationEmail(dto, token);

    return { success: true, invitationId: invitation.id };
  }

  async validateToken(token: string): Promise<ValidateTokenResponseDto> {
    const payload = this.tokenService.validateToken(token);
    if (!payload) {
      return getValidationError('invalidToken');
    }

    const invitation = await this.findById(payload.invitationId);
    const result = validateInvitation(invitation, token);

    if (isValidationError(result)) {
      return result;
    }

    return toSuccessResponse(result);
  }

  async accept(
    token: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<AcceptInvitationResponseDto> {
    const invitation = await this.validateAndGetInvitation(token);
    this.validatePassword(password);

    await this.usersService.ensureUser({
      email: invitation.email,
      firstName: firstName ?? invitation.firstName,
      lastName: lastName ?? invitation.lastName,
      role: invitation.role,
      password,
      invitee: invitation.invitedBy,
    });

    await this.markAsAccepted(invitation.id);

    return { success: true, email: invitation.email };
  }

  // Private helpers - Queries

  private async findById(id: number): Promise<Invitation | undefined> {
    const [invitation] = await this.db
      .select()
      .from(invitations)
      .where(eq(invitations.id, id));
    return invitation;
  }

  private async findPendingByEmail(
    email: string
  ): Promise<Invitation | undefined> {
    const [invitation] = await this.db
      .select()
      .from(invitations)
      .where(
        and(eq(invitations.email, email), eq(invitations.status, 'pending'))
      );
    return invitation;
  }

  // Private helpers - Commands

  private async createInvitation(
    dto: InviteUserDto,
    inviterId: number
  ): Promise<Invitation> {
    const [invitation] = await this.db
      .insert(invitations)
      .values({
        email: dto.email,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        role: dto.role ?? 'user',
        customRoleId: dto.customRoleId ?? null,
        token: 'placeholder',
        tokenExpiry: this.tokenService.getExpiryTimestamp(),
        invitedBy: inviterId,
        invitedAt: this.now(),
        status: 'pending',
      })
      .returning();
    return invitation;
  }

  private async updateToken(id: number, token: string): Promise<void> {
    await this.db
      .update(invitations)
      .set({ token })
      .where(eq(invitations.id, id));
  }

  private async markAsAccepted(id: number): Promise<void> {
    await this.db
      .update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.id, id));
  }

  // Private helpers - Validation

  private async ensureEmailNotRegistered(email: string): Promise<void> {
    if (await this.usersService.findOne(email)) {
      throw new ConflictException('User with this email already exists');
    }
  }

  private async ensureNoPendingInvitation(email: string): Promise<void> {
    if (await this.findPendingByEmail(email)) {
      throw new ConflictException(
        'An invitation is already pending for this email'
      );
    }
  }

  private async validateAndGetInvitation(token: string): Promise<Invitation> {
    const payload = this.tokenService.validateToken(token);
    if (!payload) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    const invitation = await this.findById(payload.invitationId);
    const result = validateInvitation(invitation, token);

    if (isValidationError(result)) {
      throw new BadRequestException('Invalid invitation');
    }

    return result;
  }

  private validatePassword(password: string): void {
    const MIN_PASSWORD_LENGTH = 8;
    const isValidPassword = password && password.length >= MIN_PASSWORD_LENGTH;

    if (!isValidPassword) {
      throw new BadRequestException(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
    }
  }

  // Private helpers - Email

  private async sendInvitationEmail(
    dto: InviteUserDto,
    token: string
  ): Promise<void> {
    const url = this.buildInvitationUrl(token);

    await this.emailService.send({
      to: dto.email,
      subject: invitationEmailTemplate.subject,
      body: invitationEmailTemplate.body({
        firstName: dto.firstName,
        url,
        expiryDays: this.options.invitationExpiryDays ?? 7,
      }),
    });
  }

  private buildInvitationUrl(token: string): string {
    return `${
      this.options.frontendBaseUrl
    }/accept-invitation?token=${encodeURIComponent(token)}`;
  }

  // Private helpers - Utils

  private now(): number {
    return Math.floor(Date.now() / 1000);
  }
}
