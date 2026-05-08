# Contrakt — Session Context

Contrakt is a B2B SaaS contract management platform that lets teams upload, extract, and track contracts with automated renewal alerts. It is multi-tenant, role-aware (Admin / Business Owner / Viewer), and monetised via Stripe.

## Tech Stack

- **Next.js 16.2.3** (App Router, React 19) — TypeScript throughout, no `any`
- **Prisma 7** — PostgreSQL, every query scoped by `tenantId`
- **Clerk** (`@clerk/nextjs@7.3.0`) — auth via `clerkMiddleware()` in `src/proxy.ts`; webhook at `/api/webhooks/clerk` provisions tenants and handles invite flow
- **Anthropic Claude SDK** — AI extraction of contract fields from uploaded PDFs/DOCX
- **Stripe** — billing, checkout, webhook at `/api/billing/webhook`
- **Clerk** — invite and signup emails
- **Resend** — transactional email (renewal alerts, payment notifications)
- **Slack** — backend helper retained in `src/lib/services/notifications.ts` for future use; no frontend UI
- **Tailwind CSS v4** — utility classes used sparingly; most styling is inline `style={{}}`
- **Zod v4** — request validation in API routes

## Current App State

**Fully working:**
- Auth (login / logout / invite-based signup, Clerk)
- Contract upload → AI extraction → review form → save
- Contract detail page (split-pane: document viewer + tabbed properties/documents/alerts)
- Dashboard & "All contracts" table (sortable, column visibility via View Options)
- Upcoming renewals page (`/action-required`) — same table features
- Vendors list + vendor detail (sortable table, edit form)
- Settings: profile, account (View Options drag-and-drop, Slack webhook), departments, group entities, users (invite)
- Alert scheduling (cron-style job routes), status auto-update job
- Billing (Stripe checkout, customer portal)
- Notifications page (schema + DB layer exists)

**Mocked / incomplete:**
- Notifications UI — page and components exist but not wired to real-time delivery
- Renewals page (`/renewals`) — route exists, content unknown

## Recent Changes

### 2026-05-01
- **CSP headers** (`src/lib/security/headers.ts`) — added `*.r2.cloudflarestorage.com` and `*.eu.r2.cloudflarestorage.com` to `connect-src`, `frame-src`, and `img-src`; added `blob:` to `frame-src`
- **DocumentViewer iframe** (`src/components/contracts/detail/DocumentViewer.tsx`) — white background, 0.5px border, 12px border-radius to feel native
- **Upload bug fix** (`src/components/upload/ExtractionReview.tsx`) — document type was incorrectly sent as `"original"` (invalid); fixed to `"main"` so the document record is actually created and the viewer shows the document on the detail page
- **Delete contract** (`src/components/contracts/detail/PropertiesPanel.tsx`) — delete button at the bottom of the Properties tab (scrollable, not fixed); two-step confirm; calls `DELETE /api/contracts/[id]` then hard-navigates to `/contracts` via `window.location.href` to bypass Next.js cache

### 2026-05-03 — Auth0 → Clerk migration
- Full replacement of `@auth0/nextjs-auth0` with `@clerk/nextjs@7.3.0`
- `src/proxy.ts` — replaced Auth0 middleware with `clerkMiddleware()`; public routes: `/sign-in(.*)`, `/sign-up(.*)`, `/api/billing/webhook`, `/api/webhooks/clerk`
- `src/app/layout.tsx` — added `<ClerkProvider>`
- `src/app/sign-in/` and `src/app/sign-up/` — Clerk-hosted `<SignIn />` / `<SignUp />` components
- `src/app/api/webhooks/clerk/route.ts` — new webhook: `user.created` provisions Tenant + admin User; `user.deleted` removes DB user
- `src/lib/auth/session.ts` — rewritten: `resolveAuthContext()` uses Clerk `auth()` + `getUserByClerkId`; `User.auth0Id` renamed to `User.clerkId` throughout (`prisma/schema.prisma`, `src/lib/db/users.ts`, `src/types/index.ts`)
- CSP updated in `src/lib/security/headers.ts` — Clerk and Cloudflare domains added

### 2026-05-04
- **Vendors nav** — "Vendors" added to `Sidebar.tsx`
- **Contract cascade delete** — `onDelete: Cascade` added to `ContractOwner`, `Document`, and `NotificationAlert` relations in schema; migration `20260504192425_add_cascade_delete_contract` applied
- **Contract deletion fix** (`PropertiesPanel.tsx`) — checks `response.ok` before navigating; shows toast on failure
- **Alert setup in upload** — `ContractFormFields.tsx` adds Yes/No alert toggle with inline fields; `ExtractionReview.tsx` fires `POST /api/contracts/[id]/alerts` after save; `UploadShell.tsx` lifts form state to survive child remounts; `startDate` defaults to today when extraction omits it
- **PDF viewer height fix** — `AppLayout.tsx` adds `flex flex-col` to `<main>`; review wrapper uses `flex-1`
- **CSP** — added `worker-src 'self' blob:` for PDF Web Worker

