# Contrakt — build progress

Files created to date, organised by layer.

---

## Config & types

| File | Description |
|---|---|
| `prisma/schema.prisma` | Full Prisma schema — 10 tables (added `GroupEntity`); `internalGroupEntity` made nullable on `Contract`; `groupEntityId` FK added to `Contract`; `TenantPlan` + `TenantPlanStatus` enums and 6 billing fields on `Tenant` (§15). |
| `prisma.config.ts` | Prisma 7 external config; moves the database URL out of the schema file. |
| `src/types/index.ts` | All TypeScript interfaces and `const`+union enums. Added `GroupEntity` interface. `Contract` gains `groupEntityId: string | null` and `internalGroupEntity: string | null`. `ContractSummary` replaces `internalGroupEntity: string` with `groupEntity: { id; name } | null` and adds `autoRenewal: boolean` (required by `getDisplayStatus`). `ContractWithRelations` gains `groupEntity: GroupEntity | null`. `CreateContractInput` uses `groupEntityId` instead of `internalGroupEntity`. |
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
| `src/lib/db/contractHelpers.ts` | Shared helpers used by `dashboard.ts` and `contractsFiltered.ts`. `summaryInclude` fetches `groupEntity: { select: { id, name } }`. `toSummary` maps `groupEntity` and `autoRenewal` into `ContractSummary`. |
| `src/lib/db/contractsFiltered.ts` | `getContractsFiltered` — role-aware query with status, department, term type, auto-renewal, date range, and free-text search filters. |
| `src/lib/db/dashboard.ts` | `getDashboardKpis` (total + actionRequired KPIs — actionRequired counts contracts with deadline/endDate within 60 days, no autoRenewal filter), `getActiveContracts` (take 15), `getActionRequiredContracts` (upcoming renewals within 60-day window, no autoRenewal filter), `getUpcomingRenewalsContracts` (take 15), `getBadgeCounts` (actionRequired by DB status), `getOnboardingState`. |
| `src/lib/db/notifications.ts` | **New.** `AlertWithContract` interface with computed `alertDate` field. `getUpcomingAlerts` (unsent, within N days), `getAllUpcomingAlerts` (all unsent), `getSentAlerts` (last N days), `getAllSentAlerts` (all sent). `getContractOptions` for the alert form dropdown. Role filtering via `contractRelationFilter` (produces nested contract relation filter for use inside `notificationAlert` queries). |
| `src/lib/db/groupEntities.ts` | `getGroupEntitiesByTenant` (active only), `createGroupEntity`, `deactivateGroupEntity` — full CRUD for the GroupEntity model. |
| `src/lib/db/vendors.ts` | `VendorContractRow` now uses `groupEntity: { id; name } | null` and `autoRenewal: boolean` (replacing `internalGroupEntity`). Prisma select updated to fetch both relations. |
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
| `src/lib/security/headers.ts` | `getSecurityHeaders()` — returns the full set of security response headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP, Permissions-Policy). CSP allows `*.r2.cloudflarestorage.com` and `*.eu.r2.cloudflarestorage.com` in `connect-src`, `frame-src`, and `img-src`; `blob:` in `frame-src`. |
| `src/lib/security/sanitize.ts` | `sanitizeText` (strip HTML tags + entities), `sanitizeEmail` (validate + lowercase), `validateUUID` (UUID v4 regex) — boundary-level input sanitisation helpers. |
| `src/lib/services/stripe.ts` | Stripe v22 singleton + helpers: `createCustomer`, `createCheckoutSession`, `createPortalSession`, `getSubscription`, `cancelSubscription`, `syncSeatCount`; imports `@/env` to trigger validation on startup. |
| `src/lib/services/notifications.ts` | SendGrid email and Slack Incoming Webhook helpers; both retry up to 3 times with exponential backoff (§14.3); failures are logged but never thrown so a notification failure cannot crash the scheduler. |
| `src/lib/services/planLimits.ts` | `getPlanUsage`, `checkContractLimit`, `checkUserLimit`, `checkExtractionLimit` — server-side limit enforcement per §15.2 and §15.6. |
| `src/lib/auth/config.ts` | Auth0 client singleton with route configuration and `AUTH0_CLAIM_NS` constant. |
| `src/lib/auth/session.ts` | `getSession`, `requireAuth`, `getTenantFromSession`, `resolveAuthContext`, `requireRole` — auth helpers used by every API route. |
| `src/lib/api/response.ts` | `ok`, `created`, `notFound`, `forbidden`, `badRequest`, `handleError` — typed Next.js response helpers. |
| `src/lib/services/contracts.ts` | `calculateDurationMonths`, `calculateNoticeDeadline`, `determineInitialStatus`, `buildCreateContractData` (passes `groupEntityId`). |
| `src/lib/services/extraction.ts` | `convertToText` (pdf-parse / mammoth), `extractContractProperties` (Claude API, §12.3 prompt, §12.4 schema), `handleExtractionFailure` (§12.6 all-null fallback). |
| `src/lib/services/extractionJobs.ts` | In-memory job store (`createJob`, `getJob`, `completeJob`, `failJob`) for tracking async extraction pipeline status. |
| `src/lib/utils/contractStatus.ts` | `getDisplayStatus(contract)` — derives display badge from `autoRenewal`, `renewalNoticeDeadline`, and `endDate`. Four ordered rules: (1) Auto-renewed: autoRenewal + deadline passed + end date future; (2) Expired: end date passed + no autoRenewal; (3) Action required (`"renewal_due"`): deadline or end date within 60 days (no autoRenewal filter — applies to all contracts); (4) Active: everything else. DB `status` field is never used. |

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
| `src/app/api/contracts/route.ts` | `GET` list (role-filtered) and `POST` create. Input parser accepts `groupEntityId: string | null`. |
| `src/app/api/contracts/[id]/route.ts` | `GET` single contract, `PATCH` update, `DELETE` (admin only). PATCH parser accepts all editable fields including direct `renewalNoticeDeadline` override (placed after derived-field calculation so manual value wins). |
| `src/app/api/contracts/[id]/confirm-action/route.ts` | `POST` — marks action taken, resets status to Active; idempotent. |
| `src/app/api/contracts/[id]/documents/route.ts` | `GET` list and `POST` upload linked documents for a contract. |
| `src/app/api/contracts/[id]/alerts/route.ts` | `GET` list and `POST` create notification alerts for a contract. |
| `src/app/api/contracts/[id]/alerts/[alertId]/route.ts` | `PATCH` update and `DELETE` remove a specific alert. |
| `src/app/api/documents/[docId]/url/route.ts` | `GET` — returns a signed GCS URL for viewing a document (placeholder; GCS not yet wired). |
| `src/app/api/group-entities/route.ts` | `GET` list active group entities for tenant. `POST` create (admin only). |
| `src/app/api/group-entities/[id]/route.ts` | `DELETE` soft-deactivates a group entity (admin only). |
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
| `src/app/not-found.tsx` | Global 404 page — #f5f5f7 background, 22px/600 heading, "Go to dashboard" CTA. |
| `src/app/error.tsx` | Root Next.js error page (§14.6) — same shell as not-found; captures to Sentry; "Try again" button calls `unstable_retry`. |
| `src/app/(auth)/layout.tsx` | Minimal centred layout for public auth pages — #f5f5f7 background, white 0.5px-border 12px-radius card, 32px padding. |
| `src/app/(auth)/signup/page.tsx` | Sign-up page (§13.2) — redirects to `/dashboard` if already authenticated; renders `SignupForm`. |
| `src/app/(app)/layout.tsx` | Authenticated route group layout — wraps every protected page in `AppLayout`. |
| `src/app/(app)/dashboard/page.tsx` | Home page — fetches KPIs, active contracts, upcoming renewals, and onboarding state in parallel; passes both contract lists to `DashboardShell`. |
| `src/app/(app)/setup/page.tsx` | Workspace setup wizard page (§13.4) — admin only; redirects non-admins; skips to dashboard if setup already complete; renders `SetupWizard`. |
| `src/app/(app)/contracts/page.tsx` | All Contracts page — reads URL search params, calls `getContractsFiltered`, passes data to `ContractsShell`. |
| `src/app/(app)/contracts/[id]/page.tsx` | Contract Detail page — fetches full contract with relations, computes `canEdit`, renders `ContractDetailShell`. |
| `src/app/(app)/contracts/new/page.tsx` | Upload Contract page — renders `UploadShell` which orchestrates the full upload → extract → review flow. Has `<BackLink href="/contracts" />`. |
| `src/app/(app)/action-required/page.tsx` | Upcoming Renewals page (URL stays `/action-required`) — fetches action-required contracts; passes `isAdmin` and `canConfirm` flags to `ActionRequiredShell`. |
| `src/app/(app)/notifications/page.tsx` | Notifications overview page — fetches all upcoming + all sent alerts, slices to 10 each for the summary view. Full lists live on sub-pages. |
| `src/app/(app)/notifications/upcoming/page.tsx` | All upcoming alerts — `getAllUpcomingAlerts`, no slice; `<BackLink href="/notifications" />`. |
| `src/app/(app)/notifications/sent/page.tsx` | All sent alerts — `getAllSentAlerts`, no slice; `<BackLink href="/notifications" />`. |
| `src/app/(app)/vendors/page.tsx` | Vendor Directory page — fetches all vendors with contract counts. |
| `src/app/(app)/vendors/[id]/page.tsx` | Vendor Detail page — fetches vendor with full contract list (including department + owners); 404s via `notFound()`. |
| `src/app/(app)/settings/page.tsx` | Role-based redirect — admins land on `/settings/account`, all others on `/settings/profile`. |
| `src/app/(app)/settings/users/page.tsx` | User Management page — admin only; redirects non-admins; fetches all users and departments in parallel. Has `<BackLink href="/settings/account" />`. |
| `src/app/(app)/settings/departments/page.tsx` | Department Management page — admin only; redirects non-admins; fetches all departments. Has `<BackLink href="/settings/account" />`. |
| `src/app/(app)/settings/group-entities/page.tsx` | Group Entity Management page — admin only; fetches active group entities; renders `GroupEntityList`. Has `<BackLink href="/settings/account" />`. |
| `src/app/(app)/settings/account/page.tsx` | Account Settings page — admin only; redirects non-admins; fetches tenant settings. |
| `src/app/(app)/settings/profile/page.tsx` | Profile & Notifications page — accessible by all users; fetches current user via `resolveAuthContext`. Has `<BackLink href="/settings/account" />`. |

