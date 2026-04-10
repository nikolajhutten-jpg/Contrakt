Contract Lifecycle Management (CLM) SaaS
Product Specification v0.1

1. Product Overview
A simple, clean SaaS platform for post-signature contract lifecycle management and renewal management. Users upload supplier and procurement contracts, track all key contract properties, and receive automated alerts before renewal deadlines. The product is sold as a multi-tenant external SaaS to business customers.

2. Target Users
Business Owner Access to own contracts only.
Department Owner Access to all contracts within their department.
Admin Platform-wide access; user and account management.

3. Core Features
3.1 Contract Upload & Storage
Drag-and-drop upload of contracts in PDF, Word (.docx), and Excel (.xlsx) formats.
Contracts hosted on Google Cloud (GCP) infrastructure.
Attachments, addendums, amendments, and renewals linked to a parent contract and visible in a single consolidated view.
AI-powered auto-extraction of contract properties from uploaded documents (see §5).
3.2 Contract Viewer
In-browser document viewer for PDF and Word files.
Single-screen view showing the contract document alongside all linked documents (attachments, addendums, amendments, renewals).
3.3 Contract Properties
Every contract record tracks the following fields:
Supplier / Vendor entity — Text field. Supplier / Vendor contact — Text field, optional. Internal Group entity (buyer) — Text field. Internal business owner(s) — User reference; one or more owners can be assigned. Internal department — Dropdown; values managed by Admin. Start date — Date field. End date — Date field. Duration — Integer (months); auto-calculated from start and end date. Term type — Dropdown: Fixed or Indefinite. Auto-renewal — Boolean: Yes or No. Renewal period — Integer (months). Renewal notice period — Integer (months or days). Renewal notice deadline — Date; auto-calculated from end date minus notice period. Contract status — Dropdown: Active, Expired, Auto-renewed, or Action Required.
3.4 Dashboard
Fully filterable overview of all contracts the logged-in user has access to.
Filters available on all contract properties.
Dedicated Upcoming Renewals panel showing contracts with approaching renewal notice deadlines.
Status badges (Active, Expired, Auto-renewed, Action Required) visible at a glance.
3.5 Access Management
Business Owners see only their own contracts.
Department Owners see all contracts within their department.
Admins see all contracts across the platform and manage users, roles, and account settings.
3.6 Renewal Alerts & Notifications
Default alert: business owner(s) notified 2 months before the renewal notice deadline via email and Slack.
Alert timing is fully customizable per contract by the business owner. Multiple alerts can be set per contract (e.g. 2 months, 1 month, and 1 week before the renewal notice deadline).
Additional alert triggers: end date approaching.
When a renewal notice deadline is reached, contract status automatically changes to "Action Required".
Business owner must confirm action taken to clear the Action Required status.

4. Integrations
Slack — Renewal notice alerts and status change notifications. Email (SendGrid) — Renewal notice alerts and status change notifications. Google Cloud Platform — Contract file hosting and storage. Auth0 — User authentication and role management. Stripe — Subscription billing and payment management.

5. AI Features
5.1 Auto-Extraction of Contract Properties
On upload, the platform uses the Claude API (Anthropic) to parse the document and pre-fill contract properties.
Extracted values are presented to the user for review and confirmation before saving — never silently committed.
Extraction applies to PDF and Word formats. Excel files are treated as attachments only and are not processed by the AI.

6. Notifications Logic
X months/days before renewal notice deadline (customizable; default 2 months) Email and Slack alert sent to business owner(s).
Renewal notice deadline reached Status changes to "Action Required". Email and Slack alert sent to business owner(s).
End date reached with no action confirmed Status changes to "Expired".
Auto-renewal confirmed Status changes to "Auto-renewed".

