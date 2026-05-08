// ─── Enums ────────────────────────────────────────────────────────────────────
//
// Defined as const objects + derived union types so they remain compatible with
// Prisma's generated string-literal unions while still usable as UserRole.Admin.

export const UserRole = {
  Admin: "admin",
  DepartmentOwner: "department_owner",
  BusinessOwner: "business_owner",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TermType = {
  Fixed: "fixed",
  Indefinite: "indefinite",
} as const;
export type TermType = (typeof TermType)[keyof typeof TermType];

export const PeriodUnit = {
  Months: "months",
  Days: "days",
} as const;
export type PeriodUnit = (typeof PeriodUnit)[keyof typeof PeriodUnit];

export const ContractStatus = {
  Active: "active",
  Expired: "expired",
  AutoRenewed: "auto_renewed",
  ActionRequired: "action_required",
} as const;
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

export const DocumentType = {
  Main: "main",
  Attachment: "attachment",
  Addendum: "addendum",
  Amendment: "amendment",
  Renewal: "renewal",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const FileFormat = {
  Pdf: "pdf",
  Docx: "docx",
  Xlsx: "xlsx",
} as const;
export type FileFormat = (typeof FileFormat)[keyof typeof FileFormat];

export const AlertChannel = {
  Email: "email",
  Slack: "slack",
} as const;
export type AlertChannel = (typeof AlertChannel)[keyof typeof AlertChannel];

export const AlertTriggerReference = {
  RenewalNoticeDeadline: "renewal_notice_deadline",
  EndDate: "end_date",
} as const;
export type AlertTriggerReference = (typeof AlertTriggerReference)[keyof typeof AlertTriggerReference];

export const TenantPlan = {
  Free: "free",
  Starter: "starter",
  Team: "team",
  Business: "business",
} as const;
export type TenantPlan = (typeof TenantPlan)[keyof typeof TenantPlan];

export const TenantPlanStatus = {
  Active: "active",
  PastDue: "past_due",
  Canceled: "canceled",
  ReadOnly: "read_only",
} as const;
export type TenantPlanStatus = (typeof TenantPlanStatus)[keyof typeof TenantPlanStatus];

export const ConfidenceLevel = {
  High: "high",
  Medium: "medium",
  Low: "low",
} as const;
export type ConfidenceLevel = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel];

// ─── Core Entity Interfaces ───────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  gcsBucket: string;
  slackWebhookUrl: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: TenantPlan;
  planStatus: TenantPlanStatus;
  trialEndsAt: Date | null;
  seatCount: number;
  setupComplete: boolean;
  createdAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  clerkId: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  slackUserId: string | null;
  createdAt: Date;
}

export interface Department {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  createdAt: Date;
}

