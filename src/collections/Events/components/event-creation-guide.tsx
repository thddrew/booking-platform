"use client";

import { CalendarIcon, DollarSignIcon, ListIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";

const steps = [
	{ icon: ListIcon, label: "Description", hint: "Add a title, description, and images for your event" },
	{ icon: CalendarIcon, label: "Schedules", hint: "Set when your event happens — one-time or recurring" },
	{ icon: DollarSignIcon, label: "Pricing", hint: "Add ticket types and prices (set to $0 for free events)" },
	{ icon: SettingsIcon, label: "Settings", hint: "Set capacity, enable reminders and waitlist" },
];

export default function EventCreationGuide() {
	const [dismissed, setDismissed] = useState(false);

	if (dismissed) return null;

	return (
		<div
			style={{
				background: "#f0f9ff",
				border: "1px solid #bae6fd",
				borderRadius: "8px",
				padding: "16px",
				marginBottom: "16px",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					marginBottom: "12px",
				}}
			>
				<div>
					<div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>
						Creating your event
					</div>
					<div style={{ fontSize: "13px", color: "#64748b" }}>
						Fill in each tab to set up your event. Click Publish when you're ready to go live.
					</div>
				</div>
				<button
					type="button"
					onClick={() => setDismissed(true)}
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						fontSize: "12px",
						color: "#94a3b8",
						padding: "4px",
					}}
				>
					Dismiss
				</button>
			</div>
			<div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
				{steps.map((step, i) => (
					<div
						key={step.label}
						style={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							padding: "8px 12px",
							background: "white",
							borderRadius: "6px",
							border: "1px solid #e2e8f0",
							fontSize: "12px",
							flex: "1",
							minWidth: "180px",
						}}
					>
						<div
							style={{
								width: "24px",
								height: "24px",
								borderRadius: "50%",
								background: "#0284c7",
								color: "white",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "11px",
								fontWeight: 600,
								flexShrink: 0,
							}}
						>
							{i + 1}
						</div>
						<div>
							<div style={{ fontWeight: 600 }}>{step.label}</div>
							<div style={{ color: "#94a3b8", fontSize: "11px" }}>{step.hint}</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
