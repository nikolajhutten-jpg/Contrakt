# Contrakt — build progress

Files created to date, organised by layer.

---

## Config & types

| File | Description |
|---|---|
| `prisma/schema.prisma` | Full Prisma schema — all 9 tables; now includes `TenantPlan` + `TenantPlanStatus` enums and 6 billing fields on `Tenant` (§15). |
| `prisma.config.ts` | Prisma 7 external config; moves the database URL out of the schema file. |
| `src/types/index.ts` | All TypeScript interfaces and `const`+union enums; includes `TenantPlan`, `TenantPlanStatus`, `PlanUsage` (§15). |
| `src/env.ts` | `@t3-oss/env-nextjs` + Zod schema validating all 18 required env vars at startup; optional vars (Upstash, Sentry) use `.optional()` so dev runs without them; imported by `client.ts` and `stripe.ts`. |
| `src/proxy.ts` | Auth0 session handling + per-route rate limiting: strict for /api/auth/signup, relaxed for GET, standard for all other mutations; 429 response with Retry-After when exceeded. (Renamed from `middleware.ts` per Next.js 16 deprecation.) |
| `next.config.ts` | Applies `getSecurityHeaders()` to all routes via the Next.js `headers()` config hook. |
| `sentry.client.config.ts` | Sentry browser-side init — reads `NEXT_PUBLIC_SENTRY_DSN`; 10 % trace sampling; replay integration with full text+media masking; no-op when DSN is absent. |
| `sentry.server.config.ts` | Sentry Node.js-side init — reads `SENTRY_DSN`; 10 % trace sampling; no-op when DSN is absent. |
| `.env.local` | Placeholder env vars — Auth0, PostgreSQL, Anthropic, Stripe (§15), Upstash Redis (rate limiting), Sentry DSN. |

---

## Database layer

| File | Description |
|---|---|
| `src/lib/db/client.ts` | Prisma 7 singleton using `PrismaPg` adapter; pinned to `globalThis` for hot-reload safety; imports `@/env` to trigger validation on startup. |
| `src/lib/db/tenants.ts` | `getTenantById`, `updateTenant` — tenant record queries. |
| `src/lib/db/users.ts` | `getUserById`, `getUserByAuth0Id`, `getUsersByTenant`, `createUser`, `updateUser`, `deactivateUser`. |
| `src/lib/db/contracts.ts` | Core contract CRUD: `getContractById`, `getContractsByTenant/Owner/Department`, `createContract`, `updateContract`, `deleteContract`. |
| `src/lib/db/contractHelpers.ts` | Shared helpers used by both `dashboard.ts` and `contractsFiltered.ts`: `RoleContext`, `contractWhere`, `summaryInclude`, `toSummary`. |
| `src/lib/db/contractsFiltered.ts` | `getContractsFiltered` — role-aware query with status, department, term type, auto-renewal, date range, and free-text search filters. |
| `src/lib/db/dashboard.ts` | `getDashboardKpis`, `getActionRequiredContracts`, `getUpcomingRenewalsContracts`, `getBadgeCounts`, `getOnboardingState`. |
| `src/lib/db/renewals.ts` | `getRenewalsFiltered` — role-aware query for active contracts with upcoming renewal notice deadlines; accepts department and date-range filters. |
| `src/lib/db/vendors.ts` | `getVendorsByTenant`, `getVendorsWithContractCounts`, `getVendorById`, `getVendorWithContracts` (includes department + owners per contract), `createVendor`, `updateVendor`. |
| `src/lib/db/departments.ts` | `getDepartmentsByTenant`, `getDepartmentById`, `createDepartment`, `renameDepartment`, `deactivateDepartment`. |
| `src/lib/db/documents.ts` | `getDocumentsByContract`, `getDocumentById`, `createDocument`, `deleteDocument`, `getLatestRenewalVersion`. |
| `src/lib/db/alerts.ts` | `getAlertsByContract`, `getAlertById`, `createAlert`, `updateAlert`, `deleteAlert`; casts Prisma `Json` channels back to `AlertChannel[]`. |
| `src/lib/db/settings.ts` | `getTenantSettings`, `updateTenantSettings` — account-level settings queries. |
| `src/lib/db/billing.ts` | `updateTenantBilling`, `getTenantByStripeCustomerId`, `getTenantByStripeSubscriptionId` — billing DB queries used by the webhook handler and checkout flow. |
| `src/lib/db/extractionResults.ts` | `saveExtractionResult`, `getExtractionResultByDocument` — persists Claude extraction output linked to a document record. |

