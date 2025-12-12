import React, { useState, useMemo } from 'react';
import { Transaction, Account, AccountType, CompanySettings } from '../types';
import { Calculator, AlertCircle, CheckCircle, Printer, Building2, FileText, PieChart, Search, ChevronDown, ChevronRight, Calendar } from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  companySettings: CompanySettings;
}

// --- HGB STRUCTURE DEFINITIONS ---

type ReportGroup = {
    id: string;
    label: string;
    parent?: string; // For nesting
    isTotal?: boolean;
};

// Definition der GuV Zeilen (Staffelform)
const GUV_STRUCTURE: ReportGroup[] = [
    { id: 'revenue', label: '1. Umsatzerlöse' },
    { id: 'revenue_other', label: '2. Sonstige betriebliche Erträge' },
    { id: 'material', label: '3. Materialaufwand' },
    { id: 'personnel', label: '4. Personalaufwand' },
    { id: 'depreciation', label: '5. Abschreibungen' },
    { id: 'other_cost', label: '6. Sonstige betriebliche Aufwendungen' },
    { id: 'interest', label: '7. Zinsen und ähnliche Aufwendungen' },
    { id: 'taxes', label: '8. Steuern vom Einkommen und Ertrag' },
];

// Definition der Bilanz Aktiva (Prefix act_)
const BILANZ_AKTIVA_STRUCTURE: ReportGroup[] = [
    { id: 'act_A', label: 'A. Anlagevermögen', isTotal: true },
    { id: 'act_A_I', label: 'I. Immaterielle Vermögensgegenstände', parent: 'act_A' },
    { id: 'act_A_II', label: 'II. Sachanlagen', parent: 'act_A' },
    { id: 'act_A_III', label: 'III. Finanzanlagen', parent: 'act_A' },
    
    { id: 'act_B', label: 'B. Umlaufvermögen', isTotal: true },
    { id: 'act_B_I', label: 'I. Vorräte', parent: 'act_B' },
    { id: 'act_B_II', label: 'II. Forderungen und sonstige Vermögensgegenstände', parent: 'act_B' },
    { id: 'act_B_III', label: 'III. Kassenbestand, Bundesbankguthaben, Guthaben bei Kreditinstituten', parent: 'act_B' }, // Flüssige Mittel
    
    { id: 'act_C', label: 'C. Rechnungsabgrenzungsposten', isTotal: true } // RAP
];

