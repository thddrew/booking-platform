export default function BookifyLogo() {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<path d="m15.5 7.5 2.3 2.3a1 1 0 0 1 0 1.4l-2.3 2.3" />
				<path d="m6.5 7.5-2.3 2.3a1 1 0 0 0 0 1.4l2.3 2.3" />
				<path d="m14 4-4 16" />
			</svg>
			<span style={{ fontSize: "24px", fontWeight: 700 }}>Bookify</span>
		</div>
	);
}
