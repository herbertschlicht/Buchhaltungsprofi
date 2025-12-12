import React, { useState, useMemo } from 'react';
import { Transaction, Account, AccountType, CompanySettings } from '../types';
import { Calculator, AlertCircle, CheckCircle, Printer, Building2, FileText, PieChart, Search, ChevronDown, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  companySettings: CompanySettings;
}

type ReportGroup = {
    id: string;
    label: string;
    parent?: string; 
    isTotal?: boolean;
};

// GuV (SKR 03)
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

// Bilanz Aktiva (SKR 03)
const BILANZ_AKTIVA_STRUCTURE: ReportGroup[] = [
    { id: 'act_A', label: 'A. Anlagevermögen', isTotal: true },
    { id: 'act_A_I', label: 'I. Immaterielle Vermögensgegenstände', parent: 'act_A' },
    { id: 'act_A_II', label: 'II. Sachanlagen', parent: 'act_A' },
    { id: 'act_A_III', label: 'III. Finanzanlagen', parent: 'act_A' },
    
    { id: 'act_B', label: 'B. Umlaufvermögen', isTotal: true },
    { id: 'act_B_I', label: 'I. Vorräte', parent: 'act_B' },
    { id: 'act_B_II', label: 'II. Forderungen und sonstige Vermögensgegenstände', parent: 'act_B' },
    { id: 'act_B_III', label: 'III. Kassenbestand, Bundesbankguthaben, Guthaben bei Kreditinstituten', parent: 'act_B' }, 
    
    { id: 'act_C', label: 'C. Rechnungsabgrenzungsposten', isTotal: true } 
];

