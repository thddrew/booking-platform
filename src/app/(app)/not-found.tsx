import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
			<h1 className="text-4xl font-bold tracking-tight">Page Not Found</h1>
			<p className="text-muted-foreground max-w-md">
				The page you&apos;re looking for doesn&apos;t exist or has been moved.
			</p>
			<Button asChild>
				<Link href="/">Go Home</Link>
			</Button>
		</div>
	);
}
