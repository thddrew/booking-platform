import type { Event, Page } from "@payload-types";

import React from "react";
import { EventDetailPage } from "./EventDetailPage";
import { EventsListPage } from "./EventsListPage";

export const RenderPage = ({
	data,
	event,
	slug,
	tenantId,
	tenantSlug,
}: {
	data: Page | null;
	event?: Event;
	slug?: string;
	tenantId?: string;
	tenantSlug?: string;
}) => {
	if (event) {
		return <EventDetailPage event={event} />;
	}

	if (slug === "events" && tenantId) {
		return <EventsListPage tenantId={tenantId} tenantSlug={tenantSlug} />;
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