---

## Services

| File | Description |
|---|---|
| `src/lib/security/rateLimit.ts` | Upstash sliding-window rate limiter; three tiers: strict 5/min (auth), standard 60/min (mutations), relaxed 200/min (reads); lazy Redis init; fails open when Redis is unconfigured. |
| `src/lib/security/headers.ts` | `getSecurityHeaders()` — returns the full set of security response headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP, Permissions-Policy). |
| `src/lib/security/sanitize.ts` | `sanitizeText` (strip HTML tags + entities), `sanitizeEmail` (validate + lowercase), `validateUUID` (UUID v4 regex) — boundary-level input sanitisation helpers. |
| `src/lib/services/stripe.ts` | Stripe v22 singleton + helpers: `createCustomer`, `createCheckoutSession`, `createPortalSession`, `getSubscription`, `cancelSubscription`, `syncSeatCount`; imports `@/env` to trigger validation on startup. |
| `src/lib/services/notifications.ts` | SendGrid email and Slack Incoming Webhook helpers; both retry up to 3 times with exponential backoff (§14.3); failures are logged but never thrown so a notification failure cannot crash the scheduler. |
| `src/lib/services/planLimits.ts` | `getPlanUsage`, `checkContractLimit`, `checkUserLimit`, `checkExtractionLimit` — server-side limit enforcement per §15.2 and §15.6. |
| `src/lib/auth/config.ts` | Auth0 client singleton with route configuration and `AUTH0_CLAIM_NS` constant. |
| `src/lib/auth/session.ts` | `getSession`, `requireAuth`, `getTenantFromSession`, `resolveAuthContext`, `requireRole` — auth helpers used by every API route. |
| `src/lib/api/response.ts` | `ok`, `created`, `notFound`, `forbidden`, `badRequest`, `handleError` — typed Next.js response helpers. |
| `src/lib/services/contracts.ts` | `calculateDurationMonths`, `calculateNoticeDeadline`, `determineInitialStatus`, `buildCreateContractData` — contract business logic and §14.5 edge cases. |
| `src/lib/services/extraction.ts` | `convertToText` (pdf-parse / mammoth), `extractContractProperties` (Claude API, §12.3 prompt, §12.4 schema), `handleExtractionFailure` (§12.6 all-null fallback). |
| `src/lib/services/extractionJobs.ts` | In-memory job store (`createJob`, `getJob`, `completeJob`, `failJob`) for tracking async extraction pipeline status. |

---

## Client-side API helpers

| File | Description |
|---|---|
| `src/lib/api/auth.ts` | `signup(input)` — POST to `/api/auth/signup`; used by `SignupForm`. |
| `src/lib/hooks/useToast.ts` | `useToast()` hook — reads `ToastContext`; provides `showToast(message, variant?)` to any client component inside `<ToastProvider>`. |
| `src/lib/api/billing.ts` | `startCheckout(plan)`, `openBillingPortal()` — redirect helpers that call the billing API and forward the browser to Stripe-hosted pages. |
| `src/lib/api/contracts.ts` | `confirmAction(contractId)` — POST to confirm-action endpoint; used by `ActionRequiredShell`. |
| `src/lib/api/vendors.ts` | `updateVendor(id, data)` — PATCH vendor name and contact details; used by `VendorEditForm`. |
| `src/lib/api/users.ts` | `inviteUser`, `updateUserRole`, `deactivateUser`, `updateMyProfile` — called from settings components. |
| `src/lib/api/departments.ts` | `createDepartment`, `renameDepartment`, `deactivateDepartment` — called from `DepartmentList`. |
| `src/lib/api/settings.ts` | `updateAccountSettings`, `testSlackWebhook` — called from `AccountSettingsForm`. |

