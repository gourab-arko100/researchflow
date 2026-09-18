# Build plan

Locked decisions: Clerk (auth), Vercel Blob (storage), Postgres+pgvector (vectors),
Gemini free tier (`gemini-3.6-flash`, `gemini-embedding-001`) as the default AI provider
behind an `AIService`/`EmbeddingService`/`DocumentAnalysisService` interface that the `Demo*`
classes also implement.

- [x] **Phase 1 — Project setup, design system, landing page**
      Next.js/TS/Tailwind scaffold, token system, hand-built UI primitives, landing
      page (hero, capabilities, architecture strip), `.env.example`, draft Prisma schema.
- [x] **Phase 2 — Auth + database**
      Clerk middleware (route protection), sign-in/sign-up pages, `ClerkProvider` themed
      to the token system, `user.created/updated/deleted` webhook syncing into Prisma,
      a self-healing `getOrCreateCurrentUser()` for local dev without a webhook tunnel,
      Prisma client singleton, protected `/dashboard` stub proving the whole chain.
- [x] **Phase 3 — Workspaces + document upload**
      Workspace CRUD (scoped to the signed-in user), direct-to-Blob client upload
      (drag-and-drop + picker, progress, client + server-side validation), document
      records created post-upload, dashboard with real counts, workspace detail page.
- [x] **Phase 4 — PDF processing + document reader**
      Real per-page PDF text extraction (pdf-parse, page-aware via its pagerender
      hook), DOCX (mammoth) / TXT pseudo-paginated, runs synchronously on upload,
      FAILED status + retry on extraction errors, three-pane reader (page nav,
      content, document info) with in-document search over the real extracted text.
- [x] **Phase 5 — Embeddings + vector search + RAG**
      `EmbeddingService`/`AIService` abstractions; `GeminiEmbeddingService` (real
      `gemini-embedding-001` calls) and `DemoEmbeddingService` (deterministic hashing
      bag-of-words vectorizer — real lexical retrieval, zero API key) both implement
      the same interface. Page-aware chunking, pgvector storage + cosine search via
      raw SQL, `GeminiAIService` (grounded generation) and `DemoAIService` (extractive,
      no LLM call) both implement `AIService`. Pipeline now reaches `READY`. Reader has
      a single-question retrieval test (full chat is Phase 6).
- [x] **Phase 6 — AI chat + citations**
      `/workspace/[id]/chat`: pick one paper for a focused thread or several for
      cross-paper questions, persisted `Conversation`/`Message`/`Citation` rows,
      multi-turn history. Citations now use reliable `[Source N]` tags the model
      is instructed to emit (fixes a latent bug where two papers sharing a page
      number could get mis-attributed) and render as clickable `[Title, p. N]`
      chips that deep-link into the reader at that exact page (`?page=N`).
- [x] **Phase 7 — Summaries + comparison**
      `DocumentAnalysisService` (Gemini: structured JSON extraction into the
      Document's cached fields; Demo: honest extractive overview only, no
      fabricated structure) at `/document/[id]/summary`. Comparison at
      `/workspace/[id]/compare` (2–5 papers): the table is built deterministically
      in code from each paper's cached summary — no AI call for layout — with one
      synthesis call for the written comparative analysis underneath.
      Also added: workspace deletion (with Blob cleanup) and chat-conversation
      deletion, both with confirmation.
- [x] **Phase 8 — Research gaps + literature review**
      `/workspace/[id]/research-gaps` (1–6 papers): AI observations across
      Common Limitations / Underexplored Areas / Dataset / Methodological /
      Evaluation gaps and Future Directions, always shown under a fixed
      "AI-generated — not established fact" banner regardless of what the
      model outputs. `/workspace/[id]/literature-review` (2–8 papers): groups
      papers into 2–4 themes with a drafted synthesis per theme — each section
      supports Edit (inline textarea), Regenerate (re-runs just that theme),
      Copy, and a whole-draft Export to `.md`. Demo mode is honest here too:
      gaps/theming need real synthesis, so it shows each paper's own cached
      fields unsynthesized rather than faking cross-paper insight.