// Definition der Bilanz Passiva (Prefix pas_)
const BILANZ_PASSIVA_STRUCTURE: ReportGroup[] = [
    { id: 'pas_A', label: 'A. Eigenkapital', isTotal: true },
    { id: 'pas_A_I', label: 'I. Kapital / Einlagen', parent: 'pas_A' },
    { id: 'pas_A_II', label: 'II. Gewinnvortrag / Verlustvortrag', parent: 'pas_A' }, // Previous Years Result
    { id: 'pas_A_III', label: 'III. Jahresüberschuss / Jahresfehlbetrag', parent: 'pas_A' }, // Current Year Result
    { id: 'pas_A_IV', label: 'IV. Entnahmen / Einlagen (Privat)', parent: 'pas_A' },

    { id: 'pas_B', label: 'B. Rückstellungen', isTotal: true },
    
    { id: 'pas_C', label: 'C. Verbindlichkeiten', isTotal: true },
    { id: 'pas_C_I', label: 'I. Verbindlichkeiten aus Lieferungen und Leistungen', parent: 'pas_C' },
    { id: 'pas_C_II', label: 'II. Verbindlichkeiten gegenüber Kreditinstituten', parent: 'pas_C' },
    { id: 'pas_C_III', label: 'III. Sonstige Verbindlichkeiten (inkl. Steuer/Sozial)', parent: 'pas_C' },
];

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, accounts, companySettings }) => {
  const [activeReport, setActiveReport] = useState<'income' | 'balance' | 'vat' | 'reconciliation'>('income');
  
  // Year Selection State
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [reportDate, setReportDate] = useState(`${currentYear}-12-31`);

  // Update report date when year changes
  const handleYearChange = (year: number) => {
      setSelectedYear(year);
      setReportDate(`${year}-12-31`);
  };

  // Determine available years from transactions
  const availableYears = useMemo(() => {
      const years = new Set<number>(transactions.map(t => new Date(t.date).getFullYear()));
      years.add(currentYear); // Ensure current year is always available
      return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // --- ENGINE: Map Accounts to Categories based on SKR03 Code Ranges ---
  const mapAccountToCategory = (account: Account): string => {
      const c = parseInt(account.code);
      
      // --- GuV (P&L) Mapping ---
      if (account.type === AccountType.REVENUE) {
          if (c >= 8000 && c <= 8999 && !account.name.includes('Eigenverbrauch')) return 'revenue';
          if (c >= 2600 && c <= 2799) return 'revenue_other'; // Zinserträge etc
          if (account.name.includes('Eigenverbrauch') || account.name.includes('Wertabgaben')) return 'revenue_other';
          return 'revenue_other'; // Fallback Revenue
      }
      if (account.type === AccountType.EXPENSE) {
          if (c >= 3000 && c <= 3999) return 'material';
          if (c >= 4100 && c <= 4199) return 'personnel';
          if (c >= 4200 && c <= 4299) return 'other_cost'; // Raumkosten -> Sonstige
          if (c >= 4820 && c <= 4860) return 'depreciation';
          if (c >= 2100 && c <= 2150) return 'interest';
          if (c >= 2200 && c <= 2299) return 'taxes';
          // Alles andere in 4xxx ist sonstige
          return 'other_cost';
      }

      // --- BILANZ AKTIVA Mapping (act_) ---
      if (account.type === AccountType.ASSET) {
          // Anlagevermögen (Class 0)
          if (c >= 10 && c <= 49) return 'act_A_I'; // Immateriell
          if (c >= 50 && c <= 499) return 'act_A_II'; // Sachanlagen
          if (c >= 500 && c <= 699) return 'act_A_III'; // Finanzanlagen
          
          // Umlaufvermögen (Class 1)
          if (c >= 3960 && c <= 3980) return 'act_B_I'; // Bestände (Sonderfall SKR03 Class 3 Asset)
          if (c >= 1400 && c <= 1499) return 'act_B_II'; // Forderungen aLL
          if (c >= 1500 && c <= 1549) return 'act_B_II'; // Sonstige Forderungen
          if (c >= 1000 && c <= 1399) return 'act_B_III'; // Bank/Kasse
          
          // KORREKTUR: Vorsteuer ist Forderung ggü. Finanzamt -> B.II Sonstige Vermögensgegenstände
          if (c >= 1570 && c <= 1599) return 'act_B_II'; 
          
          if (c >= 980 && c <= 990) return 'act_C'; // RAP
          
          return 'act_B_II'; // Fallback Asset -> Forderungen/Sonstige
      }

      // --- BILANZ PASSIVA Mapping (pas_) ---
      if (account.type === AccountType.LIABILITY) {
          if (c >= 800 && c <= 999 && !account.name.includes('Rückstellung')) return 'pas_A_I'; // Sollte Equity sein, aber falls falsch typisiert
          if (c >= 2300 && c <= 2399) return 'pas_B'; // Rückstellungen (Class 2 SKR03 special)
          if (c >= 950 && c <= 979) return 'pas_B'; // Rückstellungen
          
          if (c >= 1600 && c <= 1699) return 'pas_C_I'; // Verb. aLL
          if (c >= 1705 && c <= 1709) return 'pas_C_II'; // Bankdarlehen
          if (c >= 1700 && c <= 1999) return 'pas_C_III'; // Sonstige (USt, Lohn etc.)
          
          return 'pas_C_III';
      }

      if (account.type === AccountType.EQUITY) {
          if (c >= 1800 && c <= 1899) return 'pas_A_IV'; // Privat (Entnahmen/Einlagen)
          if (c >= 800 && c <= 899) return 'pas_A_I'; // Festkapital
          if (c >= 900 && c <= 949) return 'pas_A_II'; // Vortragskonten (falls manuell gebucht)
          return 'pas_A_I';
      }

      return 'uncategorized';
  };

  // --- REPORT SPECIFIC CALCULATION ENGINE ---
  // Calculates balance for an account with Year-Aware Logic
  const calculateReportBalance = (accountId: string, type: AccountType) => {
      let balance = 0;
      
      const startDateStr = `${selectedYear}-01-01`;
      const endDateStr = reportDate; // Usually YYYY-12-31

      transactions.forEach(t => {
          // Rule 1: Never include future transactions relative to report date
          if (t.date > endDateStr) return;

          // Rule 2: For P&L (Success Accounts), ONLY include transactions WITHIN the fiscal year
          // Expenses and Revenues reset to 0 at the start of the year.
          if ((type === AccountType.REVENUE || type === AccountType.EXPENSE) && t.date < startDateStr) return;

          t.lines.forEach(line => {
              if (line.accountId === accountId) {
                  if ([AccountType.ASSET, AccountType.EXPENSE].includes(type)) {
                      balance += line.debit - line.credit;
                  } else {
                      balance += line.credit - line.debit;
                  }
              }
          });
      });
      return balance;
  };

  // --- NEW: Calculate Retained Earnings (Gewinnvortrag) automatically ---
  // Sums up Revenue - Expense for ALL years prior to the selected year.
  const calculatePreviousYearsResult = () => {
      let balance = 0;
      const startDateStr = `${selectedYear}-01-01`;

      transactions.forEach(t => {
          // Strict Filter: Only transactions BEFORE the current year
          if (t.date >= startDateStr) return;

          t.lines.forEach(line => {
              const acc = accounts.find(a => a.id === line.accountId);
              if (!acc) return;

              // Add Revenue (Credit positive)
              if (acc.type === AccountType.REVENUE) {
                  balance += line.credit - line.debit;
              }
              // Subtract Expense (Debit negative for Equity logic)
              else if (acc.type === AccountType.EXPENSE) {
                  balance += line.credit - line.debit; // Expense debit reduces equity
              }
          });
      });
      return balance;
  };

  const getCategoryTotal = (categoryId: string, type: AccountType) => {
      // FIX: Strict filtering by type to avoid ID collisions between Assets and Equity
      const relevantAccounts = accounts.filter(a => mapAccountToCategory(a) === categoryId && a.type === type);
      return relevantAccounts.reduce((sum, acc) => sum + calculateReportBalance(acc.id, acc.type), 0);
  };

  // Calculate GuV Totals (Strictly for Selected Year)
  const revenueTotal = getCategoryTotal('revenue', AccountType.REVENUE);
  const otherRevenueTotal = getCategoryTotal('revenue_other', AccountType.REVENUE);
  const materialTotal = getCategoryTotal('material', AccountType.EXPENSE);
  const personnelTotal = getCategoryTotal('personnel', AccountType.EXPENSE);
  const depreciationTotal = getCategoryTotal('depreciation', AccountType.EXPENSE);
  const otherCostTotal = getCategoryTotal('other_cost', AccountType.EXPENSE);
  const interestTotal = getCategoryTotal('interest', AccountType.EXPENSE);
  const taxTotal = getCategoryTotal('taxes', AccountType.EXPENSE);

  const totalIncome = revenueTotal + otherRevenueTotal;
  const totalExpense = materialTotal + personnelTotal + depreciationTotal + otherCostTotal + interestTotal + taxTotal;
  
  // This calculates the Net Income for the SELECTED YEAR only
  const netResult = totalIncome - totalExpense; 
  
  // Calculate Profit Carryforward from PREVIOUS years (Automatic)
  const retainedEarnings = calculatePreviousYearsResult();

  // --- VAT CALC ---
  const getBalanceByPrefix = (prefix: string, type: AccountType) => {
      const relevantAccounts = accounts.filter(a => a.code.startsWith(prefix));
      return relevantAccounts.reduce((sum, acc) => sum + calculateReportBalance(acc.id, acc.type), 0);
  };
  const baseAmount19 = getBalanceByPrefix('84', AccountType.REVENUE);
  const taxAmount19 = baseAmount19 * 0.19;
  const baseAmount7 = getBalanceByPrefix('83', AccountType.REVENUE);
  const taxAmount7 = baseAmount7 * 0.07;
  const baseAmount0 = getBalanceByPrefix('81', AccountType.REVENUE);
  const totalOutputTax = taxAmount19 + taxAmount7;
  const inputTax = getBalanceByPrefix('15', AccountType.ASSET);
  const vatPayable = totalOutputTax - inputTax;

  // --- RENDER COMPONENT: REPORT ROW ---
  const ReportRow: React.FC<{ 
      label: string; 
      amount?: number; 
      isTotal?: boolean; 
      level?: number; 
      details?: React.ReactNode 
  }> = ({ label, amount, isTotal, level = 0, details }) => {
      const [expanded, setExpanded] = useState(true);
      
      const displayAmount = amount !== undefined ? amount : 0;
      const color = displayAmount >= 0 ? (isTotal ? 'text-slate-900' : 'text-slate-700') : 'text-red-600';
      const bgColor = isTotal ? (level === 0 ? 'bg-slate-100' : 'bg-slate-50') : '';
      const paddingLeft = level * 16 + 12;

      return (
          <div className="border-b border-slate-100 last:border-0">
              <div 
                className={`flex justify-between items-center py-2 pr-4 hover:bg-slate-50 transition-colors ${bgColor}`}
                style={{ paddingLeft: `${paddingLeft}px` }}
                onClick={() => setExpanded(!expanded)}
              >
                  <div className={`flex items-center gap-2 ${isTotal ? 'font-bold' : ''}`}>
                      {details && (
                          <button className="text-slate-400 hover:text-slate-600">
                              {expanded ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
                          </button>
                      )}
                      <span>{label}</span>
                  </div>
                  {amount !== undefined && (
                      <span className={`font-mono ${isTotal ? 'font-bold' : ''} ${color}`}>
                          {displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                      </span>
                  )}
              </div>
              {expanded && details && (
                  <div className="animate-fadeIn">
                      {details}
                  </div>
              )}
          </div>
      );
  };

  // Helper to render account details for a category
  const renderAccountDetails = (categoryId: string, type: AccountType) => {
      // Fix: Filter by Type as well to ensure correct list
      const relevantAccounts = accounts.filter(a => mapAccountToCategory(a) === categoryId && a.type === type);
      if (relevantAccounts.length === 0) return null;

      return (
          <div className="bg-white">
              {relevantAccounts.map(acc => {
                  const bal = calculateReportBalance(acc.id, acc.type);
                  if (Math.abs(bal) < 0.01) return null;
                  return (
                      <div key={acc.id} className="flex justify-between py-1 pr-4 pl-12 text-xs text-slate-500 hover:bg-yellow-50">
                          <span>{acc.code} - {acc.name}</span>
                          <span className="font-mono">{bal.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</span>
                      </div>
                  );
              })}
          </div>
      );
  };

  // --- RECONCILIATION LOGIC ---
  const getReconciliationData = (taxAccountCode: string, taxRate: number) => {
      const taxAccount = accounts.find(a => a.code === taxAccountCode);
      if (!taxAccount) return [];
      const breakdown: any[] = [];
      transactions.forEach(t => {
          if (t.date.substring(0, 4) !== selectedYear.toString()) return; // Filter by year

          const taxLine = t.lines.find(l => l.accountId === taxAccount.id);
          if (!taxLine) return;
          const baseLine = t.lines.find(l => 
              l.accountId !== taxAccount.id && 
              !['1000', '1200', '1400', '1600', '1210'].some(code => {
                  const acc = accounts.find(a => a.id === l.accountId);
                  return acc?.code.startsWith(code);
              })
          );
          if (baseLine) {
              const acc = accounts.find(a => a.id === baseLine.accountId);
              if (acc) {
                  const existing = breakdown.find(b => b.accountId === acc.id);
                  const lineTaxAmount = taxLine.debit > 0 ? taxLine.debit : taxLine.credit;
                  const lineNetAmount = baseLine.debit > 0 ? baseLine.debit : baseLine.credit;
                  if (existing) { existing.netAmount += lineNetAmount; existing.taxAmount += lineTaxAmount; } 
                  else { breakdown.push({ accountId: acc.id, accountName: acc.name, accountCode: acc.code, netAmount: lineNetAmount, taxAmount: lineTaxAmount }); }
              }
          }
      });
      return breakdown;
  };

  // --- ELSTER FORM COMPONENTS ---
  const ElsterLine: React.FC<{ lineNr?: number; label: string; kz?: string; value?: number; isTaxField?: boolean; highlight?: boolean; }> = 
    ({ lineNr, label, kz, value, isTaxField = false, highlight = false }) => (
      <div className={`flex border-b border-slate-300 text-xs ${highlight ? 'bg-yellow-50' : ''}`}>
          <div className="w-8 border-r border-slate-300 bg-slate-100 p-1.5 text-center text-slate-500 font-mono">{lineNr || ''}</div>
          <div className="flex-1 p-1.5 text-slate-700 font-medium">{label}</div>
          <div className="w-10 border-l border-r border-slate-300 bg-slate-200 p-1.5 text-center font-bold text-slate-900">{kz || ''}</div>
          <div className="w-32 p-1.5 text-right font-mono bg-white">
              {value !== undefined ? (isTaxField ? 
                  <span className={value < 0 ? 'text-red-600' : 'text-slate-900'}>{value.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span> : 
                  <span className="text-slate-900">{Math.floor(value).toLocaleString('de-DE')}</span>
              ) : <div className="w-full h-full bg-slate-100/30 diagonal-stripe"></div>}
          </div>
      </div>
  );

  const FormHeader = ({ page, title }: { page: number, title: string }) => (
      <div className="border-b-2 border-slate-800 pb-4 mb-4 flex justify-between items-start">
          <div className="flex items-center gap-3">
             <div className="bg-slate-900 text-white p-2 font-bold text-xl">USt 1 A</div>
             <div>
                <div className="font-bold text-lg uppercase">Umsatzsteuer-Voranmeldung</div>
                <div className="text-xs text-slate-500">{title}</div>
             </div>
          </div>
          <div className="text-right"><div className="text-xs text-slate-400 uppercase">Seite</div><div className="font-bold text-xl">{page}</div></div>
      </div>
  );

  // --- Buchhalternase (Visual Gap Filler) ---
  // Renders a div that expands to fill space and shows a diagonal line
  // REVISED: Remove min-height so it collapses to 0 if not needed.
  const LedgerFiller = () => (
      <div 
        className="flex-1 w-full relative border-x border-slate-100 min-h-0"
      >
         <div className="absolute inset-0" style={{
             backgroundImage: `linear-gradient(to bottom right, transparent calc(50% - 1px), #cbd5e1 calc(50%), transparent calc(50% + 1px))`
         }}></div>
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* --- REPORT CONTROLS (Year Selector) --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-bold text-slate-700">Wirtschaftsjahr:</span>
              <select 
                value={selectedYear} 
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-bold"
              >
                  {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                  ))}
              </select>
          </div>

          <div className="flex space-x-2 md:space-x-4 overflow-x-auto p-1">
            <button onClick={() => setActiveReport('income')} className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${activeReport === 'income' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>GuV</button>
            <button onClick={() => setActiveReport('balance')} className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${activeReport === 'balance' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Bilanz</button>
            <button onClick={() => setActiveReport('vat')} className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${activeReport === 'vat' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>UStVA</button>
            <button onClick={() => setActiveReport('reconciliation')} className={`px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center ${activeReport === 'reconciliation' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-indigo-600 hover:bg-indigo-50 border border-indigo-100'}`}><Search className="w-3 h-3 mr-1"/> Check</button>
          </div>
      </div>

      <div className={`bg-white ${activeReport === 'vat' ? 'bg-transparent shadow-none' : 'p-8 shadow-lg border border-slate-100'} rounded-xl min-h-[500px] print:shadow-none print:border-none print:p-0`}>
        
        {(activeReport === 'income' || activeReport === 'balance' || activeReport === 'reconciliation') && (
            <div className="text-center mb-8 print:mb-4">
                <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">
                    {activeReport === 'income' && 'Gewinn- und Verlustrechnung (GuV)'}
                    {activeReport === 'balance' && 'Bilanz nach HGB'}
                    {activeReport === 'reconciliation' && 'Abstimmung & Prüfung'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    {activeReport === 'income' 
                        ? `Geschäftsjahr: 01.01.${selectedYear} - 31.12.${selectedYear}` 
                        : `Stichtag: ${new Date(reportDate).toLocaleDateString('de-DE')}`
                    }
                </p>
                <p className="text-lg font-bold mt-1">{companySettings.companyName}</p>
            </div>
        )}

        {/* === GuV === */}
        {activeReport === 'income' && (
          <div className="space-y-1 font-sans text-sm animate-fadeIn">
              {GUV_STRUCTURE.map((item) => {
                  let val = 0;
                  let type = AccountType.EXPENSE;
                  if (item.id.includes('revenue')) type = AccountType.REVENUE;
                  
                  val = getCategoryTotal(item.id, type);
                  
                  return (
                      <ReportRow 
                        key={item.id} 
                        label={item.label} 
                        amount={val}
                        details={renderAccountDetails(item.id, type)}
                      />
                  );
              })}
              
              <div className="mt-8 pt-4 border-t-2 border-slate-800">
                  <div className="flex justify-between items-center text-lg font-bold">
                      <span>Jahresüberschuss / Jahresfehlbetrag {selectedYear}</span>
                      <span className={netResult >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {netResult.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                      </span>
                  </div>
              </div>
          </div>
        )}

        {/* === BILANZ (FLEXBOX LAYOUT FOR EQUAL HEIGHT) === */}
        {activeReport === 'balance' && (
          <div className="flex flex-col md:flex-row gap-8 animate-fadeIn items-stretch min-h-[600px]">
              
              {/* AKTIVA COLUMN */}
              <div className="flex-1 flex flex-col h-full bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                  <div className="bg-slate-100 p-2 font-bold text-center border-b-2 border-slate-300 uppercase">Aktiva</div>
                  
                  {/* Content (will grow but stop for filler) */}
                  <div className="flex-col">
                      {BILANZ_AKTIVA_STRUCTURE.map(group => {
                          let amount = 0;
                          
                          // KORREKTUR DER BERECHNUNGSLOGIK:
                          if (group.parent) {
                              amount = getCategoryTotal(group.id, AccountType.ASSET);
                          } else {
                              const children = BILANZ_AKTIVA_STRUCTURE.filter(c => c.parent === group.id);
                              if (children.length > 0) {
                                  amount = children.reduce((sum, c) => sum + getCategoryTotal(c.id, AccountType.ASSET), 0);
                              } else {
                                  amount = getCategoryTotal(group.id, AccountType.ASSET);
                              }
                          }

                          if (amount === 0 && group.parent) return null; 

                          return (
                              <ReportRow 
                                key={group.id} 
                                label={group.label} 
                                amount={amount} 
                                isTotal={!group.parent}
                                level={group.parent ? 1 : 0}
                                details={group.parent || !BILANZ_AKTIVA_STRUCTURE.some(c => c.parent === group.id) ? renderAccountDetails(group.id, AccountType.ASSET) : undefined}
                              />
                          );
                      })}
                  </div>
                  
                  {/* BUCHHALTERNASE (FILLER) - Expands to fill remaining height. Min-h-0 ensures it collapses on full side. */}
                  <LedgerFiller />

                  {/* TOTAL FOOTER (ALWAYS AT BOTTOM) */}
                  <div className="pt-2 pb-2 px-4 border-t-4 border-double border-slate-800 flex justify-between font-bold text-lg bg-slate-50 mt-auto">
                      <span>Summe Aktiva</span>
                      <span>
                          {BILANZ_AKTIVA_STRUCTURE.filter(g => !g.parent).reduce((sum, g) => {
                              const children = BILANZ_AKTIVA_STRUCTURE.filter(c => c.parent === g.id);
                              if (children.length > 0) {
                                return sum + children.reduce((s, c) => s + getCategoryTotal(c.id, AccountType.ASSET), 0);
                              } else {
                                return sum + getCategoryTotal(g.id, AccountType.ASSET);
                              }
                          }, 0).toLocaleString(undefined, {minimumFractionDigits: 2})} €
                      </span>
                  </div>
              </div>

              {/* PASSIVA COLUMN */}
              <div className="flex-1 flex flex-col h-full bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                  <div className="bg-slate-100 p-2 font-bold text-center border-b-2 border-slate-300 uppercase">Passiva</div>
                  
                  {/* Content */}
                  <div className="flex-col">
                      {BILANZ_PASSIVA_STRUCTURE.map(group => {
                          let amount = 0;
                          let showDetails = true;

                          if (group.id === 'pas_A_III') {
                              amount = netResult; 
                              showDetails = false;
                          } else if (group.id === 'pas_A_II') {
                              const manualBookings = getCategoryTotal(group.id, AccountType.EQUITY);
                              amount = manualBookings + retainedEarnings;
                          } else if (group.parent) {
                              amount = getCategoryTotal(group.id, group.id.startsWith('pas_A') ? AccountType.EQUITY : AccountType.LIABILITY);
                          } else {
                              const children = BILANZ_PASSIVA_STRUCTURE.filter(c => c.parent === group.id);
                              if (children.length > 0) {
                                  amount = children.reduce((sum, c) => {
                                      if (c.id === 'pas_A_III') return sum + netResult;
                                      if (c.id === 'pas_A_II') return sum + getCategoryTotal(c.id, AccountType.EQUITY) + retainedEarnings;
                                      return sum + getCategoryTotal(c.id, c.id.startsWith('pas_A') ? AccountType.EQUITY : AccountType.LIABILITY);
                                  }, 0);
                              } else {
                                  amount = getCategoryTotal(group.id, group.id.startsWith('pas_A') ? AccountType.EQUITY : AccountType.LIABILITY);
                              }
                          }

                          if (amount === 0 && group.parent && group.id !== 'pas_A_III' && group.id !== 'pas_A_II') return null;

                          return (
                              <ReportRow 
                                key={group.id} 
                                label={group.label} 
                                amount={amount} 
                                isTotal={!group.parent}
                                level={group.parent ? 1 : 0}
                                details={showDetails && (group.parent || !BILANZ_PASSIVA_STRUCTURE.some(c => c.parent === group.id)) ? renderAccountDetails(group.id, group.id.startsWith('pas_A') ? AccountType.EQUITY : AccountType.LIABILITY) : undefined}
                              />
                          );
                      })}
                  </div>

                  {/* BUCHHALTERNASE (FILLER) - Expands to fill remaining height */}
                  <LedgerFiller />

                  {/* TOTAL FOOTER (ALWAYS AT BOTTOM) */}
                   <div className="pt-2 pb-2 px-4 border-t-4 border-double border-slate-800 flex justify-between font-bold text-lg bg-slate-50 mt-auto">
                      <span>Summe Passiva</span>
                      <span>
                          {BILANZ_PASSIVA_STRUCTURE.filter(g => !g.parent).reduce((sum, g) => {
                              const children = BILANZ_PASSIVA_STRUCTURE.filter(c => c.parent === g.id);
                              if (children.length > 0) {
                                  return sum + children.reduce((s, c) => {
                                      if (c.id === 'pas_A_III') return s + netResult;
                                      if (c.id === 'pas_A_II') return s + getCategoryTotal(c.id, AccountType.EQUITY) + retainedEarnings;
                                      return s + getCategoryTotal(c.id, c.id.startsWith('pas_A') ? AccountType.EQUITY : AccountType.LIABILITY);
                                  }, 0);
                              } else {
                                  return sum + getCategoryTotal(g.id, g.id.startsWith('pas_A') ? AccountType.EQUITY : AccountType.LIABILITY);
                              }
                          }, 0).toLocaleString(undefined, {minimumFractionDigits: 2})} €
                      </span>
                  </div>
              </div>
          </div>
        )}

        {/* === VAT / UStVA === */}
        {activeReport === 'vat' && (
           <div className="animate-fadeIn flex flex-col items-center gap-8 bg-slate-100/50 p-8 print:p-0 print:bg-white print:block">
                <div className="w-full max-w-[210mm] flex justify-between items-center mb-4 no-print">
                    <div className="flex items-center gap-2 text-slate-600"><FileText className="w-4 h-4" /><span className="text-sm font-medium">Offizielles Layout</span></div>
                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm"><Printer className="w-4 h-4"/> Drucken</button>
                </div>
                <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-[15mm] text-slate-900 relative print:shadow-none print:w-full print:h-auto print:m-0">
                    <FormHeader page={1} title="Steuerpflichtige Umsätze" />
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm border border-slate-300 p-2 bg-slate-50">
                        <div><div className="text-[10px] uppercase text-slate-500 font-bold">Steuernummer</div><div className="font-mono text-lg tracking-widest">{companySettings.taxNumber || '_________________'}</div></div>
                        <div><div className="text-[10px] uppercase text-slate-500 font-bold">Zeitraum</div><div className="font-bold">Jahr {selectedYear}</div></div>
                    </div>
                    <div className="bg-slate-200 px-2 py-1 font-bold text-slate-800 text-xs uppercase border-y border-slate-300 mt-4 mb-0">1. Steuerpflichtige Umsätze</div>
                    <ElsterLine lineNr={20} label="Lieferungen und sonstige Leistungen zu 19 %" kz="81" value={baseAmount19} />
                    <ElsterLine lineNr={21} label="Lieferungen und sonstige Leistungen zu 7 %" kz="86" value={baseAmount7} />
                    
                    <div className="bg-slate-200 px-2 py-1 font-bold text-slate-800 text-xs uppercase border-y border-slate-300 mt-4 mb-0">5. Abziehbare Vorsteuer</div>
                    <ElsterLine lineNr={50} label="Vorsteuer aus Rechnungen von anderen Unternehmern" kz="66" value={inputTax} isTaxField highlight />
                    
                    <div className="bg-slate-200 px-2 py-1 font-bold text-slate-800 text-xs uppercase border-y border-slate-300 mt-4 mb-0">6. Berechnung</div>
                    <ElsterLine lineNr={60} label="Verbleibende Umsatzsteuer-Vorauszahlung / Überschuss" kz="83" value={vatPayable} isTaxField highlight />
                </div>
           </div>
        )}

        {/* === RECONCILIATION === */}
        {activeReport === 'reconciliation' && (
            <div className="space-y-8 animate-fadeIn">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-sm text-indigo-900 mb-6">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-indigo-600"/>
                        <div><strong>Hinweis:</strong> Detaillierte Herkunftsanalyse der Steuerbuchungen für {selectedYear}.</div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[ {code:'1576', rate:19}, {code:'1571', rate:7} ].map(conf => (
                        <div key={conf.code} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50 p-4 border-b border-slate-200 font-bold text-slate-700">Vorsteuer {conf.rate}% ({conf.code})</div>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-500 font-semibold border-b border-slate-200">
                                    <tr><th className="p-3 text-left">Konto</th><th className="p-3 text-right">Netto</th><th className="p-3 text-right">Steuer</th></tr>
                                </thead>
                                <tbody>
                                    {getReconciliationData(conf.code, conf.rate).map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 border-b border-slate-100">
                                            <td className="p-3">{row.accountName}</td>
                                            <td className="p-3 text-right font-mono">{row.netAmount.toFixed(2)}</td>
                                            <td className="p-3 text-right font-bold">{row.taxAmount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};