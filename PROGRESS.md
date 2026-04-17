# Contrakt — build progress

Files created to date, organised by layer.

---

## Config & types

| File | Description |
|---|---|
| `prisma/schema.prisma` | Full Prisma schema — 10 tables (added `GroupEntity`); `internalGroupEntity` made nullable on `Contract`; `groupEntityId` FK added to `Contract`; `TenantPlan` + `TenantPlanStatus` enums and 6 billing fields on `Tenant` (§15). |
| `prisma.config.ts` | Prisma 7 external config; moves the database URL out of the schema file. |
| `src/types/index.ts` | All TypeScript interfaces and `const`+union enums. Added `GroupEntity` interface. `Contract` gains `groupEntityId: string | null` and `internalGroupEntity: string | null`. `ContractSummary` replaces `internalGroupEntity: string` with `groupEntity: { id; name } | null`. `ContractWithRelations` gains `groupEntity: GroupEntity | null`. `CreateContractInput` uses `groupEntityId` instead of `internalGroupEntity`. |
| `src/env.ts` | `@t3-oss/env-nextjs` + Zod schema validating all 18 required env vars at startup; optional vars (Upstash, Sentry) use `.optional()` so dev runs without them; imported by `client.ts` and `stripe.ts`. |
| `src/proxy.ts` | Auth0 session handling + per-route rate limiting: strict for /api/auth/signup, relaxed for GET, standard for all other mutations; 429 response with Retry-After when exceeded. (Renamed from `middleware.ts` per Next.js 16 deprecation.) |
| `next.config.ts` | Applies `getSecurityHeaders()` to all routes via the Next.js `headers()` config hook. |
| `sentry.client.config.ts` | Sentry browser-side init — reads `NEXT_PUBLIC_SENTRY_DSN`; 10 % trace sampling; replay integration with full text+media masking; no-op when DSN is absent. |
| `sentry.server.config.ts` | Sentry Node.js-side init — reads `SENTRY_DSN`; 10 % trace sampling; no-op when DSN is absent. |
| `.env.local` | Placeholder env vars — Auth0, PostgreSQL, Anthropic, Stripe (§15), Upstash Redis (rate limiting), Sentry DSN. |
| `src/app/globals.css` | Design system foundation. System font stack (`-apple-system`, SF Pro Display), CSS custom properties (`--primary: #1a7f4b`, `--green-900` through `--green-100`), global input/select/textarea styles with #1a7f4b focus ring, `.fade-in` keyframe (120 ms), `.prop-row` border utility. |

---

## Database layer