// Bilanz Passiva (SKR 03)
const BILANZ_PASSIVA_STRUCTURE: ReportGroup[] = [
    { id: 'pas_A', label: 'A. Eigenkapital', isTotal: true },
    { id: 'pas_A_I', label: 'I. Kapital / Einlagen', parent: 'pas_A' },
    { id: 'pas_A_II', label: 'II. Gewinnvortrag / Verlustvortrag', parent: 'pas_A' }, 
    { id: 'pas_A_III', label: 'III. Jahresüberschuss / Jahresfehlbetrag', parent: 'pas_A' }, 
    { id: 'pas_A_IV', label: 'IV. Entnahmen / Einlagen (Privat)', parent: 'pas_A' },

    { id: 'pas_B', label: 'B. Rückstellungen', isTotal: true },
    
    { id: 'pas_C', label: 'C. Verbindlichkeiten', isTotal: true },
    { id: 'pas_C_I', label: 'I. Verbindlichkeiten aus Lieferungen und Leistungen', parent: 'pas_C' },
    { id: 'pas_C_II', label: 'II. Verbindlichkeiten gegenüber Kreditinstituten', parent: 'pas_C' },
    { id: 'pas_C_III', label: 'III. Sonstige Verbindlichkeiten (inkl. Steuer/Sozial)', parent: 'pas_C' },
];

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, accounts, companySettings }) => {
  const [activeReport, setActiveReport] = useState<'income' | 'balance' | 'vat' | 'reconciliation'>('income');
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [reportDate, setReportDate] = useState(`${currentYear}-12-31`);

  const handleYearChange = (year: number) => {
      setSelectedYear(year);
      setReportDate(`${year}-12-31`);
  };

  const availableYears = useMemo(() => {
      const years = new Set<number>(transactions.map(t => new Date(t.date).getFullYear()));
      years.add(currentYear); 
      return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // --- ENGINE: Map Accounts to Categories based on SKR03 Code Ranges ---
  const mapAccountToCategory = (account: Account): string => {
      const c = parseInt(account.code.substring(0, 4));
      
      // --- GuV (P&L) Mapping ---
      if (account.type === AccountType.REVENUE) {
          if (c >= 8000 && c <= 8999 && !account.name.includes('Eigenverbrauch')) return 'revenue';
          if (c >= 2600 && c <= 2799) return 'revenue_other'; 
          if (account.name.includes('Eigenverbrauch') || account.name.includes('Wertabgaben')) return 'revenue_other';
          return 'revenue_other'; 
      }
      if (account.type === AccountType.EXPENSE) {
          if (c >= 3000 && c <= 3999) return 'material';
          if (c >= 4100 && c <= 4199) return 'personnel';
          if (c >= 4200 && c <= 4299) return 'other_cost'; 
          if (c >= 4820 && c <= 4860) return 'depreciation';
          if (c >= 2100 && c <= 2150) return 'interest';
          if (c >= 2200 && c <= 2299) return 'taxes';
          
          return 'other_cost';
      }

      // --- BILANZ AKTIVA Mapping (SKR 03: 0xxx, 1xxx) ---
      if (account.type === AccountType.ASSET) {
          // Anlagevermögen (Class 0)
          if (c >= 10 && c <= 49) return 'act_A_I'; // Immateriell
          if (c >= 50 && c <= 499) return 'act_A_II'; // Sachanlagen
          if (c >= 500 && c <= 699) return 'act_A_III'; // Finanzanlagen
          
          // Umlaufvermögen (Class 1)
          if (c >= 3960 && c <= 3980) return 'act_B_I'; // Bestände
          if (c >= 1400 && c <= 1499) return 'act_B_II'; // Forderungen aLL
          if (c >= 1500 && c <= 1549) return 'act_B_II'; // Sonstige Forderungen
          if (c >= 1000 && c <= 1399) return 'act_B_III'; // Bank/Kasse
          
          if (c >= 1570 && c <= 1599) return 'act_B_II'; 
          
          if (c >= 980 && c <= 990) return 'act_C'; // RAP
          
          return 'act_B_II'; 
      }

      // --- BILANZ PASSIVA Mapping (SKR 03: 0xxx, 1xxx) ---
      if (account.type === AccountType.LIABILITY) {
          // SKR 03 Rückstellungen sind meist in 09xx
          if (c >= 950 && c <= 979) return 'pas_B'; 
          if (c >= 2300 && c <= 2399) return 'pas_B'; // Falls sonstige Rückstellungen dort gebucht
          
          // Verbindlichkeiten (Class 1)
          if (c >= 1600 && c <= 1699) return 'pas_C_I'; // Verb. aLL
          if (c >= 1705 && c <= 1709) return 'pas_C_II'; // Bankdarlehen
          if (c >= 1700 && c <= 1999) return 'pas_C_III'; // Sonstige (USt, Lohn etc.)
          
          return 'pas_C_III';
      }

      if (account.type === AccountType.EQUITY) {
          if (c >= 1800 && c <= 1899) return 'pas_A_IV'; // Privat
          if (c >= 800 && c <= 899) return 'pas_A_I'; // Festkapital
          if (c >= 900 && c <= 949) return 'pas_A_II'; // Vortrag
          return 'pas_A_I';
      }

      return 'uncategorized';
  };

  // --- CORE ENGINE: Calculates all values for a specific year ---
  const calculateYearData = (targetYear: number) => {
      const startDate = `${targetYear}-01-01`;
      const endDate = `${targetYear}-12-31`;

      // 1. Helper to calculate a single account's balance in this timeframe
      const getAccountBalance = (acc: Account) => {
          let bal = 0;
          transactions.forEach(t => {
              if (t.date > endDate) return;
              if ((acc.type === AccountType.REVENUE || acc.type === AccountType.EXPENSE) && t.date < startDate) return;

              t.lines.forEach(l => {
                  if (l.accountId === acc.id) {
                      if ([AccountType.ASSET, AccountType.EXPENSE].includes(acc.type)) bal += l.debit - l.credit;
                      else bal += l.credit - l.debit;
                  }
              });
          });
          return bal;
      };

      // 2. Helper for Category Totals
      const getCatTotal = (catId: string, type: AccountType) => {
          return accounts
            .filter(a => mapAccountToCategory(a) === catId && a.type === type)
            .reduce((sum, a) => sum + getAccountBalance(a), 0);
      };

      // 3. Calculate GuV
      const revenue = getCatTotal('revenue', AccountType.REVENUE);
      const otherRevenue = getCatTotal('revenue_other', AccountType.REVENUE);
      const material = getCatTotal('material', AccountType.EXPENSE);
      const personnel = getCatTotal('personnel', AccountType.EXPENSE);
      const depreciation = getCatTotal('depreciation', AccountType.EXPENSE);
      const otherCost = getCatTotal('other_cost', AccountType.EXPENSE);
      const interest = getCatTotal('interest', AccountType.EXPENSE);
      const taxes = getCatTotal('taxes', AccountType.EXPENSE);

      const totalIncome = revenue + otherRevenue;
      const totalExpense = material + personnel + depreciation + otherCost + interest + taxes;
      const netResult = totalIncome - totalExpense;

      // 4. Calculate Retained Earnings (Profit Carryforward from Years PRIOR to targetYear)
      let retainedEarnings = 0;
      transactions.forEach(t => {
          if (t.date < startDate) {
              t.lines.forEach(l => {
                  const a = accounts.find(acc => acc.id === l.accountId);
                  if (a?.type === AccountType.REVENUE) retainedEarnings += l.credit - l.debit;
                  else if (a?.type === AccountType.EXPENSE) retainedEarnings += l.credit - l.debit;
              });
          }
      });

      // 5. Build Result Map
      const values: Record<string, number> = {
          // GuV
          revenue, revenue_other: otherRevenue, material, personnel, depreciation, other_cost: otherCost, interest, taxes,
          netResult, retainedEarnings
      };

      // Bilanz
      [...BILANZ_AKTIVA_STRUCTURE, ...BILANZ_PASSIVA_STRUCTURE].forEach(group => {
          if (group.id === 'pas_A_III') {
              values[group.id] = netResult;
          } else if (group.id === 'pas_A_II') {
              values[group.id] = getCatTotal(group.id, AccountType.EQUITY) + retainedEarnings;
          } else {
              const type = group.id.startsWith('act') ? AccountType.ASSET : (group.id.startsWith('pas_A') ? AccountType.EQUITY : AccountType.LIABILITY);
              values[group.id] = getCatTotal(group.id, type);
          }
      });

      // Calculate Tree Totals (Parent Groups)
      const processTreeTotals = (structure: ReportGroup[]) => {
          structure.filter(g => g.isTotal).forEach(parent => {
              const children = structure.filter(c => c.parent === parent.id);
              if (children.length > 0) {
                  values[parent.id] = children.reduce((sum, child) => {
                      if (child.id === 'pas_A_III') return sum + netResult;
                      if (child.id === 'pas_A_II') return sum + values[child.id];
                      return sum + values[child.id];
                  }, 0);
              }
          });
      };

      processTreeTotals(BILANZ_AKTIVA_STRUCTURE);
      processTreeTotals(BILANZ_PASSIVA_STRUCTURE);

      // Final Balance Sums
      const sumAktiva = BILANZ_AKTIVA_STRUCTURE.filter(g => !g.parent).reduce((s, g) => s + values[g.id], 0);
      const sumPassiva = BILANZ_PASSIVA_STRUCTURE.filter(g => !g.parent).reduce((s, g) => s + values[g.id], 0);

      return { values, sumAktiva, sumPassiva, netResult };
  };

  // --- MEMOIZED DATA FOR CURRENT & PREVIOUS YEAR ---
  const currentData = useMemo(() => calculateYearData(selectedYear), [selectedYear, transactions, accounts]);
  const previousData = useMemo(() => calculateYearData(selectedYear - 1), [selectedYear, transactions, accounts]);

  // --- COMPONENT: REPORT ROW WITH PREVIOUS YEAR (IMPROVED DESIGN) ---
  const ReportRow: React.FC<{ 
      label: string; 
      amount: number; 
      prevAmount: number;
      isTotal?: boolean; 
      level?: number; 
      details?: React.ReactNode 
  }> = ({ label, amount, prevAmount, isTotal, level = 0, details }) => {
      const [expanded, setExpanded] = useState(true);
      
      // Visual Hierarchy Logic based on Level
      const isRoot = level === 0 && isTotal;
      const isGroup = level === 1;
      
      const textColor = amount < 0 ? 'text-red-700' : 'text-slate-900';
      const prevTextColor = prevAmount < 0 ? 'text-red-400' : 'text-slate-500';

      // Indentation logic
      const indentClass = level === 0 ? 'pl-2' : level === 1 ? 'pl-6' : 'pl-10';
      
      // Styling logic
      let containerClass = "grid grid-cols-12 items-center py-1 pr-2 transition-colors border-b border-transparent hover:bg-slate-50";
      let labelClass = "col-span-6 flex items-center gap-2 truncate";
      let numberClass = "col-span-3 text-right font-mono text-sm";
      
      if (isRoot) {
          containerClass = "grid grid-cols-12 items-center py-2 pr-2 bg-slate-100/80 border-y border-slate-200 mt-2 mb-1 print:bg-slate-100 print:border-black";
          labelClass += " font-bold text-slate-800 uppercase tracking-wide text-xs";
          numberClass += " font-bold text-slate-900";
      } else if (isGroup) {
          labelClass += " font-semibold text-slate-700 text-sm";
          numberClass += " font-medium text-slate-800";
      } else {
          labelClass += " text-slate-600 text-sm";
      }

      return (
          <div className="last:border-0">
              <div 
                className={containerClass}
                onClick={() => setExpanded(!expanded)}
              >
                  {/* Label Column */}
                  <div className={`${labelClass} ${indentClass}`}>
                      {details && (
                          <button className="text-slate-400 hover:text-slate-600 print:hidden">
                              {expanded ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
                          </button>
                      )}
                      <span>{label}</span>
                  </div>
                  
                  {/* Current Year Column */}
                  <div className={`${numberClass} ${textColor}`}>
                      {amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                  </div>

                  {/* Previous Year Column */}
                  <div className={`col-span-3 text-right font-mono text-xs ${prevTextColor}`}>
                      {prevAmount !== 0 ? prevAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €' : '-'}
                  </div>
              </div>
              {expanded && details && (
                  <div className="animate-fadeIn mb-2">
                      {details}
                  </div>
              )}
          </div>
      );
  };

  const renderAccountDetails = (categoryId: string, type: AccountType) => {
      const relevantAccounts = accounts.filter(a => mapAccountToCategory(a) === categoryId && a.type === type);
      if (relevantAccounts.length === 0) return null;

      // Need to calculate account balance individually for current year for the details view
      const getAccBal = (accId: string) => {
          const startDate = `${selectedYear}-01-01`;
          const endDate = `${selectedYear}-12-31`;
          let bal = 0;
          transactions.forEach(t => {
              if (t.date > endDate) return;
              if ((type === AccountType.REVENUE || type === AccountType.EXPENSE) && t.date < startDate) return;
              t.lines.forEach(l => {
                  if (l.accountId === accId) {
                      if ([AccountType.ASSET, AccountType.EXPENSE].includes(type)) bal += l.debit - l.credit;
                      else bal += l.credit - l.debit;
                  }
              });
          });
          return bal;
      }

      return (
          <div className="bg-white">
              {relevantAccounts.map(acc => {
                  const bal = getAccBal(acc.id);
                  if (Math.abs(bal) < 0.01) return null;
                  return (
                      <div key={acc.id} className="grid grid-cols-12 py-0.5 pr-2 hover:bg-yellow-50 text-[11px] text-slate-500">
                          <div className="col-span-6 pl-12 truncate flex gap-2">
                              <span className="font-mono text-slate-400">{acc.code}</span>
                              <span>{acc.name}</span>
                          </div>
                          <div className="col-span-3 text-right font-mono">{bal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</div>
                          <div className="col-span-3"></div>
                      </div>
                  );
              })}
          </div>
      );
  };

  // VAT & Reconciliation helpers
  const getBalanceByPrefix = (prefix: string, type: AccountType) => {
      const relevantAccounts = accounts.filter(a => a.code.startsWith(prefix));
      const startDate = `${selectedYear}-01-01`; const endDate = `${selectedYear}-12-31`;
      return relevantAccounts.reduce((sum, acc) => {
          let bal = 0;
          transactions.forEach(t => {
              if (t.date > endDate) return;
              if ((type === AccountType.REVENUE || type === AccountType.EXPENSE) && t.date < startDate) return;
              t.lines.forEach(l => { if (l.accountId === acc.id) { if ([AccountType.ASSET, AccountType.EXPENSE].includes(type)) bal += l.debit - l.credit; else bal += l.credit - l.debit; } });
          });
          return sum + bal;
      }, 0);
  };
  const baseAmount19 = getBalanceByPrefix('84', AccountType.REVENUE);
  const baseAmount7 = getBalanceByPrefix('83', AccountType.REVENUE);
  const inputTax = getBalanceByPrefix('15', AccountType.ASSET);
  const vatPayable = (baseAmount19 * 0.19 + baseAmount7 * 0.07) - inputTax;

  const getReconciliationData = (taxAccountCode: string, taxRate: number) => {
      const taxAccount = accounts.find(a => a.code === taxAccountCode);
      if (!taxAccount) return [];
      const breakdown: any[] = [];
      transactions.forEach(t => {
          if (t.date.substring(0, 4) !== selectedYear.toString()) return;
          const taxLine = t.lines.find(l => l.accountId === taxAccount.id);
          if (!taxLine) return;
          const baseLine = t.lines.find(l => l.accountId !== taxAccount.id && !['1000000', '1200000', '1400000', '1600000', '1210000'].some(code => accounts.find(a => a.id === l.accountId)?.code.startsWith(code)));
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

  const LedgerFiller = () => (
      <div className="flex-1 w-full relative border-x border-slate-200 min-h-[50px] bg-slate-50/10">
         {/* Visual filler for empty space in T-Account */}
         <div className="absolute inset-0" style={{backgroundImage: `linear-gradient(to bottom right, transparent calc(50% - 1px), #f1f5f9 calc(50%), transparent calc(50% + 1px))`}}></div>
      </div>
  );

  // Is Balanced Check for visual alert
  const isBalanced = Math.abs(currentData.sumAktiva - currentData.sumPassiva) < 0.05;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
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
                    {activeReport === 'income' && 'Gewinn- und Verlustrechnung (GuV) - SKR 03'}
                    {activeReport === 'balance' && 'Bilanz nach HGB - SKR 03'}
                    {activeReport === 'reconciliation' && 'Abstimmung & Prüfung'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    {activeReport === 'income' 
                        ? `Geschäftsjahr: 01.01.${selectedYear} - 31.12.${selectedYear}` 
                        : `Stichtag: ${new Date(reportDate).toLocaleDateString('de-DE')}`
                    }
                </p>
                <p className="text-lg font-bold mt-1">{companySettings.companyName}</p>
                
                {activeReport === 'balance' && !isBalanced && (
                    <div className="mt-4 flex justify-center no-print">
                        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-sm">
                            <AlertTriangle className="w-4 h-4 mr-2"/>
                            Achtung: Bilanz ungleichgewichtig! (Diff: {(currentData.sumAktiva - currentData.sumPassiva).toFixed(2)} €)
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- REPORT HEADER ROW (INCOME ONLY) --- */}
        {(activeReport === 'income') && (
            <div className="grid grid-cols-12 text-xs font-bold text-slate-500 uppercase border-b-2 border-slate-800 pb-2 mb-2 px-2 print:px-0">
                <div className="col-span-6 pl-4"></div>
                <div className="col-span-3 text-right">Geschäftsjahr<br/><span className="text-[10px]">{selectedYear}</span></div>
                <div className="col-span-3 text-right text-slate-400">Vorjahr<br/><span className="text-[10px]">{selectedYear - 1}</span></div>
            </div>
        )}

        {/* === GuV === */}
        {activeReport === 'income' && (
          <div className="space-y-1 font-sans text-sm animate-fadeIn">
              {GUV_STRUCTURE.map((item) => {
                  let type = AccountType.EXPENSE;
                  if (item.id.includes('revenue')) type = AccountType.REVENUE;
                  
                  return (
                      <ReportRow 
                        key={item.id} 
                        label={item.label} 
                        amount={currentData.values[item.id]}
                        prevAmount={previousData.values[item.id]}
                        details={renderAccountDetails(item.id, type)}
                      />
                  );
              })}
              
              <div className="mt-8 pt-4 border-t-2 border-slate-800">
                  <div className="grid grid-cols-12 items-center text-lg font-bold">
                      <div className="col-span-6 pl-4 uppercase">Jahresüberschuss / Fehlbetrag</div>
                      <div className={`col-span-3 text-right ${currentData.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {currentData.netResult.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                      </div>
                      <div className={`col-span-3 text-right text-sm ${previousData.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {previousData.netResult.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                      </div>
                  </div>
              </div>
          </div>
        )}

        {/* === BILANZ === */}
        {activeReport === 'balance' && (
          <div className="flex flex-col md:flex-row gap-0 animate-fadeIn items-stretch min-h-[600px] border border-slate-300 print:border-black">
              
              {/* AKTIVA COLUMN */}
              <div className="flex-1 flex flex-col h-full bg-white border-r border-slate-300 print:border-black">
                  <div className="bg-slate-200 p-2 font-bold text-center border-b border-slate-300 uppercase tracking-widest text-slate-800 print:bg-white print:border-black">Aktiva</div>
                  
                  {/* HEADER AKTIVA */}
                  <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 border-b border-slate-200 bg-slate-50 py-1 pr-2 print:border-black print:bg-white">
                      <div className="col-span-6"></div>
                      <div className="col-span-3 text-right text-slate-900">31.12.{selectedYear}</div>
                      <div className="col-span-3 text-right text-slate-400">31.12.{selectedYear - 1}</div>
                  </div>

                  <div className="flex-col">
                      {BILANZ_AKTIVA_STRUCTURE.map(group => {
                          const val = currentData.values[group.id];
                          const prevVal = previousData.values[group.id];

                          if (val === 0 && prevVal === 0 && group.parent) return null; 

                          return (
                              <ReportRow 
                                key={group.id} 
                                label={group.label} 
                                amount={val}
                                prevAmount={prevVal}
                                isTotal={!group.parent}
                                level={group.parent ? 1 : 0}
                                details={group.parent || !BILANZ_AKTIVA_STRUCTURE.some(c => c.parent === group.id) ? renderAccountDetails(group.id, AccountType.ASSET) : undefined}
                              />
                          );
                      })}
                  </div>
                  
                  <LedgerFiller />

                  <div className="grid grid-cols-12 py-2 px-2 border-t-4 border-double border-black bg-white mt-auto items-baseline">
                      <div className="col-span-6"></div>
                      <div className="col-span-3 text-right font-bold text-slate-900">
                        {currentData.sumAktiva.toLocaleString('de-DE', {minimumFractionDigits: 2})} €
                      </div>
                      <div className="col-span-3 text-right font-bold text-slate-500 text-xs">
                        {previousData.sumAktiva.toLocaleString('de-DE', {minimumFractionDigits: 2})} €
                      </div>
                  </div>
              </div>

              {/* PASSIVA COLUMN */}
              <div className="flex-1 flex flex-col h-full bg-white">
                  <div className="bg-slate-200 p-2 font-bold text-center border-b border-slate-300 uppercase tracking-widest text-slate-800 print:bg-white print:border-black">Passiva</div>
                  
                  {/* HEADER PASSIVA */}
                  <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 border-b border-slate-200 bg-slate-50 py-1 pr-2 print:border-black print:bg-white">
                      <div className="col-span-6"></div>
                      <div className="col-span-3 text-right text-slate-900">31.12.{selectedYear}</div>
                      <div className="col-span-3 text-right text-slate-400">31.12.{selectedYear - 1}</div>
                  </div>

                  <div className="flex-col">
                      {BILANZ_PASSIVA_STRUCTURE.map(group => {
                          let showDetails = true;
                          if (group.id === 'pas_A_III') showDetails = false;

                          const val = currentData.values[group.id];
                          const prevVal = previousData.values[group.id];

                          if (val === 0 && prevVal === 0 && group.parent && group.id !== 'pas_A_III' && group.id !== 'pas_A_II') return null;

                          return (
                              <ReportRow 
                                key={group.id} 
                                label={group.label} 
                                amount={val}
                                prevAmount={prevVal}
                                isTotal={!group.parent}
                                level={group.parent ? 1 : 0}
                                details={showDetails && (group.parent || !BILANZ_PASSIVA_STRUCTURE.some(c => c.parent === group.id)) ? renderAccountDetails(group.id, group.id.startsWith('pas_A') ? AccountType.EQUITY : AccountType.LIABILITY) : undefined}
                              />
                          );
                      })}
                  </div>

                  <LedgerFiller />

                   <div className="grid grid-cols-12 py-2 px-2 border-t-4 border-double border-black bg-white mt-auto items-baseline">
                      <div className="col-span-6"></div>
                      <div className="col-span-3 text-right font-bold text-slate-900">
                        {currentData.sumPassiva.toLocaleString('de-DE', {minimumFractionDigits: 2})} €
                      </div>
                      <div className="col-span-3 text-right font-bold text-slate-500 text-xs">
                        {previousData.sumPassiva.toLocaleString('de-DE', {minimumFractionDigits: 2})} €
                      </div>
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
                    {[ {code:'1576000', rate:19}, {code:'1571000', rate:7} ].map(conf => (
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