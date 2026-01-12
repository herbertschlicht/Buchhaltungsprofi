
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Account, Contact, ContactType, Transaction, Invoice, AccountType, Asset, CostCenter, Project } from '../types';
import { X, Save, Calculator, ArrowDownCircle, ArrowUpCircle, RefreshCw, Calendar, FileUp, Loader2, CheckCircle2, Sparkles, UserPlus, AlertCircle, Building2, Target } from 'lucide-react';
import { extractInvoiceData } from '../services/geminiService';
import { ContactForm } from './ContactForm';

interface InvoiceFormProps {
  type: 'outgoing' | 'incoming'; 
  contacts: Contact[];
  accounts: Account[];
  invoices?: Invoice[];
  costCenters?: CostCenter[];
  projects?: Project[];
  transactions?: Transaction[];
  nextInvoiceNumber: string; 
  onSave: (invoice: Invoice, transaction: Transaction, newAsset?: Asset) => void;
  onAddContact: (contact: Contact) => void; 
  onClose: () => void;
}

const OUTGOING_TAX_CONFIG = [
    { rate: 19, label: '19% USt', revenueAccountCode: '8400000', taxAccountCode: '1776000' },
    { rate: 7, label: '7% USt', revenueAccountCode: '8300000', taxAccountCode: '1771000' },
    { rate: 0, label: 'Steuerfrei', revenueAccountCode: '8100000', taxAccountCode: null },
];

