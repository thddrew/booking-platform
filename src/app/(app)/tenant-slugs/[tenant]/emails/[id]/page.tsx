import configPromise from "@payload-config";
import { headers as getHeaders } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { JSONContent, render, Maily } from "@thddrew/maily-render";
import { getPayload } from "payload";

import { RefreshRouteOnSave } from "@/app/components/live-preview-refresh";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isTypedObject } from "@/utilities/isTypedObject";

export default async function Page({
  params: paramsPromise,
}: {
  params: Promise<{ id: string; tenant: string }>;
}) {
  const params = await paramsPromise;

  const headers = await getHeaders();
  const payload = await getPayload({ config: configPromise });
  const { user } = await payload.auth({ headers });

  const id = params?.id;

  try {
    const tenantsQuery = await payload.find({
      collection: "tenants",
      overrideAccess: false,
      user,
      where: {
        slug: {
          equals: params.tenant,
        },
      },
    });

    // If no tenant is found, the user does not have access
    // Show the login view
    if (tenantsQuery.docs.length === 0) {
      redirect(
        `/tenant-slugs/${params.tenant}/login?redirect=${encodeURIComponent(
          `/tenant-slugs/${params.tenant}${id ? `/${id}` : ""}`
        )}`
      );
    }
  } catch (e) {
    // If the query fails, it means the user did not have access to query on the slug field
    // Show the login view
    redirect(
      `/tenant-slugs/${params.tenant}/login?redirect=${encodeURIComponent(
        `/tenant-slugs/${params.tenant}${id ? `/${id}` : ""}`
      )}`
    );
  }

  const emailQuery = await payload.find({
    collection: "emails",
    draft: true,
    trash: true,
    where: {
      and: [
        {
          "tenant.slug": {
            equals: params.tenant,
          },
        },
        {
          id: {
            equals: id,
          },
        },
      ],
    },
  });

  const emailData = emailQuery.docs?.[0];

  // The page with the provided slug could not be found
  if (!emailData) {
    return notFound();
  }

  const maily = isTypedObject<JSONContent>(emailData.emailContent)
    ? new Maily(emailData.emailContent)
    : null;

  maily?.setPreviewText(emailData.preview ?? undefined);

  const html = await maily?.render();

  // The page was found, render the page with data
  return (
    <div>
      <RefreshRouteOnSave />
      <div className="p-4">
        <div className="bg-card border rounded-lg shadow-sm flex gap-3 max-w-[600px] mx-auto p-3 mb-3">
          <Avatar className="size-6">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <p className="text-sm mr-6 mt-0.5!">Booking Operator</p>
          <div>
            <p>{emailData.subject}</p>
            <p className="text-sm text-muted-foreground italic">
              {emailData.preview}
            </p>
          </div>
        </div>
        {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </div>
  );
}
