export interface InvitationEmailData {
  firstName?: string;
  url: string;
  expiryDays: number;
}

const INVITATION_EMAIL_TEMPLATE = `
Hello {{greeting}},

You have been invited to join OpenKingdom.

Click the link below to set your password and activate your account:
{{url}}

This invitation expires in {{expiryDays}} days.

If you did not expect this invitation, you can safely ignore this email.
`;

export const invitationEmailTemplate = {
  subject: 'You have been invited to join OpenKingdom',

  body: (data: InvitationEmailData): string => {
    return INVITATION_EMAIL_TEMPLATE.trim()
      .replace('{{greeting}}', data.firstName ?? '')
      .replace('{{url}}', data.url)
      .replace('{{expiryDays}}', String(data.expiryDays));
  },
};
