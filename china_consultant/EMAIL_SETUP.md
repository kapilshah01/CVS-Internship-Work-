# Email Setup

The employee invoice mail button now sends through a server-side endpoint.

## Local development

Create `china_consultant/.env` with:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
RESEND_API_KEY=re_...
EMAIL_FROM=China Visa Service <noreply@yourdomain.com>
EMAIL_REPLY_TO=info@chinavisaservice.com.np
```

Then run:

```bash
npm run dev
```

The Vite dev server exposes `POST /api/send-invoice-email`.

## Netlify deployment

Set these environment variables in Netlify:

```env
RESEND_API_KEY=re_...
EMAIL_FROM=China Visa Service <noreply@yourdomain.com>
EMAIL_REPLY_TO=info@chinavisaservice.com.np
```

Netlify will use `netlify/functions/send-invoice-email.mjs`.

## Notes

- `EMAIL_FROM` must use a sender/domain verified in Resend.
- The invoice is attached as an `.html` file.
- If you prefer another provider later, only the server-side handler needs to change.
