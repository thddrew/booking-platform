"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
			<h1 className="text-4xl font-bold tracking-tight">
				Something went wrong
			</h1>
			{process.env.NODE_ENV === "development" && (
				<p className="text-muted-foreground max-w-md font-mono text-sm">
					{error.message}
				</p>
			)}
			<div className="flex gap-2">
				<Button onClick={reset}>Try again</Button>
				<Button variant="outline" asChild>
					<Link href="/">Go Home</Link>
				</Button>
			</div>
		</div>
	);
}
