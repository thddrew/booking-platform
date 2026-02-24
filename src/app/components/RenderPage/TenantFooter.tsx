import configPromise from "@payload-config";
import { getPayload } from "payload";

export async function TenantFooter({ tenantSlug }: { tenantSlug?: string }) {
	if (!tenantSlug) return null;

	const payload = await getPayload({ config: configPromise });

	const tenantQuery = await payload.find({
		collection: "tenants",
		where: { slug: { equals: tenantSlug } },
		limit: 1,
		overrideAccess: true,
	});

	const tenant = tenantQuery.docs[0];
	if (!tenant) return null;

	const hasContactInfo = tenant.contactEmail || tenant.contactPhone;
	if (!hasContactInfo) return null;

	return (
		<footer className="w-full border-t border-border bg-muted/30 px-4 sm:px-6 lg:px-8 py-6 mt-8">
			<div className="container mx-auto max-w-[1760px] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
				<span className="font-medium">{tenant.name}</span>
				<div className="flex items-center gap-4">
					{tenant.contactEmail && (
						<a href={`mailto:${tenant.contactEmail}`} className="hover:underline">
							{tenant.contactEmail}
						</a>
					)}
					{tenant.contactPhone && (
						<a href={`tel:${tenant.contactPhone}`} className="hover:underline">
							{tenant.contactPhone}
						</a>
					)}
				</div>
				<span className="text-xs text-muted-foreground/60">
					Powered by Bookify
				</span>
			</div>
		</footer>
	);
}
