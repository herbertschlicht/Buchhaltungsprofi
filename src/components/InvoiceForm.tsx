
import React, { useState, useEffect, useMemo } from 'react';
import { Account, Contact, ContactType, Transaction, Invoice, AccountType, PurchaseOrder, PurchaseOrderStatus, Asset, CostCenter, Project } from '../types';
import { X, Save, Calculator, ArrowDownCircle, ArrowUpCircle, RefreshCw, Calendar } from 'lucide-react';

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
    { rate: 19, label: '19% Umsatzsteuer', revenueAccountCode: '8400000', taxAccountCode: '1776000' },
    { rate: 7, label: '7% Umsatzsteuer', revenueAccountCode: '8300000', taxAccountCode: '1771000' },
    { rate: 0, label: 'Steuerfrei / Kleinunternehmer', revenueAccountCode: '8100000', taxAccountCode: null },
];

const INCOMING_TAX_CONFIG = [
    { rate: 19, label: '19% Vorsteuer', taxAccountCode: '1576000' },
    { rate: 7, label: '7% Vorsteuer', taxAccountCode: '1571000' },
    { rate: 0, label: 'Ohne Vorsteuer / 0%', taxAccountCode: null },
];

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
    type, contacts, accounts, costCenters = [], projects = [], invoices = [], nextInvoiceNumber, onSave, onClose 
}) => {
  const isIncoming = type === 'incoming';

  // Formular-Status
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber);
  const [externalNumber, setExternalNumber] = useState(''); 
  const [contactId, setContactId] = useState('');
  const [description, setDescription] = useState('');
  const [netAmount, setNetAmount] = useState<number>(0);
  const [selectedTaxIndex, setSelectedTaxIndex] = useState(0); 

  // Kontierung
  const [selectedRevenueAccountId, setSelectedRevenueAccountId] = useState('');
  const [selectedCostCenter, setSelectedCostCenter] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const taxConfig = isIncoming ? INCOMING_TAX_CONFIG[selectedTaxIndex] : OUTGOING_TAX_CONFIG[selectedTaxIndex];
  const taxAmount = Number((netAmount * (taxConfig.rate / 100)).toFixed(2));
  const grossAmount = Number((netAmount + taxAmount).toFixed(2));

  // --- DYNAMISCHE NUMMERNLOGIK BASIEREND AUF DATUM ---
  useEffect(() => {
    if (!date) return;
    const year = new Date(date).getFullYear();
    const prefix = isIncoming ? 'ER' : 'RE';
    
    // Suche alle existierenden Rechnungen für dieses Präfix und Jahr
    const yearInvoices = (invoices || []).filter(inv => 
        inv.number.startsWith(`${prefix}-${year}-`)
    );

    let maxSeq = 0;
    yearInvoices.forEach(inv => {
        const parts = inv.number.split('-');
        const seq = parseInt(parts[parts.length - 1]);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    });

    // Startwerte definieren (ER bei 1, RE bei 1001 für Demo-Zwecke)
    const baseStart = isIncoming ? 0 : 1000;
    const nextSeq = Math.max(baseStart, maxSeq) + 1;
    
    setInvoiceNumber(`${prefix}-${year}-${nextSeq.toString().padStart(3, '0')}`);
  }, [date, invoices, isIncoming]);

  // Filtern der relevanten Konten (Klasse 8 für Ausgangsrechnungen)
  const revenueAccounts = useMemo(() => 
    accounts.filter(a => a.type === AccountType.REVENUE && a.code.startsWith('8'))
  , [accounts]);

  const expenseAccounts = useMemo(() => 
    accounts.filter(a => a.type === AccountType.EXPENSE || a.code.startsWith('3') || a.code.startsWith('4'))
  , [accounts]);

  // Automatische Kontenvorauswahl
  useEffect(() => {
    if (!isIncoming && !selectedRevenueAccountId && revenueAccounts.length > 0) {
      const def = revenueAccounts.find(a => a.code === (taxConfig as any).revenueAccountCode);
      if (def) setSelectedRevenueAccountId(def.id);
    }
  }, [isIncoming, revenueAccounts, taxConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId || netAmount === 0 || !invoiceNumber || (!isIncoming && !selectedRevenueAccountId)) {
        alert("Bitte füllen Sie alle Pflichtfelder und die Kontierung aus.");
        return;
    }

    const transactionId = crypto.randomUUID();
    const invoiceId = crypto.randomUUID();

    const newInvoice: Invoice = {
        id: invoiceId,
        number: invoiceNumber, 
        externalNumber: isIncoming ? externalNumber : undefined, 
        date,
        dueDate: date, // Vereinfacht: Fälligkeit = Datum
        contactId,
        description,
        netAmount,
        taxRate: taxConfig.rate,
        taxAmount,
        grossAmount,
        transactionId
    };

    const lines = [];
    const klr = { costCenterId: selectedCostCenter || undefined, projectId: selectedProject || undefined };

    if (!isIncoming) {
        const debtorAcc = accounts.find(a => a.code === '1400000');
        const revAcc = accounts.find(a => a.id === selectedRevenueAccountId);
        const taxAcc = taxConfig.taxAccountCode ? accounts.find(a => a.code === taxConfig.taxAccountCode) : null;

        if (!debtorAcc || !revAcc) { alert("Sammelkonto 1400000 oder Erlöskonto fehlt!"); return; }

        lines.push({ accountId: debtorAcc.id, debit: grossAmount, credit: 0 }); 
        lines.push({ accountId: revAcc.id, debit: 0, credit: netAmount, ...klr }); 
        if (taxAcc && taxAmount > 0) {
            lines.push({ accountId: taxAcc.id, debit: 0, credit: taxAmount }); 
        }
    } else {
        const creditorAcc = accounts.find(a => a.code === '1600000'); 
        const expAcc = accounts.find(a => a.id === selectedRevenueAccountId); 
        const taxAcc = taxConfig.taxAccountCode ? accounts.find(a => a.code === taxConfig.taxAccountCode) : null;

        if (!creditorAcc || !expAcc) { alert("Sammelkonto 1600000 oder Aufwandskonto fehlt!"); return; }

        lines.push({ accountId: expAcc.id, debit: netAmount, credit: 0, ...klr }); 
        if (taxAcc && taxAmount > 0) {
            lines.push({ accountId: taxAcc.id, debit: taxAmount, credit: 0 }); 
        }
        lines.push({ accountId: creditorAcc.id, debit: 0, credit: grossAmount }); 
    }

    const newTransaction: Transaction = {
        id: transactionId,
        invoiceId: invoiceId, 
        date,
        description: `${isIncoming ? 'ER' : 'RE'} #${invoiceNumber} - ${description}`,
        contactId,
        lines
    };

    onSave(newInvoice, newTransaction);
    onClose();
  };

  const themeColor = isIncoming ? 'orange' : 'blue';
  const buttonColor = isIncoming ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className={`p-6 border-b flex justify-between items-center ${isIncoming ? 'bg-orange-50' : 'bg-blue-50'}`}>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg text-white ${isIncoming ? 'bg-orange-600' : 'bg-blue-600'}`}>
                {isIncoming ? <ArrowDownCircle className="w-5 h-5"/> : <ArrowUpCircle className="w-5 h-5"/>}
             </div>
             <h2 className="text-xl font-bold text-slate-800">
                {isIncoming ? 'Eingangsrechnung erfassen' : 'Ausgangsrechnung erstellen'}
             </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Belegdatum (bestimmt das Jahr)</label>
                <div className="relative">
                    <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10" />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vorgeschlagene Nr.</label>
                <div className="relative">
                    <input type="text" required value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono bg-slate-50"/>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300" title="Nummer passt sich automatisch dem Jahr an"><RefreshCw className="w-3 h-3" /></div>
                </div>
            </div>
          </div>

          <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isIncoming ? 'Lieferant' : 'Kunde'}</label>
              <select value={contactId} onChange={(e) => setContactId(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white shadow-sm" required>
                <option value="">-- Kontakt wählen --</option>
                {contacts.filter(c => c.type === (isIncoming ? ContactType.VENDOR : ContactType.CUSTOMER)).map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                ))}
              </select>
          </div>

          <div className={`p-6 rounded-xl border border-${themeColor}-100 bg-${themeColor}-50/30`}>
             <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center"><Calculator className="w-4 h-4 mr-2"/> Beträge & Buchung</h3>
             
             <div className="grid grid-cols-2 gap-6 mb-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nettobetrag (€)</label>
                    <input type="number" step="0.01" required value={netAmount || ''} onChange={(e) => setNetAmount(parseFloat(e.target.value))} className="w-full p-2.5 border rounded-lg text-right font-mono font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00"/>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Steuersatz</label>
                    <select value={selectedTaxIndex} onChange={(e) => setSelectedTaxIndex(Number(e.target.value))} className="w-full p-2.5 border rounded-lg bg-white outline-none">
                        {(isIncoming ? INCOMING_TAX_CONFIG : OUTGOING_TAX_CONFIG).map((conf, i) => <option key={i} value={i}>{conf.label}</option>)}
                    </select>
                 </div>
             </div>

             <div className="mb-4">
                 <label className="block text-sm font-medium text-slate-700 mb-1">{isIncoming ? 'Aufwandskonto' : 'Erlöskonto (Klasse 8)'}</label>
                 <select value={selectedRevenueAccountId} onChange={(e) => setSelectedRevenueAccountId(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white outline-none font-medium" required>
                     <option value="">-- Sachkonto wählen --</option>
                     {(isIncoming ? expenseAccounts : revenueAccounts).map(acc => (
                         <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                     ))}
                 </select>
             </div>

             <div className="bg-white/70 p-4 rounded-lg border border-slate-200 text-xs font-mono">
                <p className="font-bold text-slate-400 uppercase text-[10px] mb-2 tracking-widest">Buchungsvorschau</p>
                <div className="flex justify-between border-b border-slate-100 pb-1 mb-1">
                    <span>Soll: {isIncoming ? (accounts.find(a=>a.id===selectedRevenueAccountId)?.code || 'Aufwand') : '1400000 (Forderung)'}</span>
                    <span className="font-bold">{isIncoming ? netAmount.toFixed(2) : grossAmount.toFixed(2)} €</span>
                </div>
                {taxAmount > 0 && (
                    <div className="flex justify-between border-b border-slate-100 pb-1 mb-1">
                        <span>{isIncoming ? 'Soll' : 'Haben'}: {taxConfig.taxAccountCode}</span>
                        <span>{taxAmount.toFixed(2)} €</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span>Haben: {isIncoming ? '1600000 (Verbindl.)' : (accounts.find(a=>a.id===selectedRevenueAccountId)?.code || 'Erlös')}</span>
                    <span className="font-bold">{isIncoming ? grossAmount.toFixed(2) : netAmount.toFixed(2)} €</span>
                </div>
             </div>
          </div>
        </form>

        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-white transition-colors">Abbrechen</button>
            <button onClick={handleSubmit} className={`flex items-center px-6 py-2 text-white rounded-lg font-bold shadow-lg ${buttonColor} transition-all active:scale-95`}>
              <Save className="w-4 h-4 mr-2" /> Rechnung buchen
            </button>
        </div>
      </div>
    </div>
  );
};
