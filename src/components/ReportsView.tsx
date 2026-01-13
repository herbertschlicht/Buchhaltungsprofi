
import React, { useState, useMemo } from 'react';
import { Transaction, Account, AccountType, CompanySettings } from '../types';
import { Printer, Building2, Calendar, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

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
    isHeading?: boolean;
};

// --- GUV STRUKTUR (GKV § 275 HGB) ---
const GUV_GKV_STRUCTURE: ReportGroup[] = [
    { id: 'guv_1', label: '1. Umsatzerlöse' },
    { id: 'guv_2', label: '2. Erhöhung/Verminderung des Bestands an fertigen/unfertigen Erzeugnissen' },
    { id: 'guv_3', label: '3. Andere aktivierte Eigenleistungen' },
    { id: 'guv_4', label: '4. Sonstige betriebliche Erträge' },
    { id: 'guv_5', label: '5. Materialaufwand', isHeading: true },
    { id: 'guv_5_1', label: '5.1 Aufwendungen für Roh-, Hilfs- und Betriebsstoffe', parent: 'guv_5' },
    { id: 'guv_5_2', label: '5.2 Aufwendungen für bezogene Waren', parent: 'guv_5' },
    { id: 'guv_5_3', label: '5.3 Aufwendungen für bezogene Leistungen', parent: 'guv_5' },
    { id: 'guv_6', label: '6. Personalaufwand', isHeading: true },
    { id: 'guv_6_a', label: '6.a) Löhne und Gehälter', parent: 'guv_6' },
    { id: 'guv_6_b', label: '6.b) Soziale Abgaben und Aufwendungen für Altersversorgung', parent: 'guv_6' },
    { id: 'guv_7', label: '7. Abschreibungen', isHeading: true },
    { id: 'guv_7_a', label: '7.a) Auf immat. Anlagewerte und Sachanlagen', parent: 'guv_7' },
    { id: 'guv_7_b', label: '7.b) Auf Vermögensgegenstände des Umlaufvermögens', parent: 'guv_7' },
    { id: 'guv_8', label: '8. Sonstige betriebliche Aufwendungen' },
    { id: 'guv_9', label: '9. Erträge aus Beteiligungen' },
    { id: 'guv_10', label: '10. Erträge aus anderen Wertpapieren und Ausleihungen des FAV' },
    { id: 'guv_11', label: '11. Sonstige Zinsen und ähnliche Erträge' },
    { id: 'guv_12', label: '12. Abschreibungen auf Finanzanlagen und Wertpapiere des UV' },
    { id: 'guv_13', label: '13. Zinsen und ähnliche Aufwendungen' },
    { id: 'guv_14', label: '14. Steuern vom Einkommen und vom Ertrag' },
    { id: 'guv_15', label: '15. Ergebnis nach Steuern', isTotal: true },
    { id: 'guv_16', label: '16. Sonstige Steuern' },
];

// --- BILANZ AKTIVA (§ 266 HGB) ---
const BILANZ_AKTIVA_STRUCTURE: ReportGroup[] = [
    { id: 'act_A', label: 'A. Anlagevermögen', isTotal: true },
    { id: 'act_A_I', label: 'I. Immaterielle Vermögensgegenstände', parent: 'act_A' },
    { id: 'act_A_I_1', label: '1. Selbst geschaffene gewerbliche Schutzrechte', parent: 'act_A_I' },
    { id: 'act_A_I_2', label: '2. Entgeltlich erworbene Konzessionen/Lizenzen', parent: 'act_A_I' },
    { id: 'act_A_I_3', label: '3. Geschäfts- oder Firmenwert', parent: 'act_A_I' },
    { id: 'act_A_I_4', label: '4. Geleistete Anzahlungen', parent: 'act_A_I' },
    { id: 'act_A_II', label: 'II. Sachanlagen', parent: 'act_A' },
    { id: 'act_A_II_1', label: '1. Grundstücke, Bauten, grundstücksgleiche Rechte', parent: 'act_A_II' },
    { id: 'act_A_II_2', label: '2. Technische Anlagen und Maschinen', parent: 'act_A_II' },
    { id: 'act_A_II_3', label: '3. Andere Anlagen, Betriebs- und Geschäftsausstattung', parent: 'act_A_II' },
    { id: 'act_A_II_4', label: '4. Geleistete Anzahlungen und Anlagen im Bau', parent: 'act_A_II' },
    { id: 'act_A_III', label: 'III. Finanzanlagen', parent: 'act_A' },
    { id: 'act_A_III_1', label: '1. Anteile an verbundenen Unternehmen', parent: 'act_A_III' },
    { id: 'act_A_III_2', label: '2. Ausleihungen an verbundene Unternehmen', parent: 'act_A_III' },
    { id: 'act_A_III_3', label: '3. Beteiligungen', parent: 'act_A_III' },
    { id: 'act_A_III_4', label: '4. Sonstige Ausleihungen/Wertpapiere', parent: 'act_A_III' },
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
    { id: 'act_B_IV', label: 'IV. Kassenbestand, Bankguthaben', parent: 'act_B' },
    { id: 'act_C', label: 'C. Rechnungsabgrenzungsposten' },
    { id: 'act_D', label: 'D. Aktive latente Steuern' },
    { id: 'act_E', label: 'E. Aktiver Unterschiedsbetrag aus der Vermögensverrechnung' },
];