7. UI & Design Specifications
7.1 General Style
Visual style: modern and bold (reference: Rippling, Ramp).
Color palette: neutral — whites and grays as base; red, amber, and green used exclusively for status meaning.
Typography: two weights only (regular and medium); sentence case throughout.
No gradients, shadows, or decorative effects; flat surfaces only.
Desktop-only at launch; no mobile or tablet optimization required.
Dark mode not required for v1.
7.2 Navigation
Permanent left sidebar containing: logo, main navigation items, and user identity (name and role) in the footer.
Navigation items: Dashboard, All Contracts, Renewals, Action Required, Users, Settings.
Renewals and Action Required navigation items show a live badge count.
7.3 Home Screen (Dashboard)
KPI cards row at top: Total Contracts, Active, Action Required, Renewals Due.
"Action Required" section surfaces first, with red status indicators.
"Upcoming Renewals" section below, with amber status indicators.
All contract tables are filterable on all contract properties.
7.4 Contract List View
Toggle between table view and card view (user preference).
Table view columns: Supplier, Department, Owner, End Date, Notice Deadline, Status.
Status shown as a colored dot with a pill badge.
7.5 Contract Detail Page
Split-pane layout: document viewer on the left, contract properties panel on the right.
Properties panel has three tabs: Properties, Documents, and Alerts.
Documents tab shows attachments, addendums, and amendments; renewals are shown as a versioned history.
Alerts tab shows all configured notification alerts for the contract; alerts can be added, edited, or deleted.
Linked documents (attachments, addendums, amendments, renewals) are accessible within the same view.
7.6 Status Color Coding
Active — Green.
Action Required — Red.
Renewal Due — Amber.
Expired — Gray.
Auto-renewed — Blue.

8. Technical Architecture
8.1 Build Approach
Vibe coding — AI-assisted development (e.g. Cursor or Windsurf). The spec should be treated as the source of truth for prompting the AI coding environment. Modular, well-structured code is essential so AI tools can navigate and extend the codebase reliably.
8.2 Recommended Stack
Frontend and backend — Next.js (React + TypeScript). Full-stack in one codebase; ideal for vibe coding; eliminates a separate backend service. Database — PostgreSQL via Cloud SQL on GCP. Relational model fits contract data well; strong multi-tenancy support. File storage — Google Cloud Storage. One dedicated bucket per tenant; native GCP integration. Authentication — Auth0. Managed auth with RBAC support; minimal setup for vibe coding. AI extraction — Claude API (Anthropic), claude-sonnet model. Email notifications — SendGrid. Reliable transactional email; simple API; good deliverability. Slack notifications — Slack Incoming Webhooks. Lightweight integration; no bot infrastructure needed at v1. Hosting and compute — Google Cloud Run. Serverless containers; auto-scales to zero; simplest GCP deployment for vibe coding. CI/CD — GitHub Actions. Integrates well with Cloud Run deployments. Billing — Stripe. Handles subscriptions, seat counts, invoicing, and the customer billing portal.
8.3 Multi-Tenancy Architecture
Each customer (tenant) is identified by a tenant_id at the database level — all tables include a tenant_id column.
File storage: one dedicated GCP bucket per tenant, provisioned automatically on account creation.
Auth0 organizations used to scope user access per tenant.
Row-level access control enforced at the API layer based on the authenticated user's role and tenant_id.
8.4 AI Extraction Pipeline
User uploads contract (PDF or DOCX).
File stored in tenant GCP bucket.
Extraction job triggered asynchronously.
Document sent to Claude API with a structured prompt requesting contract property extraction as JSON.
Extracted values returned to the frontend for user review and confirmation before saving to the database.
Excel files (.xlsx) are stored as attachments only and are not passed through extraction.
8.5 Notification Architecture
A scheduled job (GCP Cloud Scheduler) runs daily to check for contracts approaching renewal notice deadlines.
On trigger: sends email via SendGrid API and Slack message via Incoming Webhook.
Alert timing per contract is stored in the database and evaluated at job runtime.
Contract status field updated automatically when renewal notice deadline is reached or end date passes.

