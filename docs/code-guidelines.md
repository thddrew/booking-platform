# Code Guidelines

This document outlines the coding patterns and best practices established in the booking platform codebase.

## Table of Contents

1. [Route Handlers](#route-handlers)
2. [Search Params with nuqs](#search-params-with-nuqs)
3. [Server-Side Filtering](#server-side-filtering)
4. [Component Structure](#component-structure)
5. [Tenant Access Control](#tenant-access-control)
6. [Event Routing](#event-routing)
7. [Data Fetching Patterns](#data-fetching-patterns)

---

## Route Handlers

### Structure

Route handlers in `src/app/(app)/tenant-slugs/[tenant]/[...slug]/page.tsx` and `src/app/(app)/tenant-domains/[tenant]/[...slug]/page.tsx` follow this pattern:

1. **Extract and validate params**
2. **Authenticate user**
3. **Determine route type** (events vs regular pages)
4. **Handle tenant access** (with public access fallback for events)
5. **Route to appropriate handler** (events routes skip Pages query)

### Example Structure

```typescript
export default async function Page({
  params: paramsPromise,
  searchParams,
}: {
  params: Promise<{ slug?: string[]; tenant: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const params = await paramsPromise;
  const headers = await getHeaders();
  const payload = await getPayload({ config: configPromise });
  const { user } = await payload.auth({ headers });

  const slugString = slug?.join("/") || "";
  const isEventsRoute = slugString === "events" || slugString.startsWith("events/");

  // 1. Try normal tenant access
  // 2. Fallback to public access for events routes
  // 3. Redirect to login if no access

  // For events routes: parse cache and skip Pages query
  if (isEventsRoute) {
    await eventsListSearchParamsCache.parse(searchParams);
    return <RenderPage data={null} slug={slugString} tenantId={tenant.id} tenantSlug={params.tenant} />;
  }

  // For regular pages: query Pages collection
  const pageQuery = await payload.find({ collection: "pages", ... });
  return <RenderPage data={pageData} slug={slugString} tenantId={tenant.id} tenantSlug={params.tenant} />;
}
```

### Key Principles

- **Always await params/headers**: Next.js 15+ uses async params
- **Determine route type early**: Check `isEventsRoute` before data fetching
- **Skip Pages query for events**: Events are not stored in Pages collection
- **Parse search params cache in route handler**: For events routes that need filtering

---

## Search Params with nuqs

### Pattern: Server-Side Cache

We use `createSearchParamsCache` from `nuqs/server` to share search params across server components without prop drilling.

### Implementation Steps

1. **Define search params descriptor** (`search-params.ts`):

```typescript
import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const eventsListSearchParams = {
  search: parseAsString.withDefault(""),
  people: parseAsInteger,
  startDate: parseAsString.withOptions({
    parse: parseDate,
    serialize: serializeDate,
  }),
  endDate: parseAsString.withOptions({
    parse: parseDate,
    serialize: serializeDate,
  }),
};

export const eventsListSearchParamsCache = createSearchParamsCache(eventsListSearchParams);
export { eventsListSearchParams as eventsListSearchParamsParsers };
```

2. **Parse cache in route handler** (only for routes that need it):

```typescript
if (isEventsRoute) {
  await eventsListSearchParamsCache.parse(searchParams);
  return <RenderPage ... />;
}
```

3. **Access cache in child server components**:

```typescript
// In EventsListPage or any nested server component
const { search, people, startDate, endDate } = eventsListSearchParamsCache.all();

// Or access individual values
const search = eventsListSearchParamsCache.get('search');
```

4. **Use parsers in client components**:

```typescript
'use client'
import { useQueryStates } from "nuqs";
import { eventsListSearchParamsParsers } from "./search-params";

const [{ search, people }, setFilters] = useQueryStates(eventsListSearchParamsParsers);
```

### Key Principles

- ✅ **Parse once in route handler**: Cache is scoped to the request
- ✅ **Access anywhere in server components**: No prop drilling needed
- ✅ **Share parsers with client**: Use the same descriptor for type safety
- ❌ **Don't pass searchParams as props**: Use cache instead
- ❌ **Don't parse in multiple places**: Parse once at the top level

### References

- See `docs/nuqs-server-side.md` for detailed nuqs documentation
- See `src/app/components/RenderPage/EventsListPageFilters/search-params.ts` for example

---

## Server-Side Filtering

### Pattern: Filter Data on Server

Server-side filtering improves performance and SEO. Filter data in server components before passing to client components.

### Implementation Pattern

```typescript
async function EventsListPage({ tenantId, tenantSlug }: Props) {
  // 1. Access cached search params
  const { search, people, startDate, endDate } = eventsListSearchParamsCache.all();

  // 2. Validate inputs
  const { isValid, startDate: validatedStartDate, endDate: validatedEndDate } =
    validateDateRange(startDate, endDate);

  // 3. Fetch all data
  const eventsQuery = await payloadSDK.find({ collection: "events", ... });

  // 4. Apply filters server-side
  let events = eventsQuery.docs;

  if (search.trim()) {
    events = events.filter((event) => event.title.toLowerCase().includes(search.toLowerCase()));
  }

  if (people !== null) {
    events = events.filter((event) => (event.maxQuantity ?? 0) >= people);
  }

  if (isValid && (validatedStartDate || validatedEndDate)) {
    events = events.filter((event) =>
      eventHasInstancesInRange(event, validatedStartDate, validatedEndDate),
    );
  }

  // 5. Pass filtered data to client component (presentational only)
  return <EventsListPageFilters events={events} tenantSlug={tenantSlug} />;
}
```

### Key Principles

- ✅ **Filter on server**: Better performance, SEO-friendly URLs
- ✅ **Client components are presentational**: No filtering logic in client
- ✅ **Validate inputs first**: Use validation helpers before filtering
- ✅ **Use helper functions**: Extract complex filtering logic (e.g., `eventHasInstancesInRange`)

---

## Component Structure

### RenderPage Component

The `RenderPage` component acts as a router that determines which page component to render based on the slug.

```typescript
export const RenderPage = async ({
  data,
  slug,
  tenantId,
  tenantSlug,
}: {
  data: Page | null;
  slug?: string;
  tenantId?: string;
  tenantSlug?: string;
}) => {
  const slugString = slug || "";
  const isEventsList = slugString === "events";
  const isEventDetail = slugString.startsWith("events/") && slugString.split("/").length === 2;

  if (isEventsList && tenantId) {
    return <EventsListPage tenantId={tenantId} tenantSlug={tenantSlug} />;
  }

  if (isEventDetail && tenantId && tenantSlug) {
    const eventSlug = slugString.split("/")[1];
    return <EventDetailPage eventSlug={eventSlug} tenantId={tenantId} tenantSlug={tenantSlug} />;
  }

  // Regular page rendering
  if (!data) return null;
  return <RegularPage data={data} />;
};
```

### Key Principles

- ✅ **Parse slug to determine route type**: Use string matching, not route params
- ✅ **Extract route-specific data here**: e.g., `eventSlug` from slug string
- ✅ **Don't fetch data in RenderPage**: Let child components handle their own data fetching
- ✅ **Keep it simple**: RenderPage is a router, not a data fetcher

---

## Tenant Access Control

### Pattern: Normal Access with Public Fallback

Tenant access control allows public access for events routes when `allowPublicRead: true` is set.

### Implementation

```typescript
// 1. Try normal access first (requires authentication)
const tenantsQuery = await payload.find({
  collection: "tenants",
  overrideAccess: false,
  user,
  where: { slug: { equals: params.tenant } },
});

if (tenantsQuery.docs.length > 0) {
  tenant = tenantsQuery.docs[0];
} else if (isEventsRoute) {
  // 2. For events routes, try public access
  const publicTenantsQuery = await payload.find({
    collection: "tenants",
    overrideAccess: true,
    where: {
      and: [
        { slug: { equals: params.tenant } },
        { allowPublicRead: { equals: true } },
      ],
    },
  });

  if (publicTenantsQuery.docs.length > 0) {
    tenant = publicTenantsQuery.docs[0];
  } else {
    redirect("/login");
  }
} else {
  // 3. For non-events routes, require authentication
  redirect("/login");
}
```

### Key Principles

- ✅ **Try normal access first**: Most routes require authentication
- ✅ **Public fallback only for events**: Use `isEventsRoute` check
- ✅ **Clear redirect logic**: Redirect to login when access is denied
- ❌ **Don't use try/catch for access control**: Use conditional queries instead

---

## Event Routing

### Routes

- `/tenant-slugs/{tenant}/events` → Events list page
- `/tenant-slugs/{tenant}/events/{eventSlug}` → Event detail page

### Route Handler Behavior

```typescript
const isEventsRoute = slugString === "events" || slugString.startsWith("events/");

if (isEventsRoute) {
  // Skip Pages query - events are not in Pages collection
  await eventsListSearchParamsCache.parse(searchParams); // Only for list page
  return <RenderPage data={null} slug={slugString} tenantId={tenant.id} tenantSlug={params.tenant} />;
}
```

### RenderPage Behavior

```typescript
const isEventsList = slugString === "events";
const isEventDetail = slugString.startsWith("events/") && slugString.split("/").length === 2;

if (isEventsList && tenantId) {
  return <EventsListPage tenantId={tenantId} tenantSlug={tenantSlug} />;
}

if (isEventDetail && tenantId && tenantSlug) {
  const eventSlug = slugString.split("/")[1];
  return <EventDetailPage eventSlug={eventSlug} tenantId={tenantId} tenantSlug={tenantSlug} />;
}
```

### Key Principles

- ✅ **Skip Pages query for events routes**: Events are stored in Events collection
- ✅ **Parse slug to extract eventSlug**: Use string splitting, not route params
- ✅ **Pass null for data prop**: Events routes don't have Page data
- ✅ **Fetch event data in EventDetailPage**: Don't fetch in route handler or RenderPage

---

## Data Fetching Patterns

### Events List Page

**Location**: `EventsListPage` component

**Pattern**:
1. Access cached search params
2. Validate filters
3. Fetch events from Events collection
4. Apply server-side filters
5. Pass filtered results to client component

```typescript
async function EventsListPage({ tenantId, tenantSlug }: Props) {
  const { search, people, startDate, endDate } = eventsListSearchParamsCache.all();
  const { isValid, startDate: validatedStartDate, endDate: validatedEndDate } =
    validateDateRange(startDate, endDate);

  const eventsQuery = await payloadSDK.find({
    collection: "events",
    where: {
      and: [
        { tenant: { equals: tenantId } },
        { isActive: { equals: true } },
        { _status: { equals: "published" } },
      ],
    },
  });

  let events = eventsQuery.docs;
  // Apply filters...
  return <EventsListPageFilters events={events} tenantSlug={tenantSlug} />;
}
```

### Event Detail Page

**Location**: `EventDetailPage` component

**Pattern**:
1. Receive `eventSlug` (not full event data)
2. Fetch event data by slug
3. Return 404 if not found

```typescript
export async function EventDetailPage({
  eventSlug,
  tenantId,
  tenantSlug,
}: {
  eventSlug: string;
  tenantId: string;
  tenantSlug: string;
}) {
  const payload = await getPayload({ config: configPromise });

  const eventQuery = await payload.find({
    collection: "events",
    draft: true,
    where: {
      and: [
        { tenant: { equals: tenantId } },
        { slug: { equals: eventSlug } },
      ],
    },
    limit: 1,
  });

  const event = eventQuery.docs[0];
  if (!event) {
    return notFound();
  }

  // Render event detail...
}
```

### Key Principles

- ✅ **Fetch data in the component that uses it**: Don't fetch in route handlers or RenderPage
- ✅ **Use payloadSDK for server-side queries**: Consistent query interface
- ✅ **Handle 404 cases**: Return `notFound()` when data doesn't exist
- ✅ **Use draft: true for preview**: Allow draft content in event queries
- ❌ **Don't pass full objects through props**: Pass IDs/slugs, fetch in component

---

## File Organization

### Search Params

- **Location**: `src/app/components/RenderPage/{Feature}/search-params.ts`
- **Exports**:
  - Search params descriptor object
  - Cache instance (`createSearchParamsCache`)
  - Parsers export (for client components)

### Utils

- **Location**: `src/app/components/RenderPage/{Feature}/utils/`
- **Purpose**: Server-side helper functions (validation, filtering, etc.)

### Components

- **Server components**: Data fetching, filtering, routing
- **Client components**: Presentational, URL state management (via nuqs)

---

## Summary of Key Patterns

1. **Route handlers**: Handle tenant access, determine route type, parse cache for events routes
2. **nuqs cache**: Parse once in route handler, access anywhere in server components
3. **Server-side filtering**: Filter data before passing to client components
4. **Component data fetching**: Fetch data in the component that uses it, not in route handlers
5. **Event routing**: Skip Pages query, parse slug to route to EventsListPage or EventDetailPage
6. **Tenant access**: Normal access first, public fallback only for events routes

---

## References

- [nuqs Server-Side Documentation](./nuqs-server-side.md)
- [Events Filtering Refactor Plan](./refactor-events-filtering-plan.md)
