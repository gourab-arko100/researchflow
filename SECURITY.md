# Security notes

## How data is protected

- **Login**: Clerk. `proxy.ts` redirects signed-out visitors. Every server action and page also checks the session itself.
- **Ownership**: every query is filtered by the signed-in user, so one user can never read, change or delete another user's workspaces, papers, chats, notes or saved items.
- **Rate limits**: stored in the database (`RateLimit` table), so they hold across all Vercel serverless instances. Limits per user:
  - chat: 20 messages / 5 min
  - quick ask: 20 / 5 min
  - summaries: 15 / 5 min
  - analysis: 10 / 5 min
  - uploads and re-processing: 20 / hour
  - search: 30 / min
  - notes and saved items: 60 / 5 min
  - new workspaces: 20 / hour
  - public demo: 20 / 5 min per IP
- **Quotas**: max 50 workspaces and 300 papers per user.
- **Uploads**:
  - max 4MB, PDF/DOCX/TXT only
  - the real file contents are checked, not just the file name
  - stored under a cleaned-up name with a random suffix and a fixed, safe content type
  - limits on pages, text size and number of chunks, so a "zip bomb" can't run up AI costs
- **Input validation**: every server action checks its inputs (id format, list sizes, text lengths, tags, page numbers), because server actions can be called directly with any data.
- **Webhook**: Clerk webhook signatures are verified with svix. Deleting a user also deletes their uploaded files.
- **Headers**: HSTS, a frame-ancestors/object-src/base-uri CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy and COOP. The `X-Powered-By` header is turned off.
- **Secrets**: these are never committed. `.env*`, `.vercel` and `.clerk` are all in `.gitignore`.

## One-time setup steps (done outside the code)

1. Run `npx prisma db push` once to create the `RateLimit` table. The app also creates it on first use.
2. **Supabase only**: run `prisma/enable-rls.sql` in the SQL Editor. This blocks direct REST API access to the tables.
3. Clerk dashboard: turn on bot protection and email verification for sign-ups.
4. Vercel: keep Deployment Protection on for preview deployments.

## Known limitation

Uploaded files are stored in Vercel Blob with `public` access behind long random URLs. The app never sends these URLs to the browser, but anyone who obtained a URL could open that file.