### 2026-05-06
- **Clerk invite email** (`src/app/api/users/invite/route.ts`) — after creating the DB user record, POSTs to `https://api.clerk.com/v1/invitations`; errors are best-effort (logged, not thrown)
- **Invited user webhook flow** (`src/app/api/webhooks/clerk/route.ts`) — on `user.created`, matches email to a DB user with `clerkId` starting with `"invite:"` and updates it with the real Clerk userId; fresh signups fall through to tenant creation
- **Duplicate email guard** — `invite` route returns 409 if a user with that email already exists in the tenant
- **`getUserByEmail`** added to `src/lib/db/users.ts`; `clerkId` added to `UpdateUserInput`
- **`conflict()` helper** added to `src/lib/api/response.ts`

### 2026-05-06 (continued)

- **Dark rebrand** — removed green palette (`#1a7f4b`, `--green-*` CSS vars) across all 35 components and `globals.css`; replaced with `#1a1a1a` (solid) and proportionally scaled `rgba(0,0,0,*)` for tinted backgrounds/borders. `.btn-primary` is now light grey (`#f5f5f7`) with dark text.
- **Setup wizard restructure** — split `StepOrganisation` into two steps: `StepOrganisation` (org name only) and new `StepLicense.tsx` (plan picker). `SetupWizard` now has 4 numbered steps: Organisation → License → Departments → Invite. Step indicator shows 1-indexed labels; "Invite users" label shortened to "Invite" to prevent wrapping.
- **Free plan skip** — `SetupWizard` tracks `selectedPlan`; after Departments completes, if plan is `FREE` it redirects straight to `/dashboard` and never renders step 4. "Invite users" is also hidden from the step indicator on Free.
- **Back buttons** — `StepLicense`, `StepDepartments`, and `StepInviteUsers` all have a `← Back` button (same plain-text style). Back on License → Organisation; Departments → License; Invite → Departments.
- **`• ()` invite bug** — `inviteUser()` in `src/lib/api/users.ts` was casting `res.json()` directly to `User`, but the API wraps responses as `{ data: T }`. Fixed to `(await res.json() as { data: User }).data`. Invited users now display correctly in the list.
- **Setup bypass fix** — `src/app/(setup)/setup/page.tsx` completion check tightened: redirects to `/dashboard` only when `tenant.name` + `departmentsAdded` + (`firstUserInvited` **or** plan is `FREE`). Previously only required name + departments, so paid-plan users mid-wizard were incorrectly bounced.

## The 5 Coding Rules

1. **Strict layer separation** — UI → `src/components/`, DB queries → `src/lib/db/`, business logic → `src/lib/services/`, API functions → `src/lib/api/`, types → `src/types/`, routes → `src/app/api/`
2. **Single-responsibility functions** — a function fetches, transforms, *or* renders; never all three
3. **No `any`** — explicit TypeScript types everywhere
4. **Tenant scoping** — every DB query must filter by `tenantId`; never fetch without it
5. **Auth/role check first** — every API route validates session and role before any other logic

## Key File Locations

| Area | Path |
|---|---|
| DB layer | `src/lib/db/` — `contracts.ts`, `dashboard.ts`, `vendors.ts`, `users.ts`, `alerts.ts`, `notifications.ts`, etc. |
| Services | `src/lib/services/` — `extraction.ts`, `extractionJobs.ts`, `statusUpdater.ts`, `alertScheduler.ts`, `stripe.ts`, `planLimits.ts` |
| API routes | `src/app/api/` — contracts, vendors, users, departments, group-entities, upload, documents, billing, jobs, auth |
| Auth config | `src/lib/auth/config.ts`, `src/lib/auth/session.ts`, `src/middleware.ts` |
| Shared types | `src/types/index.ts` |
| DB helpers | `src/lib/db/contractHelpers.ts` (`toSummary()`), `src/lib/db/client.ts` (Prisma singleton) |
| Table prefs hook | `src/lib/hooks/useTablePreferences.ts` — exports `ALL_CONTRACT_COLUMNS` (12 cols; `contractName` is the second, visible by default), `useTablePreferences()`, `useViewOptions()` |
| Pages | `src/app/(app)/` — dashboard, contracts, action-required, vendors, notifications, settings/*, setup |
| Layout | `src/components/layout/AppLayout.tsx`, `Sidebar.tsx` |

## What's Been Built

- **Multi-tenant auth** with Clerk, role-based access, invite flow, onboarding setup wizard
- **Contract lifecycle** — upload (PDF/DOCX), AI extraction via Anthropic, extraction review, contract name + field capture, contract save, detail view with document viewer and tabbed UI
- **Sortable, configurable tables** across all contract views — column visibility and order stored globally in `localStorage` (`contrakt_view_options`), sort state per-table (`contrakt_sort_<id>`); View Options in account settings with drag-and-drop reorder
- **Vendor management** — list, detail page with scoped contract table, inline edit form
- **Alert system** — notice-deadline and expiry alerts, cron job route, status auto-updater
- **Settings** — profile, account (Slack), departments, group entities, user management
- **Billing** — Stripe plans, checkout, customer portal, webhook handling, plan limits enforcement
- **Upload document viewer** — split-pane on review step: PDF iframe (blob URL) left, extraction form right