9. Data Model
9.1 Overview
All tables include a tenant_id foreign key to enforce multi-tenant data isolation at the database level.
9.2 Tables
tenants id (UUID, primary key), name (company name), slug (unique; used in URLs), gcs_bucket (dedicated GCP bucket name), created_at.
users id (UUID, primary key), tenant_id (FK → tenants), auth0_id (Auth0 user identifier), name, email, role (enum: admin / department_owner / business_owner), department_id (FK → departments, nullable), slack_user_id (optional; for Slack DM notifications), created_at.
departments id (UUID, primary key), tenant_id (FK → tenants), name, created_at. Values managed by Admin; fixed list per tenant.
vendors id (UUID, primary key), tenant_id (FK → tenants), name, contact_name (optional), contact_email (optional), created_at.
contracts id (UUID, primary key), tenant_id (FK → tenants), vendor_id (FK → vendors), department_id (FK → departments), internal_group_entity, start_date, end_date, duration_months (auto-calculated), term_type (enum: fixed / indefinite), auto_renewal (boolean), renewal_period_months, renewal_notice_period_value, renewal_notice_period_unit (enum: months / days), renewal_notice_deadline (auto-calculated), status (enum: active / expired / auto_renewed / action_required), action_confirmed (boolean), action_confirmed_at, created_at, updated_at.
contract_owners (join table — supports multiple owners per contract) contract_id (FK → contracts), user_id (FK → users), assigned_at.
documents id (UUID, primary key), tenant_id (FK → tenants), contract_id (FK → contracts), type (enum: main / attachment / addendum / amendment / renewal), version (integer; increments per renewal for version history), file_name, file_path (path within tenant GCP bucket), file_format (enum: pdf / docx / xlsx), uploaded_by (FK → users), uploaded_at.
notification_alerts id (UUID, primary key), contract_id (FK → contracts), tenant_id (FK → tenants), trigger_value (integer; e.g. 2), trigger_unit (enum: months / days), trigger_reference (enum: renewal_notice_deadline / end_date), channels (array: email / slack), sent_at (null until fired), created_at.
extraction_results id (UUID, primary key), document_id (FK → documents), tenant_id (FK → tenants), extracted_data (JSONB; raw Claude API response), confidence (JSONB; per-field confidence scores), confirmed_by (FK → users; set when user confirms extraction), confirmed_at, created_at.
9.3 Key Relationships
A tenant has many users, departments, vendors, and contracts.
A vendor has many contracts; the vendor detail page shows all contracts (active, expired, renewed) for that vendor.
A contract belongs to one vendor and one department; has multiple business owners (via contract_owners), multiple documents, multiple notification alerts, and one extraction result per main document upload.
Documents are typed: main is the primary contract file; renewal documents are versioned to provide renewal history; attachment, addendum, and amendment appear in their own tab on the contract detail panel.
Notification alerts are fully customizable per contract; multiple alerts can exist per contract (e.g. 2 months, 1 month, and 1 week before renewal notice deadline).