---

## Components

### Auth

| File | Description |
|---|---|
| `src/components/auth/SignupForm.tsx` | Client sign-up form — company name, name, email, password; phases: idle → submitting → success / error. Secondary "Create account" button. |

### Setup wizard (§13.4)

| File | Description |
|---|---|
| `src/components/setup/SetupWizard.tsx` | #f5f5f7 full-screen shell with white 0.5px-border 12px-radius card. Step indicator: #171717 circle (current), #1a7f4b circle (done), rgba inactive; 0.5px hairline connectors. |
| `src/components/setup/StepDepartments.tsx` | Suggestion chips: rgba(26,127,75,0.06) bg + #1a7f4b text when added. |
| `src/components/setup/StepInviteUsers.tsx` | 2-col grid for name/email. Invited list: #1a7f4b dot + muted text. |
| `src/components/setup/StepSlack.tsx` | "Send test notification" button. #1a7f4b text on success, #c0392b on failure. |

### Layout

| File | Description |
|---|---|
| `src/components/layout/AppLayout.tsx` | Server component — resolves session, fetches local user and badge counts; wraps content in `ToastProvider`, `OfflineBanner`, and `ErrorBoundary`. Page background #f5f5f7. |
| `src/components/layout/Sidebar.tsx` | White sidebar, dark text. Nav items: Home, All contracts, Upcoming renewals (was "Action required"), Notifications. Main nav active state: rgba(0,0,0,0.05) background + #171717 text. Settings sub-nav active state: #1a7f4b text only. Live `actionRequired` amber badge count on "Upcoming renewals". |

