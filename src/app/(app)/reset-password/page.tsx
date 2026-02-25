"use client";

import { CheckCircle2Icon, KeyRoundIcon, LockIcon, ShieldCheckIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function ResetPasswordPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get("token");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	if (!token) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
				<Card className="w-full max-w-md mx-4 shadow-lg border-border/50">
					<CardContent className="pt-8 pb-8 text-center">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
							<LockIcon className="h-6 w-6 text-destructive" />
						</div>
						<h2 className="text-lg font-semibold mb-2">Invalid Reset Link</h2>
						<p className="text-sm text-muted-foreground mb-6">
							This link is invalid or has expired. Please request a new password reset.
						</p>
						<Button variant="outline" onClick={() => router.push("/admin")}>
							Back to Login
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (success) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
				<Card className="w-full max-w-md mx-4 shadow-lg border-border/50">
					<CardContent className="pt-8 pb-8 text-center">
						<div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
							<CheckCircle2Icon className="h-7 w-7 text-green-600 dark:text-green-400" />
						</div>
						<h2 className="text-xl font-semibold mb-2">Password Updated</h2>
						<p className="text-sm text-muted-foreground mb-6">
							Your password has been reset successfully. You can now sign in with your new password.
						</p>
						<Button className="w-full" onClick={() => router.push("/admin")}>
							Sign In
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setLoading(true);

		try {
			const res = await fetch("/api/users/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password }),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Failed to reset password");
			} else {
				setSuccess(true);
			}
		} catch {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen grid lg:grid-cols-2">
			{/* Left panel — branding */}
			<div className="hidden lg:flex flex-col justify-between bg-foreground text-background p-12">
				<div>
					<div className="flex items-center gap-2 text-lg font-semibold">
						<KeyRoundIcon className="h-6 w-6" />
						<span>Bookify</span>
					</div>
				</div>
				<div>
					<blockquote className="text-lg leading-relaxed">
						&ldquo;The easiest way to manage bookings for our photography workshops. Our customers love the seamless experience.&rdquo;
					</blockquote>
					<p className="mt-4 text-sm text-background/60">
						— Happy Bookify Customer
					</p>
				</div>
				<div className="flex items-center gap-2 text-xs text-background/50">
					<ShieldCheckIcon className="h-3.5 w-3.5" />
					<span>Secured with end-to-end encryption</span>
				</div>
			</div>

			{/* Right panel — form */}
			<div className="flex items-center justify-center p-6 sm:p-12 bg-gradient-to-b from-background to-muted/30">
				<div className="w-full max-w-md">
					<div className="mb-8">
						<div className="lg:hidden flex items-center gap-2 text-lg font-semibold mb-8">
							<KeyRoundIcon className="h-6 w-6" />
							<span>Bookify</span>
						</div>
						<h1 className="text-2xl font-semibold tracking-tight">Reset Your Password</h1>
						<p className="text-sm text-muted-foreground mt-2">
							Choose a strong password to secure your account.
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="password" className="text-sm font-medium">
								New Password
							</label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter new password"
								required
								minLength={6}
								className="h-11"
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="confirmPassword" className="text-sm font-medium">
								Confirm Password
							</label>
							<Input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm new password"
								required
								minLength={6}
								className="h-11"
							/>
						</div>
						{error && (
							<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}
						<Button type="submit" className="w-full h-11" disabled={loading}>
							{loading ? "Resetting..." : "Reset Password"}
						</Button>
					</form>

					<div className="mt-8 lg:hidden">
						<Separator className="mb-4" />
						<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
							<ShieldCheckIcon className="h-3.5 w-3.5" />
							<span>Secured with end-to-end encryption</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