---

## API routes

| File | Description |
|---|---|
| `src/app/api/auth/[auth0]/route.ts` | Auth0 v4 stub — authentication is handled by middleware; this file exists as a placeholder only. |
| `src/app/api/auth/signup/route.ts` | `POST` — Stage 1+2 onboarding (§13.2–13.3): validates input, creates `Tenant` + admin `User` records; sets `trialEndsAt` (+14 days); Auth0 org creation, GCP bucket, and SendGrid are mocked with TODOs. |
| `src/app/api/billing/checkout/route.ts` | `POST` — admin only; provisions Stripe customer on first checkout, creates a hosted Checkout Session for plan selection; returns redirect URL. |
| `src/app/api/billing/portal/route.ts` | `POST` — admin only; creates a Stripe Customer Portal session; returns redirect URL for subscription and invoice management. |
| `src/app/api/billing/webhook/route.ts` | `POST` — Stripe webhook receiver; verifies signature with raw body; handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. |
| `src/app/api/contracts/route.ts` | `GET` list (role-filtered) and `POST` create with input validation and §14.5 edge case handling. |
| `src/app/api/contracts/[id]/route.ts` | `GET` single contract, `PATCH` update (business owner/admin), `DELETE` (admin only). |
| `src/app/api/contracts/[id]/confirm-action/route.ts` | `POST` — marks action taken, resets status to Active; idempotent. |
| `src/app/api/contracts/[id]/documents/route.ts` | `GET` list and `POST` upload linked documents for a contract. |
| `src/app/api/contracts/[id]/alerts/route.ts` | `GET` list and `POST` create notification alerts for a contract. |
| `src/app/api/contracts/[id]/alerts/[alertId]/route.ts` | `PATCH` update and `DELETE` remove a specific alert. |
| `src/app/api/documents/[docId]/url/route.ts` | `GET` — returns a signed GCS URL for viewing a document (placeholder; GCS not yet wired). |
| `src/app/api/vendors/route.ts` | `GET` list and `POST` create vendors. |
| `src/app/api/vendors/[id]/route.ts` | `GET` vendor with contracts and `PATCH` update (admin only). |
| `src/app/api/users/route.ts` | `GET` all users in tenant (admin only). |
| `src/app/api/users/invite/route.ts` | `POST` — creates a local user record for an invited user; generates placeholder `auth0Id` until Auth0 Management API is wired. |
| `src/app/api/users/[id]/route.ts` | `PATCH` update role/department and `DELETE` deactivate (admin only). |
| `src/app/api/users/me/route.ts` | `PATCH` — update own profile and notification preferences. |
| `src/app/api/departments/route.ts` | `GET` list and `POST` create departments. |
| `src/app/api/departments/[id]/route.ts` | `PATCH` rename and `DELETE` deactivate a department (admin only). |
| `src/app/api/settings/account/route.ts` | `GET` and `PATCH` tenant account settings (admin only). |
| `src/app/api/settings/account/test-slack/route.ts` | `POST` — reads tenant webhook URL and sends a test message to Slack; returns 400 if unconfigured or Slack rejects. |
| `src/app/api/upload/route.ts` | `POST` — validates file (format + size), reads buffer, creates extraction job, fires extraction pipeline fire-and-forget. |
| `src/app/api/upload/[jobId]/status/route.ts` | `GET` — returns current job status (`processing` / `complete` / `failed`) for polling. |
| `src/app/api/upload/[jobId]/result/route.ts` | `GET` — returns extracted fields and confidence ratings once the job is complete. |