### UI primitives

| File | Description |
|---|---|
| `src/components/ui/StatusBadge.tsx` | Pill badge. Active: #e6f4ec/#1a7f4b. Auto-renewed: #e8f0fe/#1a56db. Expired: rgba muted. `renewal_due` variant: #fff3e0/#b45309, label "Action required". All via inline `CONFIG` record keyed by `StatusVariant = ContractStatus \| "renewal_due"`. |
| `src/components/ui/Button.tsx` | `primary`: rgba(0,0,0,0.05) bg + #171717 text + 0.5px border (gray, not green). `secondary`: same style. `danger`: rgba bg + #c0392b text. Padding via `SIZE_STYLE` (sm/md). |
| `src/components/ui/BackLink.tsx` | `"use client"` component. Renders `← Back` as a plain link; color rgba(0,0,0,0.4) → #1a7f4b on hover; `marginBottom: "16px"`. Accepts `href` prop. Used on all sub-pages. |
| `src/components/ui/KpiCard.tsx` | White card, 0.5px border, 12px radius. Label 12px muted, value 28px/600/-0.04em. Hover darkens border. |
| `src/components/ui/EmptyState.tsx` | White card, 0.5px border, 12px radius, 48px padding. Muted document icon, 14px/500 heading, 13px muted subtext, secondary CTA button. |
| `src/components/ui/Toast.tsx` | White card per toast, 0.5px border, 12px radius, modal shadow. Variant colour on icon only; message text always #171717. Auto-dismisses after 4 s. |
| `src/components/ui/OfflineBanner.tsx` | #fff3e0 background, #b45309 text, 0.5px border-bottom. Sticky top, appears on `window offline`, auto-dismisses on `window online`. |
| `src/components/ui/ErrorBoundary.tsx` | React class error boundary; rgba(0,0,0,0.05) icon circle, 14px/500 heading, "Try again" button; captures to Sentry via `componentDidCatch`. |

