# Contrakt — build progress

Files created to date, organised by layer.

---

## Config & types

| File | Description |
|---|---|
| `prisma/schema.prisma` | Full Prisma schema — 10 tables (added `GroupEntity`); `internalGroupEntity` made nullable on `Contract`; `groupEntityId` FK added to `Contract`; `TenantPlan` + `TenantPlanStatus` enums and 6 billing fields on `Tenant` (§15). `User.auth0Id` renamed to `User.clerkId` (DB column `clerk_id`). `Tenant.setupComplete Boolean @default(false)` added — gates dashboard access. |
| `prisma.config.ts` | Prisma 7 external config; moves the database URL out of the schema file. |
| `src/types/index.ts` | All TypeScript interfaces and `const`+union enums. Added `GroupEntity` interface. `Contract` gains `groupEntityId: string | null` and `internalGroupEntity: string | null`. `ContractSummary` replaces `internalGroupEntity: string` with `groupEntity: { id; name } | null` and adds `autoRenewal: boolean`. `ContractWithRelations` gains `groupEntity: GroupEntity | null`. `CreateContractInput` uses `groupEntityId`. `User.auth0Id` renamed to `User.clerkId`. `Tenant` gains `setupComplete: boolean`. |
| `src/env.ts` | `@t3-oss/env-nextjs` + Zod schema validating all required env vars at startup. Clerk vars: `CLERK_SECRET_KEY` (server), `CLERK_WEBHOOK_SECRET` (optional), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (client). Optional vars (Upstash, Sentry, Stripe, Resend) use `.optional()` so dev runs without them. |
| `src/proxy.ts` | Clerk middleware via `clerkMiddleware()` from `@clerk/nextjs/server`. Public routes: `/sign-in(.*)`, `/sign-up(.*)`, `/api/billing/webhook`, `/api/webhooks/clerk`. All other routes require authentication via `auth.protect()`. Named `proxy` export per Next.js 16 convention. |
| `next.config.ts` | Applies `getSecurityHeaders()` to all routes via the Next.js `headers()` config hook. |
| `sentry.client.config.ts` | Sentry browser-side init — reads `NEXT_PUBLIC_SENTRY_DSN`; 10 % trace sampling; replay integration with full text+media masking; no-op when DSN is absent. |
| `sentry.server.config.ts` | Sentry Node.js-side init — reads `SENTRY_DSN`; 10 % trace sampling; no-op when DSN is absent. |
| `.env.local` | Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`), Clerk redirect URLs, `APP_BASE_URL`, PostgreSQL, Anthropic, Stripe (§15), Upstash Redis, Sentry DSN, Cloudflare R2. |
| `src/app/globals.css` | Design system foundation. System font stack (`-apple-system`, SF Pro Display), CSS custom properties (`--primary: #1a1a1a`), global input/select/textarea styles with dark focus ring, `.fade-in` keyframe (120 ms), `.prop-row` border utility. Green palette (`#1a7f4b`, `--green-*`) fully replaced with dark (`#1a1a1a`) across all components. |

---

## Database layer

| File | Description |
|---|---|
| `src/lib/db/client.ts` | Prisma 7 singleton using `PrismaPg` adapter; pinned to `globalThis` for hot-reload safety; imports `@/env` to trigger validation on startup. |
| `src/lib/db/tenants.ts` | `getTenantById`, `getTenantBySlug`, `createTenant`, `updateTenant` — tenant record queries. |
| `src/lib/db/users.ts` | `getUserById`, `getUserByClerkId`, `getUserByEmail`, `getUsersByTenant`, `createUser`, `updateUser`, `deactivateUser`. `UpdateUserInput` includes `clerkId`. All `auth0Id` references renamed to `clerkId`. |
| `src/lib/db/contracts.ts` | Core contract CRUD. `CreateContractData` and `UpdateContractData` use `groupEntityId: string | null`. `contractWithRelations` include fetches `groupEntity`. |
| `src/lib/db/contractHelpers.ts` | Shared helpers used by `dashboard.ts` and `contractsFiltered.ts`. `summaryInclude` fetches `groupEntity: { select: { id, name } }`. `toSummary` maps `groupEntity` and `autoRenewal` into `ContractSummary`. |
| `src/lib/db/contractsFiltered.ts` | `getContractsFiltered` — role-aware query with status, department, term type, auto-renewal, date range, and free-text search filters. |
| `src/lib/db/dashboard.ts` | `getDashboardKpis`, `getActiveContracts`, `getActionRequiredContracts`, `getUpcomingRenewalsContracts`, `getBadgeCounts`, `getOnboardingState`. |
| `src/lib/db/notifications.ts` | `AlertWithContract` interface with computed `alertDate` field. `getUpcomingAlerts`, `getAllUpcomingAlerts`, `getSentAlerts`, `getAllSentAlerts`, `getContractOptions`. Role filtering via `contractRelationFilter`. |
| `src/lib/db/groupEntities.ts` | `getGroupEntitiesByTenant` (active only), `createGroupEntity`, `deactivateGroupEntity`. |
| `src/lib/db/vendors.ts` | `VendorContractRow` uses `groupEntity: { id; name } | null` and `autoRenewal: boolean`. |
| `src/lib/db/departments.ts` | `getDepartmentsByTenant`, `getDepartmentById`, `createDepartment`, `renameDepartment`, `deactivateDepartment`. |
| `src/lib/db/documents.ts` | `getDocumentsByContract`, `getDocumentById`, `createDocument`, `deleteDocument`, `getLatestRenewalVersion`. |
| `src/lib/db/alerts.ts` | `getAlertsByContract`, `getAlertById`, `createAlert`, `updateAlert`, `deleteAlert`. |
| `src/lib/db/settings.ts` | `getTenantSettings`, `updateTenantSettings`. `UpdateTenantSettingsData` accepts `setupComplete?: boolean`, `plan?: TenantPlan`, `planStatus?: TenantPlanStatus`. |
| `src/lib/db/billing.ts` | `updateTenantBilling`, `getTenantByStripeCustomerId`, `getTenantByStripeSubscriptionId`. |
| `src/lib/db/extractionResults.ts` | `saveExtractionResult`, `getExtractionResultByDocument`. |

