export default function ForgotPasswordLink() {
	return (
		<div
			style={{
				textAlign: "center",
				marginTop: "16px",
			}}
		>
			<a
				href="/forgot-password"
				style={{
					fontSize: "14px",
					color: "#6B7280",
					textDecoration: "underline",
				}}
			>
				Forgot your password?
			</a>
		</div>
	);
}
