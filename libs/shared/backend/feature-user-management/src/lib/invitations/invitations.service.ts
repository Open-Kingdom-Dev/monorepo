import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import {
  invitations,
  users,
  InvitationsTableName,
  UsersTableName,
} from '@open-kingdom/shared-backend-data-access-database-setup';
import { EmailService } from '@open-kingdom/shared-backend-feature-email';

import { InvitationTokenService } from './invitation-token.service';
import {
  InviteUserDto,
  InviteUserResponseDto,
  AcceptInvitationDto,
  AcceptInvitationResponseDto,
  ValidateInvitationResponseDto,
} from './dto';

type Schema = {
  [InvitationsTableName]: typeof invitations;
  [UsersTableName]: typeof users;
};

export const USER_MANAGEMENT_OPTIONS = 'USER_MANAGEMENT_OPTIONS';

export interface UserManagementOptions {
  invitationTokenSecret: string;
  invitationExpiryDays?: number;
  frontendBaseUrl: string;
}

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    @Inject(DB_TAG) private readonly db: BetterSQLite3Database<Schema>,
    @Inject(USER_MANAGEMENT_OPTIONS)
    private readonly options: UserManagementOptions,
    private readonly tokenService: InvitationTokenService,
    @Optional() private readonly emailService?: EmailService
  ) {}

  async invite(
    dto: InviteUserDto,
    invitedById: number
  ): Promise<InviteUserResponseDto> {
    // Check if user already exists
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.email, dto.email),
    });

    if (existingUser) {
      return {
        success: false,
        message: 'A user with this email already exists',
      };
    }

    // Check for pending invitation
    const existingInvitation = await this.db.query.invitations.findFirst({
      where: and(
        eq(invitations.email, dto.email),
        eq(invitations.status, 'pending')
      ),
    });

    if (existingInvitation) {
      return {
        success: false,
        message: 'An invitation has already been sent to this email',
      };
    }

    // Generate token
    const { token, expiresAt } = this.tokenService.generate(dto.email);

    // Create invitation record
    await this.db.insert(invitations).values({
      email: dto.email,
      token,
      tokenExpiry: expiresAt,
      invitedBy: invitedById,
      invitedAt: Date.now(),
      status: 'pending',
      role: dto.role ?? 'user',
    });

    // Send invitation email
    await this.sendInvitationEmail(dto.email, token);

    // Log token in development for testing
    this.logger.debug(`Invitation token for ${dto.email}: ${token}`);

    return {
      success: true,
      message: 'Invitation sent successfully',
    };
  }

  async validate(token: string): Promise<ValidateInvitationResponseDto> {
    // Validate token signature and expiry
    const tokenPayload = this.tokenService.validate(token);
    if (!tokenPayload) {
      return {
        valid: false,
        error: 'Invalid or expired invitation token',
      };
    }

    // Check invitation status in database
    const invitation = await this.db.query.invitations.findFirst({
      where: and(
        eq(invitations.token, token),
        eq(invitations.status, 'pending')
      ),
    });

    if (!invitation) {
      return {
        valid: false,
        error: 'Invitation not found or already used',
      };
    }

    return {
      valid: true,
      email: invitation.email,
      role: invitation.role as 'guest' | 'user' | 'admin',
    };
  }

  async accept(dto: AcceptInvitationDto): Promise<AcceptInvitationResponseDto> {
    // Validate token
    const validation = await this.validate(dto.token);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error ?? 'Invalid invitation',
      };
    }

    // Get invitation record
    const invitation = await this.db.query.invitations.findFirst({
      where: eq(invitations.token, dto.token),
    });

    if (!invitation) {
      return {
        success: false,
        message: 'Invitation not found',
      };
    }

    // Create user
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    await this.db.insert(users).values({
      email: invitation.email,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      password: hashedPassword,
      role: invitation.role as 'guest' | 'user' | 'admin',
      invitedBy: invitation.invitedBy,
    });

    // Mark invitation as accepted
    await this.db
      .update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.id, invitation.id));

    return {
      success: true,
      message: 'Account created successfully',
      email: invitation.email,
    };
  }

  private async sendInvitationEmail(
    email: string,
    token: string
  ): Promise<void> {
    if (!this.emailService) {
      this.logger.warn(
        'EmailService not configured - skipping invitation email'
      );
      return;
    }

    const inviteUrl = `${this.options.frontendBaseUrl}/accept-invitation?token=${token}`;

    try {
      await this.emailService.send({
        to: email,
        subject: 'You have been invited',
        body: `You have been invited to join the platform.\n\nClick the link below to accept the invitation and create your account:\n\n${inviteUrl}\n\nThis invitation will expire in ${
          this.options.invitationExpiryDays ?? 7
        } days.`,
      });
      this.logger.log(`Invitation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}`, error);
    }
  }
}
