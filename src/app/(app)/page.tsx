import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	CalendarIcon,
	CreditCardIcon,
	GlobeIcon,
	UsersIcon,
	ClockIcon,
	BarChart3Icon,
} from "lucide-react";

const features = [
	{
		icon: CalendarIcon,
		title: "Event & Schedule Management",
		description: "Create events with recurring schedules, set capacity limits, and manage availability in real-time.",
	},
	{
		icon: CreditCardIcon,
		title: "Integrated Payments",
		description: "Accept payments via Stripe. Support for multiple currencies and automatic invoicing.",
	},
	{
		icon: UsersIcon,
		title: "Customer Management",
		description: "Track your customers, bookings, and communication all in one place.",
	},
	{
		icon: GlobeIcon,
		title: "Your Own Booking Page",
		description: "Get a branded booking page your customers can use to browse events and book online.",
	},
	{
		icon: ClockIcon,
		title: "Automated Reminders",
		description: "Send booking confirmations, reminders, and updates automatically via email.",
	},
	{
		icon: BarChart3Icon,
		title: "Dashboard & Analytics",
		description: "See your bookings, revenue, and customer activity at a glance.",
	},
];

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Nav */}
			<nav className="border-b">
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<span className="text-xl font-bold">Bookify</span>
					<div className="flex items-center gap-4">
						<Button asChild variant="ghost" size="sm">
							<Link href="/admin">Log In</Link>
						</Button>
						<Button asChild size="sm">
							<Link href="/signup">Get Started</Link>
						</Button>
					</div>
				</div>
			</nav>

			{/* Hero */}
			<section className="container mx-auto px-4 py-24 text-center max-w-3xl">
				<h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
					Online bookings for tours, classes & workshops
				</h1>
				<p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
					The easiest way for small businesses to manage schedules, take bookings, and get paid.
					Set up in minutes, no technical skills required.
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<Button asChild size="lg" className="text-base px-8">
						<Link href="/signup">Start Free</Link>
					</Button>
					<Button asChild variant="outline" size="lg" className="text-base px-8">
						<Link href="/admin">Log In</Link>
					</Button>
				</div>
			</section>

			{/* Features */}
			<section className="container mx-auto px-4 py-16 max-w-5xl">
				<h2 className="text-2xl font-semibold text-center mb-12">
					Everything you need to run your booking business
				</h2>
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{features.map((feature) => (
						<div key={feature.title} className="space-y-3">
							<div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
								<feature.icon className="h-5 w-5 text-primary" />
							</div>
							<h3 className="font-semibold">{feature.title}</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* CTA */}
			<section className="container mx-auto px-4 py-20 text-center">
				<div className="bg-foreground text-background rounded-2xl p-12 max-w-3xl mx-auto">
					<h2 className="text-2xl font-semibold mb-4">
						Ready to take bookings online?
					</h2>
					<p className="text-background/70 mb-8">
						Join hundreds of tour operators, class instructors, and workshop hosts who use Bookify to grow their business.
					</p>
					<Button asChild size="lg" variant="secondary" className="text-base px-8">
						<Link href="/signup">Get Started — It's Free</Link>
					</Button>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t py-8">
				<div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
					<p>© {new Date().getFullYear()} Bookify. All rights reserved.</p>
				</div>
			</footer>
		</div>
	);
}
