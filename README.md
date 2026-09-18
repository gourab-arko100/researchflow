# ResearchFlow

An AI research assistant for reading, searching, comparing, and writing from a personal
library of research papers — grounded in retrieval-augmented generation, not free-floating
chat.

**Status: Phase 12 of 12 — complete.** See [`PLAN.md`](./PLAN.md) for the full
phase-by-phase build history.

## Features

- **Workspaces**: separate research projects, each with its own papers, chat history, and analyses
- **Upload**: drag-and-drop PDF/DOCX/TXT, validated client- and server-side, up to 4MB (see the note in `lib/validations.ts` on why — Vercel's platform-level Function body limit, not a Next.js setting)
- **Real processing pipeline**: text extraction (true per-page for PDFs) → chunking → embedding → pgvector, with honest `FAILED` states (not silent fake success) and a Retry button
- **Document reader**: page navigation, in-document search, notes tied to a page
- **RAG chat**: single- or multi-paper conversations, persisted history, citations that deep-link to the exact page
- **Structured summaries**: cached per paper, regenerable on demand
- **Comparison**: 2–5 papers, deterministic table + one AI-synthesized narrative
- **Research gaps**: AI observations across common limitations, underexplored areas, and future directions — always shown under a fixed "not established fact" label
- **Literature review drafting**: auto-themed, per-section edit/regenerate/copy, whole-draft export to `.md`
- **Global search**: titles, page text, notes, and summaries — plain keyword search, no AI call
- **Notes and saved insights**: tag and revisit anything you've written or bookmarked
- **Analytics**: real counts and charts from the database, not invented numbers
- **Public demo workspace**: try the whole thing with zero signup and zero API key
- **Works with or without a Gemini key**: every AI feature has a Demo-mode fallback that does real retrieval, just without generative synthesis
- **Persistent navigation**: every authenticated page shares one header (Dashboard/Search/Notes/Saved/Analytics/Home) — nothing is a dead end

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + TypeScript | |
| UI | Tailwind CSS, hand-built primitives in `components/ui` | no CLI network access at scaffold time; styled to a custom token system, not default shadcn |
| Auth | Clerk | hosted, free tier, Google OAuth included |
| Database | PostgreSQL + Prisma | |
| Vector search | pgvector (Postgres extension) | keeps retrieval in the same database as everything else |
| File storage | Vercel Blob | matches Vercel deploy target |
| AI | Google Gemini (`gemini-3.6-flash` + `gemini-embedding-001`, via `@google/genai`) | current free tier covers chat *and* embeddings with no billing — note: the older `@google/generative-ai` package is deprecated (EOL Aug 2025), this project uses the current unified `@google/genai` SDK |

## Architecture

```
Upload → Text extraction → Page-aware chunking → Embedding → pgvector
                                                                  │
User question → Query embedding → Semantic search ───────────────┘
                                          │
                                   Retrieved chunks
                                          │
                                    Gemini (RAG prompt)
                                          │
                              Answer + page citations
```

The AI layer is abstracted behind `lib/ai/` (`AIService`, `EmbeddingService`,
`DocumentAnalysisService`) so `GeminiAIService`/`GeminiEmbeddingService`/`GeminiDocumentAnalysisService`
and their `Demo*` counterparts implement the same interfaces — the UI never knows which one
answered. Selection is automatic: `GEMINI_API_KEY` set → Gemini; unset → Demo (deterministic,
zero-cost, still does real retrieval). `DocumentAnalysisService` covers structured summaries,
comparison, research-gap analysis, and literature-review drafting.

## Database schema

Full detail in `prisma/schema.prisma`; the shape:

- **User** → **Workspace** (owned projects) → **Document** (uploaded papers)
- **Document** → **DocumentPage** (extracted text, one row per page) and
  **DocumentChunk** (overlapping windows of that text, each with a `vector(768)`
  embedding — this is what pgvector searches)
- **Document** also carries cached AI-extracted fields directly (`abstract`,
  `researchProblem`, `methodology`, `dataset`, `results`, `limitations`) so a
  summary or comparison never re-runs the same extraction twice
- **Workspace** → **Conversation** → **Message** → **Citation** (chat history,
  each assistant message's citations pointing at a specific document + page)
- **Note** and **SavedInsight** hang off **User** directly (a note can
  optionally reference a **Document** and page; a saved insight is a
  standalone bookmark of any AI answer)
- **Collection** / **CollectionDocument** exist in the schema for paper
  organization beyond workspaces but have no UI yet — see Future improvements

## Screenshots

_Add screenshots here once deployed — suggested set: landing page, dashboard,
document reader with an open citation, chat with multi-paper citations,
comparison table, and the public demo workspace._

## Design system

Editorial/library identity rather than generic SaaS: Fraunces (display serif) + IBM Plex
Sans (UI) + IBM Plex Mono (citations, page numbers, metadata). Palette and rationale in
`tailwind.config.ts`.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Clerk, DATABASE_URL, BLOB, GEMINI_API_KEY
```

**Database**: point `DATABASE_URL` at a Postgres instance with the `vector` extension
available (Supabase and Neon both support this — on Supabase run
`create extension if not exists vector;` once in the SQL editor; Neon's pgvector is
enabled per-database the same way). Then:

```bash
npx prisma generate
npm run db:push
```

**Clerk**: create an app at [dashboard.clerk.com](https://dashboard.clerk.com), copy the
publishable/secret keys into `.env.local`. For the `user.created` webhook to sync
accounts into Postgres locally, run `npx @clerk/localtunnel` (or ngrok) and add
`https://<tunnel-url>/api/webhooks/clerk` as a webhook endpoint in the Clerk dashboard,
subscribed to `user.created` / `user.updated` / `user.deleted`; paste its signing secret
into `CLERK_WEBHOOK_SECRET`. Not strictly required for local dev — `getOrCreateCurrentUser()`
lazily creates the Postgres row on first authenticated request either way, but the webhook
is what handles deletions and is required in production.

```bash
npm run dev
```

Visit `/sign-up`, create an account, and you should land on `/dashboard` with your
account synced.

**File storage**: create a Blob store at [vercel.com](https://vercel.com) →
Storage → Create Database → Blob, then copy the `BLOB_READ_WRITE_TOKEN` it shows
you into `.env.local` (and `.env`). `put()` still needs this token even though
uploads route through the server now — see below.

Uploads go through the app's own server (`lib/actions/document.ts`'s `uploadDocument`
server action, using Blob's plain `put()`) rather than `@vercel/blob/client`'s direct
browser-to-Blob flow. That flow currently has a platform-side bug: its
`vercel.com/api/blob` token/upload endpoint fails its own CORS check for a lot of
users, independent of network, extensions, or token setup — this is a known,
Vercel-acknowledged issue, not something specific to this project.

The trade-off of routing uploads through the server instead: Vercel Functions
(what Server Actions run as when deployed) have a hard, unconfigurable 4.5MB
request body limit at the platform level — this is enforced by Vercel itself,
not something `next.config.mjs`'s `bodySizeLimit` can raise. So uploads are
capped at 4MB (`MAX_UPLOAD_BYTES` in `lib/validations.ts`) to stay safely under
that ceiling. If you need to support larger papers, the documented alternative
— and Vercel's own recommended pattern for this exact situation — is switching
back to `@vercel/blob/client`'s direct browser-to-Blob upload, which never
sends the file through a Function at all. That's what this project used before
Phase 3 found the CORS bug above; it wasn't retested before choosing the
smaller-cap approach instead, since it's the more reliable option for a
portfolio deployment even if it means a lower ceiling.

Uploaded PDF/DOCX/TXT documents are now actually parsed page-by-page (see
`lib/processing/pipeline.ts`), chunked, embedded, and stored in pgvector —
the pipeline now runs all the way to `status: READY`. A document whose text
couldn't be extracted (e.g. a scanned PDF with no OCR) lands at `FAILED` with
a real error message and a Retry button, not a silent fake success.

**No `GEMINI_API_KEY` set?** The app still fully works — `lib/ai/index.ts`
falls back to `DemoEmbeddingService` (a deterministic hashing bag-of-words
vectorizer) and `DemoAIService` (extractive: returns the actual best-matching
passages instead of a generated answer) automatically. Add the key later and
every *new* upload embeds with Gemini instead — existing documents can be
moved onto the new embedding space with the Retry button already in the
document list (Phase 4), since it re-runs the whole pipeline including
indexing.

Once a document reaches `READY`, its reader page (`/document/[id]`) has a
single-question "Ask this document" box in the right panel — a small test of
the retrieval pipeline end to end. Full multi-turn, multi-paper chat with
persisted conversations lives at `/workspace/[id]/chat` — pick one paper for a
focused thread or several to ask questions across your library. Citations in
chat render as clickable chips (`[Title, p. N]`) that jump straight to that
page in the reader.

**Search, notes, and saved answers**: `/search` does plain keyword search
(no AI call) across paper titles, extracted page text, your notes, and cached
AI summaries. Notes can be added from the reader (tied to a page, taggable) or
managed globally at `/notes`. Any AI answer — from chat or the reader's
quick-ask — can be bookmarked with "Save this answer", visible at `/saved`.
`/analytics` shows real counts and two charts (papers over time, papers by
workspace), all from plain database queries, no AI involved.

**Demo mode**: `/demo` is a public, unauthenticated workspace that seeds
itself on first visit with four original synthetic papers, and runs entirely
on the Demo providers — it works with zero API keys configured, even on a
deployment where you've set up `GEMINI_API_KEY` for your own account. Visit it
without signing in to try multi-paper chat and per-paper Q&A immediately.

## Environment variables

See [`.env.example`](./.env.example).

## Development

- `npm run dev` — local dev server
- `npm run db:studio` — inspect the database
- `npm run test` — unit tests (Vitest, pure logic only — chunking, the Demo
  embedding hash, Gemini retry behavior, rate limiting, validation schemas;
  nothing that needs a live database or Clerk session, which would need a
  proper test harness/fixtures beyond this phase's scope)
- `npm run test:watch` — same, in watch mode
- `npm run lint`

## Security

- **Auth**: every route except the landing page, `/demo`, sign-in/up, and the
  Clerk webhook requires a session (`proxy.ts` — renamed from `middleware.ts`
  in Next.js 16; same behavior, Node runtime instead of Edge). This is a
  first-pass gate, not the actual security boundary: every server action
  independently re-verifies the session and re-scopes its query by `ownerId`
  (see `lib/auth.ts` and virtually every file under `lib/actions/`), so even a
  request that somehow bypassed this file — the exact scenario CVE-2025-29927
  exploited in older Next.js versions via a spoofed internal header, patched
  upstream well before this project's Next.js 16.2.6 — would still be
  rejected at the data layer.
- **Ownership scoping**: every database query that touches a workspace,
  document, conversation, note, or saved insight filters by the current
  user's id — never just by the record's own id. A user can't reach another
  user's data even by guessing an id; they get the same 404 either way (see
  `not-found.tsx`), not a distinguishing 403.
- **The public `/demo` actions** (`lib/actions/demo.ts`) are the one
  intentional exception to auth — hard-scoped to a single fixed seeded
  workspace so they can't become a path into anyone's real data.
- **Rate limiting**: every AI-calling action is capped per-user (per-IP for
  the unauthenticated demo endpoint) via `lib/rate-limit.ts`. It's in-memory,
  which is correct on a single long-lived process but resets on classic
  per-request serverless (a fresh process = an empty bucket) — noted in the
  code; swap in `@upstash/ratelimit` or similar for a production deployment
  at real scale.
- **Input validation**: file type/size on upload, length caps on chat
  messages, notes, and saved insights, Zod validation on workspace creation.
- **Secrets**: nothing sensitive is ever sent to the client — `GEMINI_API_KEY`,
  `CLERK_SECRET_KEY`, `DATABASE_URL`, and `BLOB_READ_WRITE_TOKEN` are read only
  in server actions and route handlers.
- **Security headers** (`next.config.mjs`): `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

## Deployment

Targets Vercel.

1. **Push to GitHub** (or GitLab/Bitbucket) and import the repo at
   [vercel.com/new](https://vercel.com/new). Framework preset auto-detects as Next.js.
2. **Database**: if you haven't already, create the Supabase/Neon project and
   run `create extension if not exists vector;` — same as local setup.
3. **Blob store**: create it from the *same* Vercel account/team you're
   deploying to (Storage → Create Database → Blob) so it's connectable to the project.
4. **Clerk**: for production, create a separate Clerk **production** instance
   (not the development one from local setup) — Clerk's dashboard warns
   clearly when you're still on dev keys, which have strict usage limits and
   aren't meant for real traffic. Add a production webhook endpoint pointing
   at `https://<your-domain>/api/webhooks/clerk`, subscribed to
   `user.created`/`user.updated`/`user.deleted`.
5. **Environment variables**: in the Vercel project's Settings → Environment
   Variables, add everything from `.env.example` with production values —
   `DATABASE_URL`, `DIRECT_URL`, both Clerk keys, `CLERK_WEBHOOK_SECRET`,
   `BLOB_READ_WRITE_TOKEN`, and `GEMINI_API_KEY` (optional — omit it and the
   deployed app runs on Demo providers for every authenticated user too, not
   just `/demo`).
6. **Deploy.** Vercel runs `npm install` and `next build` automatically —
   there's no separate migration step to wire in; `prisma generate` runs as
   part of `npm install` via Prisma's postinstall hook, and the database schema
   itself should already be pushed from local setup (`npm run db:push`) before
   the first deploy, since this project doesn't run migrations at build time.
7. **Verify**: visit the deployed URL, confirm `/demo` loads and self-seeds,
   sign up for a real account, upload a paper, and confirm it reaches `Ready`.

**Rate limiting caveat**: the in-memory limiter in `lib/rate-limit.ts` resets
per cold start on Vercel's default serverless runtime — it still helps against
casual abuse within a warm instance, but isn't a hard guarantee at scale. See
the Security section above.

## Future improvements

Tracked per-phase in `PLAN.md`. Beyond the 12 phases: OCR fallback for scanned
PDFs, streaming AI responses, org/team workspaces, a Collections UI (the
`Collection`/`CollectionDocument` models exist in the schema but have no UI
yet), a shared-store rate limiter (`@upstash/ratelimit`) for real multi-instance
deployments, and integration/e2e tests against a real test database (the
current test suite covers pure logic only — see the Security and Development
sections above).