---

## Services

| File | Description |
|---|---|
| `src/lib/security/rateLimit.ts` | Upstash sliding-window rate limiter; three tiers: strict 20/min (auth), standard 60/min (mutations), relaxed 200/min (reads); lazy Redis init; fails open when Redis is unconfigured. |
| `src/lib/security/headers.ts` | `getSecurityHeaders()` — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP, Permissions-Policy. CSP `script-src` includes `*.clerk.com`, `*.clerk.accounts.dev`, `challenges.cloudflare.com`. `connect-src` and `frame-src` include same Clerk + Cloudflare domains. |
| `src/lib/security/sanitize.ts` | `sanitizeText`, `sanitizeEmail`, `validateUUID` — boundary-level input sanitisation helpers. |
| `src/lib/services/stripe.ts` | Stripe v22 singleton + helpers: `createCustomer`, `createCheckoutSession`, `createPortalSession`, `getSubscription`, `cancelSubscription`, `syncSeatCount`. |
| `src/lib/services/notifications.ts` | Resend email and Slack Incoming Webhook helpers (backend only — no frontend UI); both retry up to 3 times with exponential backoff; failures logged but never thrown. Invites are sent via Clerk's `/v1/invitations` API, not Resend. |
| `src/lib/services/planLimits.ts` | `getPlanUsage`, `checkContractLimit`, `checkUserLimit`, `checkExtractionLimit`. |
| `src/lib/auth/session.ts` | Clerk-based auth helpers. `resolveAuthContext(options?)` — gets `userId` from `auth()`, looks up DB user by `clerkId`, resolves tenant; enforces `planStatus` (canceled/read_only → 403) and `setupComplete` gate (bypassed via `{ skipSetupCheck: true }`); returns `{ localUser, tenant, tenantId, isPastDue }`. `requireRole(role, options?)` — resolves context and asserts role; accepts single role or array; forwards `AuthOptions`. |
| `src/lib/api/response.ts` | `ok`, `created`, `notFound`, `forbidden`, `badRequest`, `handleError`. |
| `src/lib/services/contracts.ts` | `calculateDurationMonths`, `calculateNoticeDeadline`, `determineInitialStatus`, `buildCreateContractData`. |
| `src/lib/services/extraction.ts` | `convertToText` (pdf-parse / mammoth), `extractContractProperties` (Claude API), `handleExtractionFailure`. |
| `src/lib/services/extractionJobs.ts` | In-memory job store: `createJob`, `getJob`, `completeJob`, `failJob`. |
| `src/lib/utils/contractStatus.ts` | `getDisplayStatus(contract)` — derives display badge from `autoRenewal`, `renewalNoticeDeadline`, and `endDate`. |

---

## Client-side API helpers

| File | Description |
|---|---|
| `src/lib/api/auth.ts` | **Retired** — stub only; all new signups go through the Clerk webhook. |
| `src/lib/hooks/useToast.ts` | `useToast()` hook — provides `showToast(message, variant?)`. |
| `src/lib/api/billing.ts` | `startCheckout(plan)`, `openBillingPortal()`. |
| `src/lib/api/contracts.ts` | `confirmAction(contractId)`. |
| `src/lib/api/vendors.ts` | `updateVendor(id, data)`. |
| `src/lib/api/users.ts` | `inviteUser`, `updateUserRole`, `deactivateUser`, `updateMyProfile`. |
| `src/lib/api/departments.ts` | `createDepartment`, `renameDepartment`, `deactivateDepartment`. |
| `src/lib/api/settings.ts` | `updateAccountSettings`. |

---

## API routes

