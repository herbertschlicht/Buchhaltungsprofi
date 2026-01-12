
import React, { useState, useEffect, useMemo } from 'react';
// Added missing CostCenter and Project imports
import { Account, Contact, ContactType, Transaction, Invoice, AccountType, PurchaseOrder, PurchaseOrderStatus, Asset, CostCenter, Project } from '../types';
import { X, Save, Calculator, FileText, CalendarClock, ArrowDownCircle, ArrowUpCircle, AlertTriangle, ArrowRight, BookOpen, Monitor, Target, Building2, RefreshCw } from 'lucide-react';
import { afaTable } from '../data/afaTable';

interface InvoiceFormProps {
  type: 'outgoing' | 'incoming'; 
  contacts: Contact[];
  accounts: Account[];
  costCenters?: CostCenter[]; 
  projects?: Project[]; 
  transactions?: Transaction[]; 
  purchaseOrders?: PurchaseOrder[]; 
  invoices?: Invoice[];
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
    invoices = [], 
    nextInvoiceNumber, 
    nextAssetNumber, 
    onSave, 
    onSwitchToOrder, 
    onClose 
}) => {
  const isIncoming = type === 'incoming';

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber);
  const [externalNumber, setExternalNumber] = useState(''); 
  
  const [paymentTermDays, setPaymentTermDays] = useState(0); 
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const [contactId, setContactId] = useState('');
  const [description, setDescription] = useState('');
  const [netAmount, setNetAmount] = useState<number>(0);
  const [selectedTaxIndex, setSelectedTaxIndex] = useState(0); 

  // Kontierung
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCostCenter, setSelectedCostCenter] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  // Asset Integration
  const [isAssetAccount, setIsAssetAccount] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetLifeYears, setAssetLifeYears] = useState(3);
  const [assetAfaCategory, setAssetAfaCategory] = useState('');
  const [assetInventoryNumber, setAssetInventoryNumber] = useState(nextAssetNumber || ''); 

  // Steuer-Konfiguration und Berechnungen
  const taxConfig = isIncoming ? INCOMING_TAX_CONFIG[selectedTaxIndex] : OUTGOING_TAX_CONFIG[selectedTaxIndex];
  const taxAmount = Number((netAmount * (taxConfig.rate / 100)).toFixed(2));
  const grossAmount = Number((netAmount + taxAmount).toFixed(2));

  // Filtern der Konten für die Auswahl
  const revenueAccounts = useMemo(() => 
    accounts.filter(a => a.type === AccountType.REVENUE && a.code.startsWith('8')).sort((a,b) => a.code.localeCompare(b.code))
  , [accounts]);

  const expenseAccounts = useMemo(() => 
    accounts.filter(a => a.type === AccountType.EXPENSE).sort((a,b) => a.code.localeCompare(b.code))
  , [accounts]);

  const assetAccounts = useMemo(() => 
    accounts.filter(a => a.type === AccountType.ASSET && a.code.startsWith('0')).sort((a,b) => a.code.localeCompare(b.code))
  , [accounts]);

  // Initiales Setzen des Standard-Erlöskontos bei Ausgangsrechnungen
  useEffect(() => {
    if (!isIncoming && !selectedAccountId && revenueAccounts.length > 0) {
      const defaultRev = revenueAccounts.find(a => a.code === (taxConfig as any).revenueAccount) || revenueAccounts[0];
      setSelectedAccountId(defaultRev.id);
    }
  }, [isIncoming, revenueAccounts, taxConfig]);

  // Nummerierung
  useEffect(() => {
      if (!date) return;
      const year = new Date(date).getFullYear();
      const prefix = isIncoming ? 'ER' : 'RE';
      const relevantInvoices = invoices.filter(inv => inv.number.startsWith(`${prefix}-${year}-`));
      let maxNum = 0;
      if (relevantInvoices.length > 0) {
          relevantInvoices.forEach(inv => {
              const parts = inv.number.split('-');
              const numPart = parseInt(parts[parts.length - 1]);
              if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
          });
      } else {
          maxNum = isIncoming ? 0 : 1000;
      }
      setInvoiceNumber(`${prefix}-${year}-${(maxNum + 1).toString().padStart(3, '0')}`);
  }, [date, isIncoming, invoices]);

  // Fälligkeit
  useEffect(() => {
      if (date) {
          const resultDate = new Date(date);
          resultDate.setDate(resultDate.getDate() + paymentTermDays);
          setDueDate(resultDate.toISOString().split('T')[0]);
      }
  }, [date, paymentTermDays]);

  // Asset-Check
  useEffect(() => {
    const acc = accounts.find(a => a.id === selectedAccountId);
    if (acc && acc.type === AccountType.ASSET && acc.code.startsWith('0')) {
        setIsAssetAccount(true);
        if (!assetName && description) setAssetName(description);
    } else {
        setIsAssetAccount(false);
    }
  }, [selectedAccountId, accounts, description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId || netAmount === 0 || !invoiceNumber || !selectedAccountId) {
        alert("Bitte füllen Sie alle Pflichtfelder aus.");
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
    const klrProps = {
        costCenterId: selectedCostCenter || undefined,
        projectId: selectedProject || undefined
    };

    if (!isIncoming) {
        // --- BUCHUNG AUSGANGSRECHNUNG ---
        const debtorAccount = accounts.find(a => a.code === '1400000'); // Forderungen a.L.L.
        const revAccount = accounts.find(a => a.id === selectedAccountId);
        const taxAccount = taxConfig.taxAccount ? accounts.find(a => a.code === taxConfig.taxAccount) : null;

        if (!debtorAccount || !revAccount) { alert("Sammelkonto Forderungen (1400) oder Erlöskonto fehlt!"); return; }

        // Soll: Forderung (Brutto)
        lines.push({ accountId: debtorAccount.id, debit: grossAmount, credit: 0 });
        // Haben: Erlös (Netto)
        lines.push({ accountId: revAccount.id, debit: 0, credit: netAmount, ...klrProps });
        // Haben: Umsatzsteuer
        if (taxAccount && taxAmount !== 0) {
            lines.push({ accountId: taxAccount.id, debit: 0, credit: taxAmount });
        }
    } else {
        // --- BUCHUNG EINGANGSRECHNUNG ---
        const creditorAccount = accounts.find(a => a.code === '1600000'); // Verbindlichkeiten a.L.L.
        const expAccount = accounts.find(a => a.id === selectedAccountId);
        const taxAccount = taxConfig.taxAccount ? accounts.find(a => a.code === taxConfig.taxAccount) : null;

        if (!creditorAccount || !expAccount) { alert("Sammelkonto Verbindlichkeiten (1600) oder Aufwandskonto fehlt!"); return; }

        // Soll: Aufwand (Netto)
        lines.push({ accountId: expAccount.id, debit: netAmount, credit: 0, ...klrProps });
        // Soll: Vorsteuer
        if (taxAccount && taxAmount !== 0) {
            lines.push({ accountId: taxAccount.id, debit: taxAmount, credit: 0 });
        }
        // Haben: Verbindlichkeit (Brutto)
        lines.push({ accountId: creditorAccount.id, debit: 0, credit: grossAmount });
    }

    const newTransaction: Transaction = {
        id: transactionId,
        invoiceId: invoiceId, 
        date,
        description: `${isIncoming ? 'ER' : 'RE'} #${invoiceNumber}${externalNumber ? ' (' + externalNumber + ')' : ''} - ${description}`,
        contactId,
        lines
    };

    let newAsset: Asset | undefined;
    if (isIncoming && isAssetAccount) {
        newAsset = {
            id: crypto.randomUUID(),
            inventoryNumber: assetInventoryNumber || `INV-${new Date(date).getFullYear()}-AUTO`, 
            name: assetName || description,
            glAccountId: selectedAccountId,
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

  const availableContacts = contacts.filter(c => c.type === (isIncoming ? ContactType.VENDOR : ContactType.CUSTOMER));
  const themeBase = isIncoming ? 'orange' : 'blue';
  // Defined buttonColor to fix the missing name error
  const buttonColor = isIncoming ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className={`p-6 border-b border-slate-100 flex justify-between items-center bg-${themeBase}-50`}>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg text-white bg-${themeBase}-600`}>
                {isIncoming ? <ArrowDownCircle className="w-5 h-5"/> : <ArrowUpCircle className="w-5 h-5"/>}
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">
                    {isIncoming ? 'Eingangsrechnung erfassen' : 'Ausgangsrechnung erstellen'}
                </h2>
                <p className="text-xs text-slate-500">Direkte Verbuchung im Hauptbuch</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isIncoming ? 'Interne Beleg-Nr. (ER)' : 'Rechnungs-Nr.'}</label>
                <div className="relative">
                    <input type="text" required value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className={`w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium font-mono ${isIncoming ? 'bg-slate-50 text-slate-600' : ''}`}/>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 cursor-help" title="Nummer passt sich automatisch dem Jahr an"><RefreshCw className="w-3 h-3" /></div>
                </div>
            </div>
            {isIncoming ? (
                 <div>
                    <label className="block text-sm font-semibold text-orange-700 mb-1">Rechnungs-Nr. (Lieferant)</label>
                    <input type="text" value={externalNumber} onChange={(e) => setExternalNumber(e.target.value)} className="w-full p-2.5 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-medium" placeholder="z.B. RE-987654"/>
                </div>
            ) : (
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Belegdatum</label>
                    <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isIncoming ? 'Lieferant (Kreditor)' : 'Kunde (Debitor)'}</label>
                <select value={contactId} onChange={(e) => setContactId(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" required>
                    <option value="">-- Bitte wählen --</option>
                    {availableContacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Buchungstext</label>
                <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kurze Beschreibung..." className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className={`p-6 rounded-xl border border-${themeBase}-200 bg-${themeBase}-50/50`}>
             <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center"><Calculator className="w-4 h-4 mr-2"/> Beträge & Kontierung</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nettobetrag (€)</label>
                    <input type="number" step="0.01" required value={netAmount || ''} onChange={(e) => setNetAmount(parseFloat(e.target.value))} placeholder="0.00" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono font-bold text-lg"/>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Steuersatz</label>
                    <select value={selectedTaxIndex} onChange={(e) => setSelectedTaxIndex(Number(e.target.value))} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold">
                        {(isIncoming ? INCOMING_TAX_CONFIG : OUTGOING_TAX_CONFIG).map((conf, index) => <option key={index} value={index}>{conf.label}</option>)}
                    </select>
                 </div>
             </div>

             <div className="mb-4">
                 <label className="block text-sm font-medium text-slate-700 mb-1">{isIncoming ? 'Aufwands- / Anlagenkonto (Soll)' : 'Erlöskonto (Haben)'}</label>
                 <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium" required>
                     <option value="">-- Konto wählen --</option>
                     {!isIncoming ? (
                        <optgroup label="Erlöskonten (Klasse 8)">
                            {revenueAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                        </optgroup>
                     ) : (
                        <>
                            <optgroup label="Anlagevermögen (Aktivierung)">
                                {assetAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                            </optgroup>
                            <optgroup label="Aufwand / Kosten">
                                {expenseAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                            </optgroup>
                        </>
                     )}
                 </select>
             </div>

             {/* Buchungsvorschau */}
             <div className="bg-white/70 p-4 rounded-lg border border-slate-200 mt-4 space-y-2 text-xs">
                <p className="font-bold text-slate-500 uppercase text-[10px] mb-2 tracking-wider">Buchungsvorschau</p>
                {!isIncoming ? (
                    <>
                        <div className="flex justify-between border-b border-dotted border-slate-200 pb-1">
                            <span className="text-slate-600 font-bold">Soll: 1400000 (Forderungen)</span>
                            <span className="font-mono text-blue-700">{grossAmount.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted border-slate-200 pb-1">
                            <span className="text-slate-600">Haben: {accounts.find(a=>a.id===selectedAccountId)?.code || 'Erlöskonto'}</span>
                            <span className="font-mono">{netAmount.toFixed(2)} €</span>
                        </div>
                        {taxAmount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-slate-600">Haben: {taxConfig.taxAccount || 'USt-Konto'}</span>
                                <span className="font-mono">{taxAmount.toFixed(2)} €</span>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex justify-between border-b border-dotted border-slate-200 pb-1">
                            <span className="text-slate-600">Soll: {accounts.find(a=>a.id===selectedAccountId)?.code || 'Aufwandskonto'}</span>
                            <span className="font-mono">{netAmount.toFixed(2)} €</span>
                        </div>
                        {taxAmount > 0 && (
                            <div className="flex justify-between border-b border-dotted border-slate-200 pb-1">
                                <span className="text-slate-600">Soll: {taxConfig.taxAccount || 'VSt-Konto'}</span>
                                <span className="font-mono">{taxAmount.toFixed(2)} €</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-slate-600 font-bold">Haben: 1600000 (Verbindlichkeiten)</span>
                            <span className="font-mono text-orange-700">{grossAmount.toFixed(2)} €</span>
                        </div>
                    </>
                )}
                <div className="pt-2 mt-2 border-t border-slate-300 flex justify-between items-center text-sm font-bold">
                    <span>Rechnungsbetrag (Brutto)</span>
                    <span className="text-lg">{grossAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                </div>
             </div>
          </div>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors">Abbrechen</button>
            <button onClick={handleSubmit} className={`flex items-center px-6 py-2 text-white rounded-lg font-bold shadow-md transition-all ${buttonColor}`}>
              <Save className="w-4 h-4 mr-2" />
              {isIncoming ? 'Eingangsrechnung buchen' : 'Rechnung buchen'}
            </button>
        </div>
      </div>
    </div>
  );
};