10. Screen Inventory & User Stories
10.1 Screen List
Login — /login — accessible by all users.
Dashboard — /dashboard — accessible by all users.
All Contracts — /contracts — accessible by all users (filtered by role).
Contract Detail — /contracts/[id] — accessible by all users (filtered by role).
Upload Contract — /contracts/new — accessible by all users.
Vendor Directory — /vendors — accessible by all users.
Vendor Detail — /vendors/[id] — accessible by all users.
Renewals — /renewals — accessible by all users (filtered by role).
Action Required — /action-required — accessible by all users (filtered by role).
User Management — /settings/users — Admin only.
Department Management — /settings/departments — Admin only.
Account Settings — /settings/account — Admin only.
Profile & Notifications — /settings/profile — accessible by all users.
10.2 User Stories by Screen
Screen 1 — Login
As a user, I can log in with my email via Auth0 so that I am authenticated and directed to my dashboard.
As a user, I am automatically assigned my role and tenant on first login based on my Auth0 organization.
Screen 2 — Dashboard
As any user, I see KPI cards: Total Contracts, Active, Action Required, Renewals Due.
As any user, I see an "Action Required" table surfaced at the top, filtered to contracts I have access to.
As any user, I see an "Upcoming Renewals" table below, filtered to contracts I have access to.
As any user, I can toggle the contract lists between table view and card view.
As any user, I can click any contract row to navigate to the Contract Detail page.
Screen 3 — All Contracts
As a business owner, I see only contracts where I am assigned as an owner.
As a department owner, I see all contracts within my department.
As an admin, I see all contracts across the tenant.
As any user, I can filter the list by any contract property (vendor, department, status, owner, date range, term type, auto-renewal).
As any user, I can toggle between table view and card view.
As any user, I can click a contract to navigate to Contract Detail.
Screen 4 — Contract Detail
As any user, I see a split-pane layout: document viewer on the left, properties panel on the right.
As any user, I see contract properties in the right panel (all fields from §3.3).
As any user, I can switch between three tabs in the properties panel: Properties, Documents, and Alerts.
On the Documents tab I see attachments, addendums, and amendments listed; and a versioned renewal history.
On the Alerts tab I see all configured notification alerts for this contract and can add, edit, or delete alerts.
As a business owner or admin, I can edit contract properties inline.
As a business owner or admin, I can upload additional documents linked to this contract.
As a business owner or admin, I can confirm action taken when status is "Action Required".
Screen 5 — Upload Contract
As any user, I can drag and drop or browse to upload a contract file (PDF or DOCX).
As any user, I see extracted contract properties pre-filled by Claude after upload, and can review and edit each field before saving.
As any user, I can assign one or more business owners to the contract.
As any user, I can link the contract to a vendor (existing or create new inline) and a department.
As any user, I can configure notification alerts before saving.
Screen 6 — Vendor Directory
As any user, I see a list of all vendors for the tenant, with name and number of linked contracts.
As any user, I can search and filter vendors by name.
As any user, I can click a vendor to navigate to Vendor Detail.
As an admin, I can create a new vendor.
Screen 7 — Vendor Detail
As any user, I see vendor name and contact information.
As any user, I see all contracts linked to this vendor, filterable by status (Active, Expired, Auto-renewed, Action Required).
As any user, I can click any contract to navigate to Contract Detail.
As an admin, I can edit vendor name and contact details.
Screen 8 — Renewals
As any user, I see all contracts with an upcoming renewal notice deadline, filtered to contracts I have access to.
As any user, I can filter by department, owner, and date range.
As any user, I can click a contract to navigate to Contract Detail.
Screen 9 — Action Required
As any user, I see all contracts with status "Action Required", filtered to contracts I have access to.
As a business owner or admin, I can confirm action taken directly from this list without navigating to Contract Detail.
Screen 10 — User Management (Admin only)
As an admin, I can invite new users by email.
As an admin, I can assign or change a user's role (admin, department owner, business owner).
As an admin, I can assign a department to department owners.
As an admin, I can deactivate users.
Screen 11 — Department Management (Admin only)
As an admin, I can view all departments.
As an admin, I can create, rename, or deactivate departments.
Screen 12 — Account Settings (Admin only)
As an admin, I can view tenant name and billing information.
As an admin, I can configure the default Slack webhook URL for the tenant.
As an admin, I can manage the Stripe subscription and access invoices via the Stripe Customer Portal.
Screen 13 — Profile & Notifications
As any user, I can update my display name and email.
As any user, I can connect my Slack user ID for personal Slack DM alerts.
As any user, I can set my default notification preferences (email, Slack, or both).

