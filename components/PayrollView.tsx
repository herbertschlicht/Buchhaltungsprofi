import React, { useState, useMemo } from 'react';
import { Transaction, Account, TransactionType } from '../types';
import { UserCheck, PlusCircle, Calendar, FileText, CheckCircle, Save, X } from 'lucide-react';

interface PayrollViewProps {
  transactions: Transaction[];
  accounts: Account[];
  onSaveTransaction: (transaction: Transaction) => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({ transactions, accounts, onSaveTransaction }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Payroll Filter: Only transactions marked as PAYROLL or descriptions containing "Lohn"/"Gehalt"
  const payrollTransactions = useMemo(() => {
      return transactions.filter(t => 
          t.type === TransactionType.PAYROLL || 
          t.description.toLowerCase().includes('lohn') || 
          t.description.toLowerCase().includes('gehalt')
      ).sort((a,b) => b.date.localeCompare(a.date));
  }, [transactions]);

  // Modal State
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [reference, setReference] = useState(`LOB-${new Date().getFullYear()}-${new Date().getMonth() + 1}`);
  
  // Amounts
  const [grossWage, setGrossWage] = useState<number>(0);
  const [employerSocial, setEmployerSocial] = useState<number>(0);
  
  // These are derived mostly, but in payroll accounting we usually get the totals from the report
  const [netPay, setNetPay] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0); // Lohnsteuer + KiSt + Soli
  const [socialTotal, setSocialTotal] = useState<number>(0); // SV-Beiträge Gesamt (AN+AG)

