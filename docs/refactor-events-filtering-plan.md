# Events Filtering Refactor Plan

## Overview
Refactor event filtering to use server-side filtering with `nuqs` for type-safe search params handling. Simplify route handlers and centralize event logic in RenderPage.

---

## 1. Create Shared Search Params Descriptor

**New file:** `src/app/components/RenderPage/EventsListPageFilters/search-params.ts`

**Purpose:** Centralize search param definitions for server and client use

**Implementation:**
```typescript
import { parseAsInteger, parseAsString, createSearchParamsCache } from 'nuqs/server'

// Shared parsers for both server and client
export const eventsListSearchParams = {
  search: parseAsString.withDefault(''),
  people: parseAsInteger,
  dateRange: parseAsString,
}

// Server-side cache for accessing search params in RSC
export const eventsListSearchParamsCache = createSearchParamsCache(eventsListSearchParams)

// Export parsers for client-side use (in EventsListPageFilters)
export { eventsListSearchParams as eventsListSearchParamsParsers }
```

---

## 2. Route Handlers Simplification

**Files to modify:**
- `src/app/(app)/tenant-slugs/[tenant]/[...slug]/page.tsx`
- `src/app/(app)/tenant-domains/[tenant]/[...slug]/page.tsx`

**Changes:**
- Remove all event-specific logic (isEventsList, isEventDetail checks, event queries)
- Keep tenant lookup with public access checks
- Query Pages collection for regular pages only
- Pass to RenderPage: `pageData`, `slug`, `tenantId`, `tenantSlug`, `searchParams` (Next.js 15+ Promise)
- No event data fetching

**Simplified structure:**
```typescript
// Pseudo-code
1. Get tenant (with public access handling)
2. Query Pages collection for the slug
3. Pass to RenderPage: {
     pageData,
     slug,
     tenantId,
     tenantSlug,
     searchParams  // Pass through the Promise
   }
```

---

## 3. RenderPage Enhancement

**File:** `src/app/components/RenderPage/index.tsx`

**Changes:**
- Accept `searchParams: Promise<SearchParams>` prop
- Parse `slug` to determine route type:
  - `"events"` → EventsListPage
  - `"events/[eventSlug]"` → EventDetailPage
  - Otherwise → Regular page render
- For events routes:
  - Handle tenant public access check (if needed, can be done in child components)
  - Pass `searchParams` to EventsListPage/EventDetailPage
  - For EventDetailPage: fetch event data by slug
  - For EventsListPage: let it handle data fetching and filtering

**New responsibilities:**
- Determine which component to render based on slug
- Route `searchParams` to appropriate child components
- Handle event data fetching for detail pages

---

## 4. Server-Side Filtering in EventsListPage

**File:** `src/app/components/RenderPage/EventsListPage.tsx`

**Changes:**
- Accept `searchParams: Promise<SearchParams>` prop
- Use `eventsListSearchParamsCache.parse(searchParams)` to get filter values
- Fetch all events (as before)
- Apply server-side filtering using parsed values:
  - **Search**: filter by title (case-insensitive)
  - **People**: filter by `maxQuantity >= peopleValue`
  - **Date range**: use new helper `eventHasInstancesInRange()` to check if event has instances in range
- Pass filtered events array to `EventsListPageFilters` client component
- Filter values are already in URL (managed by client component), server reads them

**Filter flow:**
```
User changes filter (client)
  → URL updates via nuqs
  → Page re-renders
  → EventsListPage (server) reads searchParams via cache
  → Filters events server-side
  → Passes filtered events to EventsListPageFilters (client)
  → Client displays results
```

---

## 5. New Server-Side Helper Function

**New file:** `src/app/components/RenderPage/EventsListPageFilters/utils/event-has-instances-in-range.ts`

**Purpose:**
- Check if an event has any schedule instances that overlap with a date range
- Handle both recurring (rrule) and single-instance schedules

**Implementation:**
- For non-recurring schedules: check if single instance overlaps range
- For recurring schedules:
  - Use `RRuleTemporal` to parse rrule string
  - Use `rule.between(startDate, endDate, true)` to get occurrences
  - Calculate end time for each occurrence (start + duration using `getEventDuration`)
  - Check if any occurrence's time range (start to end) overlaps the filter date range
- Return boolean

**Function signature:**
```typescript
export function eventHasInstancesInRange(
  event: Event,
  startDate: Date,
  endDate: Date
): boolean
```

