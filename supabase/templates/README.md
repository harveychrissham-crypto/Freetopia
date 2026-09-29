# Freetopia Supabase email templates

All templates in this directory use the same Freetopia visual language: clean white cards, minimal typography, dark action buttons, and the Freetopia brand/footer.

## Authentication templates

- `confirmation.html` — Confirm signup
- `recovery.html` — Reset password
- `email_change.html` — Confirm a new email address
- `invite.html` — Accept a Freetopia invitation

## Security notification templates

- `password_changed_notification.html` — Password changed
- `email_changed_notification.html` — Email address changed

Supabase also supports security notifications for phone changes, linked/removed identities, and MFA changes. These can be added in the same visual style when those security features are enabled.

## Hosted Supabase setup

For the hosted Freetopia project, open **Authentication → Email Templates** in the Supabase dashboard and paste each corresponding file into its template.

Suggested subjects:

- Confirm signup: `Confirm your Freetopia email address`
- Reset password: `Reset your Freetopia password`
- Change email: `Confirm your new Freetopia email address`
- Invite: `You're invited to Freetopia`
- Password changed: `Your Freetopia password was changed`
- Email changed: `Your Freetopia email address was changed`

Keep Supabase template variables unchanged. Authentication links use `{{ .ConfirmationURL }}`; the email-change template uses `{{ .NewEmail }}`; the email-changed security notification uses `{{ .OldEmail }}`.

Hosted Supabase manages live templates in the dashboard, so committing these files does not automatically change the live hosted templates. Supabase documents the same hosted-dashboard workflow and supported variables in its Email Templates documentation.