| File | Description |
|---|---|
| `src/lib/db/client.ts` | Prisma 7 singleton using `PrismaPg` adapter; pinned to `globalThis` for hot-reload safety; imports `@/env` to trigger validation on startup. |
| `src/lib/db/tenants.ts` | `getTenantById`, `updateTenant` — tenant record queries. |
| `src/lib/db/users.ts` | `getUserById`, `getUserByAuth0Id`, `getUsersByTenant`, `createUser`, `updateUser`, `deactivateUser`. |
| `src/lib/db/contracts.ts` | Core contract CRUD. `CreateContractData` and `UpdateContractData` use `groupEntityId: string | null` instead of `internalGroupEntity`. `contractWithRelations` include now fetches `groupEntity`. |
| `src/lib/db/contractHelpers.ts` | Shared helpers used by `dashboard.ts` and `contractsFiltered.ts`. `summaryInclude` now includes `groupEntity: { select: { id, name } }`. `toSummary` maps `groupEntity` instead of `internalGroupEntity`. |
| `src/lib/db/contractsFiltered.ts` | `getContractsFiltered` — role-aware query with status, department, term type, auto-renewal, date range, and free-text search filters. |
| `src/lib/db/dashboard.ts` | `getDashboardKpis` (2 KPIs: total + actionRequired), `getActiveContracts` (excludes 60-day window, take 15), `getActionRequiredContracts` (no limit), `getUpcomingRenewalsContracts` (60-day OR logic, take 15), `getBadgeCounts` (actionRequired only), `getOnboardingState`. Renewals KPI and `renewalWindow` helper removed. |
| `src/lib/db/groupEntities.ts` | **New.** `getGroupEntitiesByTenant` (active only), `createGroupEntity`, `deactivateGroupEntity` — full CRUD for the GroupEntity model. |
| `src/lib/db/vendors.ts` | `VendorContractRow` now uses `groupEntity: { id; name } | null` (replacing `internalGroupEntity`). Prisma select updated to fetch the relation. |
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
| `src/lib/services/contracts.ts` | `calculateDurationMonths` (fixed: now uses `Math.max(1, Math.round(days / 30.44))` — correct for ranges like "01 Apr → 30 Apr" = 1 month), `calculateNoticeDeadline`, `determineInitialStatus`, `buildCreateContractData` (passes `groupEntityId`). |
| `src/lib/services/extraction.ts` | `convertToText` (pdf-parse / mammoth), `extractContractProperties` (Claude API, §12.3 prompt, §12.4 schema), `handleExtractionFailure` (§12.6 all-null fallback). |
| `src/lib/services/extractionJobs.ts` | In-memory job store (`createJob`, `getJob`, `completeJob`, `failJob`) for tracking async extraction pipeline status. |
| `src/lib/utils/contractStatus.ts` | **New.** `getDisplayStatus(contract)` — shared utility returning `"renewal_due"` for Active contracts whose `renewalNoticeDeadline ?? endDate` falls within 60 days. Used by all contract tables and cards for consistent badge display. |

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
| `src/app/api/contracts/route.ts` | `GET` list (role-filtered) and `POST` create. Input parser now accepts `groupEntityId: string | null` instead of `internalGroupEntity`. |
| `src/app/api/contracts/[id]/route.ts` | `GET` single contract, `PATCH` update, `DELETE` (admin only). PATCH parser accepts `groupEntityId` and all editable fields (department, owners, groupEntity, dates, term, autoRenewal, notice period). |
| `src/app/api/contracts/[id]/confirm-action/route.ts` | `POST` — marks action taken, resets status to Active; idempotent. |
| `src/app/api/contracts/[id]/documents/route.ts` | `GET` list and `POST` upload linked documents for a contract. |
| `src/app/api/contracts/[id]/alerts/route.ts` | `GET` list and `POST` create notification alerts for a contract. |
| `src/app/api/contracts/[id]/alerts/[alertId]/route.ts` | `PATCH` update and `DELETE` remove a specific alert. |
| `src/app/api/documents/[docId]/url/route.ts` | `GET` — returns a signed GCS URL for viewing a document (placeholder; GCS not yet wired). |
| `src/app/api/group-entities/route.ts` | **New.** `GET` list active group entities for tenant. `POST` create (admin only). |
| `src/app/api/group-entities/[id]/route.ts` | **New.** `DELETE` soft-deactivates a group entity (admin only). |
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
| `src/app/layout.tsx` | Root HTML shell; Geist font removed, system font inherited from globals.css; `h-full antialiased` className. |
| `src/app/page.tsx` | Root redirect to `/dashboard`. |
| `src/app/not-found.tsx` | Global 404 page — #f5f5f7 background, 22px/600 heading, #1a7f4b "Go to dashboard" CTA. |
| `src/app/error.tsx` | Root Next.js error page (§14.6) — same shell as not-found; captures to Sentry; #1a7f4b "Try again" button calls `unstable_retry`. |
| `src/app/(auth)/layout.tsx` | Minimal centred layout for public auth pages — #f5f5f7 background, white 0.5px-border 12px-radius card, 32px padding. |
| `src/app/(auth)/signup/page.tsx` | Sign-up page (§13.2) — redirects to `/dashboard` if already authenticated; inline-styled heading and subtext; renders `SignupForm`. |
| `src/app/(app)/layout.tsx` | Authenticated route group layout — wraps every protected page in `AppLayout`. |
| `src/app/(app)/dashboard/page.tsx` | Home page (titled "Home") — fetches KPIs, active contracts, action-required contracts, and onboarding state in parallel; passes both contract lists to `DashboardShell`. |
| `src/app/(app)/setup/page.tsx` | Workspace setup wizard page (§13.4) — admin only; redirects non-admins; skips to dashboard if setup already complete; renders `SetupWizard`. |
| `src/app/(app)/contracts/page.tsx` | All Contracts page — reads URL search params, calls `getContractsFiltered`, passes data to `ContractsShell`. |
| `src/app/(app)/contracts/[id]/page.tsx` | Contract Detail page — fetches full contract with relations, computes `canEdit`, renders `ContractDetailShell`. |
| `src/app/(app)/contracts/new/page.tsx` | Upload Contract page — renders `UploadShell` which orchestrates the full upload → extract → review flow. |
| `src/app/(app)/action-required/page.tsx` | Action Required page — fetches action-required contracts; passes `isAdmin` and `canConfirm` flags to the shell. |
| `src/app/(app)/vendors/page.tsx` | Vendor Directory page — fetches all vendors with contract counts. |
| `src/app/(app)/vendors/[id]/page.tsx` | Vendor Detail page — fetches vendor with full contract list (including department + owners); 404s via `notFound()`. |
| `src/app/(app)/settings/page.tsx` | **New.** Role-based redirect — admins land on `/settings/account`, all others on `/settings/profile`. |
| `src/app/(app)/settings/users/page.tsx` | User Management page — admin only; redirects non-admins; fetches all users and departments in parallel. Now part of Settings sub-navigation. |
| `src/app/(app)/settings/departments/page.tsx` | Department Management page — admin only; redirects non-admins; fetches all departments. |
| `src/app/(app)/settings/group-entities/page.tsx` | **New.** Group Entity Management page — admin only; fetches active group entities; renders `GroupEntityList`. |
| `src/app/(app)/settings/account/page.tsx` | Account Settings page — admin only; redirects non-admins; fetches tenant settings. |
| `src/app/(app)/settings/profile/page.tsx` | Profile & Notifications page — accessible by all users; fetches current user via `resolveAuthContext`. |

