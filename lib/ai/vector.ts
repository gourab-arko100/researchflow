import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { RetrievedChunk } from "@/lib/ai/types";

/** Embeddings here always come from our own embedding services (Gemini's API
 * response or our own hashing function) — never from free-form user text —
 * so inlining the numeric literal via Prisma.raw is safe; there's nothing a
 * user could inject into a list of floats we generated ourselves. */
function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.map((v) => (Number.isFinite(v) ? v : 0)).join(",")}]`;
}

export async function insertChunkEmbeddings(
  documentId: string,
  chunks: { pageNumber: number; text: string; embedding: number[] }[]
): Promise<void> {
  for (const chunk of chunks) {
    const vectorSql = Prisma.raw(`'${toVectorLiteral(chunk.embedding)}'::vector`);
    await db.$executeRaw`
      INSERT INTO "DocumentChunk" (id, "documentId", "pageNumber", text, embedding, "createdAt")
      VALUES (${randomUUID()}, ${documentId}, ${chunk.pageNumber}, ${chunk.text}, ${vectorSql}, now())
    `;
  }
}

export async function deleteChunksForDocument(documentId: string): Promise<void> {
  await db.$executeRaw`DELETE FROM "DocumentChunk" WHERE "documentId" = ${documentId}`;
}

export async function searchChunks(params: {
  documentIds: string[];
  queryEmbedding: number[];
  limit?: number;
}): Promise<RetrievedChunk[]> {
  const { documentIds, queryEmbedding, limit = 6 } = params;
  if (documentIds.length === 0) return [];

  const vectorSql = Prisma.raw(`'${toVectorLiteral(queryEmbedding)}'::vector`);

  const rows = await db.$queryRaw<
    { id: string; documentId: string; documentTitle: string; pageNumber: number; text: string; distance: number }[]
  >(Prisma.sql`
    SELECT c.id, c."documentId", d.title AS "documentTitle", c."pageNumber", c.text,
           (c.embedding <=> ${vectorSql}) AS distance
    FROM "DocumentChunk" c
    JOIN "Document" d ON d.id = c."documentId"
    WHERE c."documentId" IN (${Prisma.join(documentIds)})
    ORDER BY distance ASC
    LIMIT ${limit}
  `);

  return rows.map((r) => ({
    chunkId: r.id,
    documentId: r.documentId,
    documentTitle: r.documentTitle,
    pageNumber: r.pageNumber,
    text: r.text,
    distance: r.distance,
  }));
}
