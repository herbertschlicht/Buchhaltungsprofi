
import React, { useState, useMemo } from 'react';
import { Transaction, Account, AccountType, CompanySettings, Invoice } from '../types';
import { Search, PenLine, Check, X, FileSpreadsheet, List, Wallet, Calendar, Printer, Building2, Filter, ArrowLeft, PlusCircle } from 'lucide-react';
import { getAccountLedgerStats } from '../utils/accounting';

interface LedgerViewProps {
  transactions: Transaction[];
  accounts: Account[];
  invoices?: Invoice[];
  companySettings: CompanySettings;
  onUpdateAccount?: (account: Account) => void;
  onAddAccount?: (account: Account) => void; 
}

export const LedgerView: React.FC<LedgerViewProps> = ({ transactions, accounts, invoices = [], companySettings, onUpdateAccount, onAddAccount }) => {
  const [activeSubTab, setActiveSubTab] = useState<'journal' | 'accounts' | 'balances'>('journal');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmptyAccounts, setShowEmptyAccounts] = useState(false);
  
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const lastTransactionDate = useMemo(() => {
      if (transactions.length === 0) return new Date().toISOString().split('T')[0];
      const sorted = [...transactions].sort((a,b) => b.date.localeCompare(a.date));
      return sorted[0].date;
  }, [transactions]);

  const [balanceDate, setBalanceDate] = useState(lastTransactionDate);
  const [journalYearFilter, setJournalYearFilter] = useState<string>('all');

  // Editing State
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<AccountType>(AccountType.ASSET);

  // Creating State (New Account)
  const [isCreating, setIsCreating] = useState(false);
  const [newAccountCode, setNewAccountCode] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<AccountType>(AccountType.ASSET);

  const availableYears = useMemo(() => {
      const years = new Set<number>(transactions.map(t => new Date(t.date).getFullYear()));
      return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const reportDateObj = new Date(balanceDate);
  const reportYear = reportDateObj.getFullYear();
  const reportMonthName = reportDateObj.toLocaleDateString('de-DE', { month: 'long' });
  const reportDateFormatted = reportDateObj.toLocaleDateString('de-DE');
  const reportStartOfYear = `01.01.${reportYear}`;
  
  const filteredTransactions = useMemo(() => {
      return transactions
        .filter(t => {
            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.lines.some(l => {
                    const acc = accounts.find(a => a.id === l.accountId);
                    return (
                        acc?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        acc?.code.includes(searchTerm) 
                    );
                });
            
            const matchesYear = journalYearFilter === 'all' || new Date(t.date).getFullYear().toString() === journalYearFilter;

            return matchesSearch && matchesYear;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, accounts, journalYearFilter]);

  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.code.includes(searchTerm)
  ).sort((a, b) => a.code.localeCompare(b.code));

  const balancesList = activeSubTab === 'balances' ? accounts.map(account => {
      const stats = getAccountLedgerStats(account.id, transactions, account.type, balanceDate);
      return { ...account, ...stats };
  }).filter(acc => {
      const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || acc.code.includes(searchTerm);
      const hasMovement = Math.abs(acc.openingBalance) > 0.01 || Math.abs(acc.debitYTD) > 0.01 || Math.abs(acc.creditYTD) > 0.01;
      
      if (!matchesSearch) return false;
      if (searchTerm.length > 0) return true;
      if (showEmptyAccounts) return true;
      
      return hasMovement;
  }) : [];

  const totalListStats = balancesList.reduce((acc, c) => ({
    openingBalance: acc.openingBalance + c.openingBalance,
    debitMonth: acc.debitMonth + c.debitMonth,
    creditMonth: acc.creditMonth + c.creditMonth,
    debitYTD: acc.debitYTD + c.debitYTD,
    creditYTD: acc.creditYTD + c.creditYTD,
    endingBalance: acc.endingBalance + c.endingBalance 
  }), { openingBalance: 0, debitMonth: 0, creditMonth: 0, debitYTD: 0, creditYTD: 0, endingBalance: 0 });

  const accountSheetData = useMemo(() => {
      if (!selectedAccount) return null;

      const viewYear = new Date(balanceDate).getFullYear();
      let openingBalance = 0;
      
      const accountTx = transactions.filter(t => t.lines.some(l => l.accountId === selectedAccount.id));
      accountTx.sort((a,b) => a.date.localeCompare(b.date));

      const rows: any[] = [];

      accountTx.forEach(t => {
          const tYear = new Date(t.date).getFullYear();
          const line = t.lines.find(l => l.accountId === selectedAccount.id);
          if (!line) return;

          const debit = line.debit;
          const credit = line.credit;

          if (tYear < viewYear) {
               if ([AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY].includes(selectedAccount.type)) {
                   if (selectedAccount.type === AccountType.ASSET) openingBalance += (debit - credit);
                   else openingBalance += (credit - debit);
               }
               return; 
          }
          
          if (t.date > balanceDate) return;

          const otherLines = t.lines.filter(l => l.accountId !== selectedAccount.id);
          let contraAccountCode = "Split";
          let contraAccountName = "Mehrere Konten";
          
          if (otherLines.length === 1) {
              const contraAcc = accounts.find(a => a.id === otherLines[0].accountId);
              if (contraAcc) {
                  contraAccountCode = contraAcc.code;
                  contraAccountName = contraAcc.name;
              }
          }

          rows.push({
              id: t.id,
              date: t.date,
              reference: t.reference || invoices.find(i => i.transactionId === t.id)?.number || '-',
              description: t.description,
              contraAccountCode,
              contraAccountName,
              debit,
              credit
          });
      });

      let currentBalance = openingBalance;
      const rowsWithBalance = rows.map(r => {
          if ([AccountType.ASSET, AccountType.EXPENSE].includes(selectedAccount.type)) {
              currentBalance += (r.debit - r.credit);
          } else {
              currentBalance += (r.credit - r.debit);
          }
          return { ...r, balance: currentBalance };
      });

      return {
          openingBalance,
          rows: rowsWithBalance,
          finalBalance: currentBalance
      };

  }, [selectedAccount, transactions, balanceDate, accounts, invoices]);


  const startEditing = (account: Account) => {
    setEditingAccountId(account.id);
    setEditName(account.name);
    setEditType(account.type);
  };

  const cancelEditing = () => {
    setEditingAccountId(null);
    setEditName('');
  };

  const saveAccount = (account: Account) => {
    if (account.type !== editType) {
        if (!window.confirm(`Möchten Sie den Kontotyp wirklich ändern? Dies beeinflusst die Berechnung.`)) {
            return;
        }
    }

    if (onUpdateAccount && editName.trim()) {
      onUpdateAccount({ ...account, name: editName.trim(), type: editType });
    }
    setEditingAccountId(null);
  };

  const handleCreateAccount = () => {
      if (!newAccountCode || !newAccountName) return;
      
      // VALIDIERUNG: Exakt 7 Stellen und nur Zahlen
      if (!/^\d{7}$/.test(newAccountCode)) {
          alert("Die Kontonummer muss exakt 7-stellig sein.");
          return;
      }

      const exists = accounts.find(a => a.code === newAccountCode);
      if (exists) {
          alert(`Ein Konto mit der Nummer ${newAccountCode} existiert bereits.`);
          return;
      }

      if (onAddAccount) {
          onAddAccount({
              id: crypto.randomUUID(),
              code: newAccountCode,
              name: newAccountName,
              type: newAccountType
          });
          setIsCreating(false);
          setNewAccountCode('');
          setNewAccountName('');
      }
  };

  const handlePrint = () => {
      window.print();
  };

  const fmt = (n: number) => n === 0 ? '-' : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Finanzbuchhaltung</h2>
          <p className="text-slate-500">Journal, Sachkonten und Auswertungen.</p>
        </div>
        
        {!selectedAccount && (
            <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
                <button 
                    onClick={() => setActiveSubTab('journal')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeSubTab === 'journal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <List className="w-4 h-4 mr-2" /> Journal
                </button>
                <button 
                    onClick={() => setActiveSubTab('accounts')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeSubTab === 'accounts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Kontenplan
                </button>
                <button 
                    onClick={() => setActiveSubTab('balances')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeSubTab === 'balances' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Wallet className="w-4 h-4 mr-2" /> SuSa (Sachkonten)
                </button>
            </div>
        )}
      </div>

      {!selectedAccount && (
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between no-print bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
                type="text" 
                placeholder={activeSubTab === 'journal' ? "Suche nach Buchungen..." : "Suche nach Konten..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
            />
          </div>

          {activeSubTab === 'accounts' && (
              <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors ml-auto"
              >
                  <PlusCircle className="w-4 h-4 mr-2" /> Neues Konto
              </button>
          )}

          {activeSubTab === 'journal' && (
              <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Wirtschaftsjahr:</span>
                  <select 
                    value={journalYearFilter}
                    onChange={(e) => setJournalYearFilter(e.target.value)}
                    className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm font-medium"
                  >
                      <option value="all">Alle Jahre anzeigen</option>
                      {availableYears.map(year => (
                          <option key={year} value={year.toString()}>{year}</option>
                      ))}
                  </select>
              </div>
          )}

          {activeSubTab === 'balances' && (
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    
                    <button 
                        onClick={() => setShowEmptyAccounts(!showEmptyAccounts)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${showEmptyAccounts ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Filter className="w-3 h-3" />
                        Leere Konten {showEmptyAccounts ? 'ausblenden' : 'anzeigen'}
                    </button>

                    <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-2 rounded-lg shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <label className="text-xs font-semibold text-slate-500 mr-2">Stichtag:</label>
                        <input 
                            type="date"
                            value={balanceDate}
                            onChange={(e) => setBalanceDate(e.target.value)}
                            className="text-sm bg-transparent border-none focus:ring-0 text-slate-800 font-medium cursor-pointer outline-none"
                        />
                    </div>
                    <button 
                         onClick={handlePrint}
                         className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors shadow-sm ml-auto"
                    >
                        <Printer className="w-4 h-4" /> Drucken
                    </button>
              </div>
          )}
      </div>
      )}

      {/* CREATE ACCOUNT MODAL */}
      {isCreating && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fadeIn">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                      <h3 className="text-xl font-bold text-slate-800">Neues Sachkonto anlegen</h3>
                      <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kontonummer (Code)</label>
                          <div className="relative">
                              <input 
                                type="text" 
                                autoFocus
                                maxLength={7}
                                minLength={7}
                                value={newAccountCode}
                                onChange={e => setNewAccountCode(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="z.B. 1530001"
                                className={`w-full p-2.5 border rounded-lg outline-none font-mono ${
                                    newAccountCode.length > 0 && newAccountCode.length !== 7 
                                    ? 'border-red-300 focus:ring-2 focus:ring-red-200' 
                                    : newAccountCode.length === 7 
                                        ? 'border-green-300 focus:ring-2 focus:ring-green-200' 
                                        : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                                }`}
                              />
                              <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono ${
                                  newAccountCode.length === 7 ? 'text-green-600 font-bold' : 'text-slate-400'
                              }`}>
                                  {newAccountCode.length}/7
                              </div>
                          </div>
                          {newAccountCode.length > 0 && newAccountCode.length !== 7 && (
                              <p className="text-[10px] text-red-500 mt-1 font-medium">Die Nummer muss exakt 7 Ziffern haben.</p>
                          )}
                          {newAccountCode.length === 0 && (
                              <p className="text-[10px] text-slate-400 mt-1">z.B. SKR03 4-stellig + 000 (z.B. 4930 -> 4930000)</p>
                          )}
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bezeichnung</label>
                          <input 
                            type="text" 
                            value={newAccountName}
                            onChange={e => setNewAccountName(e.target.value)}
                            placeholder="z.B. Ford. Reisekosten Müller"
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kontotyp</label>
                          <select
                                value={newAccountType}
                                onChange={(e) => setNewAccountType(e.target.value as AccountType)}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value={AccountType.ASSET}>Aktiva (Bestand / Forderung)</option>
                                <option value={AccountType.LIABILITY}>Passiva (Bestand / Verbindlichkeit)</option>
                                <option value={AccountType.EQUITY}>Eigenkapital</option>
                                <option value={AccountType.REVENUE}>Erlös (Ertrag)</option>
                                <option value={AccountType.EXPENSE}>Aufwand (Kosten)</option>
                            </select>
                      </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-8">
                      <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Abbrechen</button>
                      <button 
                        onClick={handleCreateAccount}
                        disabled={!newAccountCode || !newAccountName || newAccountCode.length !== 7}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                          Anlegen
                      </button>
                  </div>
              </div>
          </div>
      )}

      {activeSubTab === 'journal' && !selectedAccount && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">
                <th className="p-4 w-32">Datum</th>
                <th className="p-4 w-32">Beleg</th>
                <th className="p-4">Beschreibung</th>
                <th className="p-4">Konto</th>
                <th className="p-4 text-right">Soll</th>
                <th className="p-4 text-right">Haben</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map(transaction => {
                    const linkedInvoice = transaction.invoiceId ? invoices.find(inv => inv.id === transaction.invoiceId) : null;
                    const docNumber = linkedInvoice ? linkedInvoice.number : (transaction.reference || '-');
                    const hasRef = linkedInvoice || transaction.reference;

                    return (
                        <React.Fragment key={transaction.id}>
                            {transaction.lines.map((line, lineIndex) => {
                            const account = accounts.find(a => a.id === line.accountId);
                            const isNegative = line.debit < 0 || line.credit < 0;
                            return (
                                <tr key={`${transaction.id}-${lineIndex}`} className={`hover:bg-slate-50 transition-colors group ${isNegative ? 'text-red-600' : 'text-slate-600'}`}>
                                <td className="p-4 text-sm font-mono align-top">
                                    {lineIndex === 0 ? new Date(transaction.date).toLocaleDateString('de-DE') : ''}
                                </td>
                                <td className="p-4 text-sm font-mono align-top font-bold text-slate-700">
                                    {lineIndex === 0 ? (
                                        <span className={hasRef ? 'bg-slate-100 px-1 rounded' : 'text-slate-300'}>{docNumber}</span>
                                    ) : ''}
                                </td>
                                <td className="p-4 text-sm font-medium align-top">
                                    {lineIndex === 0 ? transaction.description : ''}
                                </td>
                                <td className="p-4 text-sm">
                                    <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs text-slate-500 mr-2 font-mono">
                                        {account?.code}
                                    </span>
                                    {account?.name}
                                </td>
                                <td className="p-4 text-sm text-right font-mono">
                                    {line.debit !== 0 ? `${line.debit.toLocaleString(undefined, {minimumFractionDigits: 2})} €` : '-'}
                                </td>
                                <td className="p-4 text-sm text-right font-mono">
                                    {line.credit !== 0 ? `${line.credit.toLocaleString(undefined, {minimumFractionDigits: 2})} €` : '-'}
                                </td>
                                </tr>
                            );
                            })}
                            <tr className="bg-slate-50/30 h-1"><td colSpan={6}></td></tr>
                        </React.Fragment>
                    )
                })}
                {filteredTransactions.length === 0 && (
                    <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                            Keine Transaktionen gefunden. Prüfen Sie den Datumsfilter.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      )}

      {activeSubTab === 'accounts' && !selectedAccount && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 w-24">SKR 03</th>
                    <th className="p-4">Kontobezeichnung</th>
                    <th className="p-4 w-48">Typ / Zuordnung</th>
                    <th className="p-4 w-24 text-right">Aktion</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredAccounts.map(account => (
                        <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-sm font-mono font-medium text-slate-600">
                                <span className={searchTerm && account.code.includes(searchTerm) ? "bg-yellow-100 px-1 rounded" : ""}>
                                    {account.code}
                                </span>
                            </td>
                            <td className="p-4 text-sm font-medium text-slate-900">
                                {editingAccountId === account.id ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    account.name
                                )}
                            </td>
                            <td className="p-4 text-sm">
                                {editingAccountId === account.id ? (
                                    <select
                                        value={editType}
                                        onChange={(e) => setEditType(e.target.value as AccountType)}
                                        className="border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none text-xs w-full bg-white"
                                    >
                                        <option value={AccountType.ASSET}>Aktiva (Bestand)</option>
                                        <option value={AccountType.LIABILITY}>Passiva (Bestand)</option>
                                        <option value={AccountType.EQUITY}>Eigenkapital (Bestand)</option>
                                        <option value={AccountType.REVENUE}>Erlös (Erfolg)</option>
                                        <option value={AccountType.EXPENSE}>Aufwand (Erfolg)</option>
                                    </select>
                                ) : (
                                    <span className={`px-2 py-1 rounded text-xs font-semibold
                                        ${account.type === 'ASSET' ? 'bg-green-100 text-green-700' : 
                                          account.type === 'LIABILITY' ? 'bg-red-100 text-red-700' :
                                          account.type === 'REVENUE' ? 'bg-blue-100 text-blue-700' :
                                          account.type === 'EXPENSE' ? 'bg-orange-100 text-orange-700' : 
                                          'bg-purple-100 text-purple-700'}`}>
                                        {account.type}
                                    </span>
                                )}
                            </td>
                            <td className="p-4 text-right">
                                {editingAccountId === account.id ? (
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => saveAccount(account)} 
                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                            title="Speichern"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={cancelEditing} 
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            title="Abbrechen"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => startEditing(account)} 
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Konto bearbeiten"
                                    >
                                        <PenLine className="w-4 h-4" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      )}

      {activeSubTab === 'balances' && !selectedAccount && (
          <div className="bg-white flex flex-col h-full rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
                
                <div className="p-8 pb-4 print:p-0 print:mb-6">
                        <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
                                Sachkonten Summen- und Saldenliste
                            </h1>
                            <div className="flex items-center mt-2 text-sm text-slate-600">
                                    <Building2 className="w-4 h-4 mr-2 text-slate-400"/>
                                    <span className="font-semibold mr-2">Mandant:</span>
                                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 print:bg-transparent print:p-0 print:border print:border-slate-300">
                                    {companySettings.companyName}
                                    </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Berichtszeitraum / Stichtag</p>
                            <p className="text-lg font-bold text-slate-900">
                                Per {reportDateFormatted}
                            </p>
                        </div>
                        </div>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 text-[10px] md:text-xs text-slate-500 uppercase font-semibold sticky top-0 z-10 print:static print:bg-white print:border-b-2 print:border-black">
                            <tr>
                                <th className="px-4 py-3 print:px-1 print:py-1">Konto</th>
                                <th className="px-4 py-3 print:px-1 print:py-1 w-48">Bezeichnung</th>
                                <th className="px-2 py-3 text-center w-12 print:px-1 print:py-1" title="B=Bestand, E=Erfolg">Art</th>
                                <th className="px-2 py-3 text-right bg-slate-50 border-l border-slate-200 print:px-1 print:py-1">EB-Wert<br/>{reportStartOfYear}</th>
                                <th className="px-2 py-3 text-right print:px-1 print:py-1">Soll<br/>{reportMonthName}</th>
                                <th className="px-2 py-3 text-right print:px-1 print:py-1">Haben<br/>{reportMonthName}</th>
                                <th className="px-2 py-3 text-right bg-slate-50 border-l border-slate-200 print:px-1 print:py-1">Soll kum.<br/>{reportStartOfYear}-{reportDateFormatted}</th>
                                <th className="px-2 py-3 text-right print:px-1 print:py-1">Haben kum.<br/>{reportStartOfYear}-{reportDateFormatted}</th>
                                <th className="px-4 py-3 text-right font-bold bg-slate-100 border-l border-slate-300 print:px-1 print:py-1">Endsaldo<br/>{reportDateFormatted}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                            {balancesList.map((acc) => {
                                const isBalanceSheet = [AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY].includes(acc.type);
                                return (
                                <tr 
                                    key={acc.id} 
                                    onClick={() => setSelectedAccount(acc)}
                                    className="hover:bg-blue-50 transition-colors cursor-pointer group"
                                    title="Klicken für Einzelbuchungen (Kontenblatt)"
                                >
                                    <td className="px-4 py-2 text-xs font-mono text-slate-500 print:px-1 print:py-1 font-bold group-hover:text-blue-700">{acc.code}</td>
                                    <td className="px-4 py-2 text-xs font-bold text-slate-800 truncate max-w-[200px] print:px-1 print:py-1 print:max-w-none group-hover:text-blue-700">{acc.name}</td>
                                    
                                    <td className="px-2 py-2 text-xs text-center font-mono font-bold print:px-1 print:py-1">
                                        <span className={`px-1.5 py-0.5 rounded ${
                                            isBalanceSheet 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {isBalanceSheet ? 'B' : 'E'}
                                        </span>
                                    </td>

                                    <td className="px-2 py-2 text-xs text-right font-mono text-slate-500 bg-slate-50/50 border-l border-slate-100 print:px-1 print:py-1">
                                        {fmt(acc.openingBalance)}
                                    </td>

                                    <td className="px-2 py-2 text-xs text-right font-mono text-slate-600 print:px-1 print:py-1">
                                        {fmt(acc.debitMonth)}
                                    </td>
                                    <td className="px-2 py-2 text-xs text-right font-mono text-slate-600 print:px-1 print:py-1">
                                        {fmt(acc.creditMonth)}
                                    </td>

                                    <td className="px-2 py-2 text-xs text-right font-mono text-slate-600 bg-slate-50/50 border-l border-slate-100 print:px-1 print:py-1">
                                        {fmt(acc.debitYTD)}
                                    </td>
                                    <td className="px-2 py-2 text-xs text-right font-mono text-slate-600 print:px-1 print:py-1">
                                        {fmt(acc.creditYTD)}
                                    </td>

                                    <td className={`px-4 py-2 text-xs text-right font-mono font-bold border-l border-slate-200 bg-slate-50 print:px-1 print:py-1 ${acc.endingBalance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                        {acc.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                                    </td>
                                </tr>
                                )
                            })}
                            {balancesList.length === 0 && (
                                <tr><td colSpan={9} className="p-8 text-center text-slate-400">Keine Konten gefunden (Prüfen Sie den Filter "Leere Konten").</td></tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:static print:shadow-none print:bg-white print:border-t-2 print:border-black text-xs">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 uppercase tracking-wider print:px-1 print:py-1">Summe</td>
                                <td className="px-2 py-3 text-right font-mono print:px-1 print:py-1">{fmt(totalListStats.openingBalance)}</td>
                                <td className="px-2 py-3 text-right font-mono print:px-1 print:py-1">{fmt(totalListStats.debitMonth)}</td>
                                <td className="px-2 py-3 text-right font-mono print:px-1 print:py-1">{fmt(totalListStats.creditMonth)}</td>
                                <td className="px-2 py-3 text-right font-mono print:px-1 print:py-1">{fmt(totalListStats.debitYTD)}</td>
                                <td className="px-2 py-3 text-right font-mono print:px-1 print:py-1">{fmt(totalListStats.creditYTD)}</td>
                                <td className="px-4 py-3 text-right font-mono text-sm print:px-1 print:py-1">
                                   {totalListStats.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
          </div>
      )}

      {selectedAccount && accountSheetData && (
          <div className="bg-white flex flex-col h-full rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none animate-fadeIn">
              
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print">
                  <button 
                    onClick={() => setSelectedAccount(null)}
                    className="flex items-center text-slate-600 hover:text-blue-600 font-bold text-sm bg-white px-4 py-2 rounded-lg border border-slate-300 shadow-sm"
                  >
                      <ArrowLeft className="w-4 h-4 mr-2"/> Zurück zur Liste
                  </button>
                  <div className="flex gap-2">
                        <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-2 rounded-lg shadow-sm">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span className="text-xs text-slate-500">Stichtag:</span>
                            <span className="text-sm font-bold text-slate-700">{new Date(balanceDate).toLocaleDateString('de-DE')}</span>
                        </div>
                        <button onClick={handlePrint} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 bg-white border border-slate-300 px-3 py-2 rounded-lg shadow-sm">
                            <Printer className="w-4 h-4"/> Drucken
                        </button>
                  </div>
              </div>

              <div className="p-8 pb-4 print:p-0 print:mb-6">
                    <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight flex items-center">
                                Kontenblatt {reportYear}
                            </h1>
                            <div className="text-3xl font-mono mt-2 text-blue-700">
                                {selectedAccount.code} <span className="text-slate-800 font-sans font-bold">{selectedAccount.name}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Endsaldo per {reportDateFormatted}</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {accountSheetData.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                            </p>
                        </div>
                    </div>
              </div>

              <div className="overflow-auto flex-1">
                  <table className="w-full text-left">
                      <thead className="bg-slate-100 text-xs text-slate-500 uppercase font-semibold sticky top-0 z-10 print:static print:bg-white print:border-b-2 print:border-black">
                          <tr>
                              <th className="p-4 w-28">Datum</th>
                              <th className="p-4 w-28">Beleg</th>
                              <th className="p-4">Buchungstext</th>
                              <th className="p-4 w-40">Gegenkonto</th>
                              <th className="p-4 w-32 text-right">Soll</th>
                              <th className="p-4 w-32 text-right">Haben</th>
                              <th className="p-4 w-32 text-right font-bold bg-slate-50 border-l border-slate-200">Saldo</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          <tr className="bg-slate-50/50 font-medium text-slate-600">
                              <td className="p-4 text-xs">01.01.{reportYear}</td>
                              <td className="p-4 text-xs font-mono">EB</td>
                              <td className="p-4 text-xs italic">Saldovortrag (Eröffnungsbilanz)</td>
                              <td className="p-4 text-xs">-</td>
                              <td className="p-4 text-right font-mono text-xs">{accountSheetData.openingBalance > 0 ? fmt(accountSheetData.openingBalance) : '-'}</td>
                              <td className="p-4 text-right font-mono text-xs">{accountSheetData.openingBalance < 0 ? fmt(Math.abs(accountSheetData.openingBalance)) : '-'}</td>
                              <td className="p-4 text-right font-mono text-xs font-bold border-l border-slate-200">{fmt(accountSheetData.openingBalance)}</td>
                          </tr>

                          {accountSheetData.rows.map(row => (
                              <tr key={row.id} className="hover:bg-slate-50">
                                  <td className="p-4 text-sm text-slate-600">{new Date(row.date).toLocaleDateString('de-DE')}</td>
                                  <td className="p-4 text-sm font-mono font-medium">{row.reference}</td>
                                  <td className="p-4 text-sm text-slate-800">{row.description}</td>
                                  <td className="p-4 text-xs text-slate-500">
                                      <span className="font-mono font-bold text-slate-600 mr-1">{row.contraAccountCode}</span>
                                      <span className="truncate max-w-[100px] inline-block align-bottom">{row.contraAccountName}</span>
                                  </td>
                                  <td className="p-4 text-sm text-right font-mono text-slate-600">{fmt(row.debit)}</td>
                                  <td className="p-4 text-sm text-right font-mono text-slate-600">{fmt(row.credit)}</td>
                                  <td className={`p-4 text-sm text-right font-mono font-bold border-l border-slate-200 ${row.balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                      {row.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
};
