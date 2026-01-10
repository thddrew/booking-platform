# E2E Test Plan: Public Checkout Flow

## Overview

This document outlines comprehensive end-to-end test cases for the public checkout flow. The flow enables guests (unauthenticated users) to book events through the following steps:

1. **Event Detail Page** → View event and available timeslots
2. **Select Timeslot** → Choose date and time
3. **Click "Book Event"** → Navigate to checkout page
4. **Checkout Form** → Enter customer information
5. **Create Booking** → Submit form to create booking
6. **Payment Flow** (paid events only) → Complete Stripe payment
7. **Success Page** → View booking confirmation

## Test Environment Setup

### Prerequisites
- Test tenant with configured Stripe account
- Test events (free and paid)
- Test Stripe keys (test mode)
- Database access for verification
- Webhook endpoint configured for Stripe

### Test Data Requirements
- **Free Event**: Event with no prices or all prices set to $0
- **Paid Event**: Event with active prices > $0
- **Multiple Timeslots**: Event with multiple available time slots
- **Fully Booked Timeslot**: Event with timeslot at capacity
- **Tenant with Stripe**: Tenant with connected Stripe account
- **Tenant without Stripe**: Tenant without payment configuration

---

## Test Suite 1: Event Detail Page & Timeslot Selection

### TC-1.1: View Event Detail Page
**Objective**: Verify event details are displayed correctly

**Steps**:
1. Navigate to event detail page: `/tenant-slugs/{tenant}/events/{event-slug}`
2. Verify event information is displayed:
   - Event title
   - Event subtitle (if present)
   - Event thumbnail (if present)
   - Event description
   - Booking panel is visible

**Expected Results**:
- All event information displays correctly
- Booking panel is present and functional
- Page loads without errors

---

### TC-1.2: View Available Timeslots
**Objective**: Verify available timeslots are displayed

**Steps**:
1. Navigate to event detail page
2. Verify booking panel shows:
   - Date selection buttons (up to 7 dates)
   - Available time slots for selected date
   - Price information (Free or $X)
   - "Book Event" button

**Expected Results**:
- Date buttons are clickable
- Time slots display correctly with:
  - Start and end times
  - Available spots count
  - Visual indication of availability
- "Book Event" button is visible

---

### TC-1.3: Select Date
**Objective**: Verify date selection updates available timeslots

**Steps**:
1. Navigate to event detail page
2. Click on a different date button
3. Verify timeslots update for selected date

**Expected Results**:
- Selected date button is highlighted
- Timeslots list updates to show slots for selected date
- Previously selected date is deselected

---

### TC-1.4: Select Timeslot
**Objective**: Verify timeslot selection works correctly

**Steps**:
1. Navigate to event detail page
2. Select a date
3. Click on an available timeslot
4. Verify timeslot is selected

**Expected Results**:
- Selected timeslot is visually highlighted
- "Book Event" button becomes enabled (if it was disabled)
- Timeslot shows selected state

---

### TC-1.5: Disabled Timeslot (Fully Booked)
**Objective**: Verify fully booked timeslots are disabled

**Steps**:
1. Navigate to event detail page with fully booked timeslot
2. Verify fully booked timeslot display
3. Attempt to select fully booked timeslot

**Expected Results**:
- Fully booked timeslot shows "Fully booked" text
- Timeslot is visually disabled (opacity/reduced styling)
- Timeslot is not clickable
- "Book Event" button remains disabled if no timeslot selected

---

### TC-1.6: No Available Timeslots
**Objective**: Verify handling when no timeslots are available

**Steps**:
1. Navigate to event detail page with no available timeslots
2. Verify booking panel display

**Expected Results**:
- Message displays: "No available times at this time"
- "Book Event" button is disabled or hidden
- No date selection buttons shown

---

## Test Suite 2: Navigation to Checkout

### TC-2.1: Navigate to Checkout (Free Event)
**Objective**: Verify navigation to checkout page for free event

**Steps**:
1. Navigate to free event detail page
2. Select a date and timeslot
3. Click "Book Event" button
4. Verify URL and page content