| File | Description |
|---|---|
| `src/app/api/auth/signup/route.ts` | **Retired** — returns 410 Gone. All new signups go through the Clerk `user.created` webhook. |
| `src/app/api/webhooks/clerk/route.ts` | `POST` — Clerk webhook receiver. Verifies Svix signature. On `user.created`: idempotency check by Clerk ID; if email matches any existing DB user (invited or deactivated), updates their clerkId uniformly (re-signup recovery); otherwise provisions a new `Tenant` + admin `User`. On `user.deleted`: looks up DB user by clerkId and deletes them if found. |
| `src/app/api/billing/checkout/route.ts` | `POST` — admin only; provisions Stripe customer, creates hosted Checkout Session. Quantity hardcoded to 1 (flat-rate plans). `success_url` → `GET /api/setup/complete?redirect=/dashboard`; `cancel_url` → `/setup?step=3`. |
| `src/app/api/setup/complete/route.ts` | `PATCH` — admin only (`skipSetupCheck: true`); sets `setupComplete: true`; atomically writes `plan: Free, planStatus: Active` for free-plan tenants. `GET` — called by Stripe `success_url`; same write + redirects to `?redirect=` param (validated to start with `/`). |
| `src/app/api/billing/portal/route.ts` | `POST` — admin only; creates Stripe Customer Portal session. |
| `src/app/api/billing/webhook/route.ts` | `POST` — Stripe webhook receiver; handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. `priceIdToPlan` returns `TenantPlan \| null`; unknown price IDs return 400 (Stripe retry). After a plan update, checks seat overage — sets `planStatus: ReadOnly` if active users exceed the new plan's limit. |
| `src/app/api/contracts/route.ts` | `GET` list (role-filtered) and `POST` create (admin only; enforces `checkContractLimit`). |
| `src/app/api/contracts/[id]/route.ts` | `GET` single contract, `PATCH` update, `DELETE` (admin only). |
| `src/app/api/contracts/[id]/confirm-action/route.ts` | `POST` — marks action taken, resets status to Active; idempotent. |
| `src/app/api/contracts/[id]/documents/route.ts` | `GET` list and `POST` upload linked documents. |
| `src/app/api/contracts/[id]/alerts/route.ts` | `GET` list and `POST` create notification alerts. |
| `src/app/api/contracts/[id]/alerts/[alertId]/route.ts` | `PATCH` update and `DELETE` remove a specific alert. |
| `src/app/api/documents/[docId]/url/route.ts` | `GET` — returns a signed R2 URL (1-hour expiry). |
| `src/app/api/group-entities/route.ts` | `GET` list active group entities. `POST` create (admin only). |
| `src/app/api/group-entities/[id]/route.ts` | `DELETE` soft-deactivates a group entity (admin only). |
| `src/app/api/vendors/route.ts` | `GET` list (role-scoped) and `POST` create (admin only via `requireRole([UserRole.Admin])`). |
| `src/app/api/vendors/[id]/route.ts` | `GET` vendor with contracts and `PATCH` update (admin only). |
| `src/app/api/users/route.ts` | `GET` all users in tenant (admin only). |
| `src/app/api/users/invite/route.ts` | `POST` — enforces `checkUserLimit`; validates no duplicate email (409); creates a local user record with placeholder `clerkId`; calls Clerk's `/v1/invitations` (best-effort). |
| `src/app/api/users/[id]/route.ts` | `PATCH` update role/department and `DELETE` deactivate (admin only). |
| `src/app/api/users/me/route.ts` | `PATCH` — update own profile. |
| `src/app/api/departments/route.ts` | `GET` list and `POST` create departments. |
| `src/app/api/departments/[id]/route.ts` | `PATCH` rename and `DELETE` deactivate (admin only). |
| `src/app/api/settings/account/route.ts` | `GET` and `PATCH` tenant account settings (admin only). |
| `src/app/api/settings/account/test-slack/route.ts` | `POST` — sends a test Slack message via the backend helper; frontend Slack settings UI has been removed. |
| `src/app/api/upload/route.ts` | `POST` — enforces `checkExtractionLimit`; validates file, creates extraction job, fires pipeline. |
| `src/app/api/upload/[jobId]/status/route.ts` | `GET` — returns job status for polling. |
| `src/app/api/upload/[jobId]/result/route.ts` | `GET` — returns extracted fields once job is complete. |

---

## Pages

| File | Description |
|---|---|
| `src/app/layout.tsx` | Root HTML shell. `<ClerkProvider>` wraps `<html>/<body>`. System font, `h-full antialiased`. |
| `src/app/page.tsx` | Root redirect to `/dashboard`. |
| `src/app/not-found.tsx` | Global 404 page. |
| `src/app/error.tsx` | Root error page — captures to Sentry; "Try again" button. |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Clerk-hosted sign-in page — renders `<SignIn />` centered on `#f5f5f7`. |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Clerk-hosted sign-up page — renders `<SignUp />` centered on `#f5f5f7`. |
| `src/app/(auth)/layout.tsx` | Minimal centred layout for public auth pages. |
| `src/app/(app)/layout.tsx` | Authenticated route group layout — wraps every protected page in `AppLayout`. |
| `src/app/(app)/dashboard/page.tsx` | Home page — fetches KPIs, active contracts, upcoming renewals, and onboarding state. |
| `src/app/(setup)/setup/page.tsx` | Setup wizard — requires only a valid Clerk session (no DB user needed). If DB user exists: admin sees wizard (redirects to `/dashboard` if `setupComplete`); non-admin sees a styled "Only administrators can complete setup" message card. Accepts `?step=N` (1-indexed, 1–3) to resume — used by Stripe cancel redirect. If no DB user: checks Clerk email — redirects to `/sign-in` if deactivated; otherwise renders wizard with empty state. |
| `src/app/(app)/contracts/page.tsx` | All Contracts page — role-filtered, passes data to `ContractsShell`. |
| `src/app/(app)/contracts/[id]/page.tsx` | Contract Detail page. |
| `src/app/(app)/contracts/new/page.tsx` | Upload Contract page — renders `UploadShell`. |
| `src/app/(app)/action-required/page.tsx` | Upcoming Renewals page. |
| `src/app/(app)/notifications/page.tsx` | Notifications overview. |
| `src/app/(app)/notifications/upcoming/page.tsx` | All upcoming alerts. |
| `src/app/(app)/notifications/sent/page.tsx` | All sent alerts. |
| `src/app/(app)/vendors/page.tsx` | Vendor Directory. |
| `src/app/(app)/vendors/[id]/page.tsx` | Vendor Detail. |
| `src/app/(app)/settings/page.tsx` | Role-based redirect to account or profile settings. |
| `src/app/(app)/settings/users/page.tsx` | User Management — admin only. |
| `src/app/(app)/settings/departments/page.tsx` | Department Management — admin only. |
| `src/app/(app)/settings/group-entities/page.tsx` | Group Entity Management — admin only. |
| `src/app/(app)/settings/account/page.tsx` | Account Settings — admin only. |
| `src/app/(app)/settings/profile/page.tsx` | Profile & Notifications — all users. |

