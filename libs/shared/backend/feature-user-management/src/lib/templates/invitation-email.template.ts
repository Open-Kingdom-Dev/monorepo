export interface InvitationEmailParams {
  inviteUrl: string;
  expiryDays: number;
}

export const INVITATION_EMAIL_SUBJECT = 'You have been invited';

export const buildInvitationEmailBody = (
  params: InvitationEmailParams
): string => {
  return [
    'You have been invited to join the platform.',
    '',
    'Click the link below to accept the invitation and create your account:',
    '',
    params.inviteUrl,
    '',
    `This invitation will expire in ${params.expiryDays} days.`,
  ].join('\n');
};