11. API Routes
All routes are Next.js API routes under /api/. All require a valid Auth0 session. Tenant scope is derived from the authenticated user's session — never passed as a parameter.
Authentication
POST /api/auth/login — Auth0 callback handler.
POST /api/auth/logout — Clear session.
Contracts
GET /api/contracts — List contracts (role-filtered). Accessible by all.
POST /api/contracts — Create new contract. Accessible by all.
GET /api/contracts/[id] — Get single contract with properties. Accessible by all.
PATCH /api/contracts/[id] — Update contract properties. Business owner and admin only.
DELETE /api/contracts/[id] — Delete contract. Admin only.
POST /api/contracts/[id]/confirm-action — Mark action taken; clears Action Required status. Business owner and admin only.
Documents
POST /api/contracts/[id]/documents — Upload linked document. Accessible by business owner and admin.
GET /api/contracts/[id]/documents — List all documents linked to contract. Accessible by all.
DELETE /api/contracts/[id]/documents/[docId] — Delete a document. Admin only.
GET /api/documents/[docId]/url — Get signed GCS URL for viewing a document. Accessible by all.
Contract Upload & AI Extraction
POST /api/upload — Upload main contract file to GCS and trigger extraction job. Accessible by all.
GET /api/upload/[jobId]/status — Poll extraction job status. Accessible by all.
GET /api/upload/[jobId]/result — Get extracted contract properties for review. Accessible by all.
Notification Alerts
GET /api/contracts/[id]/alerts — List all alerts for a contract. Accessible by all.
POST /api/contracts/[id]/alerts — Create new alert. Business owner and admin only.
PATCH /api/contracts/[id]/alerts/[alertId] — Update alert timing or channels. Business owner and admin only.
DELETE /api/contracts/[id]/alerts/[alertId] — Delete alert. Business owner and admin only.
Vendors
GET /api/vendors — List all vendors. Accessible by all.
POST /api/vendors — Create new vendor. Accessible by all.
GET /api/vendors/[id] — Get vendor with linked contracts. Accessible by all.
PATCH /api/vendors/[id] — Update vendor details. Admin only.
Users
GET /api/users — List all users in tenant. Admin only.
POST /api/users/invite — Invite user by email. Admin only.
PATCH /api/users/[id] — Update role or department. Admin only.
DELETE /api/users/[id] — Deactivate user. Admin only.
PATCH /api/users/me — Update own profile and notification preferences. Accessible by all.
Departments
GET /api/departments — List all departments. Accessible by all.
POST /api/departments — Create department. Admin only.
PATCH /api/departments/[id] — Rename department. Admin only.
DELETE /api/departments/[id] — Deactivate department. Admin only.
Settings
GET /api/settings/account — Get tenant account settings. Admin only.
PATCH /api/settings/account — Update Slack webhook URL and other tenant settings. Admin only.
Scheduled Jobs (internal, not user-facing)
POST /api/jobs/check-alerts — Evaluate all contracts and fire due notifications via SendGrid and Slack. Triggered daily by GCP Cloud Scheduler.
POST /api/jobs/update-statuses — Update contract statuses (Active → Action Required → Expired). Triggered daily by GCP Cloud Scheduler.

