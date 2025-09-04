"use server";

import { Gutter } from "@payloadcms/ui";
import { DocumentViewServerProps } from "payload";
import { OnboardingView } from "./client";
import { ConnectedAccount } from "@/payload-types";
import { redirect } from "next/navigation";
import { extractTenantIdFromAccount } from "@/utilities/extractTenantIdFromAccount";

export const OnboardingLoader = async (args: DocumentViewServerProps) => {
  const doc = args.doc as ConnectedAccount;

  if (!args.user) {
    redirect("/login");
  }

  const tenant = extractTenantIdFromAccount(doc);

  if (!doc.id || !doc.stripeAccountId || !tenant) {
    return <Gutter>No connected account found</Gutter>;
  }

  return (
    <OnboardingView
      docId={doc.id}
      user={args.user}
      accountId={doc.stripeAccountId}
      tenant={tenant}
    />
  );
};

export default OnboardingLoader;
