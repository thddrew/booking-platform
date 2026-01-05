import type { Page } from "@payload-types";

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

	return (
		<React.Fragment>
			<form action="/api/users/logout" method="post">
				<button type="submit">Logout</button>
			</form>
			<h2>Here you can decide how you would like to render the page data!</h2>

			<code>{JSON.stringify(data)}</code>
		</React.Fragment>
	);
};
