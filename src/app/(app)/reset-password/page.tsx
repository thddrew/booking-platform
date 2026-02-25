"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Card className="w-full max-w-md mx-4">
					<CardContent className="pt-6">
						<p className="text-center text-muted-foreground">
							Invalid reset link.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (success) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Card className="w-full max-w-md mx-4">
					<CardHeader>
						<CardTitle className="text-center">Password Reset</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-center text-muted-foreground">
							Your password has been reset successfully.
						</p>
						<Button className="w-full" onClick={() => router.push("/admin")}>
							Go to Login
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
		<div className="min-h-screen flex items-center justify-center bg-background">
			<Card className="w-full max-w-md mx-4">
				<CardHeader>
					<CardTitle className="text-center">Reset Your Password</CardTitle>
				</CardHeader>
				<CardContent>
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
							/>
						</div>
						{error && (
							<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Resetting..." : "Reset Password"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