---

## Pages

| File | Description |
|---|---|
| `src/app/layout.tsx` | Root HTML shell with Geist font and Tailwind globals. |
| `src/app/page.tsx` | Root redirect to `/dashboard`. |
| `src/app/not-found.tsx` | Global 404 page — shown on unknown routes and `notFound()` calls; "Go to dashboard" button. |
| `src/app/error.tsx` | Root Next.js error page (§14.6) — shown on uncaught exceptions; captures to Sentry in `useEffect`; "Try again" button calls `unstable_retry`. |
| `src/app/(auth)/layout.tsx` | Minimal centred layout for public auth pages (no sidebar). |
| `src/app/(auth)/signup/page.tsx` | Sign-up page (§13.2) — redirects to `/dashboard` if already authenticated; renders `SignupForm`. |
| `src/app/(app)/layout.tsx` | Authenticated route group layout — wraps every protected page in `AppLayout`. |
| `src/app/(app)/dashboard/page.tsx` | Dashboard page — fetches KPIs, action-required, upcoming renewals, and onboarding state in parallel; redirects admin to `/setup` if no departments exist (§13.4). |
| `src/app/(app)/setup/page.tsx` | Workspace setup wizard page (§13.4) — admin only; redirects non-admins; skips to dashboard if setup already complete; renders `SetupWizard`. |
| `src/app/(app)/contracts/page.tsx` | All Contracts page — reads URL search params, calls `getContractsFiltered`, passes data to `ContractsShell`. |
| `src/app/(app)/contracts/[id]/page.tsx` | Contract Detail page — fetches full contract with relations, computes `canEdit`, renders `ContractDetailShell`. |
| `src/app/(app)/contracts/new/page.tsx` | Upload Contract page — renders `UploadShell` which orchestrates the full upload → extract → review flow. |
| `src/app/(app)/renewals/page.tsx` | Renewals page — reads `departmentId`, `deadlineFrom`, `deadlineTo` from URL params; fetches filtered renewals and departments in parallel. |
| `src/app/(app)/action-required/page.tsx` | Action Required page — fetches action-required contracts; passes `isAdmin` and `canConfirm` flags to the shell. |
| `src/app/(app)/vendors/page.tsx` | Vendor Directory page — fetches all vendors with contract counts. |
| `src/app/(app)/vendors/[id]/page.tsx` | Vendor Detail page — fetches vendor with full contract list (including department + owners); 404s via `notFound()`. |
| `src/app/(app)/settings/users/page.tsx` | User Management page — admin only; redirects non-admins; fetches all users and departments in parallel. |
| `src/app/(app)/settings/departments/page.tsx` | Department Management page — admin only; redirects non-admins; fetches all departments. |
| `src/app/(app)/settings/account/page.tsx` | Account Settings page — admin only; redirects non-admins; fetches tenant settings. |
| `src/app/(app)/settings/profile/page.tsx` | Profile & Notifications page — accessible by all users; fetches current user via `resolveAuthContext`. |

---

## Components

### Auth

| File | Description |
|---|---|
| `src/components/auth/SignupForm.tsx` | Client sign-up form — company name, name, email, password; phases: idle → submitting → success (check-email screen) / error. Calls `POST /api/auth/signup`. |

### Setup wizard (§13.4)

| File | Description |
|---|---|
| `src/components/setup/SetupWizard.tsx` | Client step state machine (steps 1–3) with step indicator chrome; passes departments from step 1 to step 2; redirects to `/dashboard` on finish. |
| `src/components/setup/StepDepartments.tsx` | Step 1 — pre-populated suggestion chips (Legal, Finance, HR, IT, Engineering, Procurement) + custom input; calls `POST /api/departments`; requires at least one before proceeding. |
| `src/components/setup/StepInviteUsers.tsx` | Step 2 (skippable) — invite form with role and conditional department select; calls existing `inviteUser` helper; shows invited list; skip/continue button. |
| `src/components/setup/StepSlack.tsx` | Step 3 (skippable) — Slack webhook URL input with inline test button; calls `testSlackWebhook` then `updateAccountSettings`; skip skips save. |

