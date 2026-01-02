# Plan: Showing Available Hours on Event Details Page

## Current State

### Existing Functions

1. **`expandSchedule`** (`src/collections/Bookings/utils/expand-schedule.ts`)
   - Expands RRule schedules into individual occurrences
   - Takes `viewStart`, `viewEnd`, `rruleString`, `eventDuration`, `eventMaxQuantity`
   - Returns `ScheduleInstance[]` with `dtstart`, `dtend`, `maxQuantity`
   - **Does NOT check bookings/availability** - just generates all possible slots

2. **`generateTimeslotsFromEvent`** (`src/components/dashboard/available-events-today.tsx`)
   - Similar to `expandSchedule` but simpler
   - Generates `Temporal.ZonedDateTime[]` for a single day
   - **Does NOT check bookings/availability** - just generates time slots

3. **`getEventDuration`** (`src/collections/Bookings/utils/get-event-duration.ts`)
   - Calculates event duration from `dtstart` and `dtend`
   - Returns `Temporal.Duration`

### What's Missing

- **No function to check actual availability** (bookings vs maxQuantity)
- Need to query existing bookings for each schedule instance
- Need to calculate remaining capacity per time slot

## Proposed Solution

### Option 1: Server-Side Function (Recommended)

Create a new server-side utility function that:
1. Takes an `Event` and a date range (e.g., next 2 weeks)
2. Expands all schedules using `expandSchedule`
3. For each schedule instance, queries existing bookings
4. Calculates remaining capacity (maxQuantity - bookedQuantity)
5. Returns available time slots with availability status

**Location**: `src/app/components/RenderPage/utils/get-available-timeslots.ts`

**Function Signature**:
```typescript
async function getAvailableTimeslots({
  event,
  startDate,
  endDate,
  payload,
}: {
  event: Event;
  startDate: Date;
  endDate: Date;
  payload: Payload;
}): Promise<Array<{
  dtstart: Date;
  dtend: Date;
  scheduleId: string;
  scheduleName?: string;
  availableSpots: number;
  maxQuantity: number;
  isAvailable: boolean; // availableSpots > 0
}>>
```

**Implementation Steps**:
1. Expand schedules using `expandSchedule`
2. For each instance, query bookings that overlap:
   - `bookings.where.eventRelation = event.id`
   - `bookings.where.dtstart >= instance.dtstart`
   - `bookings.where.dtstart < instance.dtend`
   - OR check if booking's selectedScheduleInstanceData matches
3. Sum up `totalQuantity` from booking's `pricingSnapshot`
4. Calculate `availableSpots = maxQuantity - bookedQuantity`
5. Filter out past dates
6. Sort by date/time

### Option 2: Client-Side with API Endpoint

Create an API endpoint that returns available timeslots, then use it client-side.

**Pros**: Can be cached, reusable
**Cons**: More complex, requires API route

### Display in UI

**In EventDetailPage booking panel**:

1. **Date Picker/Selector** (if multiple dates)
   - Show a calendar or date list
   - Allow user to select a date
   - Default to "today" or "next available"

2. **Available Time Slots List**
   - Show list of available times for selected date
   - Format: "2:30 PM" or "2:30 PM - 4:00 PM"
   - Show availability: "5 spots available" or "Fully booked"
   - Make each slot clickable to select it
   - Disable/ghost out fully booked slots

3. **Selected Time Display**
   - Once user selects a time, show it prominently
   - Show: Date, Time, Available spots

**UI Layout** (in booking panel):
```
┌─────────────────────────┐
│ [Price Display]         │
├─────────────────────────┤
│ Select Date             │
│ [Date Picker/Selector]  │
├─────────────────────────┤
│ Available Times         │
│ • 2:30 PM (5 spots)     │
│ • 3:00 PM (3 spots)     │
│ • 4:30 PM (Fully booked)│
├─────────────────────────┤
│ [Reserve Button]        │
└─────────────────────────┘
```

### Considerations

1. **Performance**:
   - Limit date range (e.g., next 2-4 weeks)
   - Could cache results for a few minutes
   - Consider pagination for events with many slots

2. **Single vs Recurring Events**:
   - Handle events with `rrulestring` (recurring)
   - Handle events with single `dtstart/dtend` (one-time)

3. **Timezone**:
   - Ensure consistent timezone handling
   - Display in user's local timezone if possible

4. **Booking States**:
   - Only count bookings with certain statuses (e.g., exclude cancelled)
   - Check `paymentStatus` if relevant

5. **Edge Cases**:
   - What if event has no schedules?
   - What if all slots are booked?
   - What if event is in the past?

## Implementation Order

1. ✅ Update booking panel language (Check-in/Check-out → Date/Time)
2. Create `getAvailableTimeslots` utility function
3. Update EventDetailPage to fetch available timeslots
4. Add date selector UI
5. Add time slots list UI
6. Handle time slot selection
7. Update Reserve button state/linking

## Questions to Answer

1. Should we show all future dates or just next N weeks?
2. How should we handle timezone display?
3. Should we group by schedule name or just show all times?
4. What happens when user clicks "Reserve" - link to booking form?
5. Should availability update in real-time or is cached OK?
