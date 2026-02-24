import configPromise from "@payload-config";
import { getPayload } from "payload";

export async function TenantHeader({ tenantSlug }: { tenantSlug?: string }) {
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

	const logo =
		tenant.logo && typeof tenant.logo === "object" && "url" in tenant.logo
			? tenant.logo
			: null;

	const brandColor = tenant.brandColor || "#000000";

	return (
		<header
			className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3"
			style={{ backgroundColor: brandColor }}
		>
			<div className="container mx-auto max-w-[1760px] flex items-center gap-3">
				{logo?.url && (
					<img
						src={logo.url}
						alt={`${tenant.name} logo`}
						className="h-8 w-auto object-contain"
					/>
				)}
				<div className="flex flex-col">
					<span className="text-sm font-semibold text-white">
						{tenant.name}
					</span>
					{tenant.tagline && (
						<span className="text-xs text-white/70">{tenant.tagline}</span>
					)}
				</div>
			</div>
		</header>
	);
}
