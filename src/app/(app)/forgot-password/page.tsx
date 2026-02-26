"use client";

import {
	KeyRoundIcon,
	Loader2Icon,
	MailIcon,
	ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const res = await fetch("/api/users/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			if (res.ok) {
				setSent(true);
			} else {
				const data = await res.json();
				setError(data.error || "Something went wrong");
			}
		} catch {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	if (sent) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
				<div className="w-full max-w-md mx-4 text-center">
					<div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
						<MailIcon className="h-7 w-7 text-green-600 dark:text-green-400" />
					</div>
					<h1 className="text-2xl font-semibold mb-2">Check your email</h1>
					<p className="text-sm text-muted-foreground mb-8">
						If an account exists for{" "}
						<span className="font-medium">{email}</span>, we've sent a password
						reset link. Check your inbox and spam folder.
					</p>
					<Button asChild variant="outline">
						<Link href="/admin">Back to Login</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
			<div className="w-full max-w-md mx-4">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
						<KeyRoundIcon className="h-7 w-7 text-primary" />
					</div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Forgot your password?
					</h1>
					<p className="text-sm text-muted-foreground mt-2">
						Enter your email and we'll send you a reset link.
					</p>
				</div>

				<Card className="shadow-lg border-border/50">
					<CardContent className="pt-6 pb-6">
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<label htmlFor="email" className="text-sm font-medium">
									Email address
								</label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@yourbusiness.com"
									required
									className="h-11"
								/>
							</div>
							{error && (
								<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
									<p className="text-sm text-destructive">{error}</p>
								</div>
							)}
							<Button type="submit" className="w-full h-11" disabled={loading}>
								{loading ? (
									<>
										<Loader2Icon className="h-4 w-4 animate-spin mr-2" />
										Sending...
									</>
								) : (
									"Send Reset Link"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				<p className="mt-6 text-center text-sm text-muted-foreground">
					Remember your password?{" "}
					<Link
						href="/admin"
						className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
					>
						Back to Login
					</Link>
				</p>

				<div className="mt-6">
					<Separator className="mb-4" />
					<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
						<ShieldCheckIcon className="h-3.5 w-3.5" />
						<span>We'll never share your email</span>
					</div>
				</div>
			</div>
		</div>
	);
}