---

## Components

### Auth

| File | Description |
|---|---|
| `src/components/auth/SignupForm.tsx` | Client sign-up form — company name, name, email, password; phases: idle → submitting → success (check-email screen) / error. Success state: #e6f4ec icon circle + #1a7f4b dev-continue link. Calls `POST /api/auth/signup`. |

### Setup wizard (§13.4)

| File | Description |
|---|---|
| `src/components/setup/SetupWizard.tsx` | #f5f5f7 full-screen shell with white 0.5px-border 12px-radius card. Step indicator: #171717 circle (current), #1a7f4b circle (done), rgba inactive; 0.5px hairline connectors. |
| `src/components/setup/StepDepartments.tsx` | Suggestion chips: rgba(26,127,75,0.06) bg + #1a7f4b text when added. Secondary "Add" button. #1a7f4b "Continue" primary button. |
| `src/components/setup/StepInviteUsers.tsx` | 2-col grid for name/email. Secondary "Send invite" button. Invited list: #1a7f4b dot + muted text. #1a7f4b "Continue / Skip for now" primary button. |
| `src/components/setup/StepSlack.tsx` | Secondary "Send test notification" button. #1a7f4b text on success, #c0392b on failure. Secondary "Skip" + #1a7f4b "Save and finish" button pair. |

### Layout

| File | Description |
|---|---|
| `src/components/layout/AppLayout.tsx` | Server component — resolves session, fetches local user and badge counts; wraps content in `ToastProvider`, `OfflineBanner`, and `ErrorBoundary`. Page background #f5f5f7. |
| `src/components/layout/Sidebar.tsx` | White sidebar, dark text. Main nav active state: rgba(0,0,0,0.05) background + #171717 text. Settings sub-nav active state: #1a7f4b text only (no background). Live `actionRequired` badge. |

### UI primitives

| File | Description |
|---|---|
| `src/components/ui/StatusBadge.tsx` | Pill-only badge (dot removed). Active: #e6f4ec/#1a7f4b. Renewal due: #fff3e0/#b45309. Expired/other: rgba muted. All via inline `CONFIG` record. |
| `src/components/ui/KpiCard.tsx` | White card, 0.5px border, 12px radius. Label 12px muted, value 28px/600/-0.04em. Hover darkens border. |
| `src/components/ui/Button.tsx` | `primary`: #1a7f4b bg + white text. `secondary`: rgba(0,0,0,0.05) bg + 0.5px border. `danger`: same as secondary + #c0392b text. Padding via inline `SIZE_STYLE` (sm: 5px 12px, md: 7px 16px). |
| `src/components/ui/EmptyState.tsx` | White card, 0.5px border, 12px radius, 48px padding. Muted document icon, 14px/500 heading, 13px muted subtext, #1a7f4b CTA button. |
| `src/components/ui/Toast.tsx` | White card per toast, 0.5px border, 12px radius, modal shadow. Variant colour on icon only; message text always #171717. Auto-dismisses after 4 s. |
| `src/components/ui/OfflineBanner.tsx` | #fff3e0 background, #b45309 text, 0.5px border-bottom. Sticky top, appears on `window offline`, auto-dismisses on `window online`. |
| `src/components/ui/ErrorBoundary.tsx` | React class error boundary; rgba(0,0,0,0.05) icon circle, 14px/500 heading, #1a7f4b "Try again" button; captures to Sentry via `componentDidCatch`. |

