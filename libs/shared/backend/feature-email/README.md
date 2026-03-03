# `@open-kingdom/shared-backend-feature-email`

A global NestJS dynamic module providing email sending through a pluggable provider interface. Currently implements Gmail via the Google Gmail API (service account + domain-wide delegation). Registered globally so `EmailService` is injectable in any module without re-importing.

---

## Exports

| Export | Kind | Description |
|---|---|---|
| `EmailModule` | `class` | Global NestJS dynamic module. Call `.forRoot(options)` to configure. |
| `EmailModuleOptions` | `interface` | Type-only. Argument type for `.forRoot()`. |
| `EmailService` | `class` | Injectable service. Wraps the active `EmailProvider`. Primary injection point for sending email. |
| `EmailController` | `class` | REST controller. Registers `POST /email/send`. |
| `GmailProvider` | `class` | Gmail implementation of `EmailProvider`. |
| `GmailProviderConfig` | `interface` | Configuration for `GmailProvider`. |
| `EMAIL_PROVIDER` | `symbol` | DI token for the active `EmailProvider` implementation. Value: `Symbol('EMAIL_PROVIDER')`. |
| `EmailProvider` | `interface` | Contract for email provider implementations. |
| `EmailMessage` | `interface` | Message shape passed to `EmailProvider.send()`. |
| `EmailResult` | `interface` | Return type of `EmailProvider.send()`. |
| `SendEmailDto` | `class` | Request DTO for `POST /email/send`. |
| `SendEmailResponseDto` | `class` | Response DTO for `POST /email/send`. |

---

## Type Definitions

### `EmailProvider` Interface

Any email provider implementation must expose a single `send` method that accepts an `EmailMessage` and returns a `Promise<EmailResult>`.

### `EmailMessage`

| Property | Type | Required | Description |
|---|---|---|---|
| `to` | `string[]` | Yes | Array of recipient email addresses. |
| `from` | `string` | No | Optional sender override. Defaults to `GmailProviderConfig.impersonateEmail`. |
| `subject` | `string` | Yes | Email subject line. |
| `text` | `string` | No | Plain text body. |
| `html` | `string` | No | HTML body. Takes precedence over `text` if both are provided. |

### `EmailResult`

| Property | Type | Description |
|---|---|---|
| `messageId` | `string \| undefined` | Gmail message ID returned from the API response. |

### `GmailProviderConfig`

| Property | Type | Description |
|---|---|---|
| `clientEmail` | `string` | Service account email address (e.g. `my-sa@project.iam.gserviceaccount.com`). |
| `privateKey` | `string` | PEM private key for the service account. Literal `\n` sequences in environment variables are automatically replaced with real newlines. |
| `impersonateEmail` | `string` | The Gmail address to send from. Requires domain-wide delegation granted to the service account in Google Workspace Admin. |

### `EmailModuleOptions`

`EmailModuleOptions` is a union type with a single supported variant. It contains a `provider` field (currently only `'gmail'` is accepted) and a `config` field of type `GmailProviderConfig`.

### `SendEmailDto`

| Property | Type | Description |
|---|---|---|
| `to` | `string` | Single recipient address. The controller wraps it in an array before passing to the provider. |
| `subject` | `string` | Email subject line. |
| `body` | `string` | Plain text body. |

### `SendEmailResponseDto`

| Property | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether the send operation succeeded. |
| `messageId` | `string \| undefined` | Present on success. |
| `error` | `string \| undefined` | Present on failure. |

---

## Module Registration

`EmailModule` is declared `global: true`. Register it once in the root `AppModule`. Any module that needs to send email can inject `EmailService` without importing `EmailModule` again.

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { EmailModule } from '@open-kingdom/shared-backend-feature-email';

