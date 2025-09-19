"use client";

import { useState } from "react";
import { BookingDetailsDialog } from "@/components/calendar/booking-details-dialog";
import { Calendar } from "@/components/calendar/calendar";
import type { CalendarEvent } from "@/components/calendar/types";

const sampleBookings: CalendarEvent[] = [
  {
    id: "today-1",
    title: "Morning Beginner Lesson",
    description: "Introduction to surfing basics",
    start: new Date(2025, 8, 6, 6, 0), // 6 AM - 8 AM (completed)
    end: new Date(2025, 8, 6, 8, 0),
    color: "#0891b2",
    lessonType: "beginner",
    customer: {
      name: "Tom Anderson",
      email: "tom.anderson@email.com",
      phone: "+1 (555) 111-2222",
    },
    attendees: [{ type: "adult", count: 1, price: 75 }],
    payment: {
      method: "card",
      status: "paid",
      amount: 75,
      transactionId: "txn_today001",
    },
    instructor: "Mike Rodriguez",
    equipment: ["Foam Surfboard", "Wetsuit", "Leash"],
    notes: "First lesson, nervous but excited",
  },
  {
    id: "today-2",
    title: "Private Intermediate Session",
    description: "Working on pop-up technique",
    start: new Date(2025, 8, 6, 8, 30), // 8:30 AM - 10 AM (completed)
    end: new Date(2025, 8, 6, 10, 0),
    color: "#ea580c",
    lessonType: "intermediate",
    customer: {
      name: "Rachel Green",
      email: "rachel.green@email.com",
      phone: "+1 (555) 333-4444",
    },
    attendees: [{ type: "adult", count: 1, price: 90 }],
    payment: {
      method: "paypal",
      status: "paid",
      amount: 90,
      transactionId: "pp_today002",
    },
    instructor: "Lisa Thompson",
    equipment: ["Intermediate Surfboard", "Wetsuit"],
    notes: "Has surfed 5 times before, wants to improve consistency",
  },
  {
    id: "today-3",
    title: "Family Adventure Lesson",
    description: "Fun family surfing for parents and kids",
    start: new Date(2025, 8, 6, 13, 0),
    end: new Date(2025, 8, 6, 15, 0),
    color: "#059669",
    lessonType: "group",
    customer: {
      name: "Jennifer Walsh",
      email: "jennifer.walsh@email.com",
      phone: "+1 (555) 555-6666",
    },
    attendees: [
      { type: "adult", count: 2, price: 65 },
      { type: "child", count: 3, price: 45 },
    ],
    payment: {
      method: "card",
      status: "paid",
      amount: 265,
      transactionId: "txn_today003",
    },
    instructor: "Carlos Mendez",
    equipment: ["Family Foam Boards", "Kids Wetsuits", "Adult Wetsuits"],
    notes: "Kids ages 6, 9, and 11. Family vacation activity",
  },
  {
    id: "today-4",
    title: "Student Group Lesson",
    description: "University surf club session",
    start: new Date(2025, 8, 6, 15, 30),
    end: new Date(2025, 8, 6, 17, 30),
    color: "#7c3aed",
    lessonType: "group",
    customer: {
      name: "Kevin Park",
      email: "kevin.park@university.edu",
      phone: "+1 (555) 777-8888",
    },
    attendees: [{ type: "student", count: 8, price: 50 }],
    payment: {
      method: "bank_transfer",
      status: "pending",
      amount: 400,
    },
    instructor: "Jake Sullivan",
    equipment: ["Beginner Boards", "Wetsuits"],
    notes: "University surf club, payment processing through student accounts",
  },
  {
    id: "today-5",
    title: "Sunset Advanced Lesson",
    description: "Advanced techniques in golden hour conditions",
    start: new Date(2025, 8, 6, 18, 0),
    end: new Date(2025, 8, 6, 20, 0),
    color: "#dc2626",
    lessonType: "advanced",
    customer: {
      name: "Sofia Rodriguez",
      email: "sofia.rodriguez@email.com",
      phone: "+1 (555) 999-0000",
    },
    attendees: [{ type: "adult", count: 1, price: 110 }],
    payment: {
      method: "card",
      status: "paid",
      amount: 110,
      transactionId: "txn_today005",
    },
    instructor: "Kelly Nakamura",
    equipment: ["Performance Shortboard"],
    notes: "Experienced surfer, wants to work on advanced maneuvers",
  },
  {
    id: "today-6",
    title: "Evening Couples Session",
    description: "Romantic evening surf lesson for couples",
    start: new Date(2025, 8, 6, 20, 30),
    end: new Date(2025, 8, 6, 22, 0),
    color: "#7c3aed",
    lessonType: "beginner",
    customer: {
      name: "Michael & Sarah Davis",
      email: "michael.davis@email.com",
      phone: "+1 (555) 111-3333",
    },
    attendees: [{ type: "adult", count: 2, price: 80 }],
    payment: {
      method: "card",
      status: "pending",
      amount: 160,
    },
    instructor: "Tony Garcia",
    equipment: ["Foam Surfboards", "Wetsuits", "LED Safety Lights"],
    notes: "Anniversary celebration, requested evening session with lights",
  },
  {
    id: "today-7",
    title: "Night Surf Photography",
    description: "Professional surf photography session under lights",
    start: new Date(2025, 8, 6, 22, 30),
    end: new Date(2025, 8, 6, 23, 30),
    color: "#059669",
    lessonType: "advanced",
    customer: {
      name: "James Wilson",
      email: "james.wilson@photography.com",
      phone: "+1 (555) 444-7777",
    },
    attendees: [{ type: "adult", count: 1, price: 150 }],
    payment: {
      method: "bank_transfer",
      status: "paid",
      amount: 150,
      transactionId: "bt_photo001",
    },
    instructor: "Kelly Nakamura",
    equipment: ["Performance Shortboard", "Underwater Lights", "Safety Gear"],
    notes: "Professional photographer, needs action shots for portfolio",
  },
  {
    id: "today-8",
    title: "Late Night Private Session",
    description: "Exclusive private lesson under floodlights",
    start: new Date(2025, 8, 6, 23, 45),
    end: new Date(2025, 9, 7, 0, 45), // Goes into next day
    color: "#ea580c",
    lessonType: "private",
    customer: {
      name: "Alexandra Stone",
      email: "alex.stone@executive.com",
      phone: "+1 (555) 888-9999",
    },
    attendees: [{ type: "adult", count: 1, price: 200 }],
    payment: {
      method: "card",
      status: "paid",
      amount: 200,
      transactionId: "txn_midnight001",
    },
    instructor: "Mike Rodriguez",
    equipment: ["Custom Surfboard", "Premium Wetsuit", "Floodlight Setup"],
    notes:
      "VIP client, requested exclusive late-night session with full lighting",
  },
  {
    id: "1",
    title: "Beginner Surfing Lesson",
    description: "Introduction to surfing basics and water safety",
    start: new Date(2025, 8, 2, 9, 0),
    end: new Date(2025, 8, 2, 11, 0),
    color: "#0891b2",
    lessonType: "beginner",
    customer: {
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1 (555) 123-4567",
    },
    attendees: [{ type: "adult", count: 2, price: 75 }],
    payment: {
      method: "card",
      status: "paid",
      amount: 150,
      transactionId: "txn_1234567890",
    },
    instructor: "Mike Rodriguez",
    equipment: ["Surfboard", "Wetsuit", "Leash"],
    notes: "First time surfing, requested gentle waves",
  },
  {
    id: "2",
    title: "Private Advanced Lesson",
    description: "Advanced techniques and wave reading",
    start: new Date(2025, 8, 5, 14, 0),
    end: new Date(2025, 8, 5, 16, 0),
    color: "#dc2626",
    lessonType: "private",
    customer: {
      name: "Alex Chen",
      email: "alex.chen@email.com",
      phone: "+1 (555) 987-6543",
    },
    attendees: [{ type: "adult", count: 1, price: 120 }],
    payment: {
      method: "paypal",
      status: "paid",
      amount: 120,
      transactionId: "pp_9876543210",
    },
    instructor: "Lisa Thompson",
    equipment: ["Performance Surfboard"],
    notes: "Experienced surfer, wants to work on barrel riding",
  },
  {
    id: "3",
    title: "Family Group Lesson",
    description: "Fun family surfing experience for all ages",
    start: new Date(2025, 8, 8, 10, 0),
    end: new Date(2025, 8, 8, 12, 0),
    color: "#059669",
    lessonType: "group",
    customer: {
      name: "David Martinez",
      email: "david.martinez@email.com",
      phone: "+1 (555) 456-7890",
    },
    attendees: [
      { type: "adult", count: 2, price: 65 },
      { type: "child", count: 2, price: 45 },
    ],
    payment: {
      method: "card",
      status: "paid",
      amount: 220,
      transactionId: "txn_5555666677",
    },
    instructor: "Carlos Mendez",
    equipment: ["Foam Surfboards", "Kids Wetsuits", "Adult Wetsuits"],
    notes: "Kids ages 8 and 10, very excited for first lesson",
  },
  {
    id: "4",
    title: "Intermediate Lesson",
    description: "Building on basic skills, popup practice",
    start: new Date(2025, 8, 12, 8, 0),
    end: new Date(2025, 8, 12, 10, 0),
    color: "#ea580c",
    lessonType: "intermediate",
    customer: {
      name: "Emma Wilson",
      email: "emma.wilson@email.com",
      phone: "+1 (555) 234-5678",
    },
    attendees: [{ type: "student", count: 1, price: 55 }],
    payment: {
      method: "cash",
      status: "pending",
      amount: 55,
    },
    instructor: "Jake Sullivan",
    equipment: ["Intermediate Surfboard", "Wetsuit"],
    notes: "College student, has had 3 previous lessons",
  },
  {
    id: "5",
    title: "Senior Group Session",
    description: "Gentle introduction for senior surfers",
    start: new Date(2025, 8, 15, 11, 0),
    end: new Date(2025, 8, 15, 12, 30),
    color: "#7c3aed",
    lessonType: "group",
    customer: {
      name: "Robert Thompson",
      email: "robert.thompson@email.com",
      phone: "+1 (555) 345-6789",
    },
    attendees: [{ type: "senior", count: 4, price: 50 }],
    payment: {
      method: "bank_transfer",
      status: "paid",
      amount: 200,
      transactionId: "bt_1122334455",
    },
    instructor: "Maria Santos",
    equipment: ["Longboards", "Full Wetsuits"],
    notes: "Active seniors group, ages 65-72",
  },
  {
    id: "6",
    title: "Beginner Couple Lesson",
    description: "Romantic surfing lesson for two",
    start: new Date(2025, 8, 18, 16, 0),
    end: new Date(2025, 8, 18, 18, 0),
    color: "#0891b2",
    lessonType: "beginner",
    customer: {
      name: "Jessica Brown",
      email: "jessica.brown@email.com",
      phone: "+1 (555) 567-8901",
    },
    attendees: [{ type: "adult", count: 2, price: 75 }],
    payment: {
      method: "card",
      status: "paid",
      amount: 150,
      transactionId: "txn_9988776655",
    },
    instructor: "Tony Garcia",
    equipment: ["Foam Surfboards", "Wetsuits"],
    notes: "Anniversary gift, both complete beginners",
  },
  {
    id: "7",
    title: "Advanced Wave Reading",
    description: "Master advanced wave selection and positioning",
    start: new Date(2025, 8, 22, 7, 0),
    end: new Date(2025, 8, 22, 9, 0),
    color: "#dc2626",
    lessonType: "advanced",
    customer: {
      name: "Marcus Johnson",
      email: "marcus.johnson@email.com",
      phone: "+1 (555) 678-9012",
    },
    attendees: [{ type: "adult", count: 1, price: 95 }],
    payment: {
      method: "card",
      status: "failed",
      amount: 95,
    },
    instructor: "Kelly Nakamura",
    equipment: ["Performance Shortboard"],
    notes: "Competitive surfer, payment needs to be retried",
  },
  {
    id: "8",
    title: "Kids Surf Camp",
    description: "Half-day surf camp for children",
    start: new Date(2025, 8, 25, 9, 0),
    end: new Date(2025, 8, 25, 13, 0),
    color: "#059669",
    lessonType: "group",
    customer: {
      name: "Linda Davis",
      email: "linda.davis@email.com",
      phone: "+1 (555) 789-0123",
    },
    attendees: [{ type: "child", count: 6, price: 60 }],
    payment: {
      method: "card",
      status: "paid",
      amount: 360,
      transactionId: "txn_4433221100",
    },
    instructor: "Sam Mitchell",
    equipment: ["Kids Foam Boards", "Kids Wetsuits", "Safety Vests"],
    notes: "Summer camp group, ages 7-12, all swimmers",
  },
];

