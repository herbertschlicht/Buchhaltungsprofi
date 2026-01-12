

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

export enum ContactType {
  CUSTOMER = 'CUSTOMER', // Debtor
  VENDOR = 'VENDOR'      // Creditor
}

export enum TransactionType {
  STANDARD = 'STANDARD',
  OPENING_BALANCE = 'OPENING_BALANCE',
  PAYROLL = 'PAYROLL',
  CLOSING = 'CLOSING',
  CORRECTION = 'CORRECTION',
  DEPRECIATION = 'DEPRECIATION',
  CREDIT_CARD = 'CREDIT_CARD'
}

// Added Account interface to fix "Module has no exported member Account" errors
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
    endDate?: string;
    budget?: number; 
    budgetPlan?: ProjectBudgetPosition[]; 
    description?: string;
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

export interface ContactPerson {
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface Contact {
  id: string; // Kundennummer / Lieferantennummer
  name: string;
  type: ContactType;
  
  // Identität & Kontakt
  contactPersons?: ContactPerson[];
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;

  // Adresse
  street?: string;
  zip?: string;
  city?: string;
  country?: string;

  // Finanzen
  paymentTermsDays?: number; // Zahlungsziel in Tagen
  discountRate?: number;     // Skonto in %
  discountDays?: number;     // Skontofrist in Tagen
  creditLimit?: number;      // Kreditlimit in €
  glAccount?: string;        // Zugeordnetes Debitoren/Kreditorenkonto (z.B. 1400 / 1600)

  // Steuer
  vatId?: string;           // USt-IdNr.
  taxNumber?: string;       // Steuernummer
  taxStatus?: 'DOMESTIC' | 'EU' | 'THIRD'; // Inland, EU, Drittland

  // Bank
  iban?: string;
  bic?: string;
  bankName?: string;
  sepaMandateReference?: string; // SEPA-Mandatsreferenz
  sepaMandateDate?: string;      // Datum des Mandats

  // Lieferdetails (Primär Kreditoren)
  deliveryTerms?: string;       // Lieferbedingungen (Incoterms etc.)
  shippingMethod?: string;      // Bevorzugte Versandart
  // Added preferredShippingMethod to fix type error in ContactForm.tsx
  preferredShippingMethod?: string;
  altDeliveryAddress?: string;  // Abweichende Lieferadresse

  // Mahnwesen & Sperren
  dunningLevel?: number;        // Aktuelle Mahnstufe
  dunningRules?: string;        // Spezielle Mahnregeln
  blockNote?: string;           // Sperrvermerk (z.B. "Nur Vorkasse")
  isBlocked?: boolean;

  // Internes
  notes?: string;
  category?: string;            // Kunden/Lieferanten-Kategorie
  defaultCostCenterId?: string;
  defaultProjectId?: string;
  registerNumber?: string;      // HRB / HRA
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
  dunningLevel?: number;
  lastDunningDate?: string;
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
  offerNumber?: string;
  orderNumber: string; 
  description: string;
  netAmount: number;
  notes?: string;
}

export interface Asset {
    id: string;
    inventoryNumber: string;
    name: string;
    glAccountId: string;
    purchaseDate: string;
    documentRef?: string;
    cost: number;
    usefulLifeYears: number;
    afaCategory?: string;
    residualValue: number;
    status: 'ACTIVE' | 'SOLD' | 'SCRAPPED';
    location?: string;
}

export interface ClientProfile {
    id: string;
    name: string;
    created: string;
}