**Expected Results**:
- URL redirects to: `/tenant-slugs/{tenant}/checkout?eventId={id}&dtstart={iso}&dtend={iso}&scheduleId={id}`
- Checkout page loads successfully
- Booking summary displays correct event and timeslot information
- Customer info form is present

---

### TC-2.2: Navigate to Checkout (Paid Event)
**Objective**: Verify navigation to checkout page for paid event

**Steps**:
1. Navigate to paid event detail page
2. Select a date and timeslot
3. Click "Book Event" button
4. Verify URL and page content

**Expected Results**:
- URL redirects to checkout page with correct query parameters
- Checkout page loads successfully
- Booking summary shows pricing information
- Customer info form is present
- Button text shows "Continue to Payment" (not "Complete Booking")

---

### TC-2.3: Navigate Without Timeslot Selection
**Objective**: Verify "Book Event" button is disabled when no timeslot selected

**Steps**:
1. Navigate to event detail page
2. Do not select a timeslot
3. Attempt to click "Book Event" button

**Expected Results**:
- "Book Event" button is disabled
- Button click does not navigate
- User remains on event detail page

---

### TC-2.4: URL Parameters Validation
**Objective**: Verify checkout page handles missing/invalid URL parameters

**Steps**:
1. Navigate directly to checkout page without required parameters
2. Navigate with invalid eventId
3. Navigate with invalid date format

**Expected Results**:
- Page shows appropriate error message or redirects
- Invalid parameters are handled gracefully
- User is not shown incorrect booking information

---

## Test Suite 3: Checkout Form - Customer Information

### TC-3.1: Display Checkout Form
**Objective**: Verify checkout form displays correctly

**Steps**:
1. Navigate to checkout page with valid parameters
2. Verify form fields are present

**Expected Results**:
- Form displays with fields:
  - First name (required)
  - Last name (required)
  - Email (required)
  - Phone (optional)
- Booking summary sidebar displays:
  - Event information
  - Selected timeslot (date and time)
  - Pricing breakdown (if paid event)
  - Total amount
- Submit button is present

---

### TC-3.2: Form Validation - Empty Required Fields
**Objective**: Verify validation for required fields

**Steps**:
1. Navigate to checkout page
2. Leave all fields empty
3. Click submit button
4. Verify validation errors

**Expected Results**:
- Form does not submit
- Validation errors display:
  - "First name is required"
  - "Last name is required"
  - "Invalid email address" (or similar)
- Error messages are clear and actionable

---

### TC-3.3: Form Validation - Invalid Email Format
**Objective**: Verify email format validation

**Test Cases**:
1. Enter invalid email formats:
   - `invalid-email`
   - `@example.com`
   - `user@`
   - `user@.com`
   - `user name@example.com` (with space)
2. Attempt to submit form

**Expected Results**:
- Form does not submit
- Error message: "Invalid email address"
- Valid email formats are accepted:
  - `user@example.com`
  - `user.name@example.com`
  - `user+tag@example.co.uk`

---

### TC-3.4: Form Validation - First Name Required
**Objective**: Verify first name is required

**Steps**:
1. Navigate to checkout page
2. Fill in last name and email
3. Leave first name empty
4. Attempt to submit

**Expected Results**:
- Form does not submit
- Error: "First name is required"
- Other fields retain their values

---

### TC-3.5: Form Validation - Last Name Required
**Objective**: Verify last name is required

**Steps**:
1. Navigate to checkout page
2. Fill in first name and email
3. Leave last name empty
4. Attempt to submit

**Expected Results**:
- Form does not submit
- Error: "Last name is required"
- Other fields retain their values

---

### TC-3.6: Phone Field Optional
**Objective**: Verify phone field is optional

**Steps**:
1. Navigate to checkout page
2. Fill in required fields (first name, last name, email)
3. Leave phone field empty
4. Submit form

**Expected Results**:
- Form submits successfully
- Booking is created without phone number
- No validation error for phone field

---

### TC-3.7: Form Submission - Loading State
**Objective**: Verify loading state during form submission

