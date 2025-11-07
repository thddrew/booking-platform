import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@payloadcms/ui";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo } from "react";
import {
	Controller,
	type ControllerRenderProps,
	useForm,
} from "react-hook-form";
import z from "zod";
import { expandSchedule } from "@/collections/Bookings/utils/expand-schedule";
import { getEventDuration } from "@/collections/Bookings/utils/get-event-duration";
import { sendBookingEmail } from "@/collections/Bookings/utils/send-booking-email";
import {
	BOOKING_CANCELLED,
	BOOKING_CONFIRMATION,
	BOOKING_UPDATED,
} from "@/collections/Emails/utils/email-types";
import { usePayloadMutation, usePayloadQuery } from "@/hooks/use-payload-query";
import { payloadSDK } from "@/lib/payload/payload-sdk";
import { formatDateRange } from "../calendar/utils/format-date";
import { Button } from "../ui/button";
import { Field, FieldContent, FieldError, FieldLabel } from "../ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

const formSchema = z.object({
	customerId: z.string(),
	eventId: z.string(),
	dtstart: z.string(),
	dtend: z.string(),
	scheduleId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const CustomerSelect = ({
	field,
}: {
	field: ControllerRenderProps<FormData, "customerId">;
}) => {
	const { data: customers, isFetched } = usePayloadQuery({
		queryKey: ["customers"],
		queryFn: async () => {
			const customers = await payloadSDK.find({
				collection: "customers",
				limit: 100,
			});

			return customers.docs;
		},
	});

	useEffect(() => {
		if (isFetched && customers?.[0] && !field.value) {
			field.onChange(customers[0].id);
		}
	}, [isFetched, customers, field.value, field.onChange]);

	return (
		<Select value={field.value} onValueChange={field.onChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select a customer" />
			</SelectTrigger>
			<SelectContent>
				{customers?.map((customer) => (
					<SelectItem key={customer.id} value={customer.id}>
						{customer.email}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

const EventSelect = ({
	field,
}: {
	field: ControllerRenderProps<FormData, "eventId">;
}) => {
	const { data: events, isFetched } = usePayloadQuery({
		queryKey: ["events"],
		queryFn: async () => {
			const events = await payloadSDK.find({
				collection: "events",
				limit: 100,
			});

			return events.docs;
		},
	});

	useEffect(() => {
		if (isFetched && events?.[0] && !field.value) {
			field.onChange(events[0].id);
		}
	}, [isFetched, events, field.value, field.onChange]);

	return (
		<Select value={field.value} onValueChange={field.onChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select an event" />
			</SelectTrigger>
			<SelectContent>
				{events?.map((event) => (
					<SelectItem key={event.id} value={event.id}>
						{event.title} {event.isActive ? "" : "(Inactive)"}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

const ScheduleSelect = ({
	field,
	eventId,
}: {
	field: ControllerRenderProps<FormData, "scheduleId">;
	eventId?: string;
}) => {
	const { data: event, isFetched } = usePayloadQuery({
		queryKey: ["events", eventId],
		queryFn: async () => {
			if (!eventId) return null;

			const event = await payloadSDK.findByID({
				collection: "events",
				id: eventId,
			});

			return event;
		},
		enabled: !!eventId,
	});

	const schedules = event?.schedules?.schedule || [];

	useEffect(() => {
		const firstSchedule = event?.schedules?.schedule?.[0];
		if (isFetched && firstSchedule && !field.value) {
			field.onChange(firstSchedule.id);
		}
	}, [isFetched, event, field.value, field.onChange]);

	return (
		<Select
			value={field.value}
			onValueChange={field.onChange}
			disabled={!eventId}
		>
			<SelectTrigger>
				<SelectValue placeholder="Select a schedule" />
			</SelectTrigger>
			<SelectContent>
				{schedules.map((schedule) => {
					if (!schedule.id) return null;

					return (
						<SelectItem key={schedule.id} value={schedule.id}>
							{schedule.scheduleName || "Unnamed"}{" "}
							{schedule.isActive ? "" : "(Inactive)"}
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
};

const ScheduleDateSelect = ({
	field,
	eventId,
	scheduleId,
	onDateSelect,
}: {
	field: ControllerRenderProps<FormData, "dtstart">;
	eventId?: string;
	scheduleId?: string;
	onDateSelect: (dtstart: string, dtend: string) => void;
}) => {
	const { data: event } = usePayloadQuery({
		queryKey: ["events", eventId],
		queryFn: async () => {
			if (!eventId) return null;

			const event = await payloadSDK.findByID({
				collection: "events",
				id: eventId,
			});

			return event;
		},
		enabled: !!eventId && !!scheduleId,
	});

	const schedules = event?.schedules?.schedule || [];
	const selectedSchedule = schedules.find((s) => s.id === scheduleId);

	const scheduleInstances = useMemo(() => {
		if (selectedSchedule) {
			if (!selectedSchedule.rrulestring) {
				// Single instance schedule
				const instance = {
					dtstart: new Date(selectedSchedule.dtstart),
					dtend: new Date(selectedSchedule.dtend),
				};

				return [instance];
			} else {
				// Recurring schedule - expand it
				const viewStart = new Date();
				const viewEnd = new Date();
				viewEnd.setFullYear(viewEnd.getFullYear() + 1); // 1 year in the future

				const expandedInstances = expandSchedule({
					rruleString: selectedSchedule.rrulestring,
					eventMaxQuantity: event?.maxQuantity || 0,
					eventDuration: getEventDuration(
						selectedSchedule.dtstart,
						selectedSchedule.dtend,
					),
					scheduleId: selectedSchedule.id || "",
					eventName: event?.title,
					viewStart,
					viewEnd,
					config: {
						includePastDates: false,
						generateId: () => "",
					},
				});

				return expandedInstances.slice(0, 10).map((instance) => ({
					dtstart: new Date(instance.dtstart),
					dtend: new Date(instance.dtend),
				}));
			}
		}
	}, [selectedSchedule, event]);

	useEffect(() => {
		if (!field.value && scheduleInstances?.[0]) {
			onDateSelect(
				scheduleInstances[0].dtstart.toISOString(),
				scheduleInstances[0].dtend.toISOString(),
			);
		}
	}, [scheduleInstances, field.value, onDateSelect]);

	return (
		<Select
			value={field.value}
			onValueChange={(value: string) => {
				const instance = scheduleInstances?.find(
					(inst) => inst.dtstart.toISOString() === value,
				);

				if (instance) {
					onDateSelect(
						instance.dtstart.toISOString(),
						instance.dtend.toISOString(),
					);
				}
			}}
			disabled={!scheduleId}
		>
			<SelectTrigger>
				<SelectValue placeholder="Select a date" />
			</SelectTrigger>
			<SelectContent>
				{scheduleInstances?.map((instance) => {
					const key = instance.dtstart.toISOString();
					return (
						<SelectItem key={key} value={key}>
							{formatDateRange(instance.dtstart, instance.dtend)}
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
};

export const CreateBookingTools = () => {
	const router = useRouter();
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			customerId: "",
			eventId: "",
			scheduleId: "",
			dtstart: "",
			dtend: "",
		},
	});

	const id = useId();
	const eventId = form.watch("eventId");
	const scheduleId = form.watch("scheduleId");

	const { mutate: createBooking, isPending } = usePayloadMutation(
		async (data: FormData) => {
			if (!data.eventId || !data.dtstart || !data.dtend) {
				throw new Error("Event ID, start date, and end date are required");
			}

			const booking = await payloadSDK.create({
				collection: "bookings",
				data: {
					customerRelation: data.customerId,
					eventRelation: data.eventId,
					dtstart: data.dtstart,
					dtend: data.dtend,
				},
			});

			return booking;
		},
		{
			onMutate: () => {
				toast.loading("Creating booking...", {
					id: "create-booking",
				});
			},
			onSuccess: () => {
				router.refresh();
				toast.success("Booking created successfully", {
					id: "create-booking",
				});
			},
			onError: (err: Error) => {
				toast.error("Failed to create booking", {
					description: err.message,
					id: "create-booking",
				});
			},
		},
	);

	return (
		<form
			id={id}
			onSubmit={form.handleSubmit((data) => createBooking(data))}
			className="flex flex-col gap-4"
		>
			<Controller
				disabled={isPending}
				control={form.control}
				name="customerId"
				render={({ field, fieldState }) => (
					<Field orientation="responsive" data-invalid={fieldState.invalid}>
						<FieldContent>
							<FieldLabel htmlFor="customerId">Customer</FieldLabel>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</FieldContent>
						<CustomerSelect field={field} />
					</Field>
				)}
			/>

			<Controller
				disabled={isPending}
				control={form.control}
				name="eventId"
				render={({ field, fieldState }) => (
					<Field orientation="responsive" data-invalid={fieldState.invalid}>
						<FieldContent>
							<FieldLabel htmlFor="eventId">Event</FieldLabel>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</FieldContent>
						<EventSelect field={field} />
					</Field>
				)}
			/>

			{eventId && (
				<Controller
					disabled={isPending}
					control={form.control}
					name="scheduleId"
					render={({ field, fieldState }) => (
						<Field orientation="responsive" data-invalid={fieldState.invalid}>
							<FieldContent>
								<FieldLabel htmlFor="scheduleId">Schedule</FieldLabel>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</FieldContent>
							<ScheduleSelect field={field} eventId={eventId} />
						</Field>
					)}
				/>
			)}

			{scheduleId && eventId && (
				<Controller
					disabled={isPending}
					control={form.control}
					name="dtstart"
					render={({ field, fieldState }) => (
						<Field orientation="responsive" data-invalid={fieldState.invalid}>
							<FieldContent>
								<FieldLabel htmlFor="dtstart">Date & Time</FieldLabel>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</FieldContent>
							<ScheduleDateSelect
								field={field}
								eventId={eventId}
								scheduleId={scheduleId}
								onDateSelect={(dtstart, dtend) => {
									form.setValue("dtstart", dtstart);
									form.setValue("dtend", dtend);
								}}
							/>
						</Field>
					)}
				/>
			)}

			<div className="flex justify-end">
				<Button type="submit" disabled={isPending || !form.formState.isValid}>
					{isPending ? (
						<Loader2Icon className="animate-spin" size={16} />
					) : (
						"Create Booking"
					)}
				</Button>
			</div>
		</form>
	);
};

export const EditBookingTools = ({
	bookingId,
}: {
	bookingId?: string | null;
}) => {
	const { data: booking } = usePayloadQuery({
		queryKey: ["bookings", bookingId],
		queryFn: async () => {
			const booking = await payloadSDK.findByID({
				collection: "bookings",
				id: bookingId as string,
			});

			return booking;
		},
		enabled: !!bookingId,
	});

	return (
		<div className="flex flex-col gap-2">
			<Button
				onClick={async () => {
					if (booking) {
						toast.info("Triggering confirmation workflow...");
						await sendBookingEmail({
							booking,
							emailType: BOOKING_CONFIRMATION,
						});
						toast.info("Confirmation email triggered");
					}
				}}
			>
				Send confirmation email
			</Button>

			<Button
				onClick={async () => {
					if (booking) {
						toast.info("Triggering cancellation workflow...");
						await sendBookingEmail({
							booking,
							emailType: BOOKING_CANCELLED,
						});
						toast.info("Cancellation email triggered");
					}
				}}
			>
				Send cancellation email
			</Button>

			<Button
				onClick={async () => {
					if (booking) {
						toast.info("Triggering update workflow...");
						await sendBookingEmail({
							booking,
							emailType: BOOKING_UPDATED,
						});
						toast.info("Update email triggered");
					}
				}}
			>
				Send update email
			</Button>
		</div>
	);
};
