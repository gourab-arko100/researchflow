-- Run this ONCE in Supabase → SQL Editor (only if your database is on Supabase).
--
-- Why: Supabase automatically exposes every table in the "public" schema
-- through its REST API. With Row Level Security (RLS) OFF, anyone holding
-- your project's anon key could read or change these tables directly,
-- bypassing the app completely.
--
-- Turning RLS ON with no policies blocks that REST access entirely. The app
-- itself is NOT affected: Prisma connects as the database owner, which
-- bypasses RLS.

ALTER TABLE "User"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentPage"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentChunk"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Collection"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CollectionDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Citation"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedInsight"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResearchAnalysis"   ENABLE ROW LEVEL SECURITY;

-- The rate-limit table is created by the app on first use; create it now so
-- RLS can be enabled on it as well.
CREATE TABLE IF NOT EXISTS "RateLimit" ("key" TEXT NOT NULL PRIMARY KEY, "count" INTEGER NOT NULL, "resetAt" BIGINT NOT NULL);
ALTER TABLE "RateLimit"          ENABLE ROW LEVEL SECURITY;
