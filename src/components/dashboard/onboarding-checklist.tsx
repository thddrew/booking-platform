"use client";

import {
	CalendarPlusIcon,
	CheckCircle2Icon,
	CircleIcon,
	CreditCardIcon,
	ExternalLinkIcon,
	RocketIcon,
	UserCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface OnboardingState {
	steps: {
		accountCreated: boolean;
		eventCreated: boolean;
		paymentsSetup: boolean;
		pageShared: boolean;
	};
	completed: number;
	total: number;
	isComplete: boolean;
	tenant: {
		slug: string;
		name: string;
	};
}

const stepConfig = [
	{
		key: "accountCreated" as const,
		label: "Create your account",
		description: "You're signed up and ready to go",
		icon: UserCheckIcon,
		action: null,
	},
	{
		key: "eventCreated" as const,
		label: "Create your first event",
		description: "Set up an event with schedules and pricing",
		icon: CalendarPlusIcon,
		action: { label: "Create Event", href: "/admin/collections/events/create" },
	},
	{
		key: "paymentsSetup" as const,
		label: "Set up payments",
		description: "Connect your Stripe account to accept payments",
		icon: CreditCardIcon,
		action: {
			label: "Set Up Payments",
			href: "/admin/collections/connectedAccounts/create",
		},
	},
	{
		key: "pageShared" as const,
		label: "Share your booking page",
		description: "Send your booking link to customers",
		icon: ExternalLinkIcon,
		action: null, // Dynamic — uses tenant slug
	},
];

export function OnboardingChecklist() {
	const [state, setState] = useState<OnboardingState | null>(null);
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		const wasDismissed = sessionStorage.getItem("onboarding-dismissed");
		if (wasDismissed) {
			setDismissed(true);
			return;
		}

		fetch("/api/tenants/onboarding", { credentials: "include" })
			.then((r) => r.json())
			.then((data) => {
				if (data.steps) setState(data);
			})
			.catch(() => {});
	}, []);

	if (dismissed || !state || state.isComplete) return null;

	const progress = Math.round((state.completed / state.total) * 100);

	return (
		<Card className="mb-6 border-primary/20 bg-primary/5">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<RocketIcon className="h-5 w-5 text-primary" />
						<CardTitle className="text-base">
							Welcome to Bookify! Let&apos;s get you set up.
						</CardTitle>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="text-xs text-muted-foreground"
						onClick={() => {
							setDismissed(true);
							sessionStorage.setItem("onboarding-dismissed", "1");
						}}
					>
						Dismiss
					</Button>
				</div>
				<div className="mt-3">
					<div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
						<span>
							{state.completed} of {state.total} steps complete
						</span>
						<span>{progress}%</span>
					</div>
					<Progress value={progress} className="h-2" />
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="space-y-3">
					{stepConfig.map((step) => {
						const isComplete = state.steps[step.key];
						const Icon = isComplete ? CheckCircle2Icon : CircleIcon;

						let action = step.action;
						if (step.key === "pageShared" && state.tenant.slug) {
							action = {
								label: "Copy Link",
								href: `/tenant-slugs/${state.tenant.slug}/events`,
							};
						}

						return (
							<div
								key={step.key}
								className={`flex items-start gap-3 p-3 rounded-lg ${
									isComplete ? "opacity-60" : "bg-background border"
								}`}
							>
								<Icon
									className={`h-5 w-5 mt-0.5 shrink-0 ${
										isComplete ? "text-green-600" : "text-muted-foreground"
									}`}
								/>
								<div className="flex-1 min-w-0">
									<p
										className={`text-sm font-medium ${isComplete ? "line-through" : ""}`}
									>
										{step.label}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{step.description}
									</p>
								</div>
								{!isComplete && action && (
									<Button
										asChild
										size="sm"
										variant="outline"
										className="shrink-0"
									>
										<Link href={action.href}>{action.label}</Link>
									</Button>
								)}
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
