"use client";

import { KeyRoundIcon, Loader2Icon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function SignupPage() {
	const router = useRouter();
	const [businessName, setBusinessName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const slug = businessName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const res = await fetch("/api/tenants/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ businessName, email, password }),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Failed to create account");
				setLoading(false);
				return;
			}

			router.push("/admin");
		} catch {
			setError("An unexpected error occurred");
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen grid lg:grid-cols-2">
			{/* Left panel */}
			<div className="hidden lg:flex flex-col justify-between bg-foreground text-background p-12">
				<div>
					<Link
						href="/"
						className="flex items-center gap-2 text-lg font-semibold"
					>
						<KeyRoundIcon className="h-6 w-6" />
						<span>Bookify</span>
					</Link>
				</div>
				<div>
					<h2 className="text-3xl font-semibold leading-tight mb-4">
						Start taking bookings in minutes
					</h2>
					<p className="text-background/70 leading-relaxed">
						Create your account, set up your first event, and share your booking
						page with customers. No credit card required.
					</p>
				</div>
				<div className="flex items-center gap-2 text-xs text-background/50">
					<ShieldCheckIcon className="h-3.5 w-3.5" />
					<span>Free to start. No credit card required.</span>
				</div>
			</div>

			{/* Right panel */}
			<div className="flex items-center justify-center p-6 sm:p-12 bg-gradient-to-b from-background to-muted/30">
				<div className="w-full max-w-md">
					<div className="mb-8">
						<div className="lg:hidden flex items-center gap-2 text-lg font-semibold mb-8">
							<Link href="/" className="flex items-center gap-2">
								<KeyRoundIcon className="h-6 w-6" />
								<span>Bookify</span>
							</Link>
						</div>
						<h1 className="text-2xl font-semibold tracking-tight">
							Create your account
						</h1>
						<p className="text-sm text-muted-foreground mt-2">
							Set up your business and start taking bookings today.
						</p>
					</div>

					<Card className="shadow-lg border-border/50">
						<CardContent className="pt-6 pb-6">
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<label htmlFor="businessName" className="text-sm font-medium">
										Business Name
									</label>
									<Input
										id="businessName"
										value={businessName}
										onChange={(e) => setBusinessName(e.target.value)}
										placeholder="Sunset Kayak Tours"
										required
										className="h-11"
									/>
									{slug && (
										<p className="text-xs text-muted-foreground">
											Your booking page: bookify.app/
											<span className="font-mono">{slug}</span>
										</p>
									)}
								</div>
								<div className="space-y-2">
									<label htmlFor="email" className="text-sm font-medium">
										Email
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
								<div className="space-y-2">
									<label htmlFor="password" className="text-sm font-medium">
										Password
									</label>
									<Input
										id="password"
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="At least 6 characters"
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
								<Button
									type="submit"
									className="w-full h-11"
									disabled={loading}
								>
									{loading ? (
										<>
											<Loader2Icon className="h-4 w-4 animate-spin mr-2" />
											Creating account...
										</>
									) : (
										"Create Account"
									)}
								</Button>
							</form>
						</CardContent>
					</Card>

					<p className="mt-6 text-center text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							href="/admin"
							className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
						>
							Log in
						</Link>
					</p>

					<div className="mt-6 lg:hidden">
						<Separator className="mb-4" />
						<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
							<ShieldCheckIcon className="h-3.5 w-3.5" />
							<span>Free to start. No credit card required.</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