---

## Components

### Setup wizard (§13.4)

| File | Description |
|---|---|
| `src/components/setup/SetupWizard.tsx` | #f5f5f7 full-screen shell with white 0.5px-border 12px-radius card. 3-step indicator: 1 Organisation → 2 Departments → 3 License. Accepts `initialStep?: 0\|1\|2` (used by Stripe cancel redirect). |
| `src/components/setup/StepOrganisation.tsx` | Org name input. Saves via `PATCH /api/settings/account` and calls `onComplete()`. |
| `src/components/setup/StepDepartments.tsx` | Suggestion chips + custom department input. Continue is always enabled (departments optional). Has `onBack` (→ Organisation). |
| `src/components/setup/StepLicense.tsx` | Final step. Plan picker (Free / Starter / Team / Business). "Get started" button: Free → saves plan + `PATCH /api/setup/complete` + `router.push('/dashboard')`; paid → `startCheckout(plan)` → Stripe (success redirects to `GET /api/setup/complete?redirect=/dashboard`). Has `onBack` (→ Departments). |
| `src/components/setup/StepInviteUsers.tsx` | Unused in current wizard flow — retained in codebase. |
| `src/components/setup/StepSlack.tsx` | Unused in current wizard flow — retained in codebase. |

### Layout

| File | Description |
|---|---|
| `src/components/layout/AppLayout.tsx` | Server component — calls `auth()` from Clerk, looks up DB user by `clerkId`. Redirects to `/sign-in` if no Clerk session; to `/setup` if no DB user or `tenant.setupComplete` is false. Fetches badge counts, renders `PastDueBanner` (amber, dismissible) when `planStatus === past_due`, then renders sidebar. |
| `src/components/layout/Sidebar.tsx` | White sidebar. Nav: Home, All contracts, Upcoming renewals, Notifications, Vendors, Settings. Sign out button (`<SignOutButton>` from Clerk) above user identity footer. |

### UI primitives

| File | Description |
|---|---|
| `src/components/ui/StatusBadge.tsx` | Pill badge for contract status. |
| `src/components/ui/Button.tsx` | `primary`, `secondary`, `danger` variants; `sm`/`md` sizes. |
| `src/components/ui/BackLink.tsx` | `← Back` link. |
| `src/components/ui/KpiCard.tsx` | White card with label and value. |
| `src/components/ui/EmptyState.tsx` | White card with icon, heading, subtext, CTA. |
| `src/components/ui/Toast.tsx` | Auto-dismissing toast (4 s). |
| `src/components/ui/OfflineBanner.tsx` | Sticky offline indicator. |
| `src/components/ui/ErrorBoundary.tsx` | React class error boundary; captures to Sentry. |

### Dashboard

| File | Description |
|---|---|
| `src/components/dashboard/DashboardShell.tsx` | KPIs, contract tables, onboarding checklist. |
| `src/components/dashboard/KpiRow.tsx` | Total contracts and Action required tiles. |
| `src/components/dashboard/ContractTable.tsx` | White card table with `StatusBadge`. |

### All Contracts

| File | Description |
|---|---|
| `src/components/contracts/ContractsShell.tsx` | Page shell — title, "Add contract" button, filter bar, empty states. |
| `src/components/contracts/ContractFilters.tsx` | Search + filter row. |
| `src/components/contracts/ContractTableFull.tsx` | Table with table/card toggle. |
| `src/components/contracts/ContractCard.tsx` | Card view per contract. |

### Contract Detail

| File | Description |
|---|---|
| `src/components/contracts/detail/ContractDetailShell.tsx` | Split-pane layout. |
| `src/components/contracts/detail/DocumentViewer.tsx` | Fetches signed R2 URL; PDF iframe or DOCX download. |
| `src/components/contracts/detail/PropertiesPanel.tsx` | Tab bar. Delete Contract (two-step, admin). |
| `src/components/contracts/detail/PropertiesTab.tsx` | Editable contract fields. |
| `src/components/contracts/detail/EditableField.tsx` | Inline edit with Save/Cancel. |
| `src/components/contracts/detail/EditableOwnersField.tsx` | Inline owner multi-select. |
| `src/components/contracts/detail/DocumentsTab.tsx` | Document list with type badges. |
| `src/components/contracts/detail/AlertsTab.tsx` | Alert list with remove. |
| `src/components/contracts/detail/AddAlertForm.tsx` | Inline add alert form. |

### Upload