**Steps**:
1. Navigate to checkout page
2. Fill in all required fields
3. Click submit button
4. Observe button state

**Expected Results**:
- Submit button shows loading state:
  - Spinner icon appears
  - Button text changes to "Processing..."
  - Button is disabled during submission
- Form fields are disabled during submission

---

### TC-3.8: Form Submission - Error Handling
**Objective**: Verify error handling for failed submissions

**Steps**:
1. Navigate to checkout page
2. Fill in valid form data
3. Simulate server error (network failure, invalid event, etc.)
4. Verify error display

**Expected Results**:
- Error message displays in form
- Error is user-friendly and actionable
- Form remains accessible for retry
- User can correct and resubmit

---

## Test Suite 4: Booking Creation - Free Events

### TC-4.1: Create Free Event Booking
**Objective**: Verify free event booking creation

**Steps**:
1. Navigate to free event checkout page
2. Fill in customer information:
   - First name: "John"
   - Last name: "Doe"
   - Email: "john.doe@example.com"
   - Phone: "+1 (555) 123-4567" (optional)
3. Submit form
4. Verify redirect and booking creation

**Expected Results**:
- Form submits successfully
- Redirects to: `/tenant-slugs/{tenant}/checkout/success?bookingId={id}&email={email}`
- Success page displays correctly
- **Database Verification**:
  - Booking record created with:
    - `customerSnapshot` contains customer info
    - `eventRelation` matches event ID
    - `dtstart` and `dtend` match selected timeslot
    - `paymentMethod` = "payLater"
    - `paymentStatus` = "complete"
    - `tenant` matches tenant ID

---

### TC-4.2: Create Free Booking Without Phone
**Objective**: Verify booking creation without optional phone field

**Steps**:
1. Navigate to free event checkout page
2. Fill in required fields only (no phone)
3. Submit form

**Expected Results**:
- Booking created successfully
- `customerSnapshot.phone` is null or undefined
- Other customer information is saved correctly

---

### TC-4.3: Free Event - Direct to Success Page
**Objective**: Verify free events skip payment page

**Steps**:
1. Complete checkout for free event
2. Verify navigation flow

**Expected Results**:
- After form submission, redirects directly to success page
- Payment page is NOT shown
- Success page shows booking confirmation

---

## Test Suite 5: Booking Creation - Paid Events

### TC-5.1: Create Paid Event Booking
**Objective**: Verify paid event booking creation

**Steps**:
1. Navigate to paid event checkout page
2. Fill in customer information
3. Submit form
4. Verify redirect and booking creation

**Expected Results**:
- Form submits successfully
- Redirects to: `/tenant-slugs/{tenant}/checkout/payment?bookingId={id}&email={email}`
- Payment page displays correctly
- **Database Verification**:
  - Booking record created with:
    - `customerSnapshot` contains customer info
    - `eventRelation` matches event ID
    - `dtstart` and `dtend` match selected timeslot
    - `pricingSnapshot` contains price information
    - `paymentMethod` = "payNow"
    - `paymentStatus` = null (pending payment)

---

### TC-5.2: Paid Event - Navigate to Payment Page
**Objective**: Verify paid events redirect to payment page

**Steps**:
1. Complete checkout form for paid event
2. Verify navigation flow

**Expected Results**:
- After form submission, redirects to payment page
- Payment page shows:
  - Booking summary
  - Payment form/Stripe checkout
  - Correct total amount

---

### TC-5.3: Booking Creation - Invalid Event ID
**Objective**: Verify error handling for invalid event

**Steps**:
1. Navigate to checkout with invalid eventId
2. Fill in form and submit

**Expected Results**:
- Error message: "Event not found"
- Booking is not created
- User can correct and retry

---

### TC-5.4: Booking Creation - Timeslot No Longer Available
**Objective**: Verify handling when timeslot becomes unavailable

**Steps**:
1. Navigate to checkout page
2. Wait for timeslot to become fully booked (or simulate)
3. Submit form

**Expected Results**:
- Appropriate error message displayed
- User is informed timeslot is no longer available
- Option to return to event page and select different timeslot

