"use client";

import { Clock, CreditCard, FileText, MapPin, User, Users } from "lucide-react";
import type { CalendarEvent } from "@/components/calendar/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface BookingDetailsDialogProps {
  booking: CalendarEvent | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (booking: CalendarEvent) => void;
  onCancel?: (bookingId: string) => void;
}

export function BookingDetailsDialog({
  booking,
  isOpen,
  onOpenChange,
  onEdit,
  onCancel,
}: BookingDetailsDialogProps) {
  if (!booking) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLessonTypeColor = (type: string) => {
    switch (type) {
      case "beginner":
        return "bg-blue-100 text-blue-800";
      case "intermediate":
        return "bg-orange-100 text-orange-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      case "private":
        return "bg-purple-100 text-purple-800";
      case "group":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalAttendees = booking.attendees.reduce(
    (sum, attendee) => sum + attendee.count,
    0
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] w-[90vw] max-w-[90vw] sm:max-w-[90vw] md:max-w-[90vw] lg:max-w-[90vw] overflow-hidden p-0">
        <div className="flex min-h-[600px] w-full">
          {/* Main Content - Left Side */}
          <div className="flex-1 min-w-[400px] p-6 overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Surfing Lesson Booking Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Lesson Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{booking.title}</h3>
                  <Badge className={getLessonTypeColor(booking.lessonType)}>
                    {booking.lessonType.charAt(0).toUpperCase() +
                      booking.lessonType.slice(1)}{" "}
                    Lesson
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(booking.start)}
                  </div>
                  <div>
                    {formatTime(booking.start)} - {formatTime(booking.end)}
                  </div>
                </div>

                {booking.description && (
                  <p className="text-sm text-muted-foreground">
                    {booking.description}
                  </p>
                )}
              </div>

              <Separator />

              {/* Customer Details */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {booking.customer.name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {booking.customer.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>{" "}
                    {booking.customer.phone}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Attendees */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Attendees ({totalAttendees} total)
                </h4>
                <div className="space-y-2">
                  {booking.attendees.map((attendee, index) => (
                    <div
                      key={attendee.type}
                      className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded"
                    >
                      <span>
                        {attendee.count}x{" "}
                        {attendee.type.charAt(0).toUpperCase() +
                          attendee.type.slice(1)}
                        {attendee.count > 1 ? "s" : ""}
                      </span>
                      <span className="font-medium">
                        ${attendee.price * attendee.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              {(booking.instructor ||
                booking.equipment?.length ||
                booking.notes) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Additional Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      {booking.instructor && (
                        <div>
                          <span className="font-medium">Instructor:</span>{" "}
                          {booking.instructor}
                        </div>
                      )}
                      {booking.equipment && booking.equipment.length > 0 && (
                        <div>
                          <span className="font-medium">Equipment:</span>{" "}
                          {booking.equipment.join(", ")}
                        </div>
                      )}
                      {booking.notes && (
                        <div>
                          <span className="font-medium">Notes:</span>{" "}
                          {booking.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Sidebar - Right Side */}
          <div className="w-80 flex-shrink-0 bg-muted/30 border-l p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Payment Details */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Information
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Status:</span>
                    <Badge className={getStatusColor(booking.payment.status)}>
                      {booking.payment.status.charAt(0).toUpperCase() +
                        booking.payment.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Method:</span>
                    <span className="text-sm font-medium">
                      {booking.payment.method.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Amount:</span>
                    <span className="text-xl font-bold">
                      ${booking.payment.amount}
                    </span>
                  </div>

                  {booking.payment.transactionId && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Transaction ID:
                      </span>
                      <div className="text-xs font-mono bg-background p-2 rounded border break-all">
                        {booking.payment.transactionId}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => onEdit?.(booking)}
                  className="w-full"
                  size="lg"
                >
                  Edit Booking
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onCancel?.(booking.id)}
                  className="w-full"
                  size="lg"
                >
                  Cancel Booking
                </Button>

                {booking.payment.status === "pending" && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    size="lg"
                  >
                    Send Payment Reminder
                  </Button>
                )}

                {booking.payment.status === "paid" && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    size="lg"
                  >
                    Send Confirmation
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