### Layout

| File | Description |
|---|---|
| `src/components/layout/AppLayout.tsx` | Server component — resolves session, fetches local user and badge counts; wraps content in `ToastProvider`, `OfflineBanner`, and `ErrorBoundary`. |
| `src/components/layout/Sidebar.tsx` | Permanent left nav with logo, navigation items, live badge counts (action required / renewals), and user identity footer. |

### UI primitives

| File | Description |
|---|---|
| `src/components/ui/StatusBadge.tsx` | Coloured dot + pill badge for contract status variants (active, expired, auto-renewed, action required, renewal due). |
| `src/components/ui/KpiCard.tsx` | Single KPI tile with a label and large number; supports green / amber / red value colouring. |
| `src/components/ui/Button.tsx` | Reusable button with `primary`, `secondary`, and `danger` variants in `sm` and `md` sizes. |
| `src/components/ui/EmptyState.tsx` | Centred empty-state panel with document icon, heading, subtext, and a CTA button. |
| `src/components/ui/Toast.tsx` | `ToastProvider` (context + state + auto-dismiss timer) and `ToastBadge` UI; success/error/warning variants; stacks bottom-right; auto-dismisses after 4 s (§14.6). |
| `src/components/ui/OfflineBanner.tsx` | Sticky top banner that appears on `window offline` and auto-dismisses on `window online`; exact §14.6 wording. |
| `src/components/ui/ErrorBoundary.tsx` | React class error boundary wrapping authenticated page content; catches rendering errors, captures to Sentry via `componentDidCatch`, and shows "Try again" fallback. |

### Dashboard

| File | Description |
|---|---|
| `src/components/dashboard/DashboardShell.tsx` | Client shell — onboarding checklist (localStorage dismissal), Action Required section, Upcoming Renewals section. |
| `src/components/dashboard/KpiRow.tsx` | Four-column grid of `KpiCard` tiles for the dashboard KPI row. |
| `src/components/dashboard/ContractTable.tsx` | Client-side filterable contract table used on the dashboard; supports `forceRenewalDueBadge` prop. |

### All Contracts

| File | Description |
|---|---|
| `src/components/contracts/ContractsShell.tsx` | Page shell — header with upload button, filter bar, empty states, and contract list. |
| `src/components/contracts/ContractFilters.tsx` | Client filter bar — pushes search/status/department/term/date params to URL on change. |
| `src/components/contracts/ContractTableFull.tsx` | Table + card toggle (localStorage preference), row count, and full contract list rendering. |
| `src/components/contracts/ContractCard.tsx` | Card-view variant showing vendor, entity, status badge, and a 2×2 detail grid. |

### Contract Detail

| File | Description |
|---|---|
| `src/components/contracts/detail/ContractDetailShell.tsx` | Split-pane root — left document viewer, right 384 px properties panel; owns selected-document state. |
| `src/components/contracts/detail/DocumentViewer.tsx` | Fetches signed URL on mount; renders PDF in iframe, offers download link for DOCX, shows loading/error states. |
| `src/components/contracts/detail/PropertiesPanel.tsx` | Tabbed right panel with Properties / Documents / Alerts tabs and underline active indicator. |
| `src/components/contracts/detail/PropertiesTab.tsx` | All §3.3 contract fields; editable inline for business owners and admins; confirm-action banner when status is action required. |
| `src/components/contracts/detail/EditableField.tsx` | Hover-to-reveal Edit button that expands to an inline input with Save/Cancel; uses `useTransition` for pending state. |
| `src/components/contracts/detail/DocumentsTab.tsx` | Groups documents by type; renewal documents shown as versioned history sorted newest-first; clicking a row drives the viewer. |
| `src/components/contracts/detail/AlertsTab.tsx` | Lists alerts with timing, channels, and sent date; Remove button per alert; "+ Add alert" reveals the form inline. |
| `src/components/contracts/detail/AddAlertForm.tsx` | Inline add-alert form — value/unit/reference dropdowns and email/Slack checkboxes; posts to the alerts API. |

