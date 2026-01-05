import type React from "react";

import "./globals.css";
import NuqsAdapter from "@/components/providers/nuqs";
import { ThemeProvider } from "@/components/theme-provider";

const baseClass = "multi-tenant";

export const metadata = {
	description: "Multi-tenant event booking platform",
	title: "Event Booking Platform",
};

// eslint-disable-next-line no-restricted-exports
export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html suppressHydrationWarning className={baseClass} lang="en">
			<body>
				<NuqsAdapter>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						{children}
					</ThemeProvider>
				</NuqsAdapter>
			</body>
		</html>
	);
}