### Dashboard (Home)

| File | Description |
|---|---|
| `src/components/dashboard/DashboardShell.tsx` | 28px/32px padding. 22px/600/-0.03em page title, client-side date subtitle. Secondary "Add contract" button top-right. Two sections with 15px/600 headers and "View all →" #1a7f4b links. Onboarding checklist card (localStorage dismissal, admin-only). |
| `src/components/dashboard/KpiRow.tsx` | Two KpiCard tiles: Total contracts and Action required, both linking to their respective pages. |
| `src/components/dashboard/ContractTable.tsx` | White card table, 0.5px border, 12px radius. TH: 11px/500/muted/uppercase. TD: 13px/40px height/0.5px row borders. Row hover rgba(0,0,0,0.02). Uses `getDisplayStatus()` for badge. |

### All Contracts

| File | Description |
|---|---|
| `src/components/contracts/ContractsShell.tsx` | Page shell — 22px/600 title, secondary "Add contract" button top-right, filter bar, empty states. |
| `src/components/contracts/ContractFilters.tsx` | Single flex row, 8px gap. 280px search input, 34px-height selects. "Clear filters" as plain muted text button. No label wrappers. |
| `src/components/contracts/ContractTableFull.tsx` | Same table pattern as ContractTable + Apple segmented control (gray pill / white active tab) for table/card toggle. Row count left-aligned muted text. |
| `src/components/contracts/ContractCard.tsx` | White card, 0.5px border, 12px radius. Hover border darkens. Vendor 13px/500, group entity 11px muted, metadata as dl grid. |

### Contract Detail

| File | Description |
|---|---|
| `src/components/contracts/detail/ContractDetailShell.tsx` | Split-pane: left pane #f5f5f7 with 0.5px right border, right panel 380px white. 44px header. "← Contracts" muted/hover-green back button. |
| `src/components/contracts/detail/DocumentViewer.tsx` | Fetches signed URL on mount; PDF in iframe; #1a7f4b download button for DOCX; loading/error states use design-token colors. |
| `src/components/contracts/detail/PropertiesPanel.tsx` | Tab bar with 0.5px bottom border. Active tab: #1a7f4b text + 2px solid underline with -0.5px margin to overlap border. Content: 20px/24px padding. |
| `src/components/contracts/detail/PropertiesTab.tsx` | Vendor name 16px/600/-0.02em. Field rows via `.prop-row` CSS class (40% label / flex-1 value). SectionLabel dividers. Action banner: #fdecea bg. |
| `src/components/contracts/detail/EditableField.tsx` | Read mode: Edit button opacity-0 → group-hover → #1a7f4b. Edit mode: input + #1a7f4b Save text / muted Cancel. Toggle: #1a7f4b active pill / rgba inactive. |
| `src/components/contracts/detail/EditableOwnersField.tsx` | Inline owner editor — names in read mode; `OwnerSelect` multi-select pill autocomplete in edit mode with Save/Cancel. |
| `src/components/contracts/detail/DocumentsTab.tsx` | Three-column rows (filename/TypeBadge pill/date). Selected: rgba(26,127,75,0.06) bg + #1a7f4b text. Renewal versions indented with left border. |
| `src/components/contracts/detail/AlertsTab.tsx` | Timing left + ChannelPill components + sent date #1a7f4b. Remove button: opacity-0 → group-hover → #c0392b. |
| `src/components/contracts/detail/AddAlertForm.tsx` | Inline with 0.5px top border. Flex row controls. #1a7f4b Save text / muted Cancel. |

### Upload