---

## Test Suite 6: Payment Flow (Paid Events)

### TC-6.1: Display Payment Page
**Objective**: Verify payment page displays correctly

**Steps**:
1. Complete checkout form for paid event
2. Verify payment page content

**Expected Results**:
- Payment page loads successfully
- Order summary displays:
  - Event information
  - Date and time
  - Line items with prices
  - Total amount
- Payment form/Stripe Elements is present
- Back/Cancel link is available

---

### TC-6.2: Payment Page - Missing Booking ID
**Objective**: Verify handling of missing booking ID

**Steps**:
1. Navigate directly to payment page without bookingId parameter
2. Verify page behavior

**Expected Results**:
- Redirects to events page or shows error
- Payment form is not displayed
- User is informed of the issue

---

### TC-6.3: Payment Page - Email Validation
**Objective**: Verify email validation for booking access

**Steps**:
1. Complete checkout with email: `user@example.com`
2. Navigate to payment page with different email in URL
3. Verify access control

**Expected Results**:
- Payment page validates email matches booking
- If email doesn't match, shows 404 or error
- Prevents unauthorized access to booking

---

### TC-6.4: Payment Page - Tenant Without Stripe
**Objective**: Verify handling when tenant has no Stripe account

**Steps**:
1. Complete checkout for paid event
2. Use tenant without configured Stripe account
3. Verify payment page display

**Expected Results**:
- Message displays: "Payment is not available for this event. Please contact the organizer."
- Payment form is not shown
- User can contact organizer

---

### TC-6.5: Stripe Checkout Session Creation
**Objective**: Verify Stripe checkout session is created

**Steps**:
1. Complete checkout for paid event with valid Stripe account
2. Verify Stripe integration

**Expected Results**:
- Stripe checkout session is created
- Session includes:
  - Correct line items from pricing snapshot
  - Customer email
  - Success and cancel URLs
  - Metadata with bookingId and tenantId
- Payment form initializes correctly

---

### TC-6.6: Complete Payment - Success Flow
**Objective**: Verify successful payment completion

**Steps**:
1. Complete checkout form
2. Navigate to payment page
3. Complete Stripe payment (use test card: 4242 4242 4242 4242)
4. Verify redirect and booking update

**Expected Results**:
- Payment processes successfully
- Redirects to success page: `/tenant-slugs/{tenant}/checkout/success?bookingId={id}&email={email}`
- **Database Verification**:
  - Booking `paymentStatus` is updated to "complete" (via webhook)
  - Payment record is created (if applicable)
  - Booking remains accessible

---

### TC-6.7: Payment Cancellation
**Objective**: Verify payment cancellation handling

**Steps**:
1. Complete checkout form
2. Navigate to payment page
3. Cancel payment (click cancel or close)
4. Verify redirect

**Expected Results**:
- User is redirected to cancel URL or payment page
- Booking remains in pending state
- User can retry payment

---

### TC-6.8: Payment Failure
**Objective**: Verify payment failure handling

**Steps**:
1. Complete checkout form
2. Navigate to payment page
3. Use declined test card (4000 0000 0000 0002)
4. Verify error handling

**Expected Results**:
- Payment failure is displayed clearly
- User can retry payment
- Booking remains in pending state
- Error message is user-friendly

---

### TC-6.9: Stripe Webhook - Payment Success
**Objective**: Verify webhook updates booking status

**Steps**:
1. Complete payment successfully
2. Verify webhook is received
3. Check booking status update

**Expected Results**:
- Webhook endpoint receives `checkout.session.completed` event
- Booking `paymentStatus` is updated to "complete"
- Webhook processes correctly with metadata validation

---

### TC-6.10: Stripe Webhook - Payment Expired
**Objective**: Verify expired payment session handling

**Steps**:
1. Create booking and navigate to payment page
2. Wait for session to expire (or simulate)
3. Verify webhook handling

**Expected Results**:
- Webhook receives `checkout.session.expired` event
- Booking status is updated appropriately
- User is informed if they return to payment page

---

## Test Suite 7: Success Page

