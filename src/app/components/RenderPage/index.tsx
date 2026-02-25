import type { Page } from "@payload-types";
import { convertLexicalToHTMLAsync } from "@payloadcms/richtext-lexical/html-async";

import React from "react";
import { EventDetailPage } from "./EventDetailPage";
import { EventsListPage } from "./EventsListPage";

export const RenderPage = async ({
	data,
	slug,
	tenantId,
	tenantSlug,
}: {
	data: Page | null;
	slug?: string;
	tenantId?: string;
	tenantSlug?: string;
}) => {
	const slugString = slug || "";

	const isEventsList = slugString === "events";
	const isEventDetail = slugString.startsWith("events/") && slugString.split("/").length === 2;

	if (isEventsList && tenantId) {
		return (
			<EventsListPage tenantId={tenantId} tenantSlug={tenantSlug} />
		);
	}

	if (isEventDetail && tenantId && tenantSlug) {
		const eventSlug = slugString.split("/")[1];
		return <EventDetailPage eventSlug={eventSlug} tenantId={tenantId} tenantSlug={tenantSlug} />;
	}

	if (!data) {
		return null;
	}

	const contentHtml = data.content
		? await convertLexicalToHTMLAsync({ data: data.content })
		: null;

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
				<h1 className="text-3xl font-semibold mb-6">{data.title}</h1>
				{contentHtml && (
					<div
						className="prose prose-lg dark:prose-invert max-w-none"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: Lexical HTML is sanitized by convertLexicalToHTMLAsync
						dangerouslySetInnerHTML={{ __html: contentHtml }}
					/>
				)}
			</div>
		</div>
	);
};
