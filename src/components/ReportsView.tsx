
import React, { useState, useMemo } from 'react';
import { Transaction, Account, AccountType, CompanySettings } from '../types';
import { Calculator, AlertCircle, Printer, Building2, ChevronDown, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';

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

// --- GUV STRUKTUR ---
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

// --- BILANZ AKTIVA (§ 266 HGB) ---
const BILANZ_AKTIVA_STRUCTURE: ReportGroup[] = [
    { id: 'act_A', label: 'A. Anlagevermögen', isTotal: true },
    { id: 'act_A_I', label: 'I. Immaterielle Vermögensgegenstände', parent: 'act_A' },
    { id: 'act_A_I_1', label: '1. Selbst geschaffene Schutzrechte', parent: 'act_A_I' },
    { id: 'act_A_I_2', label: '2. Entgeltlich erworbene Konzessionen/Lizenzen', parent: 'act_A_I' },
    { id: 'act_A_I_3', label: '3. Geschäfts- oder Firmenwert', parent: 'act_A_I' },
    { id: 'act_A_I_4', label: '4. Geleistete Anzahlungen', parent: 'act_A_I' },
    
    { id: 'act_A_II', label: 'II. Sachanlagen', parent: 'act_A' },
    { id: 'act_A_II_1', label: '1. Grundstücke und Bauten', parent: 'act_A_II' },
    { id: 'act_A_II_2', label: '2. Technische Anlagen und Maschinen', parent: 'act_A_II' },
    { id: 'act_A_II_3', label: '3. Andere Anlagen, BGA', parent: 'act_A_II' },
    { id: 'act_A_II_4', label: '4. Geleistete Anzahlungen / Anlagen im Bau', parent: 'act_A_II' },
    
    { id: 'act_A_III', label: 'III. Finanzanlagen', parent: 'act_A' },
    { id: 'act_A_III_1', label: '1. Anteile an verbundenen Unternehmen', parent: 'act_A_III' },
    { id: 'act_A_III_2', label: '2. Beteiligungen', parent: 'act_A_III' },
    { id: 'act_A_III_3', label: '3. Wertpapiere des Anlagevermögens', parent: 'act_A_III' },
    
    { id: 'act_B', label: 'B. Umlaufvermögen', isTotal: true },
    { id: 'act_B_I', label: 'I. Vorräte', parent: 'act_B' },
    { id: 'act_B_I_1', label: '1. Roh-, Hilfs- und Betriebsstoffe', parent: 'act_B_I' },
    { id: 'act_B_I_2', label: '2. Unfertige Erzeugnisse / Leistungen', parent: 'act_B_I' },
    { id: 'act_B_I_3', label: '3. Fertige Erzeugnisse und Waren', parent: 'act_B_I' },
    
    { id: 'act_B_II', label: 'II. Forderungen und sonstige Vermögensgegenstände', parent: 'act_B' },
    { id: 'act_B_II_1', label: '1. Forderungen aus Lieferungen und Leistungen', parent: 'act_B_II' },
    { id: 'act_B_II_2', label: '2. Forderungen gegen verbundene Unternehmen', parent: 'act_B_II' },
    { id: 'act_B_II_3', label: '3. Sonstige Vermögensgegenstände', parent: 'act_B_II' },
    
    { id: 'act_B_III', label: 'III. Wertpapiere', parent: 'act_B' },
    { id: 'act_B_IV', label: 'IV. Kassenbestand, Bundesbankguthaben, Bank', parent: 'act_B' },
    
    { id: 'act_C', label: 'C. Rechnungsabgrenzungsposten' },
    { id: 'act_D', label: 'D. Aktive latente Steuern' }
];

// --- BILANZ PASSIVA (§ 266 HGB) ---
const BILANZ_PASSIVA_STRUCTURE: ReportGroup[] = [
    { id: 'pas_A', label: 'A. Eigenkapital', isTotal: true },
    { id: 'pas_A_I', label: 'I. Gezeichnetes Kapital / Kapitalkonto', parent: 'pas_A' },
    { id: 'pas_A_II', label: 'II. Kapitalrücklage', parent: 'pas_A' },
    { id: 'pas_A_III', label: 'III. Gewinnrücklagen', parent: 'pas_A' },
    { id: 'pas_A_IV', label: 'IV. Gewinnvortrag / Verlustvortrag', parent: 'pas_A' },
    { id: 'pas_A_V', label: 'V. Jahresüberschuss / Jahresfehlbetrag', parent: 'pas_A' },
    { id: 'pas_A_VI', label: 'VI. Nicht durch Eigenkapital gedeckter Fehlbetrag', parent: 'pas_A' },

    { id: 'pas_B', label: 'B. Rückstellungen', isTotal: true },
    { id: 'pas_B_1', label: '1. Rückstellungen für Pensionen', parent: 'pas_B' },
    { id: 'pas_B_2', label: '2. Steuerrückstellungen', parent: 'pas_B' },
    { id: 'pas_B_3', label: '3. Sonstige Rückstellungen', parent: 'pas_B' },
    
    { id: 'pas_C', label: 'C. Verbindlichkeiten', isTotal: true },
    { id: 'pas_C_1', label: '1. Anleihen', parent: 'pas_C' },
    { id: 'pas_C_2', label: '2. Verbindlichkeiten gegenüber Kreditinstituten', parent: 'pas_C' },
    { id: 'pas_C_3', label: '3. Erhaltene Anzahlungen auf Bestellungen', parent: 'pas_C' },
    { id: 'pas_C_4', label: '4. Verbindlichkeiten aus L.u.L.', parent: 'pas_C' },
    { id: 'pas_C_5', label: '5. Verbindlichkeiten gegenüber verbundenen Unternehmen', parent: 'pas_C' },
    { id: 'pas_C_6', label: '6. Sonstige Verbindlichkeiten', parent: 'pas_C' },

    { id: 'pas_D', label: 'D. Rechnungsabgrenzungsposten' },
    { id: 'pas_E', label: 'E. Passive latente Steuern' }
];

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, accounts, companySettings }) => {
  const [activeReport, setActiveReport] = useState<'income' | 'balance'>('income');
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const availableYears = useMemo(() => {
      const years = new Set<number>(transactions.map(t => new Date(t.date).getFullYear()));
      years.add(currentYear); 
      return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // --- ENGINE: Map Accounts to Categories based on SKR03 Code Ranges ---
  const mapAccountToCategory = (account: Account): string => {
      const c = parseInt(account.code.substring(0, 4));
      
      // GuV Mapping
      if (account.type === AccountType.REVENUE) {
          if (c >= 8000 && c <= 8999 && !account.name.includes('Eigenverbrauch')) return 'revenue';
          return 'revenue_other'; 
      }
      if (account.type === AccountType.EXPENSE) {
          if (c >= 3000 && c <= 3999) return 'material';
          if (c >= 4100 && c <= 4199) return 'personnel';
          if (c >= 4820 && c <= 4860) return 'depreciation';
          if (c >= 2100 && c <= 2150) return 'interest';
          if (c >= 2200 && c <= 2299) return 'taxes';
          return 'other_cost';
      }

      // Aktiva Mapping
      if (account.type === AccountType.ASSET) {
          // A. Anlagevermögen
          if (c === 27) return 'act_A_I_2';
          if (c === 35) return 'act_A_I_3';
          if (c >= 10 && c <= 49) return 'act_A_I_2';
          if (c >= 50 && c <= 100) return 'act_A_II_1';
          if (c === 200) return 'act_A_II_2';
          if (c >= 320 && c <= 480) return 'act_A_II_3';
          if (c === 485) return 'act_A_II_3';
          if (c >= 500 && c <= 700) return 'act_A_III_1';

          // B. Umlaufvermögen
          if (c >= 3960 && c <= 3980) return 'act_B_I_3';
          if (c >= 1400 && c <= 1499) return 'act_B_II_1';
          if (c >= 1500 && c <= 1549) return 'act_B_II_3';
          if (c >= 1000 && c <= 1299) return 'act_B_IV';
          if (c >= 1570 && c <= 1599) return 'act_B_II_3'; // VSt als Forderung
          
          if (c >= 980 && c <= 990) return 'act_C';
      }

      // Passiva Mapping
      if (account.type === AccountType.LIABILITY) {
          if (c === 950) return 'pas_B_1';
          if (c === 960) return 'pas_B_2';
          if (c === 970 || c === 2300) return 'pas_B_3';
          
          if (c >= 1600 && c <= 1699) return 'pas_C_4';
          if (c >= 1705 && c <= 1709) return 'pas_C_2';
          if (c >= 1700 && c <= 1999) return 'pas_C_6';
      }

      if (account.type === AccountType.EQUITY) {
          if (c >= 800 && c <= 859) return 'pas_A_I';
          if (c >= 860 && c <= 899) return 'pas_A_IV';
          if (c >= 1800 && c <= 1899) return 'pas_A_I'; // Bei Einzelunternehmen
          return 'pas_A_I';
      }

      return 'uncategorized';
  };

  const calculateYearData = (targetYear: number) => {
      const startDate = `${targetYear}-01-01`;
      const endDate = `${targetYear}-12-31`;

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

      const values: Record<string, number> = {};
      
      // Init all categories with 0
      [...GUV_STRUCTURE, ...BILANZ_AKTIVA_STRUCTURE, ...BILANZ_PASSIVA_STRUCTURE].forEach(g => values[g.id] = 0);

      // Sum up leaf accounts
      accounts.forEach(acc => {
          const cat = mapAccountToCategory(acc);
          if (values[cat] !== undefined) {
              values[cat] += getAccountBalance(acc);
          }
      });

      // Special handling for GuV result in Equity
      const totalIncome = values['revenue'] + values['revenue_other'];
      const totalExpense = values['material'] + values['personnel'] + values['depreciation'] + values['other_cost'] + values['interest'] + values['taxes'];
      const netResult = totalIncome - totalExpense;
      values['pas_A_V'] = netResult;

      // Aggregation logic (Bottom-Up)
      const aggregate = (structure: ReportGroup[]) => {
          // Sort by depth (deepest first) to ensure totals are correct
          const getDepth = (id: string): number => {
              const item = structure.find(s => s.id === id);
              if (!item || !item.parent) return 0;
              return 1 + getDepth(item.parent);
          };
          const sorted = [...structure].sort((a, b) => getDepth(b.id) - getDepth(a.id));
          
          sorted.forEach(item => {
              if (item.parent) {
                  values[item.parent] += values[item.id];
              }
          });
      };

      aggregate(BILANZ_AKTIVA_STRUCTURE);
      aggregate(BILANZ_PASSIVA_STRUCTURE);

      const sumAktiva = BILANZ_AKTIVA_STRUCTURE.filter(g => !g.parent).reduce((s, g) => s + values[g.id], 0);
      const sumPassiva = BILANZ_PASSIVA_STRUCTURE.filter(g => !g.parent).reduce((s, g) => s + values[g.id], 0);

      return { values, sumAktiva, sumPassiva, netResult };
  };

  const currentData = useMemo(() => calculateYearData(selectedYear), [selectedYear, transactions, accounts]);
  const previousData = useMemo(() => calculateYearData(selectedYear - 1), [selectedYear, transactions, accounts]);

  const ReportRow: React.FC<{ 
      id: string;
      label: string; 
      amount: number; 
      prevAmount: number;
      level?: number; 
      isBold?: boolean;
  }> = ({ id, label, amount, prevAmount, level = 0, isBold }) => {
      // Don't show zero lines unless requested by HGB logic (simplified here)
      if (Math.abs(amount) < 0.01 && Math.abs(prevAmount) < 0.01) return null;

      const indentClass = level === 0 ? 'pl-0' : level === 1 ? 'pl-6' : level === 2 ? 'pl-12' : 'pl-16';
      
      return (
          <div className={`grid grid-cols-12 items-center py-1.5 border-b border-slate-100 hover:bg-slate-50 transition-colors ${isBold ? 'font-bold bg-slate-50/50' : 'text-slate-600'}`}>
              <div className={`col-span-6 flex items-center gap-2 truncate ${indentClass} text-sm`}>
                  <span>{label}</span>
              </div>
              <div className={`col-span-3 text-right font-mono text-sm ${amount < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </div>
              <div className={`col-span-3 text-right font-mono text-xs text-slate-400`}>
                  {prevAmount !== 0 ? prevAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '-'}
              </div>
          </div>
      );
  };

  const isBalanced = Math.abs(currentData.sumAktiva - currentData.sumPassiva) < 0.05;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-bold text-slate-700">Wirtschaftsjahr:</span>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2 font-bold outline-none"
              >
                  {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                  ))}
              </select>
          </div>

          <div className="flex space-x-2 p-1 bg-slate-100 rounded-lg">
            <button onClick={() => setActiveReport('income')} className={`px-6 py-2 rounded-md font-medium text-sm transition-all ${activeReport === 'income' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>GuV</button>
            <button onClick={() => setActiveReport('balance')} className={`px-6 py-2 rounded-md font-medium text-sm transition-all ${activeReport === 'balance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Bilanz</button>
          </div>
          
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 shadow-sm"><Printer className="w-4 h-4"/> Drucken</button>
      </div>

      <div className="bg-white p-10 shadow-xl border border-slate-100 rounded-2xl print:shadow-none print:border-none print:p-0">
        
        <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest border-b-4 border-slate-900 inline-block pb-1">
                {activeReport === 'income' ? 'Gewinn- und Verlustrechnung' : 'Bilanz nach HGB'}
            </h2>
            <div className="flex justify-center items-center gap-6 mt-4 text-slate-500 font-medium">
                <div className="flex items-center"><Building2 className="w-4 h-4 mr-2"/> {companySettings.companyName}</div>
                <div>Stichtag: 31.12.{selectedYear}</div>
            </div>
            
            {!isBalanced && activeReport === 'balance' && (
                <div className="mt-6 flex justify-center no-print">
                    <div className="bg-red-50 text-red-700 px-6 py-3 rounded-xl text-sm font-bold flex items-center border border-red-100 shadow-sm">
                        <AlertTriangle className="w-5 h-5 mr-3"/>
                        Differenz Aktiva/Passiva: {(currentData.sumAktiva - currentData.sumPassiva).toFixed(2)} €
                    </div>
                </div>
            )}
        </div>

        {activeReport === 'income' && (
          <div className="space-y-1 animate-fadeIn">
              <div className="grid grid-cols-12 text-[10px] font-black text-slate-400 uppercase border-b border-slate-200 pb-2 mb-4 px-2">
                  <div className="col-span-6 pl-4">Posten</div>
                  <div className="col-span-3 text-right">Lfd. Jahr ({selectedYear})</div>
                  <div className="col-span-3 text-right">Vorjahr ({selectedYear - 1})</div>
              </div>
              {GUV_STRUCTURE.map((item) => (
                  <ReportRow 
                    key={item.id} id={item.id} label={item.label} 
                    amount={currentData.values[item.id]} prevAmount={previousData.values[item.id]}
                  />
              ))}
              
              <div className="mt-10 pt-6 border-t-2 border-slate-900">
                  <div className="grid grid-cols-12 items-center">
                      <div className="col-span-6 pl-4 text-lg font-black uppercase tracking-tight text-slate-900">Jahresüberschuss / Fehlbetrag</div>
                      <div className={`col-span-3 text-right text-xl font-black ${currentData.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {currentData.netResult.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </div>
                      <div className={`col-span-3 text-right text-sm font-bold text-slate-400`}>
                          {previousData.netResult.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </div>
                  </div>
              </div>
          </div>
        )}

        {activeReport === 'balance' && (
          <div className="flex flex-col gap-12 animate-fadeIn">
              
              {/* AKTIVA SECTION */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-900 p-3 font-black text-center text-white uppercase tracking-[0.2em] text-sm">Aktiva</div>
                  <div className="p-6">
                      <div className="grid grid-cols-12 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 pb-2 mb-2">
                          <div className="col-span-6">Position</div>
                          <div className="col-span-3 text-right">31.12.{selectedYear}</div>
                          <div className="col-span-3 text-right">Vorjahr</div>
                      </div>
                      {BILANZ_AKTIVA_STRUCTURE.map(group => {
                          const level = (group.id.match(/_/g) || []).length;
                          return (
                              <ReportRow 
                                key={group.id} id={group.id} label={group.label} 
                                amount={currentData.values[group.id]} prevAmount={previousData.values[group.id]}
                                level={level} isBold={level === 0 || group.isTotal}
                              />
                          );
                      })}
                      <div className="grid grid-cols-12 py-4 mt-4 border-t-4 border-double border-slate-900 bg-slate-50 rounded-b-xl">
                          <div className="col-span-6 text-sm font-black uppercase pl-4">Summe Aktiva</div>
                          <div className="col-span-3 text-right font-black text-lg text-slate-900">
                            {currentData.sumAktiva.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                          </div>
                          <div className="col-span-3 text-right font-bold text-slate-400 text-sm">
                            {previousData.sumAktiva.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                          </div>
                      </div>
                  </div>
              </div>

              {/* PASSIVA SECTION */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-900 p-3 font-black text-center text-white uppercase tracking-[0.2em] text-sm">Passiva</div>
                  <div className="p-6">
                      <div className="grid grid-cols-12 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 pb-2 mb-2">
                          <div className="col-span-6">Position</div>
                          <div className="col-span-3 text-right">31.12.{selectedYear}</div>
                          <div className="col-span-3 text-right">Vorjahr</div>
                      </div>
                      {BILANZ_PASSIVA_STRUCTURE.map(group => {
                          const level = (group.id.match(/_/g) || []).length;
                          return (
                              <ReportRow 
                                key={group.id} id={group.id} label={group.label} 
                                amount={currentData.values[group.id]} prevAmount={previousData.values[group.id]}
                                level={level} isBold={level === 0 || group.isTotal}
                              />
                          );
                      })}
                      <div className="grid grid-cols-12 py-4 mt-4 border-t-4 border-double border-slate-900 bg-slate-50 rounded-b-xl">
                          <div className="col-span-6 text-sm font-black uppercase pl-4">Summe Passiva</div>
                          <div className="col-span-3 text-right font-black text-lg text-slate-900">
                            {currentData.sumPassiva.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                          </div>
                          <div className="col-span-3 text-right font-bold text-slate-400 text-sm">
                            {previousData.sumPassiva.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};