### TC-7.1: Display Success Page - Free Event
**Objective**: Verify success page for free event booking

**Steps**:
1. Complete free event booking
2. Verify success page content

**Expected Results**:
- Success page displays:
  - Success icon/indicator
  - "Booking Confirmed!" heading
  - Booking details card with:
    - Event information (title, subtitle, thumbnail)
    - Date and time
    - Customer information
    - Booking reference (ID)
  - Confirmation message about email
  - "Browse More Events" button

---

### TC-7.2: Display Success Page - Paid Event
**Objective**: Verify success page for paid event booking

**Steps**:
1. Complete paid event booking and payment
2. Verify success page content

**Expected Results**:
- Success page displays all booking details
- Payment status is shown (if applicable)
- All information matches booking data

---

### TC-7.3: Success Page - Missing Booking ID
**Objective**: Verify handling of missing booking ID

**Steps**:
1. Navigate to success page without bookingId parameter
2. Verify page behavior

**Expected Results**:
- Shows 404 or error page
- User is informed booking not found

---

### TC-7.4: Success Page - Email Validation
**Objective**: Verify email validation for booking access

**Steps**:
1. Complete booking with email: `user@example.com`
2. Navigate to success page with different email
3. Verify access control

**Expected Results**:
- If email doesn't match booking email, shows 404
- Prevents unauthorized access to booking confirmation
- Valid email allows access

---

### TC-7.5: Success Page - Invalid Booking ID
**Objective**: Verify handling of invalid booking ID

**Steps**:
1. Navigate to success page with non-existent bookingId
2. Verify page behavior

**Expected Results**:
- Shows 404 or error page
- User is informed booking not found

---

### TC-7.6: Success Page - Booking Details Accuracy
**Objective**: Verify booking details are accurate

**Steps**:
1. Complete booking with known data
2. Verify success page displays correct information

**Expected Results**:
- Event title matches
- Date and time match selected timeslot
- Customer name and email match form input
- Booking ID matches created booking
- All displayed data is accurate

---

### TC-7.7: Success Page - Navigation
**Objective**: Verify navigation from success page

**Steps**:
1. Complete booking and view success page
2. Click "Browse More Events" button
3. Verify navigation

**Expected Results**:
- Button navigates to events listing page
- URL is correct: `/tenant-slugs/{tenant}/events`
- User can browse and book more events

---

## Test Suite 8: Guest Booking Verification

### TC-8.1: Guest Booking - No Authentication Required
**Objective**: Verify guest bookings work without login

**Steps**:
1. Ensure user is not logged in
2. Complete full checkout flow
3. Verify booking creation

**Expected Results**:
- Booking can be created without authentication
- No login prompts appear
- Booking is associated with guest (customerSnapshot, not customerRelation)

---

### TC-8.2: Guest Booking - Customer Snapshot
**Objective**: Verify customer snapshot is saved correctly

**Steps**:
1. Complete guest booking with:
   - First name: "Jane"
   - Last name: "Smith"
   - Email: "jane.smith@example.com"
   - Phone: "+1 (555) 987-6543"
2. Verify database record

**Expected Results**:
- `customerSnapshot` contains:
  - `firstName`: "Jane"
  - `lastName`: "Smith"
  - `fullName`: "Jane Smith"
  - `email`: "jane.smith@example.com"
  - `phone`: "+1 (555) 987-6543"
- `customerRelation` is null (guest booking)

---

### TC-8.3: Guest Booking - Email Access
**Objective**: Verify guest can access booking via email

**Steps**:
1. Complete guest booking
2. Use booking ID and email to access success page
3. Verify access is granted

**Expected Results**:
- Success page is accessible with correct email
- Booking details are displayed
- Email validation works correctly

---

## Test Suite 9: Edge Cases & Error Scenarios

### TC-9.1: Concurrent Booking - Same Timeslot
**Objective**: Verify handling when multiple users book same timeslot simultaneously

**Steps**:
1. Open two browser sessions
2. Both select same timeslot
3. Both complete checkout simultaneously
4. Verify booking creation