export interface GroupEntity {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Contract {
  id: string;
  contractName: string;
  tenantId: string;
  vendorId: string;
  departmentId: string;
  groupEntityId: string | null;
  internalGroupEntity: string | null;
  startDate: Date;
  endDate: Date;
  durationMonths: number;
  termType: TermType;
  autoRenewal: boolean;
  renewalPeriodMonths: number | null;
  renewalNoticePeriodValue: number | null;
  renewalNoticePeriodUnit: PeriodUnit | null;
  renewalNoticeDeadline: Date | null;
  status: ContractStatus;
  actionConfirmed: boolean;
  actionConfirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractOwner {
  contractId: string;
  userId: string;
  assignedAt: Date;
}

export interface Document {
  id: string;
  tenantId: string;
  contractId: string;
  type: DocumentType;
  version: number;
  fileName: string;
  filePath: string;
  fileFormat: FileFormat;
  uploadedById: string | null;
  uploadedAt: Date;
}

export interface NotificationAlert {
  id: string;
  tenantId: string;
  contractId: string;
  triggerValue: number;
  triggerUnit: PeriodUnit;
  triggerReference: AlertTriggerReference;
  channels: AlertChannel[];
  sentAt: Date | null;
  createdAt: Date;
}

export interface ExtractionResult {
  id: string;
  tenantId: string;
  documentId: string;
  extractedData: ExtractionOutput;
  confidence: ConfidenceRatings;
  confirmedById: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
}

// ─── AI Extraction Types ──────────────────────────────────────────────────────

/** Raw JSON structure returned by the Claude API extraction prompt (§12.4) */
export interface ExtractionOutput {
  vendor_name: string | null;
  vendor_contact_name: string | null;
  vendor_contact_email: string | null;
  internal_group_entity: string | null;
  start_date: string | null; // ISO 8601 YYYY-MM-DD
  end_date: string | null;   // ISO 8601 YYYY-MM-DD
  duration_months: number | null;
  term_type: "fixed" | "indefinite" | null;
  auto_renewal: boolean | null;
  renewal_period_months: number | null;
  renewal_notice_period_value: number | null;
  renewal_notice_period_unit: "months" | "days" | null;
}

/** Per-field confidence ratings returned alongside extracted values (§12.4) */
export interface ConfidenceRatings {
  vendor_name: ConfidenceLevel;
  start_date: ConfidenceLevel;
  end_date: ConfidenceLevel;
  term_type: ConfidenceLevel;
  auto_renewal: ConfidenceLevel;
  renewal_notice_period_value: ConfidenceLevel;
}

// ─── Relational / API Response Types ─────────────────────────────────────────

/** User with their department resolved */
export interface UserWithDepartment extends User {
  department: Department | null;
}

/** Vendor with a count of linked contracts */
export interface VendorWithContractCount extends Vendor {
  contractCount: number;
}

/** Minimal owner info surfaced inside contract responses */
export interface ContractOwnerWithUser extends ContractOwner {
  user: Pick<User, "id" | "name" | "email">;
}

/** Full contract record with all relations needed for the detail page (§7.5) */
export interface ContractWithRelations extends Contract {
  vendor: Vendor;
  department: Department;
  groupEntity: GroupEntity | null;
  owners: ContractOwnerWithUser[];
  documents: Document[];
  notificationAlerts: NotificationAlert[];
}

/** Lighter contract shape for list/dashboard views (§7.4) */
export interface ContractSummary {
  id: string;
  contractName: string;
  tenantId: string;
  groupEntity: Pick<GroupEntity, "id" | "name"> | null;
  startDate: Date;
  endDate: Date;
  durationMonths: number;
  termType: TermType;
  renewalNoticeDeadline: Date | null;
  status: ContractStatus;
  autoRenewal: boolean;
  vendor: Pick<Vendor, "id" | "name">;
  department: Pick<Department, "id" | "name">;
  owners: Pick<User, "id" | "name">[];
}

/** Extraction result with its source document resolved */
export interface ExtractionResultWithDocument extends ExtractionResult {
  document: Document;
}

// ─── API Request / Response Shapes ───────────────────────────────────────────

/** Body accepted by POST /api/contracts */
export interface CreateContractInput {
  contractName: string;
  vendorId: string;
  departmentId: string;
  groupEntityId: string | null;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  termType: TermType;
  autoRenewal: boolean;
  renewalPeriodMonths: number | null;
  renewalNoticePeriodValue: number | null;
  renewalNoticePeriodUnit: PeriodUnit | null;
  ownerIds: string[];
  documentId?: string; // pre-uploaded main document to link
}

/** Body accepted by PATCH /api/contracts/[id] */
export type UpdateContractInput = Partial<Omit<
  CreateContractInput,
  "documentId"
>>;

/** Body accepted by POST /api/contracts/[id]/alerts */
export interface CreateAlertInput {
  triggerValue: number;
  triggerUnit: PeriodUnit;
  triggerReference: AlertTriggerReference;
  channels: AlertChannel[];
}

/** Body accepted by PATCH /api/contracts/[id]/alerts/[alertId] */
export type UpdateAlertInput = Partial<CreateAlertInput>;

/** Body accepted by POST /api/vendors */
export interface CreateVendorInput {
  name: string;
  contactName?: string;
  contactEmail?: string;
}

/** Usage counts for a tenant — used by billing UI and plan limit checks */
export interface PlanUsage {
  contracts: number;
  users: number;
  extractionsThisMonth: number;
}

/** Standard paginated list wrapper for collection endpoints */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Standard error shape returned by all API routes */
export interface ApiError {
  error: string;
  code?: string;
}