**Notes:**
- Uses `getEventDuration()` from `@/collections/Bookings/utils/get-event-duration`
- Uses `RRuleTemporal` from `rrule-temporal`
- Handles edge cases (no schedules, inactive schedules, etc.)

---

## 6. EventsListPageFilters Client Component Simplification

**File:** `src/app/components/RenderPage/EventsListPageFilters/index.tsx`

**Changes:**
- Import `eventsListSearchParamsParsers` from `search-params.ts`
- Remove client-side filtering logic from `useMemo`
- Keep filter UI management (`SearchBar`, `EventCard`, `EmptyState`)
- Keep URL state management with `useQueryStates` (using shared parsers)
- Receive pre-filtered `events` array from server (no filtering logic)
- The component is now purely presentational + URL state management

**New flow:**
```typescript
// Client component receives pre-filtered events
export function EventsListPageFilters({ events, tenantSlug }: Props) {
  // Just manage URL state and UI
  const [{ search, people, dateRange }, setFilters] = useQueryStates(
    eventsListSearchParamsParsers
  )

  // No filtering logic - just display what server sent
  return (
    <SearchBar ... />
    <EventGrid events={events} />  // Already filtered
  )
}
```

---

## 7. EventDetailPage Adjustments

**File:** `src/app/components/RenderPage/EventDetailPage.tsx`

**Changes:**
- Accept `searchParams` prop for timeslot preselection (if needed, already supports this via URL params)
- Handle tenant public access check if needed (or can be done in RenderPage)
- No major changes needed

---

## 8. File Structure Summary

```
src/app/(app)/
  tenant-slugs/[tenant]/[...slug]/page.tsx    (simplified - only Pages query)
  tenant-domains/[tenant]/[...slug]/page.tsx  (simplified - only Pages query)

src/app/components/RenderPage/
  index.tsx                                    (enhanced - slug parsing, routing)
  EventsListPage.tsx                           (enhanced - server-side filtering with nuqs cache)
  EventDetailPage.tsx                          (minor adjustments)
  EventsListPageFilters/
    search-params.ts                           (NEW - shared search params descriptor)
    index.tsx                                  (simplified - no client filtering)
    utils/
      event-has-instances-in-range.ts          (NEW - server-side date range check)
```

---

## 9. Data Flow Diagram (Updated)

```
Route Handler (simplified)
  ↓
  Query Pages collection
  ↓
  Pass searchParams Promise
  ↓
RenderPage
  ↓
  Parse slug
  ├─ "events" → EventsListPage
  │    ↓
  │    eventsListSearchParamsCache.parse(searchParams)
  │    ↓
  │    Get filter values: { search, people, dateRange }
  │    ↓
  │    Fetch all events
  │    ↓
  │    Apply server-side filters:
  │      - Search (title)
  │      - People (maxQuantity)
  │      - Date range (eventHasInstancesInRange)
  │    ↓
  │    Pass filtered events to EventsListPageFilters (client)
  │    ↓
  │    Client displays (manages URL state via useQueryStates)
  │
  ├─ "events/[slug]" → EventDetailPage
  │    ↓
  │    Fetch event by slug
  │    ↓
  │    Render with searchParams for preselection
  │
  └─ Other → Regular page render
```

---

## 10. Benefits of Using nuqs Server-Side

✅ **Type safety**: Shared parsers ensure server and client stay in sync
✅ **Simpler**: No manual searchParams parsing
✅ **Single source of truth**: Search params defined once
✅ **Better DX**: Cache works across server components in the tree
✅ **Performance**: Server-side filtering reduces client-side work

---

## 11. Implementation Order

1. Create `search-params.ts` with shared parsers and cache
2. Create `event-has-instances-in-range.ts` helper
3. Update `EventsListPage.tsx` for server-side filtering using cache
4. Simplify `EventsListPageFilters/index.tsx` (remove client filtering, use shared parsers)
5. Enhance `RenderPage/index.tsx` (slug parsing, routing, pass searchParams)
6. Simplify both route handlers (remove event logic, pass searchParams)
7. Test all routes and filters

---

## Notes

- This plan uses `nuqs` server-side features for cleaner, type-safe search param handling
- Server-side filtering ensures better performance and SEO-friendly URLs
- All event logic is centralized in RenderPage and EventsListPage
- Route handlers are simplified to only handle basic routing and Pages collection queries
