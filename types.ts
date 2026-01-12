
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

// NEW: Transaction Types for better categorization
export enum TransactionType {
  STANDARD = 'STANDARD',   // Normale Rechnung / Zahlung
  // Added missing types
  OPENING_BALANCE = 'OPENING_BALANCE',
  PAYROLL = 'PAYROLL',     // Lohn & Gehalt
  CLOSING = 'CLOSING',     // Jahresabschluss
  CORRECTION = 'CORRECTION', // Umbuchung
  DEPRECIATION = 'DEPRECIATION', // Automatische AfA
  CREDIT_CARD = 'CREDIT_CARD'
}

// --- NEW: CONTROLLING / KLR ENTITIES ---
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
    daysToPay: number; // Wie viele Tage Frist?
}

export interface CompanySettings {
  companyName: string;
  ceo: string; // Geschäftsführer
  street: string;
  zip: string;
  city: string;
  country: string;
  
  // Tax
  taxNumber: string; // Steuernummer (für UStVA wichtig)
  vatId: string; // USt-IdNr.
  registerCourt: string; // Amtsgericht
  registerNumber: string; // HRB/HRA

  // Bank
  bankName: string;
  iban: string;
  bic: string;
  
  // Contact
  email: string;
  phone: string;
  website: string;

  // Dunning Configuration (Mahnwesen)
  dunningConfig?: {
      level1: DunningLevelConfig;
      level2: DunningLevelConfig;
      level3: DunningLevelConfig;
  };
}

export interface ContactPerson {
  name: string;
  role: string; // e.g. "Geschäftsführung", "Buchhaltung"
  email?: string;
  phone?: string;
}

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  email?: string; // General invoice email (e.g. accounting@)
  phone?: string;
  website?: string;
  
  // Specific Contact Persons (Multiple)
  contactPersons?: ContactPerson[];

  // Address
  street?: string;
  zip?: string;
  city?: string;
  country?: string; // default DE

  // Bank Details
  iban?: string;
  bic?: string;
  bankName?: string;

  // Legal & Tax
  vatId?: string; // USt-IdNr.
  taxNumber?: string; // Steuernummer
  registerNumber?: string; // HRB / HRA
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
}

export interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
  // Added KLR fields
  costCenterId?: string;
  projectId?: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  type?: TransactionType; // NEW field
  description: string;
  reference?: string; // Internal Document Reference (e.g. "LOB-2025-11", "UM-001")
  contactId?: string; // Optional link to a debtor/creditor
  lines: JournalLine[];
  invoiceId?: string; // Link to an invoice
  attachments?: string[]; // NEW: List of filenames
}

export interface Invoice {
  id: string;
  number: string; // Internal Number (RE-2023-001 or ER-2023-001)
  externalNumber?: string; // NEW: Vendor's Invoice Number (only relevant for incoming)
  date: string;
  dueDate: string; // New: Payment deadline
  contactId: string;
  description: string;
  netAmount: number;
  taxRate: number; // e.g. 19, 7, 0
  taxAmount: number;
  grossAmount: number;
  transactionId: string;
  dunningLevel?: number; // 0 = None, 1 = Reminder, 2 = 1. Warning, 3 = 2. Warning
  lastDunningDate?: string; // ISO Date of last dunning action
}

// --- NEW PROCUREMENT TYPES ---
export enum PurchaseOrderStatus {
  OFFER = 'OFFER',           // Angebot erhalten
  ORDERED = 'ORDERED',       // Bestellt
  DELIVERED = 'DELIVERED',   // Ware/Leistung erhalten
  COMPLETED = 'COMPLETED'    // Rechnung geprüft & gebucht
}

export interface PurchaseOrder {
  id: string;
  contactId: string;
  date: string;
  status: PurchaseOrderStatus;
  offerNumber?: string; // Nummer des Lieferantenangebots
  orderNumber: string; // Unsere interne Bestellnummer
  description: string;
  netAmount: number; // Erwarteter Nettobetrag laut Angebot
  notes?: string;
}

// --- NEW ASSET MANAGEMENT TYPES ---
export interface Asset {
    id: string; // Internal UUID
    inventoryNumber: string; // e.g. INV-001
    name: string; // e.g. "VW Golf"
    glAccountId: string; // Account where AHK is booked (e.g. 0320)
    
    purchaseDate: string; // Anschaffungsdatum (Zugang)
    documentRef?: string; // Rechnungsnummer / Belegnummer
    
    cost: number; // Anschaffungskosten (AHK Netto)
    
    usefulLifeYears: number; // Nutzungsdauer in Jahren
    afaCategory?: string; // z.B. "AfA-Tabelle AV" oder "GWG"
    
    residualValue: number; // Restwert (usually 0 or 1)
    
    status: 'ACTIVE' | 'SOLD' | 'SCRAPPED';
    location?: string; // e.g. "Büro München"
}

export interface FinancialReportData {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}
