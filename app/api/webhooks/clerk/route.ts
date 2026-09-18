import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// Configure this URL (https://<your-domain>/api/webhooks/clerk) in the Clerk
// dashboard under Webhooks, subscribed to user.created / user.updated / user.deleted,
// and put its signing secret in CLERK_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("CLERK_WEBHOOK_SECRET is not set", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  let event: WebhookEvent;

  try {
    event = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Clerk webhook: signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name } = event.data;
      const email = email_addresses[0]?.email_address;
      if (!email) break;

      const name = [first_name, last_name].filter(Boolean).join(" ") || null;

      await db.user.upsert({
        where: { id },
        create: {
          id,
          email,
          name,
          settings: { create: {} },
        },
        update: { email, name },
      });
      break;
    }
    case "user.deleted": {
      const id = event.data.id;
      if (id) {
        await db.user.delete({ where: { id } }).catch(() => {
          // already gone — fine
        });
      }
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}
