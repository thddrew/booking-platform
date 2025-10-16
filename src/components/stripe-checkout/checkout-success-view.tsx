"use server";

import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createLoader, type Parser, parseAsString } from "nuqs/server";
import type { AdminViewServerProps } from "payload";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type CheckoutSuccessParams = {
	bookingId: string;
	checkoutSessionId?: string;
};

export const checkoutSuccessLoader = createLoader({
	bookingId: parseAsString,
	checkoutSessionId: parseAsString,
} satisfies Record<keyof CheckoutSuccessParams, Parser<any>>);

async function CheckoutSuccessView({
	initPageResult,
	params,
	searchParams,
}: AdminViewServerProps) {
	if (!searchParams) {
		redirect("/admin");
	}

	const { bookingId } = await checkoutSuccessLoader(searchParams);

	return (
		<DefaultTemplate
			i18n={initPageResult.req.i18n}
			locale={initPageResult.locale}
			params={params}
			payload={initPageResult.req.payload}
			permissions={initPageResult.permissions}
			searchParams={searchParams}
			user={initPageResult.req.user || undefined}
			visibleEntities={initPageResult.visibleEntities}
		>
			<Gutter>
				<div className="flex items-center justify-center min-h-[60vh] py-8 twp">
					<Card className="max-w-2xl w-full">
						<CardHeader className="text-center">
							<div className="flex justify-center mb-4">
								<div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
									<CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-500" />
								</div>
							</div>
							<CardTitle className="text-2xl">Payment Successful!</CardTitle>
						</CardHeader>

						<CardContent className="space-y-4">
							<div className="bg-muted/50 rounded-lg p-4">
								<h3 className="font-semibold mb-2">What's next?</h3>
								<ul className="space-y-2 text-sm text-muted-foreground">
									<li className="flex items-start gap-2">
										<CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
										<span>
											You'll receive a confirmation email with your receipt
										</span>
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
										<span>
											Your booking details have been saved to your account
										</span>
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
										<span>
											You can view your bookings anytime in your dashboard
										</span>
									</li>
								</ul>
							</div>
						</CardContent>

						<CardFooter className="flex justify-center gap-3">
							<Button asChild variant="default">
								<Link
									href={`${process.env.NEXT_PUBLIC_PAYLOAD_PUBLIC_SERVER_URL}/admin/collections/bookings/${bookingId}`}
								>
									<ArrowLeft className="w-4 h-4" />
									Return to booking
								</Link>
							</Button>
						</CardFooter>
					</Card>
				</div>
			</Gutter>
		</DefaultTemplate>
	);
}

export default CheckoutSuccessView;
