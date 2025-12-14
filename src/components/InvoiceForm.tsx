
import React, { useState, useEffect, useMemo } from 'react';
import { Account, Contact, ContactType, Transaction, Invoice, AccountType, PurchaseOrder, PurchaseOrderStatus, Asset, CostCenter, Project } from '../types';
import { X, Save, Calculator, FileText, CalendarClock, ArrowDownCircle, ArrowUpCircle, AlertTriangle, ArrowRight, BookOpen, Monitor, Target, Building2, PieChart } from 'lucide-react';
import { afaTable } from '../data/afaTable';

interface InvoiceFormProps {
  type: 'outgoing' | 'incoming'; 
  contacts: Contact[];
  accounts: Account[];
  costCenters?: CostCenter[]; 
  projects?: Project[]; 
  transactions?: Transaction[]; 
  purchaseOrders?: PurchaseOrder[]; 
  nextInvoiceNumber: string; 
  nextAssetNumber?: string; 
  onSave: (invoice: Invoice, transaction: Transaction, newAsset?: Asset) => void;
  onSwitchToOrder?: (order: PurchaseOrder) => void; 
  onClose: () => void;
}

const OUTGOING_TAX_CONFIG = [
    { rate: 19, label: '19% Umsatzsteuer', revenueAccount: '8400000', taxAccount: '1776000' },
    { rate: 7, label: '7% Umsatzsteuer', revenueAccount: '8300000', taxAccount: '1771000' },
    { rate: 0, label: 'Steuerfrei / Kleinunternehmer', revenueAccount: '8100000', taxAccount: null },
];

const INCOMING_TAX_CONFIG = [
    { rate: 19, label: '19% Vorsteuer', taxAccount: '1576000' },
    { rate: 7, label: '7% Vorsteuer', taxAccount: '1571000' },
    { rate: 0, label: 'Ohne Vorsteuer / 0%', taxAccount: null },
];

