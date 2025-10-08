import { Webhook } from "svix";
import { Endpoint } from "payload";
import { headers } from "next/headers";
import { ResendWebhookPayload } from "@/types/resend";
import { contactUpdatedWebhook } from "@/lib/resend/webhooks/contact.updated";

export const resendWebhook: Endpoint = {
  path: "/webhooks/resend",
  method: "post",
  handler: async (req) => {
    const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      throw new Error(
        "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
      );
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error occured -- no svix headers", {
        status: 400,
      });
    }

    // Get the body
    const payload = await req.json?.();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: ResendWebhookPayload;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as ResendWebhookPayload;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occured", {
        status: 400,
      });
    }

    switch (evt.type) {
      case "contact.updated": {
        const res = await contactUpdatedWebhook({
          payload: evt,
          req,
        });

        return res;
      }
      case "contact.deleted": {
        return Response.json({
          message: "Resend webhook received",
        });
      }
    }
  },
};