@Module({
  imports: [
    EmailModule.forRoot({
      provider: 'gmail',
      config: {
        clientEmail:      process.env['GMAIL_CLIENT_EMAIL']!,
        privateKey:       process.env['GMAIL_PRIVATE_KEY']!,
        impersonateEmail: process.env['GMAIL_IMPERSONATE_EMAIL']!,
      },
    }),
  ],
})
export class AppModule {}
```

---

## Configuration Options

| Option | Type | Description |
|---|---|---|
| `provider` | `'gmail'` | Selects the email provider implementation. Only `'gmail'` is supported. |
| `config.clientEmail` | `string` | Google service account email address. |
| `config.privateKey` | `string` | PEM-format private key for the service account. Literal `\n` sequences in environment variables are automatically replaced with real newlines. |
| `config.impersonateEmail` | `string` | The Gmail address to impersonate as the sender. Requires domain-wide delegation granted to the service account in Google Workspace Admin. |

---

## Module Behavior

1. `EmailModule.forRoot(options)` returns a `DynamicModule` with `global: true`.
2. The `EMAIL_PROVIDER` token is provided via a factory. For `provider: 'gmail'`, a `GmailProvider` instance is constructed using `config`.
3. `EmailService` is provided and depends on `EMAIL_PROVIDER`.
4. `EmailController` is registered.
5. Only `EmailService` is exported — `EMAIL_PROVIDER` and `EmailController` are internal.

---

## EmailService API

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `send` | `dto: SendEmailDto` | `Promise<SendEmailResponseDto>` | Sends a single email. Wraps `dto.to` in an array and maps `dto.body` to the `text` field before calling the provider. Catches provider errors and returns `{ success: false, error: message }` rather than throwing. |

`EmailService.send()` accepts the flat `SendEmailDto` shape (single `to` string, `body` field) and maps it to the `EmailMessage` shape (`to: [dto.to]`, `text: dto.body`) before calling the underlying provider.

---

## GmailProvider Details

`GmailProvider` implements `EmailProvider` and accepts a `GmailProviderConfig` in its constructor. Authentication uses a Google service account JWT with the scope `https://www.googleapis.com/auth/gmail.send` and domain-wide delegation to `config.impersonateEmail`. Messages are RFC 2822-formatted and base64url-encoded before transmission via `gmail.users.messages.send`.

Content type selection: if `message.html` is provided, the MIME content type is `text/html`; otherwise `text/plain`.

---

## REST API Endpoint

### `POST /email/send`

Sends an email using the configured provider.

The request body must contain `to` (a single recipient address string), `subject` (string), and `body` (plain text string). On success the response is `201 Created` with `success: true` and a `messageId` string. On failure the response contains `success: false` and an `error` string describing the failure.

This endpoint does not enforce authentication itself. If `JwtAuthGuard` is registered globally via `APP_GUARD`, add `@Public()` if this endpoint needs to be publicly accessible.

---

## Injecting EmailService

Since `EmailModule` is global, `EmailService` is available to inject anywhere after registration — no additional `imports` needed.

```typescript
import { Injectable } from '@nestjs/common';
import { EmailService } from '@open-kingdom/shared-backend-feature-email';

@Injectable()
export class NotificationService {
  constructor(private emailService: EmailService) {}

  async notifyUser(email: string, message: string): Promise<void> {
    const result = await this.emailService.send({
      to: email,
      subject: 'Notification',
      body: message,
    });

    if (!result.success) {
      throw new Error(`Email delivery failed: ${result.error}`);
    }
  }
}
```

---

## Custom Provider Implementation

To add a new provider, implement the `EmailProvider` interface by creating a class with a `send(message: EmailMessage): Promise<EmailResult>` method. The current module only switches on `provider: 'gmail'`, so adding a new provider requires modifying `EmailModule.forRoot()` to handle the new provider key and instantiate the new class.

---

## GCP Setup for Gmail Provider

1. Create a Google Cloud service account.
2. Enable the Gmail API on the project.
3. Generate a JSON key for the service account; extract `client_email` and `private_key`.
4. In Google Workspace Admin Console, grant the service account domain-wide delegation with the scope `https://www.googleapis.com/auth/gmail.send`.
5. Set `impersonateEmail` to the Gmail address the service account will send as.

---

## Testing

```bash
nx test @open-kingdom/shared-backend-feature-email
```
