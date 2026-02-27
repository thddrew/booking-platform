"use client";

import {
	AlertTriangleIcon,
	ClipboardIcon,
	GlobeIcon,
	Loader2Icon,
	MailIcon,
	RefreshCwIcon,
	ShieldCheckIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface DnsRecord {
	type: string;
	name: string;
	value: string;
	ttl?: string;
	priority?: number;
	status?: string;
}

interface DomainState {
	configured: boolean;
	domain: string | null;
	verified: boolean;
	status?: string;
	records: DnsRecord[];
}

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	return (
		<button
			type="button"
			onClick={() => {
				navigator.clipboard.writeText(text);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}}
			className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
			title="Copy to clipboard"
		>
			<ClipboardIcon className="h-3 w-3" />
			{copied ? "Copied!" : "Copy"}
		</button>
	);
}

export function EmailDomainClient() {
	const [tenantId, setTenantId] = useState<string | null>(null);
	const [domain, setDomain] = useState("");
	const [state, setState] = useState<DomainState | null>(null);
	const [loading, setLoading] = useState(true);
	const [adding, setAdding] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchStatus = useCallback(async function fetchStatus(tid: string) {
		setLoading(true);
		try {
			const res = await fetch(`/api/tenants/email-domain?tenantId=${tid}`, {
				credentials: "include",
			});
			const data = await res.json();
			setState(data);
		} catch {
			setError("Failed to load domain status");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const cookie = document.cookie
			.split("; ")
			.find((c) => c.startsWith("payload-tenant="));
		const id = cookie?.split("=")[1];
		if (id) {
			setTenantId(id);
			fetchStatus(id);
		} else {
			setLoading(false);
		}
	}, [fetchStatus]);

	async function handleAddDomain() {
		if (!tenantId || !domain) return;
		setAdding(true);
		setError(null);

		try {
			const res = await fetch("/api/tenants/email-domain", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ tenantId, domain }),
			});
			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Failed to add domain");
			} else {
				setState({
					configured: true,
					domain,
					verified: false,
					records: data.records || [],
				});
			}
		} catch {
			setError("Failed to add domain");
		} finally {
			setAdding(false);
		}
	}

	async function handleVerify() {
		if (!tenantId) return;
		setVerifying(true);
		setError(null);

		try {
			const res = await fetch("/api/tenants/email-domain", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ tenantId }),
			});
			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Verification failed");
			} else {
				setState((prev) =>
					prev
						? {
								...prev,
								verified: data.verified,
								status: data.status,
								records: data.records || prev.records,
							}
						: null,
				);
				if (!data.verified) {
					setError(
						"Domain not yet verified. Please ensure all DNS records are configured and try again in a few minutes.",
					);
				}
			}
		} catch {
			setError("Verification failed");
		} finally {
			setVerifying(false);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!tenantId) {
		return (
			<Card>
				<CardContent className="py-12 text-center">
					<p className="text-muted-foreground">
						Please select a business from the dropdown to configure email
						domain.
					</p>
				</CardContent>
			</Card>
		);
	}

	if (state?.verified) {
		return (
			<div className="max-w-2xl space-y-6">
				<div>
					<h1 className="text-2xl font-semibold">Email Domain</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Your custom email sending domain
					</p>
				</div>

				<Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
					<CardContent className="py-6">
						<div className="flex items-center gap-4">
							<div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
								<ShieldCheckIcon className="h-6 w-6 text-green-600" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<p className="font-semibold">{state.domain}</p>
									<Badge variant="success">Verified</Badge>
								</div>
								<p className="text-sm text-muted-foreground mt-1">
									Booking emails will be sent from{" "}
									<span className="font-mono text-xs">
										bookings@{state.domain}
									</span>
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (state?.configured && state.records.length > 0) {
		return (
			<div className="max-w-3xl space-y-6">
				<div>
					<h1 className="text-2xl font-semibold">Email Domain</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Add these DNS records to verify{" "}
						<span className="font-semibold">{state.domain}</span>
					</p>
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<AlertTriangleIcon className="h-5 w-5 text-amber-500" />
							<CardTitle className="text-base">DNS Records Required</CardTitle>
						</div>
						<p className="text-sm text-muted-foreground">
							Add the following records to your DNS provider (GoDaddy,
							Cloudflare, Namecheap, etc.)
						</p>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{state.records.map((record, i) => (
								<div
									key={`${record.type}-${i}`}
									className="p-4 rounded-lg border bg-muted/30"
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<Badge variant="outline" className="font-mono text-xs">
												{record.type}
											</Badge>
											{record.status === "verified" && (
												<Badge variant="success" className="text-xs">
													Verified
												</Badge>
											)}
											{record.status === "pending" && (
												<Badge variant="warning" className="text-xs">
													Pending
												</Badge>
											)}
										</div>
									</div>
									<div className="space-y-2 text-sm">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground w-16 shrink-0">
												Name
											</span>
											<div className="flex items-center gap-2 min-w-0">
												<code className="text-xs bg-background px-2 py-1 rounded border truncate">
													{record.name}
												</code>
												<CopyButton text={record.name} />
											</div>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground w-16 shrink-0">
												Value
											</span>
											<div className="flex items-center gap-2 min-w-0">
												<code className="text-xs bg-background px-2 py-1 rounded border truncate max-w-md">
													{record.value}
												</code>
												<CopyButton text={record.value} />
											</div>
										</div>
										{record.priority !== undefined && (
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground w-16 shrink-0">
													Priority
												</span>
												<code className="text-xs">{record.priority}</code>
											</div>
										)}
									</div>
								</div>
							))}
						</div>

						<Separator className="my-6" />

						{error && (
							<div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}

						<div className="flex items-center justify-between">
							<p className="text-xs text-muted-foreground">
								DNS changes can take up to 48 hours to propagate
							</p>
							<Button
								onClick={handleVerify}
								disabled={verifying}
								className="gap-2"
							>
								{verifying ? (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								) : (
									<RefreshCwIcon className="h-4 w-4" />
								)}
								{verifying ? "Checking..." : "Verify Domain"}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-2xl space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Email Domain</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Set up a custom domain so booking emails come from your business
					address
				</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
							<MailIcon className="h-5 w-5 text-primary" />
						</div>
						<div>
							<CardTitle className="text-base">Custom Email Domain</CardTitle>
							<p className="text-sm text-muted-foreground">
								Instead of emails coming from bookify.app, they'll come from
								your own domain
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="p-4 rounded-lg bg-muted/30 border">
							<div className="flex items-center gap-3 text-sm">
								<GlobeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
								<div>
									<p className="font-medium">How it works</p>
									<ol className="mt-2 space-y-1 text-muted-foreground text-xs list-decimal list-inside">
										<li>Enter your domain name below</li>
										<li>
											We'll give you DNS records to add to your domain provider
										</li>
										<li>Add the records and click Verify</li>
										<li>
											Once verified, booking emails come from{" "}
											<span className="font-mono">bookings@yourdomain.com</span>
										</li>
									</ol>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<label htmlFor="domain" className="text-sm font-medium">
								Your domain
							</label>
							<div className="flex gap-2">
								<Input
									id="domain"
									value={domain}
									onChange={(e) => setDomain(e.target.value)}
									placeholder="yourbusiness.com"
									className="h-11"
								/>
								<Button
									onClick={handleAddDomain}
									disabled={adding || !domain}
									className="h-11 px-6"
								>
									{adding ? (
										<Loader2Icon className="h-4 w-4 animate-spin" />
									) : (
										"Add Domain"
									)}
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">
								Enter your root domain (e.g. sunsetkayak.com), not a subdomain
							</p>
						</div>

						{error && (
							<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
