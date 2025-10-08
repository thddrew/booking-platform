import { PayloadRequest } from "payload";
import { ContactUpdatedWebhookPayload } from "@/types/resend";

export const contactUpdatedWebhook = async ({
  payload,
  req,
}: {
  payload: ContactUpdatedWebhookPayload;
  req: PayloadRequest;
}): Promise<Response> => {
  const { data } = payload;

  console.log("data", data);

  return Response.json({
    message: "Resend webhook received",
  });
};