**Expected Results**:
- Only one booking succeeds (or appropriate handling)
- Second booking shows error or timeslot unavailable
- No duplicate bookings created
- Availability is updated correctly

---

### TC-9.2: Timeslot Availability - Real-time Updates
**Objective**: Verify timeslot availability reflects current bookings

**Steps**:
1. View event with available timeslot
2. Complete booking for that timeslot
3. Return to event page
4. Verify timeslot availability updated

**Expected Results**:
- Timeslot shows reduced availability or "Fully booked"
- Availability count is accurate
- UI updates reflect current state

---

### TC-9.3: Network Failure During Submission
**Objective**: Verify handling of network failures

**Steps**:
1. Navigate to checkout page
2. Fill in form
3. Simulate network failure (disable network)
4. Attempt to submit
5. Re-enable network and retry

**Expected Results**:
- Error message displays on network failure
- Form data is retained (if possible)
- User can retry after network restored
- No duplicate bookings created on retry

---

### TC-9.4: Session Expiration
**Objective**: Verify handling of expired sessions

**Steps**:
1. Start checkout process
2. Wait for session to expire (or simulate)
3. Attempt to complete booking

**Expected Results**:
- Appropriate error or redirect
- User is informed of session expiration
- User can restart booking process

---

### TC-9.5: Invalid URL Parameters - Malformed Dates
**Objective**: Verify handling of malformed date parameters

**Steps**:
1. Navigate to checkout with invalid date format in URL
2. Verify page behavior

**Expected Results**:
- Page handles invalid dates gracefully
- Error message or redirect to event page
- No crashes or unhandled errors

---

### TC-9.6: Large Form Inputs
**Objective**: Verify handling of unusually large inputs

**Steps**:
1. Navigate to checkout page
2. Enter very long strings in form fields:
   - First name: 1000 characters
   - Last name: 1000 characters
   - Email: very long email
3. Submit form

**Expected Results**:
- Form validation handles long inputs appropriately
- Database constraints are respected
- User receives appropriate feedback
- No system errors or crashes

---

### TC-9.7: Special Characters in Form Fields
**Objective**: Verify handling of special characters

**Steps**:
1. Navigate to checkout page
2. Enter special characters:
   - Name: "O'Brien", "José", "李"
   - Email: "user+tag@example.com"
   - Phone: "+1 (555) 123-4567"
3. Submit form

**Expected Results**:
- Special characters are handled correctly
- Data is saved accurately in database
- Display on success page is correct
- No encoding issues

---

## Test Suite 10: Integration & Data Integrity

### TC-10.1: Booking Data Integrity
**Objective**: Verify all booking data is saved correctly

**Steps**:
1. Complete booking with known test data
2. Query database directly
3. Verify all fields

**Expected Results**:
- All booking fields are populated correctly:
  - `tenant` matches tenant ID
  - `eventRelation` matches event ID
  - `dtstart` and `dtend` match selected timeslot
  - `selectedScheduleInstanceData` contains schedule info
  - `customerSnapshot` contains customer info
  - `pricingSnapshot` contains price info
  - `paymentMethod` is correct (payLater for free, payNow for paid)
  - `paymentStatus` is correct
  - Timestamps are set correctly

---

### TC-10.2: Event Snapshot (if applicable)
**Objective**: Verify event snapshot is created

**Steps**:
1. Complete booking
2. Verify event snapshot in booking record

**Expected Results**:
- `eventSnapshot` contains event information:
  - Event title
  - Event subtitle (if present)
  - Event thumbnail (if present)
- Snapshot allows display without querying event relation

---

### TC-10.3: Pricing Snapshot Accuracy
**Objective**: Verify pricing snapshot matches event prices

**Steps**:
1. Complete booking for paid event
2. Verify pricing snapshot

**Expected Results**:
- `pricingSnapshot` contains all active prices
- Price amounts match event prices at time of booking
- Quantities are correct
- Price labels are included

---

### TC-10.4: Multi-Tenant Isolation
**Objective**: Verify bookings are isolated by tenant