- [x] **Phase 9 — Search + notes + bookmarks + analytics**
      `/search`: deterministic keyword search (no AI call) across titles, extracted
      page text, notes, and cached AI summaries, with jump-to-page results.
      `/notes`: create/edit/delete notes tied to a document and page, tagged;
      also embedded directly in the reader. `/saved`: bookmark any AI answer
      from chat or the reader's quick-ask via "Save this answer". `/analytics`:
      real counts (workspaces, papers, AI analyses = actual assistant-message
      count, notes, saved) plus two Recharts charts (papers over time, papers
      by workspace) — all plain queries, no AI. Also fixed a duplicate summary
      link that had crept into the reader's right panel.
- [x] **Phase 10 — Demo mode**
      `/demo`: a shared, publicly-viewable workspace that self-seeds on first
      visit with 4 original synthetic papers (Bengali ASR, Bengali aphasia
      detection, transformer-based low-resource ASR, Bengali-English code-switched
      speech-to-text — not reproductions of any real publication). Runs entirely
      on the Demo embedding/AI providers directly (bypassing the env-based
      factory), so it works with zero API keys configured anywhere, even on a
      deployment where the owner has set up Gemini for their own authenticated
      use. Real multi-paper chat and per-paper Q&A, no account needed — every
      demo action is hard-scoped to the fixed seeded workspace so it can't
      become a backdoor into real users' data.
- [x] **Phase 11 — Testing + security + performance**
      Unit tests (Vitest) for the pure/deterministic logic: chunking, the Demo
      embedding hash (determinism, dimensionality, unit-normalization, relative
      similarity), Gemini retry behavior, rate limiting, and validation schemas
      — `npm run test`. Rate limiting added to every AI-calling action (chat,
      quick-ask, summarize/compare/gaps/lit-review, and the public demo
      endpoint), in-memory with a documented caveat about serverless scaling.
      Global `error.tsx` and `not-found.tsx` (the latter deliberately identical
      for "doesn't exist" vs "not yours" — no information leak). `loading.tsx`
      skeletons for the dashboard, workspace, and document reader. Security
      headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.) in
      `next.config.mjs`. Added missing database indexes (`Note`, `SavedInsight`,
      `Conversation`, `Message`, `Citation`) found during the audit. Length caps
      added to saved insights.
- [x] **Phase 12 — README + deployment prep**
      Migrated `middleware.ts` → `proxy.ts` (Next.js 16's renamed convention;
      also documented that this project's real security boundary is
      per-request ownership scoping, not this file — see README Security).
      README: added Features, Database Schema, and Screenshots sections;
      fixed several stale references left over from earlier phases (Next.js
      15 → 16, old model names in `.env.example`, a "lands in Phase 7–8" note
      for features that had already shipped); expanded Deployment into real
      step-by-step Vercel prep including a production-vs-dev Clerk instance
      callout. Added `LICENSE` (MIT) and package metadata.

All 12 phases complete.

## Post-launch fixes

- **Persistent app header**: every authenticated route now shares
  `app/(app)/layout.tsx` (a route group — same URLs, shared layout) with a
  header linking to Dashboard/Search/Notes/Saved/Analytics/Home plus the
  Clerk `UserButton`, so no page is a dead end reachable only by browser
  back. Sign-in/sign-up also got a "← Home" link. Previously each page only
  had a single contextual "← parent" link.
- **Vercel deploy compatibility**: found that Vercel Functions enforce a
  hard, unconfigurable 4.5MB request body limit — since uploads route through
  a server action, the original 25MB cap would have failed in production for
  any file above 4.5MB. Lowered `MAX_UPLOAD_BYTES` to 4MB; see the note in
  `lib/validations.ts` for the full trade-off and the documented alternative
  (client-direct-to-Blob upload) if larger files are needed later.

Each phase is verified (build + manual pass through the new flow) before moving to the
next, per the source spec's own instruction not to generate the whole project in one
shot.
