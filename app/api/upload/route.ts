import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACCEPTED_DOCUMENT_TYPES, MAX_UPLOAD_BYTES } from "@/lib/validations";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const user = await getOrCreateCurrentUser();
        if (!user) throw new Error("Not signed in");

        const workspaceId = clientPayload ? JSON.parse(clientPayload).workspaceId : null;
        if (!workspaceId) throw new Error("Missing workspaceId");

        const workspace = await db.workspace.findFirst({
          where: { id: workspaceId, ownerId: user.id },
          select: { id: true },
        });
        if (!workspace) throw new Error("Workspace not found");

        return {
          allowedContentTypes: [...ACCEPTED_DOCUMENT_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ workspaceId, userId: user.id }),
        };
      },
      // Not relied on for record-creation (see lib/actions/document.ts —
      // the client calls that directly, since onUploadCompleted needs a
      // publicly reachable URL and won't fire from localhost). Kept as a
      // best-effort log / for when this is deployed.
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Blob upload completed:", blob.url, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