| File | Description |
|---|---|
| `src/components/upload/UploadShell.tsx` | Phase state machine: upload → polling → review / error. |
| `src/components/upload/UploadZone.tsx` | Drag-and-drop zone. |
| `src/components/upload/ExtractionReview.tsx` | Two-column AI preview / editable form. |
| `src/components/upload/ContractFormFields.tsx` | Form fields with confidence indicators. |
| `src/components/upload/ConfidenceIndicator.tsx` | Coloured dot with hover tooltip. |
| `src/components/upload/OwnerSelect.tsx` | Multi-select pill autocomplete. |

### Upcoming Renewals

| File | Description |
|---|---|
| `src/components/action-required/ActionRequiredShell.tsx` | "Upcoming renewals" table with confirm and fade-out. |

### Notifications

| File | Description |
|---|---|
| `src/components/notifications/NotificationsShell.tsx` | Overview with upcoming/sent sections. |
| `src/components/notifications/AlertsListShell.tsx` | Full-list shell with search filter. |
| `src/components/notifications/AlertsTable.tsx` | Columns: Supplier, Alert date, Notice deadline, End date, Trigger, Status, Actions. |
| `src/components/notifications/AddEditAlertForm.tsx` | Add/edit alert form. |

### Vendors

| File | Description |
|---|---|
| `src/components/vendors/VendorList.tsx` | Vendor directory table with search. |
| `src/components/vendors/VendorDetail.tsx` | Vendor name, metadata, contract table. |
| `src/components/vendors/VendorEditForm.tsx` | Inline edit for vendor fields. |

### Settings — Users

| File | Description |
|---|---|
| `src/components/settings/users/UserTable.tsx` | User list with role selects and deactivate. |
| `src/components/settings/users/InviteUserForm.tsx` | Invite form with role-conditional department field. |

### Settings — Departments

| File | Description |
|---|---|
| `src/components/settings/departments/DepartmentList.tsx` | Department list with inline rename and deactivate. |

### Settings — Group Entities

| File | Description |
|---|---|
| `src/components/settings/group-entities/GroupEntityList.tsx` | Group entity list with deactivate. |

### Settings — Account

| File | Description |
|---|---|
| `src/components/settings/account/AccountSettingsForm.tsx` | Company and tenant settings. |
| `src/components/settings/account/BillingSection.tsx` | Plan cards (matching StepLicense style) for all plans — current plan highlighted; selecting a different plan reveals an "Upgrade/Downgrade to X" button. Free card hidden for paid users. Users and Contracts usage meters (contracts meter only shown for finite limits). Stripe not-configured error surfaced explicitly. |

### Settings — Profile

| File | Description |
|---|---|
| `src/components/settings/profile/ProfileForm.tsx` | Identity and notification preferences. |

---

## Infrastructure & Auth (2026-05-03)

### Auth0 → Clerk migration

Full replacement of `@auth0/nextjs-auth0` with `@clerk/nextjs@7.3.0`.

| File | Change |
|---|---|
| `src/proxy.ts` | Replaced Auth0 + rate-limiting middleware with `clerkMiddleware()`. Public routes: `/sign-in(.*)`, `/sign-up(.*)`, `/api/billing/webhook`, `/api/webhooks/clerk`. |
| `src/app/layout.tsx` | Added `<ClerkProvider>` wrapping `<html>/<body>`. |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | New — Clerk `<SignIn />` component. |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | New — Clerk `<SignUp />` component. |
| `src/app/api/webhooks/clerk/route.ts` | New — `user.created` webhook provisions Tenant + Admin User. Verifies Svix signature. |
| `src/lib/auth/session.ts` | Rewritten — `resolveAuthContext()` uses `auth()` from Clerk + `getUserByClerkId`. No longer requires Clerk org ID; resolves tenant from `user.tenantId`. |
| `src/lib/db/users.ts` | `getUserByAuth0Id` replaced with `getUserByClerkId`. All `auth0Id` → `clerkId`. |
| `src/types/index.ts` | `User.auth0Id` → `User.clerkId`. |
| `prisma/schema.prisma` | `User.auth0Id` → `User.clerkId` (`@map("clerk_id")`). |
| `src/env.ts` | Auth0 vars removed; Clerk vars added. |
| `src/lib/security/headers.ts` | CSP updated: `*.clerk.com`, `*.clerk.accounts.dev`, `challenges.cloudflare.com` added to `script-src`, `connect-src`, `frame-src`. Auth0 domains removed. |
| `src/lib/auth/config.ts` | **Deleted** — Auth0 client config no longer needed. |
| `src/app/api/auth/[auth0]/route.ts` | **Deleted** — Auth0 route handler. |
| `src/app/(auth)/signup/page.tsx` | **Deleted** — replaced by Clerk's `/sign-up`. |
| `src/components/auth/SignupForm.tsx` | **Deleted** — replaced by Clerk's hosted UI. |

### DB migration

| Migration | Description |
|---|---|
| `prisma/migrations/20260501000000_rename_auth0id_to_clerkid` | `ALTER TABLE "users" RENAME COLUMN "auth0_id" TO "clerk_id"` — applied to Neon via `prisma migrate deploy`. |

### Production deployment notes (Vercel)

- **Required env vars**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (`/sign-in`), `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (`/sign-up`), `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` (`/dashboard`), `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` (`/setup`), `APP_BASE_URL`, `DATABASE_URL`, plus all R2 vars.
- **Clerk webhook**: register `https://your-domain.vercel.app/api/webhooks/clerk` in the Clerk dashboard → Webhooks, subscribe to `user.created`, copy the signing secret to `CLERK_WEBHOOK_SECRET`.
- **New user flow**: Clerk signup → `user.created` webhook → Tenant + User provisioned in DB → user redirected to `/setup` to configure workspace.
- **`AppLayout` redirect logic**: no Clerk session → `/sign-in`; authenticated but no DB user → `/setup`; authenticated + DB user → renders app normally.