### Dashboard (Home)

| File | Description |
|---|---|
| `src/components/dashboard/DashboardShell.tsx` | 28px/32px padding. 22px/600/-0.03em page title, client-side date subtitle. Secondary "Add contract" button top-right. Two sections: "All contracts" and "Upcoming renewals" (was "Action required"), each with 15px/600 header and "View all →" link in #171717. Onboarding checklist card (localStorage dismissal, admin-only). |
| `src/components/dashboard/KpiRow.tsx` | Two KpiCard tiles: Total contracts and Action required, both linking to their respective pages. |
| `src/components/dashboard/ContractTable.tsx` | White card table, 0.5px border, 12px radius. TH: 11px/500/muted/uppercase. TD: 13px/40px height/0.5px row borders. Row hover rgba(0,0,0,0.02). Full-row click to open contract. Uses `getDisplayStatus()` for badge. |

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
| `src/components/contracts/detail/DocumentViewer.tsx` | Fetches signed R2 signed URL on mount; PDF in iframe (white bg, 0.5px border, 12px radius); download button for DOCX; loading/error states use design-token colors. |
| `src/components/contracts/detail/PropertiesPanel.tsx` | Tab bar with 0.5px bottom border. Active tab: #1a7f4b text + 2px solid underline. Content: 20px/24px padding. Delete Contract button at bottom of Properties tab — two-step confirm; calls `DELETE /api/contracts/[id]`; hard-navigates to `/contracts` via `window.location.href` to bypass Next.js cache. Visible to `canEdit` users only. |
| `src/components/contracts/detail/PropertiesTab.tsx` | Vendor name 16px/600/-0.02em. Field rows via `.prop-row` CSS class. SectionLabel dividers. Action banner: #fdecea bg. All date fields (start, end, notice deadline) are editable via `EditableField`. Notice deadline patches `renewalNoticeDeadline` directly; clearing sends `null`. |
| `src/components/contracts/detail/EditableField.tsx` | Read mode: Edit button opacity-0 → group-hover → #1a7f4b. Edit mode: input + Save / Cancel. Toggle: #1a7f4b active pill / rgba inactive. |
| `src/components/contracts/detail/EditableOwnersField.tsx` | Inline owner editor — names in read mode; `OwnerSelect` multi-select pill autocomplete in edit mode with Save/Cancel. |
| `src/components/contracts/detail/DocumentsTab.tsx` | Three-column rows (filename/TypeBadge pill/date). Selected: rgba(26,127,75,0.06) bg + #1a7f4b text. Renewal versions indented with left border. |
| `src/components/contracts/detail/AlertsTab.tsx` | Timing left + ChannelPill components + sent date. Remove button: opacity-0 → group-hover → #c0392b. |
| `src/components/contracts/detail/AddAlertForm.tsx` | Inline with 0.5px top border. Flex row controls. Save / Cancel. |

### Upload

