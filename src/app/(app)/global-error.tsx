"use client";

export default function GlobalError({
	error: _error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en">
			<body>
				<div
					style={{
						display: "flex",
						minHeight: "100vh",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "1rem",
						textAlign: "center",
						fontFamily: "system-ui, sans-serif",
					}}
				>
					<h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>
						Something went wrong
					</h1>
					<p style={{ color: "#6b7280", maxWidth: "28rem" }}>
						An unexpected error occurred. Please try again.
					</p>
					<button
						type="button"
						onClick={reset}
						style={{
							padding: "0.5rem 1rem",
							borderRadius: "0.375rem",
							backgroundColor: "#0f172a",
							color: "#fff",
							border: "none",
							cursor: "pointer",
							fontSize: "0.875rem",
						}}
					>
						Try again
					</button>
				</div>
			</body>
		</html>
	);
}