---

## Session changes (2026-05-04)

### Vendors navigation
- `src/components/layout/Sidebar.tsx` — added "Vendors" nav item linking to `/vendors`.

### Contract deletion fix
- `prisma/schema.prisma` — added `onDelete: Cascade` to the `contract` relation on `ContractOwner`, `Document`, and `NotificationAlert`. Child rows are now removed automatically when a contract is deleted.
- `prisma/migrations/20260504192425_add_cascade_delete_contract/` — migration applied to Neon.
- `src/components/contracts/detail/PropertiesPanel.tsx` — checks `response.ok` after the DELETE fetch; shows a toast error and resets confirm state on failure instead of redirecting regardless.

### Alert setup in upload form
- `src/components/upload/ContractFormFields.tsx` — added five fields to `FieldValues`: `alertEnabled`, `alertTriggerValue`, `alertTriggerUnit`, `alertTriggerReference`, `alertChannels`. Rendered as a "Set up alert" Yes/No toggle (styled identically to Auto-renewal) with inline fields: number input + unit select (stacked), "Before" reference select, "Notify via" checkboxes.
- `src/components/upload/ExtractionReview.tsx` — after contract and document are saved, fires `POST /api/contracts/[id]/alerts` if `alertEnabled`; shows a warning toast on failure but does not block navigation.
- `src/components/upload/UploadShell.tsx` — form state (`fields`, `ownerIds`) lifted here from `ExtractionReview` to survive any child remount; `makeInitialFields` initialises state from extracted data when transitioning to the review phase; `startDate` defaults to today's date in `YYYY-MM-DD` format when extraction does not provide one.

### PDF viewer height fix
- `src/components/layout/AppLayout.tsx` — added `flex flex-col` to `<main>` so the review layout can use `flex-1` instead of `h-full` for reliable height resolution.
- `src/components/upload/UploadShell.tsx` — review wrapper changed from `className="flex h-full"` to `className="flex flex-1"`, giving the iframe a definite height at every ancestor level.

### CSP update
- `src/lib/security/headers.ts` — added `worker-src 'self' blob:` directive so the browser's built-in PDF renderer can load its Web Worker from a blob URL in the upload preview iframe.

---

## Session changes (2026-05-06)

### Clerk invite email wired up
- `src/app/api/users/invite/route.ts` — after creating the DB user record, POSTs to `https://api.clerk.com/v1/invitations` using `CLERK_SECRET_KEY` as the Bearer token. Errors are logged but do not fail the request (DB record already exists).
- `src/app/api/webhooks/clerk/route.ts` — on `user.created`, checks for an existing DB user with the same email and a placeholder `clerkId` starting with `"invite:"`; if found, updates it with the real Clerk `userId` instead of provisioning a new tenant. Fresh signups fall through to the existing tenant-creation path.
- `src/lib/db/users.ts` — added `getUserByEmail(email)`; added `clerkId` to `UpdateUserInput`.

### User management gap fixes
- `src/lib/api/response.ts` — added `conflict()` helper (409).
- `src/app/api/users/invite/route.ts` — duplicate email guard: calls `getUserByEmail` before creating the record; returns 409 if a user with that email already exists in the tenant.
- `src/app/(app)/setup/page.tsx` — deactivated user guard: in the no-DB-user branch, fetches the Clerk user's primary email via `currentUser()` and calls `getUserByEmail`; if the email exists in the DB with a non-`invite:` clerkId, redirects to `/sign-in` instead of rendering the setup wizard.
- `src/app/api/webhooks/clerk/route.ts` — deactivated user guard: on `user.created`, if the email matches a DB row with a real (non-`invite:`) clerkId, returns 200 without provisioning a new tenant. `user.deleted` handler: looks up DB user by clerkId and hard-deletes them if found, keeping the DB consistent with direct Clerk-dashboard deletions. Event interface updated to make email fields optional (absent on `user.deleted` payloads).
- `src/app/api/users/route.ts` — removed dead `POST` handler (including `parseInput` and `ParsedInput`); only `GET` remains. Invite goes through `POST /api/users/invite`.

### Invite resend
- `src/app/api/users/invite/route.ts` — resend path: if the email belongs to an existing pending user (`clerkId` starts with `"invite:"`), cancels all live Clerk invitations for that address via `GET /v1/invitations?status=pending` + `POST /v1/invitations/:id/revoke`, then sends a fresh one and returns 200 with the existing user. Fresh invites still return 201.
- `src/components/settings/users/UserTable.tsx` — "Pending" amber badge on rows with a placeholder `clerkId`; "Resend" button calls `inviteUser` from the client API helper; Spinner while busy; "Invite resent." confirmation inline. Added `Joined/Invited` date column. Department select now shows `—` for Admins (not just DepartmentOwners). Role revert on error.

---

## Session changes (2026-05-06, continued)

### Role-based access control overhaul — DepartmentOwner and BusinessOwner made view-only

**Goal:** Admin retains full access. DepartmentOwner and BusinessOwner become read-only roles. DepartmentOwner scope expanded to include contracts they own (in addition to contracts in their department).