  // Helper to check balance
  const totalDebit = grossWage + employerSocial;
  const totalCredit = netPay + taxAmount + socialTotal;
  const diff = totalDebit - totalCredit;
  const isBalanced = Math.abs(diff) < 0.05;

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isBalanced) {
          alert(`Buchung nicht ausgeglichen! Differenz: ${diff.toFixed(2)} €`);
          return;
      }

      // Accounts
      const accGross = accounts.find(a => a.code === '4100')?.id;
      const accSocialExp = accounts.find(a => a.code === '4130')?.id;
      const accNetLiab = accounts.find(a => a.code === '1740')?.id;
      const accTaxLiab = accounts.find(a => a.code === '1741')?.id;
      const accSocialLiab = accounts.find(a => a.code === '1742')?.id;

      if (!accGross || !accSocialExp || !accNetLiab || !accTaxLiab || !accSocialLiab) {
          alert("Kritische Konten fehlen im Kontenplan (4100, 4130, 1740, 1741, 1742).");
          return;
      }

      const lines = [
          { accountId: accGross, debit: grossWage, credit: 0 },
          { accountId: accSocialExp, debit: employerSocial, credit: 0 },
          { accountId: accNetLiab, debit: 0, credit: netPay },
          { accountId: accTaxLiab, debit: 0, credit: taxAmount },
          { accountId: accSocialLiab, debit: 0, credit: socialTotal }
      ].filter(l => l.debit > 0 || l.credit > 0);

      const newTransaction: Transaction = {
          id: crypto.randomUUID(),
          date: `${period}-28`, // Usually booked end of month
          type: TransactionType.PAYROLL,
          reference,
          description: `Lohnbuchhaltung ${period}`,
          lines
      };

      onSaveTransaction(newTransaction);
      setShowModal(false);
      
      // Reset Form
      setGrossWage(0); setEmployerSocial(0); setNetPay(0); setTaxAmount(0); setSocialTotal(0);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
         <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <UserCheck className="w-6 h-6 mr-3 text-indigo-600"/>
                Personalwesen & Lohnbuchhaltung
            </h2>
            <p className="text-slate-500">Erfassung und Übersicht der monatlichen Lohnläufe.</p>
         </div>
         <button 
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-all"
         >
             <PlusCircle className="w-4 h-4 mr-2" />
             Lohnbuchung erfassen
         </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                      <tr>
                          <th className="p-4 w-32">Datum</th>
                          <th className="p-4 w-32">Beleg-Nr.</th>
                          <th className="p-4">Beschreibung</th>
                          <th className="p-4 text-right">Gesamtaufwand (AG)</th>
                          <th className="p-4 text-right">Auszahlung (Netto)</th>
                          <th className="p-4 text-right">Abgaben (Steuer/SV)</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {payrollTransactions.map(t => {
                          const totalExpense = t.lines.reduce((sum, l) => {
                              const acc = accounts.find(a => a.id === l.accountId);
                              return (acc?.type === 'EXPENSE') ? sum + l.debit : sum;
                          }, 0);
                          
                          const netPayout = t.lines.reduce((sum, l) => {
                              const acc = accounts.find(a => a.id === l.accountId);
                              // 1740 is Net Liabilities
                              return (acc?.code === '1740') ? sum + l.credit : sum;
                          }, 0);

                          const taxesAndSocial = t.lines.reduce((sum, l) => {
                              const acc = accounts.find(a => a.id === l.accountId);
                              // 1741 (Tax) + 1742 (Social)
                              return (acc?.code === '1741' || acc?.code === '1742') ? sum + l.credit : sum;
                          }, 0);

                          return (
                              <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors">
                                  <td className="p-4 text-sm text-slate-600">{t.date}</td>
                                  <td className="p-4 text-sm font-mono font-medium bg-slate-50 rounded w-fit inline-block my-2 ml-4">{t.reference || '-'}</td>
                                  <td className="p-4 text-sm font-bold text-slate-800">{t.description}</td>
                                  <td className="p-4 text-sm text-right font-mono font-bold">{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</td>
                                  <td className="p-4 text-sm text-right font-mono text-indigo-600">{netPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</td>
                                  <td className="p-4 text-sm text-right font-mono text-slate-500">{taxesAndSocial.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</td>
                              </tr>
                          );
                      })}
                      {payrollTransactions.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400">Keine Lohnbuchungen vorhanden.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* --- PAYROLL WIZARD MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Lohnbuchung erfassen</h2>
                        <p className="text-xs text-indigo-700 mt-1">Übertragen Sie die Summen aus dem Buchungsbeleg Ihres Lohnbüros.</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Abrechnungsmonat</label>
                            <input 
                                type="month" 
                                value={period}
                                onChange={(e) => {
                                    setPeriod(e.target.value);
                                    setReference(`LOB-${e.target.value}`);
                                }}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Beleg-Nr.</label>
                            <input 
                                type="text" 
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">Aufwand (Soll)</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Bruttolöhne & Gehälter (4100)</label>
                                <input 
                                    type="number" step="0.01" 
                                    value={grossWage || ''} 
                                    onChange={(e) => setGrossWage(parseFloat(e.target.value))}
                                    className="w-full p-2 border border-slate-300 rounded text-right font-mono" placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">AG-Anteil Sozialvers. (4130)</label>
                                <input 
                                    type="number" step="0.01" 
                                    value={employerSocial || ''} 
                                    onChange={(e) => setEmployerSocial(parseFloat(e.target.value))}
                                    className="w-full p-2 border border-slate-300 rounded text-right font-mono" placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="mt-2 text-right text-sm font-bold text-slate-700">
                            Summe Aufwand: {totalDebit.toFixed(2)} €
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 bg-slate-50 p-4 rounded-lg">
                        <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">Verbindlichkeiten (Haben)</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-slate-700 w-1/2">Auszahlungsbetrag Netto (1740)</label>
                                <input 
                                    type="number" step="0.01" 
                                    value={netPay || ''} 
                                    onChange={(e) => setNetPay(parseFloat(e.target.value))}
                                    className="w-1/2 p-2 border border-slate-300 rounded text-right font-mono border-l-4 border-l-indigo-500" placeholder="0.00"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-slate-700 w-1/2">Lohn- & Kirchensteuer (1741)</label>
                                <input 
                                    type="number" step="0.01" 
                                    value={taxAmount || ''} 
                                    onChange={(e) => setTaxAmount(parseFloat(e.target.value))}
                                    className="w-1/2 p-2 border border-slate-300 rounded text-right font-mono" placeholder="0.00"
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-slate-700 w-1/2">Sozialversicherung Gesamt (1742)</label>
                                <input 
                                    type="number" step="0.01" 
                                    value={socialTotal || ''} 
                                    onChange={(e) => setSocialTotal(parseFloat(e.target.value))}
                                    className="w-1/2 p-2 border border-slate-300 rounded text-right font-mono" placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="mt-2 text-right text-sm font-bold text-slate-700 border-t border-slate-200 pt-2">
                            Summe Haben: {totalCredit.toFixed(2)} €
                        </div>
                    </div>

                    {/* Balance Check */}
                    <div className={`p-3 rounded-lg text-center font-bold text-sm ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isBalanced ? (
                            <span className="flex items-center justify-center"><CheckCircle className="w-4 h-4 mr-2"/> Buchung ist ausgeglichen</span>
                        ) : (
                            <span>Differenz: {diff.toFixed(2)} € (Bitte prüfen)</span>
                        )}
                    </div>

                </form>

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-white">Abbrechen</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={!isBalanced || totalDebit === 0}
                        className={`flex items-center px-6 py-2 text-white rounded-lg font-medium shadow-md transition-all ${isBalanced && totalDebit > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'}`}
                    >
                        <Save className="w-4 h-4 mr-2" /> Buchen
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};