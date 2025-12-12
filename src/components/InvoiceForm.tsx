import React, { useState, useEffect } from 'react';
import { Account, Contact, ContactType, Transaction, Invoice, AccountType, PurchaseOrder, PurchaseOrderStatus, Asset } from '../types';
import { X, Save, Calculator, FileText, CalendarClock, ArrowDownCircle, ArrowUpCircle, AlertTriangle, ArrowRight, BookOpen, Monitor } from 'lucide-react';
import { afaTable } from '../data/afaTable';

interface InvoiceFormProps {
  type: 'outgoing' | 'incoming'; 
  contacts: Contact[];
  accounts: Account[];
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

  let accountMismatchWarning = null;
  if (isIncoming && selectedExpenseAccountId) {
      const selectedAccount = accounts.find(a => a.id === selectedExpenseAccountId);
      if (selectedAccount) {
          const nameLower = selectedAccount.name.toLowerCase();
          const is19Acc = nameLower.includes('19%') || nameLower.includes('19 %');
          const is7Acc = nameLower.includes('7%') || nameLower.includes('7 %');
          
          if (is19Acc && taxConfig.rate !== 19) {
              accountMismatchWarning = `Achtung: Konto "${selectedAccount.name}" erwartet 19%, gewählt sind ${taxConfig.rate}%.`;
          }
          if (is7Acc && taxConfig.rate !== 7) {
              accountMismatchWarning = `Achtung: Konto "${selectedAccount.name}" erwartet 7%, gewählt sind ${taxConfig.rate}%.`;
          }
      }
  }

  useEffect(() => {
      if (!isIncoming && !description && contactId) {
          const contact = availableContacts.find(c => c.id === contactId);
          if (contact) setDescription(`Rechnung ${invoiceNumber} an ${contact.name}`);
      } else if (isIncoming && !description && contactId) {
          const contact = availableContacts.find(c => c.id === contactId);
          if (externalNumber && contact) {
               setDescription(`Eingangsrechnung ${externalNumber} (${contact.name})`);
          }
      }
  }, [invoiceNumber, contactId, isIncoming, externalNumber]);

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

    if (!isIncoming) {
        const debtorAccount = accounts.find(a => a.code === '1400000'); 
        const revCode = (taxConfig as any).revenueAccount; 
        const revenueAccount = accounts.find(a => a.code === revCode);
        const taxAccount = taxConfig.taxAccount ? accounts.find(a => a.code === taxConfig.taxAccount) : null;

        if (!debtorAccount || !revenueAccount) { alert("Konten fehlen!"); return; }

        lines.push({ accountId: debtorAccount.id, debit: grossAmount, credit: 0 });
        lines.push({ accountId: revenueAccount.id, debit: 0, credit: netAmount });
        if (taxAccount && taxAmount !== 0) {
            lines.push({ accountId: taxAccount.id, debit: 0, credit: taxAmount });
        }

    } else {
        const creditorAccount = accounts.find(a => a.code === '1600000'); 
        const expenseAccount = accounts.find(a => a.id === selectedExpenseAccountId);
        const taxAccount = taxConfig.taxAccount ? accounts.find(a => a.code === taxConfig.taxAccount) : null;

        if (!creditorAccount || !expenseAccount) { alert("Konten fehlen!"); return; }

        lines.push({ accountId: expenseAccount.id, debit: netAmount, credit: 0 });
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

  const themeColor = isIncoming ? 'text-orange-600 bg-orange-50' : 'text-blue-600 bg-blue-50';
  const borderColor = isIncoming ? 'border-orange-200' : 'border-blue-200';
  const buttonColor = isIncoming ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${isIncoming ? 'bg-orange-50' : 'bg-blue-50'}`}>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg text-white ${isIncoming ? 'bg-orange-600' : 'bg-blue-600'}`}>
                {isIncoming ? <ArrowDownCircle className="w-5 h-5"/> : <ArrowUpCircle className="w-5 h-5"/>}
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">
                    {isIncoming ? 'Eingangsrechnung erfassen' : 'Ausgangsrechnung erstellen'}
                </h2>
                <p className="text-xs text-slate-500">
                    {isIncoming ? 'Rechnungseingangsbuch (fortlaufende Nummer)' : 'Rechnung an Kunden (Debitor)'}
                </p>
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
                    placeholder={isIncoming ? "z.B. ER-2025-001" : "z.B. RE-2025-001"}
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
            
