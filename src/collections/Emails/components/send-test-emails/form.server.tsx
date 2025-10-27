"use server";

import { getTenantFromCookie } from "@payloadcms/plugin-multi-tenant/utilities";
import type { ServerComponentProps } from "payload";
import { Suspense } from "react";
import type { Email } from "@/payload-types";
import SendTestEmailForm from "./form.client";

export default async function SendTestEmailFormServer(
	props: ServerComponentProps,
) {
	const tenant = getTenantFromCookie(props.req.headers, "text");
	return (
		<Suspense>
			<SendTestEmailForm
				email={props.data as Email}
				tenantId={String(tenant)}
			/>
		</Suspense>
	);
}
