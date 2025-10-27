import { MinimalTemplate } from "@payloadcms/next/templates";
import { DashboardViewServerProps } from "@payloadcms/next/views";
import { Gutter } from "@payloadcms/ui";

export default function DashboardView({
	initPageResult,
	params,
	searchParams,
}: DashboardViewServerProps) {
	return <Gutter>Dashboard</Gutter>;
}