**Steps**:
1. Create booking for Tenant A
2. Attempt to access booking from Tenant B context
3. Verify isolation

**Expected Results**:
- Bookings are properly scoped to tenant
- Cross-tenant access is prevented
- Tenant field is set correctly in booking

---

## Test Suite 11: UI/UX & Accessibility

### TC-11.1: Responsive Design
**Objective**: Verify checkout flow works on mobile devices

**Steps**:
1. Test checkout flow on mobile viewport (< 768px)
2. Test on tablet viewport (768px - 1024px)
3. Test on desktop viewport (> 1024px)

**Expected Results**:
- All pages are responsive
- Forms are usable on mobile
- Booking summary adapts to screen size
- Touch targets are adequate size
- Text is readable

---

### TC-11.2: Loading States
**Objective**: Verify loading states are clear

**Steps**:
1. Navigate through checkout flow
2. Observe loading states during:
   - Form submission
   - Page navigation
   - Payment processing

**Expected Results**:
- Loading indicators are visible
- User understands system is processing
- No confusion about current state

---

### TC-11.3: Error Messages Clarity
**Objective**: Verify error messages are clear and actionable

**Steps**:
1. Trigger various error scenarios
2. Verify error messages

**Expected Results**:
- Error messages are user-friendly
- Messages explain what went wrong
- Messages suggest how to fix the issue
- Technical errors are not exposed to users

---

### TC-11.4: Form Field Labels & Placeholders
**Objective**: Verify form is clear and intuitive

**Steps**:
1. Navigate to checkout form
2. Verify form field labels and placeholders

**Expected Results**:
- All fields have clear labels
- Placeholders provide helpful examples
- Required fields are indicated
- Optional fields are marked

---

### TC-11.5: Back Navigation
**Objective**: Verify back navigation works correctly

**Steps**:
1. Navigate through checkout flow
2. Use browser back button
3. Use "Back" links in UI
4. Verify state preservation

**Expected Results**:
- Back navigation works as expected
- Form data is preserved (if appropriate)
- User can return to previous steps
- No data loss on navigation

---

## Test Suite 12: Performance & Scalability

### TC-12.1: Page Load Performance
**Objective**: Verify pages load within acceptable time

**Steps**:
1. Measure load times for:
   - Event detail page
   - Checkout page
   - Payment page
   - Success page

**Expected Results**:
- Pages load within 2-3 seconds
- No significant performance degradation
- Images are optimized

---

### TC-12.2: Form Submission Performance
**Objective**: Verify form submission is responsive

**Steps**:
1. Submit checkout form
2. Measure time to redirect/response

**Expected Results**:
- Form submission completes within 2-3 seconds
- User receives feedback promptly
- No noticeable delays

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Test environment is configured
- [ ] Test data is prepared (free and paid events)
- [ ] Stripe test account is configured
- [ ] Webhook endpoint is accessible
- [ ] Database access is available for verification
- [ ] Test email addresses are available

### Test Execution
- [ ] All test cases are executed
- [ ] Results are documented
- [ ] Bugs/issues are logged
- [ ] Screenshots/videos are captured for failures
- [ ] Database is verified for critical test cases

### Post-Test
- [ ] Test results are reviewed
- [ ] Critical bugs are prioritized
- [ ] Test data is cleaned up (if needed)
- [ ] Test report is generated

---

## Test Data Examples

### Valid Test Data
```json
{
  "customerInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1 (555) 123-4567"
  },
  "eventId": "valid-event-uuid",
  "dtstart": "2024-12-25T10:00:00Z",
  "dtend": "2024-12-25T11:00:00Z",
  "scheduleId": "valid-schedule-id"
}
```

### Stripe Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

---

## Notes

- All tests should be run in a test environment, not production
- Database verification steps should use read-only queries when possible
- Webhook testing may require Stripe CLI or webhook forwarding
- Consider automated testing tools (Playwright, Cypress) for regression testing
- Test both tenant-slugs and tenant-domains routing (if applicable)
- Verify email notifications are sent (if applicable)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-XX | Initial | Initial test plan creation |