### Upload

| File | Description |
|---|---|
| `src/components/upload/UploadShell.tsx` | Phase state machine (`upload → polling → review / error`) with 2 s polling interval and 60 s timeout. |
| `src/components/upload/UploadZone.tsx` | Drag-and-drop + click-to-browse file picker; client-side format and size validation before submission. |
| `src/components/upload/ExtractionReview.tsx` | Fetches vendors, departments, users on mount; full review form with vendor create-inline, owner checkboxes, and Confirm & Save. |
| `src/components/upload/ContractFormFields.tsx` | Extracted date / term / renewal fields with `ConfidenceIndicator` next to each label. |
| `src/components/upload/ConfidenceIndicator.tsx` | Green / amber / gray dot per §12.5 confidence level; `title` attribute shows full label on hover. |
| `src/components/upload/OwnerSelect.tsx` | Checkbox list for multi-owner assignment; extracted from `ExtractionReview` to respect the 200-line limit. |

### Renewals

| File | Description |
|---|---|
| `src/components/renewals/RenewalsShell.tsx` | Filter bar (department dropdown + notice-deadline date range, URL-param driven) and contract table with amber renewal-due badges. |

### Action Required

| File | Description |
|---|---|
| `src/components/action-required/ActionRequiredShell.tsx` | Custom table with an Action column; per-row `ConfirmButton` using `useTransition`; confirmed rows removed from local state. Admins can confirm any contract; business owners only their own. |

### Vendors

| File | Description |
|---|---|
| `src/components/vendors/VendorList.tsx` | Searchable vendor table (client-side name filter) showing name and contract count; each row links to vendor detail. |
| `src/components/vendors/VendorDetail.tsx` | Vendor header (name, contact name/email, contract count) with admin edit toggle; status-dropdown-filtered contract table below. |
| `src/components/vendors/VendorEditForm.tsx` | Inline form for vendor name, contact name, and contact email; on save calls PATCH then `router.refresh()`. |

### Settings — Users

| File | Description |
|---|---|
| `src/components/settings/users/UserTable.tsx` | Table of all team members; per-row role and department dropdowns trigger API calls on `onChange`; deactivate button with browser confirm removes the row on success. |
| `src/components/settings/users/InviteUserForm.tsx` | Grid form with name, email, role, and conditional department select (visible only for department owner role); clears and refreshes on success. |

### Settings — Departments

| File | Description |
|---|---|
| `src/components/settings/departments/DepartmentList.tsx` | Active department list with inline rename (text input in-place) and deactivate-with-confirm; deactivated items shown as strikethrough below; add-department form at the bottom. |

### Settings — Account

| File | Description |
|---|---|
| `src/components/settings/account/AccountSettingsForm.tsx` | Company name field and Slack webhook URL input with an inline "Send test" button; test calls `/api/settings/account/test-slack` and shows inline green/red feedback. |
| `src/components/settings/account/BillingSection.tsx` | Plan badge, trial countdown, seat count, Starter usage meters (contracts / users / AI extractions), upgrade prompts on limit-reached, "Manage billing" (Stripe portal) and plan checkout buttons (§15). |

### Settings — Profile

| File | Description |
|---|---|
| `src/components/settings/profile/ProfileForm.tsx` | Sections for Identity (name, email), Slack (Slack user ID with helper text), and Notification Preferences (explanatory note linking to per-contract alert configuration). |