const INCOMING_TAX_CONFIG = [
    { rate: 19, label: '19% VSt', taxAccountCode: '1576000' },
    { rate: 7, label: '7% VSt', taxAccountCode: '1571000' },
    { rate: 0, label: '0% VSt', taxAccountCode: null },
];

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
    type, contacts, accounts, invoices = [], costCenters = [], projects = [], onSave, onAddContact, onClose 
}) => {
  const isIncoming = type === 'incoming';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [externalNumber, setExternalNumber] = useState(''); 
  const [contactId, setContactId] = useState('');
  const [description, setDescription] = useState('');
  const [netAmount, setNetAmount] = useState<number>(0);
  const [selectedTaxIndex, setSelectedTaxIndex] = useState(0); 
  const [selectedAccountId, setSelectedAccountId] = useState('');
  
  // Controlling fields
  const [selectedCostCenter, setSelectedCostCenter] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [aiContactDraft, setAiContactDraft] = useState<Partial<Contact> | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const taxConfig = isIncoming ? INCOMING_TAX_CONFIG[selectedTaxIndex] : OUTGOING_TAX_CONFIG[selectedTaxIndex];
  const taxAmount = Number((netAmount * (taxConfig.rate / 100)).toFixed(2));
  const grossAmount = Number((netAmount + taxAmount).toFixed(2));

  // --- AUTO NUMBERING ---
  useEffect(() => {
    if (!date) return;
    const year = new Date(date).getFullYear();
    const prefix = isIncoming ? 'ER' : 'RE';
    const yearInvoices = (invoices || []).filter(inv => inv.number.startsWith(`${prefix}-${year}-`));
    let maxSeq = 0;
    yearInvoices.forEach(inv => {
        const parts = inv.number.split('-');
        const seq = parseInt(parts[parts.length - 1]);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    });
    const baseStart = isIncoming ? 0 : 1000;
    const nextSeq = Math.max(baseStart, maxSeq) + 1;
    setInvoiceNumber(`${prefix}-${year}-${nextSeq.toString().padStart(3, '0')}`);
  }, [date, invoices, isIncoming]);

  const revenueAccounts = useMemo(() => 
    accounts.filter(a => a.type === AccountType.REVENUE && a.code.startsWith('8'))
  , [accounts]);

  const expenseAccounts = useMemo(() => 
    accounts.filter(a => a.type === AccountType.EXPENSE || a.code.startsWith('3') || a.code.startsWith('4'))
  , [accounts]);

  useEffect(() => {
    if (!isIncoming && !selectedAccountId && revenueAccounts.length > 0) {
      const def = revenueAccounts.find(a => a.code === (taxConfig as any).revenueAccountCode);
      if (def) setSelectedAccountId(def.id);
    }
  }, [isIncoming, revenueAccounts, taxConfig]);

  // --- SMART SCAN ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsScanning(true);
      setScanSuccess(false);
      setAiContactDraft(null);

      const reader = new FileReader();
      reader.onload = async (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          const result = await extractInvoiceData(base64, file.type);
          if (result) {
              if (result.date) setDate(result.date);
              if (result.invoiceNumber) isIncoming ? setExternalNumber(result.invoiceNumber) : setInvoiceNumber(result.invoiceNumber);
              if (result.netAmount) setNetAmount(result.netAmount);
              if (result.description) setDescription(result.description);
              if (result.taxRate !== undefined) {
                  const configs = isIncoming ? INCOMING_TAX_CONFIG : OUTGOING_TAX_CONFIG;
                  const idx = configs.findIndex(c => c.rate === result.taxRate);
                  if (idx !== -1) setSelectedTaxIndex(idx);
              }
              
              if (result.vendorName) {
                  const matched = contacts.find(c => 
                      c.name.toLowerCase().includes(result.vendorName.toLowerCase()) ||
                      result.vendorName.toLowerCase().includes(c.name.toLowerCase())
                  );
                  if (matched) {
                      setContactId(matched.id);
                  } else {
                      setAiContactDraft({
                          name: result.vendorName,
                          street: result.street,
                          zip: result.zip,
                          city: result.city,
                          vatId: result.vatId,
                          type: isIncoming ? ContactType.VENDOR : ContactType.CUSTOMER
                      });
                  }
              }
              setScanSuccess(true);
              setTimeout(() => setScanSuccess(false), 4000);
          }
          setIsScanning(false);
      };
      reader.readAsDataURL(file);
  };

  const handleQuickAddContact = () => {
      if (!aiContactDraft) return;
      setShowContactModal(true);
  };

  const onQuickContactSaved = (newContact: Contact) => {
      setShowContactModal(false);
      setAiContactDraft(null);
      onAddContact(newContact);
      setContactId(newContact.id);
  };

  const getNextContactId = () => {
      const prefix = isIncoming ? 'K' : 'D';
      const startNum = isIncoming ? 70000 : 10000;
      const relevantContacts = contacts.filter(c => c.type === (isIncoming ? ContactType.VENDOR : ContactType.CUSTOMER));
      const ids = relevantContacts.map(c => parseInt(c.id.replace(prefix, ''))).filter(n => !isNaN(n));
      const max = ids.length > 0 ? Math.max(...ids) : startNum - 1;
      return prefix + (max + 1).toString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId || netAmount === 0 || !selectedAccountId) {
        alert("Pflichtfelder fehlen (Kontakt, Betrag oder Konto)."); return;
    }
    const transactionId = crypto.randomUUID();
    const invoiceId = crypto.randomUUID();
    const newInvoice: Invoice = {
        id: invoiceId, number: invoiceNumber, externalNumber: isIncoming ? externalNumber : undefined, 
        date, dueDate: date, contactId, description, netAmount, taxRate: taxConfig.rate, taxAmount, grossAmount, transactionId
    };

    const klr = {
        costCenterId: selectedCostCenter || undefined,
        projectId: selectedProject || undefined
    };

    const lines = [];
    if (!isIncoming) {
        const debtorAcc = accounts.find(a => a.code === '1400000');
        const revAcc = accounts.find(a => a.id === selectedAccountId);
        const taxAcc = taxConfig.taxAccountCode ? accounts.find(a => a.code === taxConfig.taxAccountCode) : null;
        if (debtorAcc && revAcc) {
            lines.push({ accountId: debtorAcc.id, debit: grossAmount, credit: 0 }); 
            lines.push({ accountId: revAcc.id, debit: 0, credit: netAmount, ...klr }); 
            if (taxAcc) lines.push({ accountId: taxAcc.id, debit: 0, credit: taxAmount }); 
        }
    } else {
        const creditorAcc = accounts.find(a => a.code === '1600000'); 
        const expAcc = accounts.find(a => a.id === selectedAccountId); 
        const taxAcc = taxConfig.taxAccountCode ? accounts.find(a => a.code === taxConfig.taxAccountCode) : null;
        if (creditorAcc && expAcc) {
            lines.push({ accountId: expAcc.id, debit: netAmount, credit: 0, ...klr }); 
            if (taxAcc) lines.push({ accountId: taxAcc.id, debit: taxAmount, credit: 0 }); 
            lines.push({ accountId: creditorAcc.id, debit: 0, credit: grossAmount }); 
        }
    }
    onSave(newInvoice, { id: transactionId, invoiceId, date, description, contactId, lines });
    onClose();
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className={`p-6 border-b flex justify-between items-center ${isIncoming ? 'bg-orange-50' : 'bg-blue-50'}`}>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg text-white ${isIncoming ? 'bg-orange-600' : 'bg-blue-600'}`}>
                {isIncoming ? <ArrowDownCircle className="w-5 h-5"/> : <ArrowUpCircle className="w-5 h-5"/>}
             </div>
             <h2 className="text-xl font-bold text-slate-800">{isIncoming ? 'Eingangsbeleg' : 'Ausgangsbeleg'}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
        </div>

        <form id="invoice-form" onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-6">
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group
                ${isScanning ? 'bg-indigo-50 border-indigo-400' : scanSuccess ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white'}
            `}
          >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
              
              {isScanning ? (
                  <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-2" />
                      <p className="text-sm font-bold text-indigo-600">KI scannt Dokument...</p>
                  </div>
              ) : scanSuccess ? (
                  <div className="flex flex-col items-center">
                      <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                      <p className="text-sm font-bold text-green-600">Erfolgreich ausgelesen!</p>
                  </div>
              ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <FileUp className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-slate-600">Smart Scan (AI)</p>
                        <p className="text-xs text-slate-400">PDF oder Foto hier hochladen</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase">
                        <Sparkles className="w-3 h-3" /> Gemini Vision Power
                    </div>
                  </>
              )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Datum</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none" />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isIncoming ? 'Fremd-Nr.' : 'Beleg-Nr.'}</label>
                <input type="text" value={isIncoming ? externalNumber : invoiceNumber} onChange={(e) => isIncoming ? setExternalNumber(e.target.value) : setInvoiceNumber(e.target.value)} className="w-full p-2.5 border rounded-lg font-mono font-bold" />
            </div>
          </div>

          <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isIncoming ? 'Lieferant' : 'Kunde'}</label>
              <select value={contactId} onChange={(e) => { setContactId(e.target.value); setAiContactDraft(null); }} className="w-full p-2.5 border rounded-lg bg-white outline-none" required>
                <option value="">-- Kontakt wählen --</option>
                {contacts.filter(c => c.type === (isIncoming ? ContactType.VENDOR : ContactType.CUSTOMER)).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {aiContactDraft && (
                  <div className="mt-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-indigo-600" />
                          <div className="text-xs">
                              <p className="font-bold text-indigo-900">Unbekannter Name erkannt:</p>
                              <p className="text-indigo-700">"{aiContactDraft.name}"</p>
                          </div>
                      </div>
                      <button 
                        type="button"
                        onClick={handleQuickAddContact}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
                      >
                          <UserPlus className="w-3 h-3" /> Kontakt anlegen
                      </button>
                  </div>
              )}
          </div>

          <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Beschreibung</label>
                <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none" />
          </div>

          {/* CONTROLLING SECTION (NEW) */}
          {(costCenters.length > 0 || projects.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  {costCenters.length > 0 && (
                      <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center">
                              <Building2 className="w-3 h-3 mr-1" /> Kostenstelle
                          </label>
                          <select 
                            value={selectedCostCenter} 
                            onChange={e => setSelectedCostCenter(e.target.value)}
                            className="w-full p-2 border rounded-lg text-xs bg-white outline-none"
                          >
                              <option value="">- Ohne KSt -</option>
                              {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.code} {cc.name}</option>)}
                          </select>
                      </div>
                  )}
                  {projects.length > 0 && (
                      <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center">
                              <Target className="w-3 h-3 mr-1" /> Projekt / Bauvorhaben
                          </label>
                          <select 
                            value={selectedProject} 
                            onChange={e => setSelectedProject(e.target.value)}
                            className="w-full p-2 border rounded-lg text-xs bg-white outline-none"
                          >
                              <option value="">- Ohne Projekt -</option>
                              {projects.map(p => <option key={p.id} value={p.id}>{p.code} {p.name}</option>)}
                          </select>
                      </div>
                  )}
              </div>
          )}

          <div className={`p-6 rounded-xl border ${isIncoming ? 'bg-orange-50/30' : 'bg-blue-50/30'}`}>
             <div className="grid grid-cols-2 gap-6 mb-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Netto (€)</label>
                    <input type="number" step="0.01" required value={netAmount || ''} onChange={(e) => setNetAmount(parseFloat(e.target.value))} className="w-full p-2.5 border rounded-lg text-right font-mono font-bold text-lg" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Steuer</label>
                    <select value={selectedTaxIndex} onChange={(e) => setSelectedTaxIndex(Number(e.target.value))} className="w-full p-2.5 border rounded-lg bg-white">
                        {(isIncoming ? INCOMING_TAX_CONFIG : OUTGOING_TAX_CONFIG).map((conf, i) => <option key={i} value={i}>{conf.label}</option>)}
                    </select>
                 </div>
             </div>

             <div className="mb-4">
                 <label className="block text-sm font-medium text-slate-700 mb-1">{isIncoming ? 'Aufwandskonto' : 'Erlöskonto'}</label>
                 <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white font-medium" required>
                     <option value="">-- Sachkonto wählen --</option>
                     {(isIncoming ? expenseAccounts : revenueAccounts).map(acc => (
                         <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                     ))}
                 </select>
             </div>

             <div className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between font-bold">
                <span className="text-slate-500">Gesamt (Brutto):</span>
                <span>{grossAmount.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</span>
             </div>
          </div>
        </form>

        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Abbrechen</button>
            <button type="submit" form="invoice-form" className={`px-6 py-2 text-white rounded-lg font-bold shadow-lg ${isIncoming ? 'bg-orange-600' : 'bg-blue-600'}`}>
              Speichern
            </button>
        </div>
      </div>
    </div>

    {showContactModal && aiContactDraft && (
        <ContactForm 
            type={isIncoming ? ContactType.VENDOR : ContactType.CUSTOMER}
            nextId={getNextContactId()}
            initialData={aiContactDraft}
            onSave={onQuickContactSaved}
            onClose={() => setShowContactModal(false)}
        />
    )}
    </>
  );
};
