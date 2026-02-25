"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ViewPublicPageButton() {
	const [tenantSlug, setTenantSlug] = useState<string | null>(null);

	useEffect(() => {
		async function fetchTenant() {
			try {
				const res = await fetch("/api/users/me", { credentials: "include" });
				const data = await res.json();
				const tenantId = data?.user?.tenant?.id || data?.user?.tenant;
				if (!tenantId) return;

				const tenantRes = await fetch(`/api/tenants/${tenantId}`);
				const tenantData = await tenantRes.json();
				if (tenantData?.slug) {
					setTenantSlug(tenantData.slug);
				}
			} catch {
				// silently fail
			}
		}
		fetchTenant();
	}, []);

	if (!tenantSlug) return null;

	return (
		<Button asChild variant="outline" size="sm" className="gap-2">
			<a
				href={`/tenant-slugs/${tenantSlug}/events`}
				target="_blank"
				rel="noopener noreferrer"
			>
				View Booking Page
				<ExternalLinkIcon className="h-3.5 w-3.5" />
			</a>
		</Button>
	);
}
