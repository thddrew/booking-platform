"use server";

import { Gutter } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import type { DocumentViewServerProps } from "payload";
import type { ConnectedAccount } from "@/payload-types";
import { extractID } from "@/utilities/extractID";
import { OnboardingView } from "./client";

export const OnboardingLoader = async (args: DocumentViewServerProps) => {
  const doc = args.doc as ConnectedAccount;

  if (!args.user) {
    redirect("/login");
  }

  const tenant = extractID(doc);

  if (!doc.id || !doc.stripeAccountId || !tenant) {
    return <Gutter>No connected account found</Gutter>;
  }

  return (
    <Gutter>
      <div className="py-10">
        <OnboardingView
          docId={doc.id}
          user={args.user}
          accountId={doc.stripeAccountId}
          tenant={tenant}
        />
      </div>
    </Gutter>
  );
};

export default OnboardingLoader;