#### DB layer

| File | Change |
|---|---|
| `src/lib/db/contractHelpers.ts` | `contractWhere` for `DepartmentOwner` now returns `{ tenantId, OR: [{ departmentId }, { owners: { some: { userId } } }] }` instead of `{ tenantId, departmentId }`, giving DepartmentOwners visibility into contracts they own regardless of department. |
| `src/lib/db/dashboard.ts` | Three queries that spread `contractWhere` and then added a top-level `OR` (renewal / upcoming date filters) now wrap the extra `OR` as `AND: [{ OR: [...] }]` to prevent it clobbering the role-scope `OR` for DepartmentOwner. |
| `src/lib/db/contractsFiltered.ts` | Search filter `OR` wrapped as `AND: [{ OR: [...] }]` for the same reason. |
| `src/lib/db/contracts.ts` | Added `getContractsByDepartmentOrOwner(departmentId, userId, tenantId)` — single query with `OR: [{ departmentId }, { owners: { some: { userId } } }]`; used by the `GET /api/contracts` list route for DepartmentOwner. |
| `src/lib/db/vendors.ts` | Added `getVendorsByOwner(userId, tenantId)` and `getVendorsByDepartmentOrOwner(userId, departmentId, tenantId)` — both include `_count` and return `VendorWithContractCount[]`. |

#### API routes

| Route | Change |
|---|---|
| `POST /api/contracts` | Now Admin-only (was open to all authenticated users). |
| `PATCH /api/contracts/[id]` | Now Admin-only (was Admin + BusinessOwner with ownership check). |
| `POST /api/contracts/[id]/alerts` | Now Admin-only (was Admin + BusinessOwner). |
| `PATCH /api/contracts/[id]/alerts/[alertId]` | Now Admin-only. |
| `DELETE /api/contracts/[id]/alerts/[alertId]` | Now Admin-only. |
| `POST /api/contracts/[id]/documents` | Now Admin-only. |
| `POST /api/contracts/[id]/confirm-action` | Now Admin-only. |
| `GET /api/contracts` | DepartmentOwner branch now calls `getContractsByDepartmentOrOwner` (dept + owned) instead of `getContractsByDepartment` (dept only). |
| `GET /api/contracts/[id]` | `canRead` helper updated: DepartmentOwner can read if `contract.departmentId === departmentId` **or** they are listed in `contract.owners`. |
| `GET /api/vendors` | Now role-scoped: Admin → all, DepartmentOwner → `getVendorsByDepartmentOrOwner`, BusinessOwner → `getVendorsByOwner`. |
| `POST /api/vendors` | Now Admin-only (was open to all authenticated users). |

#### Pages

| File | Change |
|---|---|
| `src/app/(app)/contracts/new/page.tsx` | Added `resolveAuthContext()` call; non-Admin roles are redirected to `/dashboard`. |
| `src/app/(app)/contracts/[id]/page.tsx` | `canEdit` is now `localUser.role === UserRole.Admin` only (previously also true for BusinessOwner on owned contracts). |
| `src/app/(app)/contracts/page.tsx` | Passes `isAdmin` prop to `ContractsShell`. |
| `src/app/(app)/vendors/page.tsx` | Now branches on role: Admin → `getVendorsWithContractCounts`, DepartmentOwner → `getVendorsByDepartmentOrOwner`, BusinessOwner → `getVendorsByOwner`. Previously always called the unscoped `getVendorsWithContractCounts`. |

#### UI components

| File | Change |
|---|---|
| `src/components/contracts/ContractsShell.tsx` | Added `isAdmin` prop. "Add contract" button hidden for non-Admin. Empty-state action and subtext conditionally suppressed for non-Admin. |
| `src/components/dashboard/DashboardShell.tsx` | "Add contract" button wrapped in `{isAdmin && ...}`. |
| `src/components/ui/EmptyState.tsx` | `actionLabel` and `onAction` made optional; button only renders when both are provided. |
| `src/components/vendors/VendorList.tsx` | Removed "Add vendor" button (linked to a non-existent `/vendors/new` route).

---

## Session changes (2026-05-07)

### Setup wizard overhaul

- **New flow**: Organisation → Departments → License (3 steps, down from 4). StepConfirm removed entirely.
- **Departments optional**: Continue button always enabled in `StepDepartments` — no longer gated on adding at least one department.
- **License as final step**: `StepLicense` handles its own completion — no `onComplete` prop. Free plan: saves plan + calls `PATCH /api/setup/complete` + navigates to `/dashboard`. Paid plans: calls `startCheckout(plan)`, which Stripe redirects back to `GET /api/setup/complete?redirect=/dashboard` on success or `/setup?step=3` on cancel.
- **`setupComplete` field**: added `Boolean @default(false)` to `Tenant` in schema; migration `20260507000000_add_setup_complete` applied. `Tenant` interface and `UpdateTenantSettingsData` updated.
- **New API route `src/app/api/setup/complete`**: `PATCH` sets `setupComplete: true` (used by wizard). `GET` does the same then redirects to `?redirect=` param — called by Stripe `success_url`.
- **AppLayout gate**: redirects to `/setup` if `!tenant.setupComplete` (in addition to the existing no-DB-user redirect).
- **Stripe checkout fixes**: quantity hardcoded to `1` (flat-rate plans — previously used seat count). `success_url` updated to `GET /api/setup/complete?redirect=/dashboard`.
- **`setup/page.tsx`**: completion check simplified to `tenant.setupComplete` only. Accepts `?step=N` (1-indexed) to resume wizard at a specific step.

