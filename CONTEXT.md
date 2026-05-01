# Contrakt — Session Context

Contrakt is a B2B SaaS contract management platform that lets teams upload, extract, and track contracts with automated renewal alerts. It is multi-tenant, role-aware (Admin / Business Owner / Viewer), and monetised via Stripe.

## Tech Stack

- **Next.js 16.2.3** (App Router, React 19) — TypeScript throughout, no `any`
- **Prisma 7** — PostgreSQL, every query scoped by `tenantId`
- **Auth0 SDK v4** (`@auth0/nextjs-auth0`) — auth handled in `src/middleware.ts`, not a route handler
- **Anthropic Claude SDK** — AI extraction of contract fields from uploaded PDFs/DOCX
- **Stripe** — billing, checkout, webhook at `/api/billing/webhook`
- **SendGrid** — transactional email (invite, alert notifications)
- **Tailwind CSS v4** — utility classes used sparingly; most styling is inline `style={{}}`
- **Zod v4** — request validation in API routes

## Current App State

**Fully working:**
- Auth (login / logout / invite-based signup, Auth0 v4)
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
- Slack notifications — webhook URL saved, sending not fully implemented
- Renewals page (`/renewals`) — route exists, content unknown

## Recent Changes (2026-05-01)

- **CSP headers** (`src/lib/security/headers.ts`) — added `*.r2.cloudflarestorage.com` and `*.eu.r2.cloudflarestorage.com` to `connect-src`, `frame-src`, and `img-src`; added `blob:` to `frame-src`
- **DocumentViewer iframe** (`src/components/contracts/detail/DocumentViewer.tsx`) — white background, 0.5px border, 12px border-radius to feel native
- **Upload bug fix** (`src/components/upload/ExtractionReview.tsx`) — document type was incorrectly sent as `"original"` (invalid); fixed to `"main"` so the document record is actually created and the viewer shows the document on the detail page
- **Delete contract** (`src/components/contracts/detail/PropertiesPanel.tsx`) — delete button at the bottom of the Properties tab (scrollable, not fixed); two-step confirm; calls `DELETE /api/contracts/[id]` then hard-navigates to `/contracts` via `window.location.href` to bypass Next.js cache

## The 6 Coding Rules

1. **Strict layer separation** — UI → `src/components/`, DB queries → `src/lib/db/`, business logic → `src/lib/services/`, API functions → `src/lib/api/`, types → `src/types/`, routes → `src/app/api/`
2. **200-line file limit** — split any file that exceeds it on a genuine concern boundary
3. **Single-responsibility functions** — a function fetches, transforms, *or* renders; never all three
4. **No `any`** — explicit TypeScript types everywhere
5. **Tenant scoping** — every DB query must filter by `tenantId`; never fetch without it
6. **Auth/role check first** — every API route validates session and role before any other logic

## Key File Locations

| Area | Path |
|---|---|
| DB layer | `src/lib/db/` — `contracts.ts`, `dashboard.ts`, `vendors.ts`, `users.ts`, `alerts.ts`, `notifications.ts`, etc. |
| Services | `src/lib/services/` — `extraction.ts`, `extractionJobs.ts`, `statusUpdater.ts`, `alertScheduler.ts`, `stripe.ts`, `planLimits.ts` |
| API routes | `src/app/api/` — contracts, vendors, users, departments, group-entities, upload, documents, billing, jobs, auth |
| Auth config | `src/lib/auth/config.ts`, `src/lib/auth/session.ts`, `src/middleware.ts` |
| Shared types | `src/types/index.ts` |
| DB helpers | `src/lib/db/contractHelpers.ts` (`toSummary()`), `src/lib/db/client.ts` (Prisma singleton) |
| Table prefs hook | `src/lib/hooks/useTablePreferences.ts` — exports `ALL_CONTRACT_COLUMNS`, `useTablePreferences()`, `useViewOptions()` |
| Pages | `src/app/(app)/` — dashboard, contracts, action-required, vendors, notifications, settings/*, setup |
| Layout | `src/components/layout/AppLayout.tsx`, `Sidebar.tsx` |

## What's Been Built

- **Multi-tenant auth** with Auth0 v4, role-based access, invite flow, onboarding setup wizard
- **Contract lifecycle** — upload (PDF/DOCX), AI extraction via Anthropic, extraction review, contract save, detail view with document viewer and tabbed UI
- **Sortable, configurable tables** across all contract views — column visibility and order stored globally in `localStorage` (`contrakt_view_options`), sort state per-table (`contrakt_sort_<id>`); View Options in account settings with drag-and-drop reorder
- **Vendor management** — list, detail page with scoped contract table, inline edit form
- **Alert system** — notice-deadline and expiry alerts, cron job route, status auto-updater
- **Settings** — profile, account (Slack), departments, group entities, user management
- **Billing** — Stripe plans, checkout, customer portal, webhook handling, plan limits enforcement
- **Upload document viewer** — split-pane on review step: PDF iframe (blob URL) left, extraction form right