            {isIncoming && (
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

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                        <CalendarClock className="w-3 h-3 mr-1 text-slate-500"/> Zahlungsziel
                     </label>
                     <select 
                        value={paymentTermDays}
                        onChange={(e) => setPaymentTermDays(Number(e.target.value))}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                     >
                         {PAYMENT_TERMS.map((term, index) => (
                             <option key={index} value={term.days}>{term.label}</option>
                         ))}
                     </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Fälligkeitsdatum</label>
                    <input 
                        type="date" 
                        required
                        value={dueDate} 
                        onChange={(e) => setDueDate(e.target.value)} 
                        className="w-full p-2.5 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" 
                    />
                </div>
             </div>
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

          {openVendorOrders.length > 0 && onSwitchToOrder && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 animate-fadeIn">
                  <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 shrink-0 mt-0.5" />
                      <div>
                          <h4 className="font-bold text-amber-800 text-sm">Hinweis: Es existieren offene Bestellungen</h4>
                          <p className="text-xs text-amber-700 mt-1 mb-2">
                              Für {availableContacts.find(c=>c.id === contactId)?.name} wurden folgende Bestellungen gefunden. 
                              Wollen Sie die Rechnung gegen eine Bestellung buchen, um den Vorgang korrekt abzuschließen?
                          </p>
                          <div className="flex flex-wrap gap-2">
                              {openVendorOrders.map(po => (
                                  <button
                                    key={po.id}
                                    type="button"
                                    onClick={() => onSwitchToOrder(po)}
                                    className="flex items-center bg-white border border-amber-300 text-amber-800 px-3 py-1.5 rounded text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm"
                                  >
                                      Bestell-Nr. {po.orderNumber}
                                      <ArrowRight className="w-3 h-3 ml-2"/>
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Beschreibung</label>
            <input 
                type="text" 
                required
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder={isIncoming ? "z.B. Büromaterial, Telefonkosten..." : "z.B. Beratungsleistung..."}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className={`p-6 rounded-xl border ${borderColor} ${isIncoming ? 'bg-orange-50/50' : 'bg-blue-50/50'}`}>
             <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center">
                <Calculator className="w-4 h-4 mr-2"/> Buchungsdetails
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
                             {assetAccounts.map(acc => (
                                 <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                             ))}
                         </optgroup>

                         <optgroup label="Aufwand / Kosten">
                             {expenseAccounts.map(acc => (
                                 <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                             ))}
                         </optgroup>
                     </select>
                     {accountMismatchWarning && (
                         <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded flex items-center">
                             <AlertTriangle className="w-3 h-3 mr-1"/> {accountMismatchWarning}
                         </div>
                     )}
                 </div>
             )}

             {isIncoming && isAssetAccount && (
                 <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-6 animate-fadeIn">
                     <div className="flex items-center text-emerald-800 font-bold mb-3 pb-2 border-b border-emerald-200">
                         <Monitor className="w-5 h-5 mr-2"/>
                         Anlagendetails & Inventarisierung
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="col-span-2">
                             <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Bezeichnung des Wirtschaftsguts</label>
                             <input 
                                type="text"
                                value={assetName}
                                onChange={(e) => setAssetName(e.target.value)}
                                className="w-full p-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                             />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Inventarnummer (Automatisch)</label>
                             <input 
                                type="text"
                                value={assetInventoryNumber}
                                onChange={(e) => setAssetInventoryNumber(e.target.value)}
                                className="w-full p-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-mono"
                             />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Vorlage (AfA-Tabelle)</label>
                             <select 
                                onChange={handleAfaSelection}
                                className="w-full p-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                defaultValue=""
                             >
                                 <option value="" disabled>-- Bitte wählen --</option>
                                 {afaTable.map((item, idx) => (
                                     <option key={idx} value={item.label}>{item.label} ({item.years} Jahre)</option>
                                 ))}
                                 <option value="custom">Benutzerdefiniert</option>
                             </select>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Nutzungsdauer (Jahre)</label>
                             <input 
                                type="number"
                                min="0"
                                value={assetLifeYears}
                                onChange={(e) => setAssetLifeYears(parseInt(e.target.value))}
                                className="w-full p-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                             />
                         </div>
                     </div>
                     <p className="text-xs text-emerald-600 mt-2 flex items-center">
                         <BookOpen className="w-3 h-3 mr-1"/>
                         Das Anlagegut wird automatisch im Anlageverzeichnis angelegt (AHK: {netAmount.toFixed(2)} €).
                     </p>
                 </div>
             )}

             <div className="space-y-2 pt-4 border-t border-slate-200 text-xs md:text-sm mt-4">
                {!isIncoming ? (
                    <>
                        <div className="flex justify-between text-slate-600">
                            <span>Erlöskonto (Haben):</span>
                            <span className="font-mono">{(taxConfig as any).revenueAccount} - {netAmount.toFixed(2)} €</span>
                        </div>
                        {taxAmount !== 0 && (
                            <div className="flex justify-between text-slate-600">
                                <span>USt-Konto (Haben):</span>
                                <span className="font-mono">{taxConfig.taxAccount} - {taxAmount.toFixed(2)} €</span>
                            </div>
                        )}
                        <div className="flex justify-between text-slate-600">
                            <span>Forderungskonto (Soll):</span>
                            <span className="font-mono">1400000 - {grossAmount.toFixed(2)} €</span>
                        </div>
                    </>
                ) : (
                    <>
                         <div className="flex justify-between text-slate-600">
                            <span>{isAssetAccount ? 'Anlagenkonto (Aktivierung)' : 'Aufwandskonto (Soll)'}:</span>
                            <span className="font-mono">{accounts.find(a=>a.id===selectedExpenseAccountId)?.code || '???'} - {netAmount.toFixed(2)} €</span>
                        </div>
                        {taxAmount !== 0 && (
                            <div className="flex justify-between text-slate-600">
                                <span>Vorsteuer (Soll):</span>
                                <span className="font-mono">{taxConfig.taxAccount} - {taxAmount.toFixed(2)} €</span>
                            </div>
                        )}
                        <div className="flex justify-between text-slate-600">
                            <span>Verbindlichkeiten (Haben):</span>
                            <span className="font-mono">1600000 - {grossAmount.toFixed(2)} €</span>
                        </div>
                    </>
                )}
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-300">
                    <span className="font-bold text-lg text-slate-800">Gesamtbetrag (Brutto)</span>
                    <span className={`font-bold text-2xl ${isIncoming ? 'text-orange-700' : 'text-blue-700'}`}>
                        {grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                    </span>
                </div>
             </div>
          </div>

        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors"
            >
              Abbrechen
            </button>
            <button 
              onClick={handleSubmit}
              className={`flex items-center px-6 py-2 text-white rounded-lg font-medium shadow-md transition-all ${buttonColor}`}
            >
              <Save className="w-4 h-4 mr-2" />
              {isIncoming ? 'Eingangsrechnung buchen' : 'Ausgangsrechnung buchen'}
            </button>
        </div>
      </div>
    </div>
  );
};