import { CalendarCheck, Contact, Radio, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOverviewStats } from "./utils/server/get-overview-stats";

export async function Overview() {
	const stats = await getOverviewStats();

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-sm font-medium">
						<Ticket className="size-4 text-muted-foreground" />
						Bookings
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.bookingsThisMonth}</div>
					<p className="text-xs text-muted-foreground">This month</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-sm font-medium">
						<Contact className="size-4 text-muted-foreground" />
						Customers
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.customersThisMonth}</div>
					<p className="text-xs text-muted-foreground">This month</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-sm font-medium">
						<CalendarCheck className="size-4 text-muted-foreground" />
						Active Events
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.activeEvents}</div>
					<p className="text-xs text-muted-foreground">
						Published &amp; active
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-sm font-medium">
						<Radio className="size-4 text-muted-foreground" />
						Revenue
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-muted-foreground">--</div>
					<p className="text-xs text-muted-foreground">Coming soon</p>
				</CardContent>
			</Card>
		</div>
	);
}
