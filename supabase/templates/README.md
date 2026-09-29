# Freetopia Supabase email templates

Use `confirmation.html` as the Freetopia-branded Confirm signup template.

Hosted Supabase:
1. Open Authentication → Email Templates → Confirm signup.
2. Set subject to: `Confirm your Freetopia email address`
3. Paste the contents of `confirmation.html`.
4. Keep `{{ .ConfirmationURL }}` unchanged so Supabase inserts the real verification URL.

Hosted Supabase manages these templates in its dashboard, so committing this file does not by itself change the hosted template.