### Billing section overhaul (`BillingSection.tsx`)

- Replaced ad-hoc upgrade buttons with plan cards matching `StepLicense` style (4 cards, `repeat(4,1fr)` grid; 3 cards for paid users — Free card hidden).
- Current plan highlighted with dark border + "Current plan" label. Selecting a non-current paid card reveals "Upgrade to X" / "Downgrade to X" button (direction derived from `PLAN_ORDER`). Clicking the same card again deselects it.
- Usage meters: Users meter always shown (all plans have a finite user limit); Contracts meter shown only for finite limits (Free only). AI extractions removed.
- Plan usage header now reads "PLAN USAGE — [Plan name]".
- Stripe not-configured error surfaced as "Stripe is not configured yet. Please contact support." when the server returns a `not configured` message.

### Sidebar

- Added `<SignOutButton>` (Clerk) above the user identity footer — same 13px neutral style as nav items.

---

## Session changes (2026-05-07, continued)

### License enforcement

- `src/app/api/contracts/route.ts` — `POST` calls `checkContractLimit(tenantId, tenant.plan)` before creating; returns 403 if the tenant is at or over their plan's contract limit.
- `src/app/api/users/invite/route.ts` — calls `checkUserLimit(tenantId, tenant.plan)` before creating the user record; returns 403 if the tenant is at or over their plan's seat limit.
- `src/app/api/upload/route.ts` — calls `checkExtractionLimit(tenantId, tenant.plan)` before starting the extraction pipeline; returns 403 if the tenant is at their monthly extraction limit.
- `src/app/api/billing/checkout/route.ts` — downgrade guard: if the target plan's seat limit is lower than the current active user count, returns 400 before creating the Stripe session.

### Upload upgrade modal

- `src/components/upload/UploadZone.tsx` — `onError` prop extended to `(message: string, status?: number) => void`; HTTP status forwarded to parent on upload failure.
- `src/components/upload/UploadShell.tsx` — `handleUploadError` intercepts 403 responses and shows a fixed-position upgrade modal ("You've reached your limit") with an "Upgrade plan" button (→ `/settings/account`) and a "Dismiss" button, instead of entering the error phase.

### Security audit and fixes (13 issues)

Full audit across middleware, plan enforcement, setup gates, Stripe webhooks, scheduler auth, and role consistency.

**Batch 1 — High severity**

- `src/lib/auth/session.ts` — `AuthOptions { skipSetupCheck?: boolean }` interface added. `resolveAuthContext` enforces `planStatus`: `canceled` or `read_only` → throws 403. `setupComplete` gate throws 403 unless `skipSetupCheck` is true. Returns `isPastDue` flag. `requireRole` accepts and forwards `AuthOptions`.
- `src/components/layout/PastDueBanner.tsx` — new client component. Amber dismissible banner for `past_due` tenants; links to `/settings/account`.
- `src/components/layout/AppLayout.tsx` — renders `PastDueBanner` above `OfflineBanner` when `isPastDue`.
- `src/proxy.ts` / `src/middleware.ts` — confirmed `proxy.ts` is the correct Next.js 16 convention. `src/middleware.ts` was created by error and hard-deleted (`rm`) — even a comment-only file causes Next.js 16 to error.

**Batch 2 — Medium severity**

- `src/app/(setup)/setup/page.tsx` — non-Admin users see a styled message card instead of `redirect("/dashboard")`, eliminating a redirect loop.
- `src/app/api/billing/webhook/route.ts` — `priceIdToPlan` returns `TenantPlan | null`; unknown price IDs return 400. `customer.subscription.updated` checks seat overage post-update and sets `planStatus: ReadOnly` if active users exceed the new plan's limit.
- `src/app/api/auth/signup/route.ts` — retired; returns 410 Gone.
- `src/lib/api/auth.ts` — retired; stub only.
- `src/app/api/webhooks/clerk/route.ts` — `existingByEmail` branch simplified: always calls `updateUser(..., { clerkId })` regardless of old clerkId format, covering both invited and deactivated user re-signup.
- `src/app/api/settings/account/route.ts` — both GET and PATCH use `skipSetupCheck: true` so admins can configure settings during onboarding.
- `src/app/api/jobs/update-statuses/route.ts` — scheduler auth is now unconditional: missing `SCHEDULER_SECRET` → 500; non-matching → 403. Previously skipped auth entirely when the env var was absent.

**Batch 3 — Low severity**

- `src/lib/db/settings.ts` — `UpdateTenantSettingsData` gains `planStatus?: TenantPlanStatus`.
- `src/app/api/setup/complete/route.ts` — both GET and PATCH use `skipSetupCheck: true` and atomically write `{ plan: Free, planStatus: Active }` for free-plan tenants alongside `setupComplete: true`.
- `src/app/api/contracts/[id]/confirm-action/route.ts` — doc comment corrected to "Admin only".
- `src/app/api/vendors/route.ts` — `POST` uses `requireRole([UserRole.Admin])` directly instead of `resolveAuthContext` + manual role check.

### DB backfill

All 10 existing tenants had `setup_complete` set to `true` via direct SQL, preventing the new `setupComplete` gate from locking out pre-existing users.
