
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

export enum ContactType {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR'
}

export enum TransactionType {
  STANDARD = 'STANDARD',
  OPENING_BALANCE = 'OPENING_BALANCE',
  PAYROLL = 'PAYROLL',
  CLOSING = 'CLOSING',
  CORRECTION = 'CORRECTION',
  DEPRECIATION = 'DEPRECIATION',
  CREDIT_CARD = 'CREDIT_CARD',
  REVERSAL = 'REVERSAL'
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

export interface ProjectBudgetPosition {
  accountId: string;
  amount: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
  startDate: string;
  budget?: number;
  budgetPlan?: ProjectBudgetPosition[];
}

export interface DunningLevelConfig {
  title: string;
  subjectTemplate: string;
  bodyTemplate: string;
  fee: number;
  daysToPay: number;
}

export interface CompanySettings {
  companyName: string;
  ceo: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  taxNumber: string;
  vatId: string;
  registerCourt: string;
  registerNumber: string;
  bankName: string;
  iban: string;
  bic: string;
  email: string;
  phone: string;
  website: string;
  dunningConfig?: {
    level1: DunningLevelConfig;
    level2: DunningLevelConfig;
    level3: DunningLevelConfig;
  };
}

// Added ContactPerson interface
export interface ContactPerson {
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  email?: string;
  phone?: string;
  // Added missing fields for Contact interface
  fax?: string;
  website?: string;
  city?: string;
  zip?: string;
  street?: string;
  country?: string;
  glAccount?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  vatId?: string;
  taxStatus?: 'DOMESTIC' | 'EU' | 'THIRD';
  isBlocked?: boolean;
  category?: string;
  notes?: string;
  paymentTermsDays?: number;
  discountRate?: number;
  discountDays?: number;
  creditLimit?: number;
  contactPersons?: ContactPerson[];
  deliveryTerms?: string;
  shippingMethod?: string;
  altDeliveryAddress?: string;
  sepaMandateReference?: string;
}

export interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
  costCenterId?: string;
  projectId?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type?: TransactionType;
  description: string;
  reference?: string;
  contactId?: string;
  lines: JournalLine[];
  invoiceId?: string;
  isReversed?: boolean;
  reversedBy?: string;
  reversesId?: string;
  stornoReason?: string;
  // Added attachments field
  attachments?: string[];
}

export interface Invoice {
  id: string;
  number: string;
  externalNumber?: string;
  date: string;
  dueDate: string;
  contactId: string;
  description: string;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  grossAmount: number;
  transactionId: string;
  isReversed?: boolean;
  dunningLevel?: number;
}

export interface Asset {
  id: string;
  inventoryNumber: string;
  name: string;
  glAccountId: string;
  purchaseDate: string;
  cost: number;
  usefulLifeYears: number;
  status: 'ACTIVE' | 'SOLD' | 'SCRAPPED';
  documentRef?: string;
  afaCategory?: string;
  residualValue?: number;
}

export interface ClientProfile {
  id: string;
  name: string;
  created: string;
}

export enum PurchaseOrderStatus {
  OFFER = 'OFFER',
  ORDERED = 'ORDERED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED'
}

export interface PurchaseOrder {
  id: string;
  contactId: string;
  date: string;
  status: PurchaseOrderStatus;
  orderNumber: string;
  description: string;
  netAmount: number;
  offerNumber?: string;
  notes?: string;
}