12. AI Extraction Spec
12.1 Overview
When a contract is uploaded, the file is sent to the Claude API (claude-sonnet) with a structured prompt instructing it to extract contract properties and return them as a strict JSON object. The result is stored in extraction_results and presented to the user for review before any data is saved to the contracts table.
12.2 Supported Input Formats
PDF — converted to text before sending to Claude.
DOCX — converted to plain text before sending to Claude.
XLSX — not processed; stored as attachment only.
12.3 Claude System Prompt
The system prompt instructs Claude to:
Act as a contract data extraction assistant.
Return only a valid JSON object matching the schema below — no prose, no markdown, no explanation.
Use null for any field it cannot find or is not confident about — never invent values.
Express dates in ISO 8601 format (YYYY-MM-DD).
Express durations and periods as integers.
12.4 Extraction Output Schema
The Claude API must return a JSON object with the following fields:
vendor_name (string or null), vendor_contact_name (string or null), vendor_contact_email (string or null), internal_group_entity (string or null), start_date (YYYY-MM-DD or null), end_date (YYYY-MM-DD or null), duration_months (integer or null), term_type ("fixed" or "indefinite" or null), auto_renewal (boolean or null), renewal_period_months (integer or null), renewal_notice_period_value (integer or null), renewal_notice_period_unit ("months" or "days" or null).
In addition, a confidence object must be returned with high/medium/low ratings for the following fields: vendor_name, start_date, end_date, term_type, auto_renewal, renewal_notice_period_value.
12.5 Confidence Handling in the UI
High confidence — field is pre-filled with a green indicator.
Medium confidence — field is pre-filled but flagged for user attention with an amber indicator.
Low confidence or null — field is left empty with a prompt for manual input, shown with a gray indicator.
User must click "Confirm & Save" to commit any extracted data — nothing is auto-saved.
12.6 Failure Handling
If Claude returns malformed JSON — extraction is marked as failed; user is prompted to fill in all fields manually.
If the uploaded file cannot be parsed to text (e.g. scanned image PDF with no OCR layer) — user is notified and prompted to enter properties manually.
Extraction failures are logged but do not block the user from creating the contract record manually.
12.7 Data Privacy
Contract document content is sent to the Anthropic API for extraction purposes only.
This must be disclosed in the product's privacy policy and DPA.
No contract content is used for model training (Anthropic's API terms apply).
Documents are not cached or stored by Anthropic beyond the API request lifecycle.

13. Onboarding Flow
13.1 Overview
Onboarding covers the full journey from a new customer signing up to their first contract being uploaded. It consists of four stages: sign-up, tenant provisioning, workspace setup, and first contract upload.
13.2 Stage 1 — Sign-up
New customer lands on the sign-up page and enters: company name, full name, work email, and password.
Auth0 creates a new user and a new Auth0 organization (= tenant).
The signing-up user is automatically assigned the admin role.
A verification email is sent via SendGrid; user must verify before proceeding.
13.3 Stage 2 — Tenant Provisioning (automated, background)
Triggered immediately after email verification:
A new record is created in the tenants table.
A dedicated GCP bucket is provisioned for the tenant (contrakt-{tenant-slug}-documents).
Bucket permissions are locked to the tenant's service account only.
A default notification alert template is created: 2 months before renewal notice deadline, via email.
User is redirected to the workspace setup screen.
13.4 Stage 3 — Workspace Setup (in-app, admin only)
A lightweight 3-step setup wizard shown to the admin on first login:
Step 1 — Departments. Admin creates at least one department. Pre-populated suggestions are shown (e.g. Legal, Finance, HR, IT, Engineering, Procurement). More departments can be added later in Settings.
Step 2 — Invite users. Admin can invite team members by email, assigning each a role and optionally a department. Invites are sent via SendGrid. This step is skippable.
Step 3 — Slack integration. Admin can paste the tenant-wide Slack Incoming Webhook URL. A test notification is sent to confirm the integration works. This step is skippable.
After completing or skipping all steps, admin lands on the Dashboard.
13.5 Stage 4 — First Contract Upload
An empty state prompt on the Dashboard guides the user to upload their first contract.
Upload flow follows the standard contract upload screen (Screen 5, §10.2).
A tooltip or inline guide highlights the AI extraction review step on first use.
13.6 Invited User Flow
Invited user receives email with a sign-up link.
User sets their password via Auth0.
User is assigned to the correct tenant, role, and department automatically.
User lands directly on the Dashboard — no setup wizard shown.
13.7 Onboarding Checklist (admin-facing, dismissible)
A checklist card on the Dashboard tracks onboarding progress and is hidden once all items are complete or the admin dismisses it:
Account created.
Departments added.
First user invited.
Slack connected.
First contract uploaded.

14. Error States & Edge Cases
14.1 File Upload Errors
File exceeds size limit (>25MB) Message: "This file is too large. Maximum file size is 25MB." Upload is blocked; user is prompted to compress or split the file.
Unsupported file format Message: "Only PDF, DOCX, and XLSX files are supported." Upload is blocked.
Upload fails mid-transfer (network error) Message: "Upload failed. Please try again." A retry button is shown; no partial file is stored.
File uploads successfully but text extraction fails (e.g. scanned image PDF) Message: "We couldn't read the text in this document. Please fill in the contract details manually." Contract creation continues with all fields empty for manual input.
14.2 AI Extraction Errors
Claude API returns malformed JSON Message: "Automatic extraction failed. Please fill in the details manually." All fields are left empty; user proceeds manually.
Claude API timeout or unavailable Message: "Extraction is taking longer than expected. You can wait or fill in the details manually." A retry option is shown; manual fallback is available.
Extraction returns all null fields No error message shown. Fields appear empty; user fills in manually.
14.3 Notification Errors
SendGrid delivery fails Retry up to 3 times with exponential backoff. Failure is logged. Admin is notified via an in-app dashboard alert.
Slack webhook fails Retry up to 3 times. Failure is logged. Email is sent as fallback if the email channel is also configured for that alert.
Both email and Slack fail Failure is logged. Contract status is still updated to "Action Required". Admin is notified on next dashboard login.
14.4 Access & Permission Errors
User tries to access a contract they don't own Message: "You don't have access to this contract." User is redirected to Dashboard.
Business owner tries to access admin settings Message: "This page is for admins only." User is redirected to Dashboard.
Expired or invalid Auth0 session Message: "Your session has expired. Please log in again." User is redirected to login.
14.5 Data Edge Cases
Contract end date in the past at upload Status is set to Expired immediately on save.
Renewal notice deadline already passed at upload Status is set to Action Required immediately; alert is fired on next scheduler run.
Auto-renewal is true but no renewal period is set Inline validation warning shown; save is blocked until renewal period is filled in.
Business owner account deactivated Contract remains assigned to the deactivated user. Admin is prompted to reassign on next dashboard login.
Vendor deleted Contracts retain the vendor name as plain text; the vendor link is removed. Admin is notified.
Duplicate contract upload (same file name, same vendor) Warning shown: "A contract with this name from this vendor already exists. Are you sure you want to continue?" User can proceed or cancel.
14.6 General UI Error States
All API errors return a user-facing toast notification: "Something went wrong. Please try again."
Network connectivity loss shows a banner: "You appear to be offline. Changes may not be saved."
Empty states (no contracts, no vendors, no users) show an illustrated empty state with a clear call-to-action button, not a blank screen.

15. Pricing & Packaging
15.1 Pricing Model
Per-seat SaaS subscription, billed monthly or annually (annual billing includes a discount equivalent to 2 months free). Pricing is based on active users across any role. Deactivated users do not count toward seat count.
15.2 Plans
Starter — €49/month (up to 5 users)
Up to 50 contracts.
Up to 5 users.
20 AI extractions per month.
5 GB storage.
Slack integration included.
Up to 2 custom alert rules per contract.
Vendor directory included.
No SSO, no dedicated support, no SLA.
Growth — €15/user/month
Unlimited contracts.
Unlimited users.
Unlimited AI extractions.
50 GB storage.
Slack integration included.
Unlimited custom alert rules.
Vendor directory included.
No SSO, no dedicated support, no SLA.
Enterprise — Custom pricing
Everything in Growth, plus: SSO, dedicated support, custom storage, and SLA.
15.3 Annual Discount
2 months free on annual billing (approximately 17% discount). Annual plans billed upfront.
15.4 Trial
14-day free trial on sign-up; no credit card required.
Trial includes full Growth plan features.
At trial end, admin is prompted to select a plan. Tenant moves to read-only if no plan is selected within 7 days of trial expiry.
15.5 Billing Infrastructure
Billing handled via Stripe.
Stripe Customer Portal used for plan changes, payment method updates, and invoice downloads.
Seat count synced to Stripe on user invite and deactivation.
Upgrade prompts shown in-app when a plan limit is reached.
15.6 Plan Limits Enforcement
Contract limit reached (Starter) Upload is blocked. Upgrade prompt is shown.
User limit reached (Starter) Invite is blocked. Upgrade prompt is shown.
AI extraction limit reached (Starter) Extraction is skipped. Manual entry prompt and upgrade prompt are shown.
Storage limit reached Upload is blocked. Upgrade prompt is shown.

16. GDPR & Data Privacy
16.1 Role Definitions
Contrakt.io (the product) — Data Processor. Processes personal data on behalf of customers. Customer (tenant) — Data Controller. Determines purpose and means of processing. Anthropic (Claude API) — Sub-processor. Receives contract content for AI extraction. SendGrid — Sub-processor. Receives email addresses for notification delivery. Auth0 — Sub-processor. Processes user identity and authentication data. Google Cloud (GCP) — Sub-processor. Hosts all files and database data. Stripe — Sub-processor. Processes billing and payment data.
16.2 Personal Data Processed
User name and email — Collected at registration and invite. Used for authentication and notifications. Slack user ID — Provided via user profile settings. Used for Slack notification delivery. Contract document content — Uploaded by customer. Used for storage, AI extraction, and viewing. Vendor contact name and email — Entered by customer. Used for contract record keeping.
16.3 Data Processing Agreement (DPA)
A DPA must be made available to all customers and accepted at sign-up.
The DPA must cover: processing purpose, data categories, sub-processors, retention periods, security measures, and data subject rights.
The sub-processor list must be kept up to date. Customers must be notified of changes with 30 days notice.
16.4 Data Residency
All customer data (database and file storage) is stored in GCP europe-west4 (Netherlands) by default.
This satisfies EU data residency requirements for most customers.
Enterprise customers can negotiate an alternative region on request.
16.5 Data Retention
Contract documents and metadata — Retained for the duration of the customer subscription plus 30 days. Deleted from GCP bucket and database at expiry. User data — Retained until account deactivation plus 30 days. Deleted from database and Auth0. Extraction results — Retained and deleted with the associated contract record. Notification logs — Retained for 12 months; auto-purged thereafter.
16.6 GDPR Data Subject Rights
Right of access — Admin can export all tenant data via Account Settings. Right to erasure — Admin can delete individual contracts or request full tenant deletion; executed within 30 days. Right to rectification — Users can update their own profile; admins can update any record. Right to portability — Contract metadata exportable as CSV; documents downloadable as ZIP. Right to object — Tenant can disable AI extraction per contract or globally in Account Settings.
16.7 Security Measures
All data encrypted in transit (TLS 1.2 or higher) and at rest (AES-256 via GCP default encryption).
GCP bucket access restricted to application service account only; no public access.
Auth0 handles password hashing, brute-force protection, and MFA (MFA optional for users; enforceable by admin on Enterprise plan).
API routes enforce role-based access control on every request.
Anthropic API calls contain contract content only — no tenant identifiers are included.
SendGrid and Slack receive email addresses and Slack IDs only — no contract content is shared.
16.8 Breach Notification
In the event of a data breach, affected customers will be notified within 72 hours in accordance with GDPR Article 33. A breach response procedure must be documented internally before go-live.

17. Out of Scope (v1)
Pre-signature and negotiation workflows.
E-signing integration (e.g. DocuSign).
Microsoft Teams integration.
Contract versioning and audit trail.
Multi-language UI (English only at launch).
Renewal decision workflow beyond action confirmation.
Mobile and tablet optimization.
Dark mode.
SOC 2 certification (recommended for a later stage).

18. Non-Functional Requirements
Hosting — Google Cloud Platform (europe-west4 region). Language — English (UI and all communications). Architecture — Multi-tenant SaaS; dedicated GCP bucket per tenant. File formats supported — PDF, DOCX, XLSX. Security — Role-based access control (RBAC) per §2. Browser support — Latest versions of Chrome, Firefox, Safari, and Edge. Maximum file size — 25 MB per upload. Uptime target — 99.5% (excluding scheduled maintenance).