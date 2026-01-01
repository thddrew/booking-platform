import { convertLexicalToHTMLAsync } from '@payloadcms/richtext-lexical/html-async'
import {
	ArrowLeftIcon,
	CalendarIcon,
	CheckIcon,
	ClockIcon,
	HeartIcon,
	Share2Icon,
} from "lucide-react";
import Link from "next/link";
import { RefreshRouteOnSave } from "@/app/components/live-preview-refresh";
import { Button } from "@/components/ui/button";
import type { Event } from "@/payload-types";

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
		data: description as Parameters<typeof convertLexicalToHTMLAsync>[0]["data"],
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
							<button
								type="button"
								className="p-2 rounded-full hover:bg-muted transition-colors"
								aria-label="Share"
							>
								<Share2Icon className="h-5 w-5" />
							</button>
							<button
								type="button"
								className="p-2 rounded-full hover:bg-muted transition-colors"
								aria-label="Save to favorites"
							>
								<HeartIcon className="h-5 w-5" />
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1760px] py-8">
				<div className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-16">
					<div className="min-w-0">
						<h1 className="text-[26px] font-semibold mb-2 text-foreground">
							{event.title}
						</h1>

						<div className="flex flex-wrap items-center gap-4 text-[15px] text-muted-foreground mb-8">
							{firstSchedule && (
								<div className="flex items-center gap-1">
									<CalendarIcon className="h-4 w-4" />
									<span>
										{formatDate(new Date(firstSchedule.dtstart))} -{" "}
										{formatTime(new Date(firstSchedule.dtstart))}
									</span>
								</div>
							)}
						</div>

						{event.thumbnail &&
							typeof event.thumbnail === "object" &&
							"url" in event.thumbnail && (
								<div className="mb-8">
									<div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted">
										<img
											src={event.thumbnail.url as string}
											alt={event.title}
											className="w-full h-full object-cover"
										/>
									</div>
									{galleryImages.length > 0 && (
										<div className="grid grid-cols-4 gap-2 mt-2">
											{galleryImages.slice(0, 4).map((image, idx) => {
												if (typeof image === "string" || !("url" in image))
													return null;
												return (
													<button
														type="button"
														key={image.id}
														className="relative aspect-square overflow-hidden rounded-lg bg-muted"
													>
														<img
															src={image.url as string}
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
									)}
								</div>
							)}

						{event.description && (
							<div className="mb-8 pb-8 border-b">
								<EventDescription description={event.description} />
							</div>
						)}

						{event.schedules?.schedule && event.schedules.schedule.length > 0 && (
							<div className="mb-8 pb-8 border-b">
								<h2 className="text-[22px] font-semibold mb-6">Schedule</h2>
								<div className="space-y-6">
									{event.schedules.schedule
										.filter((schedule) => schedule.isActive !== false)
										.map((schedule) => {
											const startDate = new Date(schedule.dtstart);
											const endDate = new Date(schedule.dtend);

											return (
												<div key={schedule.id} className="flex gap-4">
													<div className="shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
														<CalendarIcon className="h-5 w-5 text-muted-foreground" />
													</div>
													<div className="flex-1 min-w-0">
														{schedule.scheduleName && (
															<h3 className="font-semibold text-[16px] mb-1">
																{schedule.scheduleName}
															</h3>
														)}
														<p className="text-[15px] text-foreground mb-1">
															{formatDate(startDate)}
														</p>
														<p className="text-[14px] text-muted-foreground flex items-center gap-2">
															<ClockIcon className="h-4 w-4" />
															{formatTime(startDate)} - {formatTime(endDate)}
														</p>
													</div>
												</div>
											);
										})}
								</div>
							</div>
						)}

						{hasPrices && activePrices.length > 0 && (
							<div className="mb-8 pb-8 border-b">
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
							</div>
						)}
					</div>

					<div className="lg:sticky lg:top-[72px] h-fit">
						<div className="border rounded-2xl p-6 shadow-lg bg-background">
							<div className="flex items-baseline justify-between mb-6">
								<div>
									{!isFree ? (
										<>
											<span className="text-[22px] font-semibold">
												${minPrice.toFixed(0)}
											</span>
											{activePrices.length > 1 && (
												<span className="text-[15px] text-muted-foreground ml-1">
													+
												</span>
											)}
										</>
									) : (
										<span className="text-[22px] font-semibold">Free</span>
									)}
								</div>
							</div>

							<div className="space-y-4 mb-6">
								<div className="border rounded-lg p-4">
									<div className="grid grid-cols-2 gap-4">
										<div className="border-r pr-4">
											<div className="text-xs font-medium text-muted-foreground uppercase mb-1">
												Check-in
											</div>
											<div className="text-[15px] font-medium">
												{firstSchedule
													? formatDate(new Date(firstSchedule.dtstart))
													: "Select date"}
											</div>
										</div>
										<div>
											<div className="text-xs font-medium text-muted-foreground uppercase mb-1">
												Check-out
											</div>
											<div className="text-[15px] font-medium">
												{firstSchedule
													? formatDate(new Date(firstSchedule.dtend))
													: "Select date"}
											</div>
										</div>
									</div>
								</div>
							</div>

							<Button size="lg" className="w-full rounded-lg" disabled>
								Reserve
							</Button>

							<p className="text-center text-[13px] text-muted-foreground mt-4">
								You won't be charged yet
							</p>

							{hasPrices && activePrices.length > 1 && (
								<div className="mt-6 pt-6 border-t space-y-3">
									{activePrices.map((price) => (
										<div
											key={price.id}
											className="flex items-center justify-between text-[14px]"
										>
											<span className="text-muted-foreground">
												{price.label}
											</span>
											<span className="font-medium">
												{price.amount === 0 ? (
													<span className="text-success">Free</span>
												) : (
													`$${price.amount.toFixed(2)}`
												)}
											</span>
										</div>
									))}
									<div className="flex items-center justify-between text-[14px] font-semibold pt-3 border-t">
										<span>Total</span>
										<span>
											{isFree ? (
												<span className="text-success">Free</span>
											) : (
												`$${minPrice.toFixed(2)}`
											)}
										</span>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