const PAYMENT_TERMS = [
    { days: 0, label: 'Sofort ohne Abzug' },
    { days: 7, label: '7 Tage netto' },
    { days: 14, label: '14 Tage netto' },
    { days: 30, label: '30 Tage netto' },
];

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
    type, 
    contacts, 
    accounts, 
    costCenters = [],
    projects = [],
    transactions = [],
    purchaseOrders = [], 
    nextInvoiceNumber, 
    nextAssetNumber, 
    onSave, 
    onSwitchToOrder,
    onClose 
}) => {
  const isIncoming = type === 'incoming';

  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber);
  const [externalNumber, setExternalNumber] = useState(''); 
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTermDays, setPaymentTermDays] = useState(0); 
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const [contactId, setContactId] = useState('');
  const [description, setDescription] = useState('');
  const [netAmount, setNetAmount] = useState<number>(0);
  const [selectedTaxIndex, setSelectedTaxIndex] = useState(0); 

  const [selectedExpenseAccountId, setSelectedExpenseAccountId] = useState('');
  
  // KLR Fields
  const [selectedCostCenter, setSelectedCostCenter] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const [isAssetAccount, setIsAssetAccount] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetLifeYears, setAssetLifeYears] = useState(3);
  const [assetAfaCategory, setAssetAfaCategory] = useState('');
  const [assetInventoryNumber, setAssetInventoryNumber] = useState(nextAssetNumber || ''); 

  const taxConfig = isIncoming ? INCOMING_TAX_CONFIG[selectedTaxIndex] : OUTGOING_TAX_CONFIG[selectedTaxIndex];
  const taxAmount = Number((netAmount * (taxConfig.rate / 100)).toFixed(2));
  const grossAmount = Number((netAmount + taxAmount).toFixed(2));

  const availableContacts = contacts.filter(c => c.type === (isIncoming ? ContactType.VENDOR : ContactType.CUSTOMER));

  const assetAccounts = accounts.filter(a => isIncoming && a.type === AccountType.ASSET && a.code.startsWith('0')).sort((a,b) => a.code.localeCompare(b.code));
  
  const expenseAccounts = accounts.filter(a => 
      isIncoming && a.type === AccountType.EXPENSE && 
      !['1200000','1000000','1400000','1210000'].includes(a.code) 
  ).sort((a,b) => a.code.localeCompare(b.code));

  const openVendorOrders = (isIncoming && contactId && purchaseOrders) 
    ? purchaseOrders.filter(po => 
        po.contactId === contactId && 
        (po.status === PurchaseOrderStatus.ORDERED || po.status === PurchaseOrderStatus.DELIVERED)
      )
    : [];

  // --- BUDGET CHECK LOGIC ---
  const projectBudgetInfo = useMemo(() => {
      if (!selectedProject || !projects) return null;
      const project = projects.find(p => p.id === selectedProject);
      if (!project) return null;

      // Determine the account being booked (Expense for incoming, Revenue for outgoing)
      const targetAccountId = isIncoming ? selectedExpenseAccountId : accounts.find(a => a.code === (taxConfig as any).revenueAccount)?.id;

      // 1. Calculate GLOBAL Project Budget Stats
      const globalUsed = transactions.reduce((sum, t) => {
          return sum + t.lines.filter(l => l.projectId === selectedProject).reduce((lineSum, l) => {
              const acc = accounts.find(a => a.id === l.accountId);
              // Expense reduces budget (Debit positive)
              if (acc?.type === AccountType.EXPENSE || acc?.type === AccountType.ASSET) {
                  return lineSum + (l.debit - l.credit);
              }
              return lineSum;
          }, 0);
      }, 0);

      const globalLimit = project.budget || 0;
      const globalRemaining = globalLimit - globalUsed;
      const globalExceeded = (globalRemaining - (isIncoming ? netAmount : 0)) < 0;

      // 2. Calculate SPECIFIC Account Budget Stats (if defined)
      let accountBudget = null;
      if (targetAccountId && project.budgetPlan) {
          const planItem = project.budgetPlan.find(p => p.accountId === targetAccountId);
          if (planItem) {
              const accountUsed = transactions.reduce((sum, t) => {
                  return sum + t.lines.filter(l => l.projectId === selectedProject && l.accountId === targetAccountId).reduce((lSum, l) => {
                      return lSum + (l.debit - l.credit); // Simple net flow
                  }, 0);
              }, 0);
              
              const remaining = planItem.amount - accountUsed;
              const remainingAfter = remaining - (isIncoming ? netAmount : 0);
              
              accountBudget = {
                  limit: planItem.amount,
                  used: accountUsed,
                  remaining,
                  remainingAfter,
                  isExceeded: remainingAfter < 0
              };
          }
      }

      return {
          global: {
              limit: globalLimit,
              used: globalUsed,
              remaining: globalRemaining,
              isExceeded: globalExceeded
          },
          accountSpecific: accountBudget
      };
  }, [selectedProject, projects, transactions, netAmount, isIncoming, accounts, selectedExpenseAccountId, taxConfig]);


  useEffect(() => {
      if (selectedExpenseAccountId) {
          const acc = accounts.find(a => a.id === selectedExpenseAccountId);
          if (acc && acc.type === AccountType.ASSET && acc.code.startsWith('0')) {
              setIsAssetAccount(true);
              if (!assetName && description) setAssetName(description);
              if (!assetInventoryNumber && nextAssetNumber) setAssetInventoryNumber(nextAssetNumber);
          } else {
              setIsAssetAccount(false);
          }
      }
  }, [selectedExpenseAccountId, accounts, description, assetName, nextAssetNumber, assetInventoryNumber]);

  const handleAfaSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedLabel = e.target.value;
      const entry = afaTable.find(item => item.label === selectedLabel);
      if (entry) {
          setAssetAfaCategory(entry.label);
          setAssetLifeYears(entry.years);
      } else {
          setAssetAfaCategory('Benutzerdefiniert');
      }
  };

  useEffect(() => {
      if (date) {
          const resultDate = new Date(date);
          resultDate.setDate(resultDate.getDate() + paymentTermDays);
          setDueDate(resultDate.toISOString().split('T')[0]);
      }
  }, [date, paymentTermDays]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId || netAmount === 0 || !invoiceNumber) return;
    if (isIncoming && !selectedExpenseAccountId) {
        alert("Bitte wählen Sie ein Aufwandskonto (Sachkonto) aus.");
        return;
    }

    const transactionId = crypto.randomUUID();
    const invoiceId = crypto.randomUUID();

    const newInvoice: Invoice = {
        id: invoiceId,
        number: invoiceNumber, 
        externalNumber: isIncoming ? externalNumber : undefined, 
        date,
        dueDate,
        contactId,
        description,
        netAmount,
        taxRate: taxConfig.rate,
        taxAmount,
        grossAmount,
        transactionId
    };

    const lines = [];

    // KLR Assignment
    const klrProps = {
        costCenterId: selectedCostCenter || undefined,
        projectId: selectedProject || undefined
    };

    if (!isIncoming) {
        const debtorAccount = accounts.find(a => a.code === '1400000'); 
        const revCode = (taxConfig as any).revenueAccount; 
        const revenueAccount = accounts.find(a => a.code === revCode);
        const taxAccount = taxConfig.taxAccount ? accounts.find(a => a.code === taxConfig.taxAccount) : null;

        if (!debtorAccount || !revenueAccount) { alert("Konten fehlen!"); return; }

        lines.push({ accountId: debtorAccount.id, debit: grossAmount, credit: 0 });
        lines.push({ accountId: revenueAccount.id, debit: 0, credit: netAmount, ...klrProps });
        if (taxAccount && taxAmount !== 0) {
            lines.push({ accountId: taxAccount.id, debit: 0, credit: taxAmount });
        }

    } else {
        const creditorAccount = accounts.find(a => a.code === '1600000'); 
        const expenseAccount = accounts.find(a => a.id === selectedExpenseAccountId);
        const taxAccount = taxConfig.taxAccount ? accounts.find(a => a.code === taxConfig.taxAccount) : null;

        if (!creditorAccount || !expenseAccount) { alert("Konten fehlen!"); return; }

        lines.push({ accountId: expenseAccount.id, debit: netAmount, credit: 0, ...klrProps });
        if (taxAccount && taxAmount !== 0) {
            lines.push({ accountId: taxAccount.id, debit: taxAmount, credit: 0 });
        }
        lines.push({ accountId: creditorAccount.id, debit: 0, credit: grossAmount });
    }

    const newTransaction: Transaction = {
        id: transactionId,
        invoiceId: invoiceId, 
        date,
        description: `${isIncoming ? 'Eingangsrechnung' : 'Ausgangsrechnung'} #${invoiceNumber}${externalNumber ? ' (Ext: ' + externalNumber + ')' : ''} - ${description}`,
        contactId,
        lines
    };

    let newAsset: Asset | undefined;
    if (isIncoming && isAssetAccount) {
        newAsset = {
            id: crypto.randomUUID(),
            inventoryNumber: assetInventoryNumber || `INV-${new Date().getFullYear()}-AUTO`, 
            name: assetName || description,
            glAccountId: selectedExpenseAccountId,
            purchaseDate: date,
            documentRef: externalNumber || invoiceNumber,
            cost: netAmount,
            usefulLifeYears: assetLifeYears,
            afaCategory: assetAfaCategory || 'Manuell',
            residualValue: 0,
            status: 'ACTIVE'
        };
    }

    onSave(newInvoice, newTransaction, newAsset);
    onClose();
  };

  const borderColor = isIncoming ? 'border-orange-200' : 'border-blue-200';
  const buttonColor = isIncoming ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${isIncoming ? 'bg-orange-50' : 'bg-blue-50'}`}>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg text-white ${isIncoming ? 'bg-orange-600' : 'bg-blue-600'}`}>
                {isIncoming ? <ArrowDownCircle className="w-5 h-5"/> : <ArrowUpCircle className="w-5 h-5"/>}
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">
                    {isIncoming ? 'Eingangsrechnung erfassen' : 'Ausgangsrechnung erstellen'}
                </h2>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                    {isIncoming ? 'Interne Beleg-Nr. (ER)' : 'Rechnungs-Nr.'}
                </label>
                <input 
                    type="text" 
                    required
                    value={invoiceNumber} 
                    onChange={(e) => setInvoiceNumber(e.target.value)} 
                    className={`w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium font-mono ${isIncoming ? 'bg-slate-50 text-slate-600' : ''}`}
                />
            </div>
            
            {isIncoming ? (
                 <div>
                    <label className="block text-sm font-semibold text-orange-700 mb-1">Rechnungs-Nr. (Lieferant)</label>
                    <input 
                        type="text" 
                        value={externalNumber}
                        onChange={(e) => setExternalNumber(e.target.value)}
                        className="w-full p-2.5 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                        placeholder="z.B. RE-987654"
                        autoFocus
                    />
                </div>
            ) : (
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Belegdatum</label>
                    <input 
                        type="date" 
                        required
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                </div>
            )}
          </div>

          <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {isIncoming ? 'Lieferant (Kreditor)' : 'Kunde (Debitor)'}
              </label>
              <select 
                value={contactId} 
                onChange={(e) => setContactId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                required
              >
                <option value="">-- Bitte wählen --</option>
                {availableContacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
          </div>

          <div className={`p-6 rounded-xl border ${borderColor} ${isIncoming ? 'bg-orange-50/50' : 'bg-blue-50/50'}`}>
             <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center">
                <Calculator className="w-4 h-4 mr-2"/> Buchungsdetails & Controlling
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nettobetrag (€)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        required
                        value={netAmount || ''} 
                        onChange={(e) => setNetAmount(parseFloat(e.target.value))} 
                        placeholder="0.00"
                        className={`w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono font-bold text-lg`}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Steuersatz</label>
                    <select 
                        value={selectedTaxIndex} 
                        onChange={(e) => setSelectedTaxIndex(Number(e.target.value))}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        {isIncoming 
                            ? INCOMING_TAX_CONFIG.map((conf, index) => <option key={index} value={index}>{conf.label}</option>)
                            : OUTGOING_TAX_CONFIG.map((conf, index) => <option key={index} value={index}>{conf.label}</option>)
                        }
                    </select>
                 </div>
             </div>

             {/* KLR / CONTROLLING SECTION WITH BUDGET CHECK */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-white p-3 rounded-lg border border-slate-200">
                 <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase flex items-center">
                         <Building2 className="w-3 h-3 mr-1"/> Kostenstelle
                     </label>
                     <select 
                        value={selectedCostCenter}
                        onChange={(e) => setSelectedCostCenter(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-sm"
                     >
                         <option value="">- Keine -</option>
                         {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.code} {cc.name}</option>)}
                     </select>
                 </div>
                 <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase flex items-center">
                         <Target className="w-3 h-3 mr-1"/> Bauvorhaben (Projekt)
                     </label>
                     <select 
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-sm"
                     >
                         <option value="">- Keines -</option>
                         {projects.map(p => <option key={p.id} value={p.id}>{p.code} {p.name}</option>)}
                     </select>
                 </div>
                 
                 {/* GLOBAL BUDGET ALERT */}
                 {projectBudgetInfo && projectBudgetInfo.global && isIncoming && (
                     <div className={`col-span-2 p-2 rounded text-xs border mb-1 ${projectBudgetInfo.global.isExceeded ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                         <div className="flex justify-between font-bold mb-1">
                             <span>Gesamt-Budget Projekt:</span>
                             <span>{projectBudgetInfo.global.remaining.toLocaleString(undefined, {minimumFractionDigits:2})} € offen</span>
                         </div>
                         {projectBudgetInfo.global.isExceeded && (
                             <div className="flex items-center font-bold">
                                 <AlertTriangle className="w-3 h-3 mr-1"/>
                                 Überschreitung bei dieser Buchung!
                             </div>
                         )}
                     </div>
                 )}

                 {/* SPECIFIC ACCOUNT BUDGET ALERT */}
                 {projectBudgetInfo && projectBudgetInfo.accountSpecific && isIncoming && (
                     <div className={`col-span-2 p-2 rounded text-xs border ${projectBudgetInfo.accountSpecific.isExceeded ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                         <div className="flex justify-between font-bold mb-1">
                             <span>Konten-Budget ({selectedExpenseAccountId ? 'Konto gewählt' : ''}):</span>
                             <span>{projectBudgetInfo.accountSpecific.remaining.toLocaleString(undefined, {minimumFractionDigits:2})} € offen</span>
                         </div>
                         <div className="w-full bg-white/50 h-1.5 rounded-full overflow-hidden">
                             <div 
                                className={`h-full ${projectBudgetInfo.accountSpecific.isExceeded ? 'bg-red-500' : 'bg-blue-500'}`} 
                                style={{width: `${Math.min(100, (projectBudgetInfo.accountSpecific.used / projectBudgetInfo.accountSpecific.limit) * 100)}%`}}
                             ></div>
                         </div>
                         {projectBudgetInfo.accountSpecific.isExceeded && (
                             <div className="flex items-center font-bold mt-1">
                                 <AlertTriangle className="w-3 h-3 mr-1"/>
                                 Achtung! Budget für dieses Konto ausgeschöpft.
                             </div>
                         )}
                     </div>
                 )}
             </div>

             {isIncoming && (
                 <div className="mb-4">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Aufwandskonto / Anlagenkonto (Soll)</label>
                     <select 
                        value={selectedExpenseAccountId}
                        onChange={(e) => setSelectedExpenseAccountId(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                     >
                         <option value="">-- Sachkonto wählen --</option>
                         <optgroup label="Anlagevermögen (Aktivierung)">
                             {assetAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                         </optgroup>
                         <optgroup label="Aufwand / Kosten">
                             {expenseAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                         </optgroup>
                     </select>
                 </div>
             )}

             {isIncoming && isAssetAccount && (
                 <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-6 animate-fadeIn">
                     <div className="flex items-center text-emerald-800 font-bold mb-3 pb-2 border-b border-emerald-200">
                         <Monitor className="w-5 h-5 mr-2"/>
                         Anlagendetails
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="col-span-2">
                             <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Bezeichnung</label>
                             <input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} className="w-full p-2 border border-emerald-300 rounded bg-white"/>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Inventarnummer</label>
                             <input type="text" value={assetInventoryNumber} onChange={(e) => setAssetInventoryNumber(e.target.value)} className="w-full p-2 border border-emerald-300 rounded bg-white font-mono"/>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Nutzungsdauer (Jahre)</label>
                             <input type="number" value={assetLifeYears} onChange={(e) => setAssetLifeYears(parseInt(e.target.value))} className="w-full p-2 border border-emerald-300 rounded bg-white"/>
                         </div>
                     </div>
                 </div>
             )}
          </div>

        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors">Abbrechen</button>
            <button onClick={handleSubmit} className={`flex items-center px-6 py-2 text-white rounded-lg font-medium shadow-md transition-all ${buttonColor}`}>
              <Save className="w-4 h-4 mr-2" />
              {isIncoming ? 'Eingangsrechnung buchen' : 'Ausgangsrechnung buchen'}
            </button>
        </div>
      </div>
    </div>
  );
};