export default function HomePage() {
  const [bookings, setBookings] = useState<CalendarEvent[]>(sampleBookings);
  const [selectedBooking, setSelectedBooking] = useState<CalendarEvent | null>(
    null
  );
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  const handleBookingClick = (booking: CalendarEvent) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const handleBookingCreate = (booking: CalendarEvent) => {
    setBookings((prev) => [...prev, booking]);
  };

  const handleBookingUpdate = (updatedBooking: CalendarEvent) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === updatedBooking.id ? updatedBooking : booking
      )
    );
    setShowBookingDetails(false);
  };

  const handleBookingCancel = (bookingId: string) => {
    setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
    setShowBookingDetails(false);
  };

  return (
    <div className="p-4">
      <Calendar
        initialEvents={bookings}
        onEventCreate={handleBookingCreate}
        onEventUpdate={handleBookingUpdate}
        onEventDelete={handleBookingCancel}
        onEventClick={handleBookingClick}
        onViewChange={(view) => console.log("View changed:", view)}
        onDateChange={(date) => console.log("Date changed:", date)}
        className="flex-1"
      />

      <BookingDetailsDialog
        isOpen={showBookingDetails}
        onOpenChange={setShowBookingDetails}
        booking={selectedBooking}
        onEdit={(booking) => {
          // For now, just log - could open edit dialog
          console.log("Edit booking:", booking);
        }}
        onCancel={handleBookingCancel}
      />
    </div>
  );
}
