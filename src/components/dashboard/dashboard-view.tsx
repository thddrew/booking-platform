import type { DashboardViewServerProps } from "@payloadcms/next/views";
import { Gutter } from "@payloadcms/ui";
import { Suspense } from "react";
import StripeNotificationBannerServer from "../stripe-notification/banner.server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AvailableEventsToday } from "./available-events-today";
import { BookingsToday } from "./bookings-today";
import { OnboardingChecklist } from "./onboarding-checklist";
import { Overview } from "./overview";
import { ViewPublicPageButton } from "./view-public-page-button";

export default async function DashboardView(args: DashboardViewServerProps) {
	return (
		<Gutter>
			<div className="twp">
				<OnboardingChecklist />
				<div className="flex justify-end mb-4">
					<ViewPublicPageButton />
				</div>
				<Tabs defaultValue="today">
					<TabsList>
						<TabsTrigger value="today">Today</TabsTrigger>
						<TabsTrigger value="overview">Overview</TabsTrigger>
					</TabsList>
					<TabsContent value="today">
						<div className="mb-3">
							<StripeNotificationBannerServer {...args} />
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Suspense>
								<BookingsToday />
							</Suspense>
							<Suspense>
								<AvailableEventsToday />
							</Suspense>
						</div>
					</TabsContent>
					<TabsContent value="overview">
						<Suspense>
							<Overview />
						</Suspense>
					</TabsContent>
				</Tabs>
			</div>
		</Gutter>
	);
}
