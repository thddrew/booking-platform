import configPromise from "@payload-config";
import { convertLexicalToHTMLAsync } from '@payloadcms/richtext-lexical/html-async';
import {
	ArrowLeftIcon,
	CalendarIcon,
	CheckIcon,
	HeartIcon,
	Share2Icon,
} from "lucide-react";
import Link from "next/link";
import { getPayload } from "payload";
import { RefreshRouteOnSave } from "@/app/components/live-preview-refresh";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Event } from "@/payload-types";
import { EventBookingPanel } from "./EventBookingPanel";
import { getAvailableTimeslots } from "./utils/get-available-timeslots";

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

function formatTime(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(date);
}

async function EventDescription({
	description,
}: {
	description: NonNullable<Event["description"]>;
}) {
	const html = await convertLexicalToHTMLAsync({
		data: description,
	});

	return (
		<div
			className="prose prose-lg dark:prose-invert max-w-none [&_p]:text-[16px] [&_p]:leading-7 [&_p]:text-foreground [&_h1]:text-[28px] [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-[24px] [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-[20px] [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:my-2 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_em]:italic [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Lexical HTML is sanitized by convertLexicalToHTMLAsync
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}

export async function EventDetailPage({ event }: { event: Event }) {
	const hasPrices = event.prices && event.prices.length > 0;
	const activePrices = event.prices?.filter((p) => p.isActive !== false) || [];
	const isFree = activePrices.length === 0 || activePrices.every((p) => p.amount === 0);
	const minPrice = activePrices.length > 0
		? Math.min(...activePrices.map((p) => p.amount))
		: 0;
	const galleryImages = event.gallery?.filter(
		(img) => typeof img === "object" && "url" in img,
	) || [];
	const firstSchedule = event.schedules?.schedule?.find((s) => s.isActive !== false);

	const payload = await getPayload({ config: configPromise });
	const startDate = new Date();
	startDate.setHours(0, 0, 0, 0);
	const endDate = new Date();
	endDate.setDate(endDate.getDate() + 28);

	const availableTimeslots = await getAvailableTimeslots({
		event,
		startDate,
		endDate,
		payload,
	});

	return (
		<div className="min-h-screen bg-background">
			<RefreshRouteOnSave />
			<div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1760px]">
					<div className="flex items-center justify-between h-16">
						<Link
							href="../events"
							className="flex items-center gap-2 text-foreground hover:opacity-70 transition-opacity"
						>
							<ArrowLeftIcon className="h-5 w-5" />
							<span className="hidden sm:inline font-medium">Back</span>
						</Link>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label="Share"
							>
								<Share2Icon className="h-5 w-5" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label="Save to favorites"
							>
								<HeartIcon className="h-5 w-5" />
							</Button>
						</div>
					</div>
				</div>
			</div>

			{event.thumbnail &&
				typeof event.thumbnail === "object" &&
				"url" in event.thumbnail &&
				event.thumbnail.url && (
					<div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden bg-muted">
						<img
							src={event.thumbnail.url}
							alt={event.title}
							className="w-full h-full object-cover"
						/>
					</div>
				)}

			<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1760px] py-8">
				<div className="mb-6 pb-6">
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
						<div className="flex-1">
							<h1 className="text-[32px] font-semibold mb-3 text-foreground">
								{event.title}
							</h1>
							<div className="flex flex-wrap items-center gap-4 text-[15px] text-muted-foreground">
								{firstSchedule && (
									<div className="flex items-center gap-1.5">
										<CalendarIcon className="h-4 w-4" />
										<span>
											{formatDate(new Date(firstSchedule.dtstart))} at{" "}
											{formatTime(new Date(firstSchedule.dtstart))}
										</span>
									</div>
								)}
							</div>
						</div>
						<div className="flex items-baseline gap-2">
							{!isFree ? (
								<>
									<span className="text-[28px] font-semibold">
										${minPrice.toFixed(0)}
									</span>
									{activePrices.length > 1 && (
										<span className="text-[16px] text-muted-foreground">+</span>
									)}
								</>
							) : (
								<span className="text-[28px] font-semibold">Free</span>
							)}
						</div>
					</div>
					<Separator className="mt-6" />
				</div>

				<div className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-16">
					<div className="min-w-0">

						{galleryImages.length > 0 && (
							<div className="mb-8">
								<div className="grid grid-cols-4 gap-2">
									{galleryImages.slice(0, 4).map((image, idx) => {
										if (typeof image === "string" || !("url" in image) || !image.url)
											return null;
										return (
											<button
												type="button"
												key={image.id}
												className="relative aspect-square overflow-hidden rounded-lg bg-muted"
											>
											<img
												src={image.url}
												alt={event.title}
												className="w-full h-full object-cover hover:opacity-90 transition-opacity"
											/>
												{idx === 3 && galleryImages.length > 4 && (
													<div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-semibold">
														+{galleryImages.length - 4}
													</div>
												)}
											</button>
										);
									})}
								</div>
							</div>
						)}

						{event.description && (
							<div className="mb-8 pb-8">
								<EventDescription description={event.description} />
								<Separator className="mt-8" />
							</div>
						)}

						{hasPrices && activePrices.length > 0 && (
							<div className="mb-8 pb-8">
								<h2 className="text-[22px] font-semibold mb-6">What's included</h2>
								<div className="grid sm:grid-cols-2 gap-4">
									{activePrices.map((price) => (
										<div key={price.id} className="flex items-start gap-3">
											<CheckIcon className="h-5 w-5 text-foreground mt-0.5 shrink-0" />
											<div>
												<p className="font-medium text-[15px]">{price.label}</p>
												{price.description && (
													<p className="text-[14px] text-muted-foreground mt-1">
														{price.description}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
								<Separator className="mt-8" />
							</div>
						)}
					</div>

					<div className="lg:sticky lg:top-[72px] h-fit">
						<EventBookingPanel
							timeslots={availableTimeslots}
							minPrice={minPrice}
							isFree={isFree}
							activePrices={activePrices}
							hasMultiplePrices={activePrices.length > 1}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