| File | Description |
|---|---|
| `src/components/upload/UploadShell.tsx` | Phase state machine (`upload → polling → review / error`). PageHeader component (22px title + 13px subtitle). PollingDots animation. #1a7f4b spinner accent. 2 s polling, 60 s timeout. |
| `src/components/upload/UploadZone.tsx` | 0.5px dashed border drop zone; solid #1a7f4b + rgba tint on drag-over. File pill with × remove. #1a7f4b full-width upload button. |
| `src/components/upload/ExtractionReview.tsx` | Two-column layout: 55% AI preview / 45% editable form. "EXTRACTED BY AI" + "CONTRACT DETAILS" section labels. Full-width #1a7f4b save button. |
| `src/components/upload/ContractFormFields.tsx` | Single-column 16px gap. ConfidenceIndicator dot inline with label. Auto-renewal as Yes/No pill toggle. Notice period wrapped in `.fade-in`. |
| `src/components/upload/ConfidenceIndicator.tsx` | 6px dot: #1a7f4b (high), #d97706 (medium), rgba(0,0,0,0.2) (low/absent). Hover tooltip via useState. |
| `src/components/upload/OwnerSelect.tsx` | rgba(0,0,0,0.06) pills with × remove. Dropdown: white card, 0.5px border, 8px radius, modal shadow. Hover: rgba(0,0,0,0.03) bg on option rows. |

### Action Required

| File | Description |
|---|---|
| `src/components/action-required/ActionRequiredShell.tsx` | 22px/600 page header. Same TH/TD table constants. ConfirmButton: #1a7f4b text + rgba(26,127,75,0.3) border + hover rgba fill. `fadingIds` Set for 200 ms opacity fade before row removal. Inline empty state (no EmptyState component — no CTA needed). |

### Vendors

| File | Description |
|---|---|
| `src/components/vendors/VendorList.tsx` | 28px/32px padding. 22px/600 title. #1a7f4b "Add vendor" link. 280px search input. White card table, consistent TH/TD constants. Row hover. |
| `src/components/vendors/VendorDetail.tsx` | Breadcrumb with hover-green links. 22px/600 vendor name. dl metadata. Edit card: white 0.5px-border 12px-radius, 14px/600 title. Contract table with StatusBadge. |
| `src/components/vendors/VendorEditForm.tsx` | 12px/500 field labels. Inline inputs. #1a7f4b "Save changes" primary + muted "Cancel" text button. |

### Settings — Users

| File | Description |
|---|---|
| `src/components/settings/users/UserTable.tsx` | Row count above table. Compact selects (height 30px). Name + email stacked in one cell. Deactivate: opacity-0 group-hover → #c0392b. Consistent TH/TD. |
| `src/components/settings/users/InviteUserForm.tsx` | White card, 0.5px border, 12px radius, 16px/20px padding. 14px/600 title. 2-col name/email grid. Department field `.fade-in` when role=DepartmentOwner. Right-aligned #1a7f4b submit. |

### Settings — Departments

| File | Description |
|---|---|
| `src/components/settings/departments/DepartmentList.tsx` | White card, ROW_STYLE (flex, 40px, 0.5px border-bottom). Hover-only Rename/Deactivate. Inline rename: Save (#1a7f4b) / Cancel (muted). Inactive: strikethrough muted. Add form with 0.5px top border. |

### Settings — Group Entities

| File | Description |
|---|---|
| `src/components/settings/group-entities/GroupEntityList.tsx` | Same card/row pattern as DepartmentList without rename. Deactivate: opacity-0 group-hover → #c0392b. Add form at bottom. |

### Settings — Account

| File | Description |
|---|---|
| `src/components/settings/account/AccountSettingsForm.tsx` | Three SECTION_DIVIDER sections (Company / Slack / Tenant). Test result uses `.fade-in`. Right-aligned #1a7f4b save. |
| `src/components/settings/account/BillingSection.tsx` | Plan + trial pill badges. UsageMeter: 180px label / flex 4px bar (#1a7f4b fill, red at limit) / 60px count. BTN_PRIMARY (#1a7f4b) + BTN_SECONDARY constants. |

### Settings — Profile

| File | Description |
|---|---|
| `src/components/settings/profile/ProfileForm.tsx` | Three SECTION_DIVIDER sections (Identity / Slack / Notification Preferences). Notification Preferences section explains per-contract alert config. Right-aligned #1a7f4b save. |
