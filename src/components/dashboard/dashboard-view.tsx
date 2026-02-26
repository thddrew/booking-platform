import type { DashboardViewServerProps } from "@payloadcms/next/views";
import { Gutter } from "@payloadcms/ui";
import { Suspense } from "react";
import StripeNotificationBannerServer from "../stripe-notification/banner.server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { OnboardingChecklist } from "./onboarding-checklist";
import { Overview } from "./overview";
import { TodaySchedule } from "./today-schedule";
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
						<Suspense>
							<TodaySchedule />
						</Suspense>
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