| File | Description |
|---|---|
| `src/components/upload/UploadShell.tsx` | Phase state machine (`upload → polling → review / error`). PageHeader with `<BackLink href="/contracts" />`. PollingDots animation. 2 s polling, 60 s timeout. |
| `src/components/upload/UploadZone.tsx` | 0.5px dashed border drop zone; solid #1a7f4b + rgba tint on drag-over. File pill with × remove. Secondary "Upload" button. |
| `src/components/upload/ExtractionReview.tsx` | Two-column layout: 55% AI preview / 45% editable form. Section labels. Vendor is mandatory (validated before save). Vendor dropdown uses `"__new__"` sentinel for "Create new supplier" option. Group entity dropdown has "Select group entity" placeholder. Field gap 20px, label margin-bottom 6px. Secondary "Confirm & save" button. Document record created with `type: "main"` after contract save. |
| `src/components/upload/ContractFormFields.tsx` | Single-column 20px gap. 6px label margin. ConfidenceIndicator dot inline with label. Auto-renewal as Yes/No pill toggle (#1a7f4b active). Notice period wrapped in `.fade-in`. |
| `src/components/upload/ConfidenceIndicator.tsx` | 6px dot: #1a7f4b (high), #d97706 (medium), rgba(0,0,0,0.2) (low/absent). Hover tooltip via useState. |
| `src/components/upload/OwnerSelect.tsx` | rgba(0,0,0,0.06) pills with × remove. Dropdown: white card, 0.5px border, 8px radius, modal shadow. |

### Upcoming Renewals (was Action Required)

| File | Description |
|---|---|
| `src/components/action-required/ActionRequiredShell.tsx` | Page header "Upcoming renewals". Same TH/TD table constants. ConfirmButton: #1a7f4b text + rgba(26,127,75,0.3) border + hover rgba fill. `fadingIds` Set for 200 ms opacity fade before row removal. Empty state: "No upcoming renewals". |

### Notifications

| File | Description |
|---|---|
| `src/components/notifications/NotificationsShell.tsx` | Overview shell with two sections (upcoming / sent). `SectionHeader` shows title, count, and always-visible "View all →" link. Manages add/edit form state via `FormMode` union type. |
| `src/components/notifications/AlertsListShell.tsx` | Full-list shell used by `/notifications/upcoming` and `/notifications/sent`. Accepts `backHref` prop, renders `<BackLink>`. Client-side vendor name search filter. Same add/edit form pattern. |
| `src/components/notifications/AlertsTable.tsx` | Client component. Columns: Supplier, Alert date, Notice deadline, End date, Trigger, Status, Actions. `DeleteButton` calls `DELETE /api/contracts/[id]/alerts/[alertId]` then `router.refresh()`. `onEdit` callback surfaces to parent shell. |
| `src/components/notifications/AddEditAlertForm.tsx` | Add mode: contract `<select>` from `ContractOption[]`. Edit mode: contract name read-only, fields pre-filled. POSTs or PATCHes the alert API endpoint. |

### Vendors

| File | Description |
|---|---|
| `src/components/vendors/VendorList.tsx` | 28px/32px padding. 22px/600 title. 280px search input. White card table, consistent TH/TD constants. Row hover. |
| `src/components/vendors/VendorDetail.tsx` | `<BackLink href="/vendors" />` replaces old breadcrumb nav. 22px/600 vendor name. dl metadata. Contract table with `StatusBadge` using `getDisplayStatus` (passes `autoRenewal` from `VendorContractRow`). |
| `src/components/vendors/VendorEditForm.tsx` | 12px/500 field labels. Inline inputs. Secondary "Save changes" button + muted "Cancel" text button. |

### Settings — Users

| File | Description |
|---|---|
| `src/components/settings/users/UserTable.tsx` | Row count above table. Compact selects (height 30px). Name + email stacked in one cell. Deactivate: opacity-0 group-hover → #c0392b. |
| `src/components/settings/users/InviteUserForm.tsx` | White card, 0.5px border, 12px radius. 2-col name/email grid. Department field `.fade-in` when role=DepartmentOwner. Secondary "Send invite" submit button. |

### Settings — Departments

| File | Description |
|---|---|
| `src/components/settings/departments/DepartmentList.tsx` | White card, ROW_STYLE (flex, 40px, 0.5px border-bottom). Hover-only Rename/Deactivate. Inline rename: Save / Cancel. Inactive: strikethrough muted. Secondary "Add department" button. |

### Settings — Group Entities

| File | Description |
|---|---|
| `src/components/settings/group-entities/GroupEntityList.tsx` | Same card/row pattern as DepartmentList without rename. Deactivate: opacity-0 group-hover → #c0392b. Secondary "Add" button. |

### Settings — Account

| File | Description |
|---|---|
| `src/components/settings/account/AccountSettingsForm.tsx` | Three SECTION_DIVIDER sections (Company / Slack / Tenant). Test result uses `.fade-in`. Secondary "Save" button. |
| `src/components/settings/account/BillingSection.tsx` | Plan + trial pill badges. UsageMeter: 180px label / flex 4px bar (#1a7f4b fill, red at limit) / 60px count. |

### Settings — Profile

| File | Description |
|---|---|
| `src/components/settings/profile/ProfileForm.tsx` | Three SECTION_DIVIDER sections (Identity / Slack / Notification Preferences). Secondary "Save" button. |