// --- BILANZ PASSIVA (§ 266 HGB) ---
const BILANZ_PASSIVA_STRUCTURE: ReportGroup[] = [
    { id: 'pas_A', label: 'A. Eigenkapital', isTotal: true },
    { id: 'pas_A_I', label: 'I. Gezeichnetes Kapital / Festkapital', parent: 'pas_A' },
    { id: 'pas_A_II', label: 'II. Kapitalrücklage', parent: 'pas_A' },
    { id: 'pas_A_III', label: 'III. Gewinnrücklagen', parent: 'pas_A' },
    { id: 'pas_A_IV', label: 'IV. Gewinnvortrag / Verlustvortrag', parent: 'pas_A' },
    { id: 'pas_A_V', label: 'V. Jahresüberschuss / Jahresfehlbetrag', parent: 'pas_A' },
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
    { id: 'pas_C_6', label: '6. Sonstige Verbindlichkeiten (inkl. Steuern/Sozial)', parent: 'pas_C' },
    { id: 'pas_D', label: 'D. Rechnungsabgrenzungsposten' },
    { id: 'pas_E', label: 'E. Passive latente Steuern' }
];

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, accounts, companySettings }) => {
  const [activeReport, setActiveReport] = useState<'income' | 'balance'>('income');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const availableYears = useMemo(() => {
      const years = new Set<number>(transactions.map(t => new Date(t.date).getFullYear()));
      years.add(new Date().getFullYear());
      return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // --- MAPPING ENGINE SKR 03 ---
  const mapAccountToCategory = (account: Account): string => {
      const code = parseInt(account.code.substring(0, 4));
      
      if (account.type === AccountType.REVENUE) {
          if (code >= 8000 && code <= 8999 && !account.name.includes('Eigenverbrauch')) return 'guv_1';
          if (code >= 8900 && code <= 8950) return 'guv_4';
          if (code >= 2700 && code <= 2799) return 'guv_4';
          if (code === 2650) return 'guv_11';
          return 'guv_4';
      }

      if (account.type === AccountType.EXPENSE) {
          if (code >= 3000 && code <= 3099) return 'guv_5_1';
          if (code >= 3200 && code <= 3599) return 'guv_5_2';
          if (code >= 3100 && code <= 3199 || code === 5900) return 'guv_5_3';
          if (code >= 4100 && code <= 4129) return 'guv_6_a';
          if (code >= 4130 && code <= 4199) return 'guv_6_b';
          if (code >= 4820 && code <= 4839) return 'guv_7_a';
          if (code >= 4840 && code <= 4859) return 'guv_7_b';
          if (code >= 2100 && code <= 2149) return 'guv_13';
          if (code >= 2200 && code <= 2289) return 'guv_14';
          if (code >= 2380 && code <= 2399) return 'guv_16';
          return 'guv_8';
      }

      if (account.type === AccountType.ASSET) {
          if (code >= 10 && code <= 49) return 'act_A_I_2';
          if (code >= 50 && code <= 199) return 'act_A_II_1';
          if (code >= 200 && code <= 299) return 'act_A_II_2';
          if (code >= 300 && code <= 499) return 'act_A_II_3';
          if (code >= 500 && code <= 799) return 'act_A_III_1';
          if (code >= 3960 && code <= 3989) return 'act_B_I_3';
          if (code >= 1400 && code <= 1499) return 'act_B_II_1';
          if (code >= 1500 && code <= 1599) return 'act_B_II_3';
          if (code >= 1000 && code <= 1299) return 'act_B_IV';
          if (code >= 980 && code <= 990) return 'act_C';
          return 'act_B_II_3';
      }

      if (account.type === AccountType.LIABILITY) {
          if (code >= 950 && code <= 959) return 'pas_B_1';
          if (code >= 960 && code <= 969) return 'pas_B_2';
          if (code >= 970 && code <= 979 || code === 2300) return 'pas_B_3';
          if (code >= 1600 && code <= 1699) return 'pas_C_4';
          if (code >= 1705 && code <= 1709) return 'pas_C_2';
          if (code >= 1700 && code <= 1999) return 'pas_C_6';
          return 'pas_C_6';
      }

      if (account.type === AccountType.EQUITY) {
          if (code >= 800 && code <= 859) return 'pas_A_I';
          if (code >= 860 && code <= 899) return 'pas_A_IV';
          if (code >= 1800 && code <= 1899) return 'pas_A_I';
          return 'pas_A_I';
      }

      return 'uncategorized';
  };

  const calculateReportData = (targetYear: number) => {
      const startDate = `${targetYear}-01-01`;
      const endDate = `${targetYear}-12-31`;
      const values: Record<string, number> = {};
      const allStructs = [...GUV_GKV_STRUCTURE, ...BILANZ_AKTIVA_STRUCTURE, ...BILANZ_PASSIVA_STRUCTURE];
      allStructs.forEach(s => values[s.id] = 0);

      accounts.forEach(acc => {
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
          const cat = mapAccountToCategory(acc);
          if (values[cat] !== undefined) values[cat] += bal;
      });

      // Kalkulation GuV Ergebnis
      const sumRevenue = values['guv_1'] + values['guv_2'] + values['guv_3'] + values['guv_4'] + values['guv_9'] + values['guv_10'] + values['guv_11'];
      const sumExpense = values['guv_5_1'] + values['guv_5_2'] + values['guv_5_3'] + values['guv_6_a'] + values['guv_6_b'] + values['guv_7_a'] + values['guv_7_b'] + values['guv_8'] + values['guv_12'] + values['guv_13'] + values['guv_14'] + values['guv_16'];
      const netResult = sumRevenue - sumExpense;
      values['guv_15'] = sumRevenue - (sumExpense - values['guv_16']); // Ergebnis nach Steuern (vereinfacht)
      values['pas_A_V'] = netResult;

      // Bottom-Up Aggregation
      const aggregate = (struct: ReportGroup[]) => {
          const sorted = [...struct].sort((a,b) => (b.id.match(/_/g) || []).length - (a.id.match(/_/g) || []).length);
          sorted.forEach(item => { if(item.parent) values[item.parent] += values[item.id]; });
      };
      aggregate(BILANZ_AKTIVA_STRUCTURE);
      aggregate(BILANZ_PASSIVA_STRUCTURE);
      aggregate(GUV_GKV_STRUCTURE);

      const sumAktiva = BILANZ_AKTIVA_STRUCTURE.filter(s => !s.parent).reduce((sum, s) => sum + values[s.id], 0);
      const sumPassiva = BILANZ_PASSIVA_STRUCTURE.filter(s => !s.parent).reduce((sum, s) => sum + values[s.id], 0);

      return { values, sumAktiva, sumPassiva, netResult };
  };

  const currentData = useMemo(() => calculateReportData(selectedYear), [selectedYear, transactions, accounts]);
  const prevData = useMemo(() => calculateReportData(selectedYear - 1), [selectedYear, transactions, accounts]);

  const ReportRow: React.FC<{ 
      group: ReportGroup; 
      amount: number; 
      prevAmount: number;
  }> = ({ group, amount, prevAmount }) => {
      if (Math.abs(amount) < 0.01 && Math.abs(prevAmount) < 0.01) return null;

      const level = (group.id.match(/_/g) || []).length;
      const isRoot = level === 0 || group.isTotal;
      const isSub = level >= 2;

      return (
          <div className={`grid grid-cols-12 items-center py-2 border-b border-slate-100 transition-all hover:bg-slate-50/50 
            ${isRoot ? 'font-black bg-slate-50 text-slate-900 border-b-2 border-slate-200' : 'text-slate-600'}
            ${group.isHeading ? 'bg-slate-100/30 font-bold text-slate-700' : ''}
          `}>
              <div className={`col-span-7 flex items-center gap-2 truncate 
                ${level === 0 ? 'pl-0 text-sm uppercase' : level === 1 ? 'pl-6 text-sm' : 'pl-12 text-xs italic'}
              `}>
                  <span>{group.label}</span>
              </div>
              <div className={`col-span-3 text-right font-mono ${isRoot ? 'text-sm' : 'text-xs'} ${amount < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
              </div>
              <div className={`col-span-2 text-right font-mono text-[10px] text-slate-400`}>
                  {prevAmount !== 0 ? prevAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 }) : '-'}
              </div>
          </div>
      );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center no-print">
          <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-transparent font-bold outline-none">
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setActiveReport('income')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeReport === 'income' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>GuV (GKV)</button>
              <button onClick={() => setActiveReport('balance')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeReport === 'balance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Bilanz (§266)</button>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold"><Printer className="w-4 h-4"/> Drucken</button>
      </div>

      <div className="bg-white p-12 shadow-2xl rounded-3xl border border-slate-100 print:shadow-none print:border-none print:p-4">
        <div className="text-center mb-16 border-b-2 border-slate-900 pb-8">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                {activeReport === 'income' ? 'Gewinn- und Verlustrechnung' : 'Bilanz'}
            </h1>
            <p className="text-slate-500 font-medium mt-2">{activeReport === 'income' ? 'Gesamtkostenverfahren gemäß § 275 Abs. 2 HGB' : 'Gliederung gemäß § 266 HGB'}</p>
            <div className="flex justify-center items-center gap-8 mt-6 text-sm font-bold text-slate-400">
                <span className="flex items-center"><Building2 className="w-4 h-4 mr-2"/> {companySettings.companyName}</span>
                <span>Wirtschaftsjahr: {selectedYear}</span>
            </div>
        </div>

        {activeReport === 'income' && (
            <div className="animate-fadeIn">
                <div className="grid grid-cols-12 text-[10px] font-black text-slate-400 uppercase mb-4 px-2">
                    <div className="col-span-7">Position</div>
                    <div className="col-span-3 text-right">Betrag {selectedYear}</div>
                    <div className="col-span-2 text-right">Vorjahr</div>
                </div>
                {GUV_GKV_STRUCTURE.map(g => (
                    <ReportRow key={g.id} group={g} amount={currentData.values[g.id]} prevAmount={prevData.values[g.id]} />
                ))}
                <div className="mt-12 p-6 bg-slate-900 text-white rounded-2xl flex justify-between items-center shadow-xl">
                    <span className="text-xl font-black uppercase tracking-widest">Jahresüberschuss / Fehlbetrag</span>
                    <span className="text-2xl font-mono font-black">{currentData.netResult.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</span>
                </div>
            </div>
        )}

        {activeReport === 'balance' && (
            <div className="space-y-16 animate-fadeIn">
                {/* AKTIVA */}
                <div>
                    <div className="bg-slate-900 text-white p-3 font-black text-center uppercase tracking-widest text-sm rounded-t-xl">Aktiva</div>
                    <div className="border-x border-b border-slate-200 rounded-b-xl overflow-hidden">
                        {BILANZ_AKTIVA_STRUCTURE.map(g => (
                            <ReportRow key={g.id} group={g} amount={currentData.values[g.id]} prevAmount={prevData.values[g.id]} />
                        ))}
                        <div className="bg-slate-50 p-4 flex justify-between font-black text-lg border-t-4 border-double border-slate-900">
                            <span>SUMME AKTIVA</span>
                            <span>{currentData.sumAktiva.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</span>
                        </div>
                    </div>
                </div>

                {/* PASSIVA */}
                <div>
                    <div className="bg-slate-900 text-white p-3 font-black text-center uppercase tracking-widest text-sm rounded-t-xl">Passiva</div>
                    <div className="border-x border-b border-slate-200 rounded-b-xl overflow-hidden">
                        {BILANZ_PASSIVA_STRUCTURE.map(g => (
                            <ReportRow key={g.id} group={g} amount={currentData.values[g.id]} prevAmount={prevData.values[g.id]} />
                        ))}
                        <div className="bg-slate-50 p-4 flex justify-between font-black text-lg border-t-4 border-double border-slate-900">
                            <span>SUMME PASSIVA</span>
                            <span>{currentData.sumPassiva.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</span>
                        </div>
                    </div>
                </div>

                {Math.abs(currentData.sumAktiva - currentData.sumPassiva) > 0.05 && (
                    <div className="bg-red-50 text-red-700 p-6 rounded-2xl border-2 border-red-200 flex items-center gap-4 no-print shadow-lg">
                        <AlertTriangle className="w-10 h-10 animate-pulse" />
                        <div>
                            <p className="font-black text-lg">Bilanz-Differenz erkannt!</p>
                            <p className="text-sm font-medium">Aktiva und Passiva müssen ausgeglichen sein. Differenz: {(currentData.sumAktiva - currentData.sumPassiva).toFixed(2)} €</p>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
