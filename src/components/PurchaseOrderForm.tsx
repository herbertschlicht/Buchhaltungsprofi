import React, { useState, useEffect } from 'react';
import { PurchaseOrder, PurchaseOrderStatus, Contact, Account, Transaction, Invoice } from '../types';
import { X, ArrowRight, FileText, CheckCircle, AlertTriangle, Truck, ShoppingCart, Save } from 'lucide-react';

interface PurchaseOrderFormProps {
  order?: PurchaseOrder; 
  contactId?: string; 
  contacts: Contact[];
  accounts: Account[]; 
  nextOrderNumber: string;
  onSave: (order: PurchaseOrder, transaction?: Transaction, invoice?: Invoice) => void;
  onClose: () => void;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ 
    order, 
    contactId: initialContactId, 
    contacts, 
    accounts,
    nextOrderNumber, 
    onSave, 
    onClose 
}) => {
  const [step, setStep] = useState(0); 
  
  const [selectedContactId, setSelectedContactId] = useState(order?.contactId || initialContactId || '');
  const [orderNumber, setOrderNumber] = useState(order?.orderNumber || nextOrderNumber);
  const [offerNumber, setOfferNumber] = useState(order?.offerNumber || '');
  const [date, setDate] = useState(order?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(order?.description || '');
  const [netAmount, setNetAmount] = useState<number>(order?.netAmount || 0);
  const [status, setStatus] = useState<PurchaseOrderStatus>(order?.status || PurchaseOrderStatus.OFFER);
  const [notes, setNotes] = useState(order?.notes || '');

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
  // Default to Wareneingang 19% in SKR 03 -> 3400000
  const [selectedExpenseAccount, setSelectedExpenseAccount] = useState('3400000'); 

  const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE' || a.id.startsWith('0') || a.id.startsWith('3'));

  useEffect(() => {
      if (order && !invoiceAmount) {
          setInvoiceAmount(order.netAmount); 
      }
  }, [order]);

  const handleSave = () => {
      if (!selectedContactId || !description) return;

      const updatedOrder: PurchaseOrder = {
          id: order?.id || crypto.randomUUID(),
          contactId: selectedContactId,
          orderNumber,
          offerNumber,
          date,
          description,
          netAmount,
          status,
          notes
      };

      onSave(updatedOrder);
      onClose();
  };

  const handleBookInvoice = () => {
      const updatedOrder: PurchaseOrder = {
        id: order?.id || crypto.randomUUID(),
        contactId: selectedContactId,
        orderNumber,
        offerNumber,
        date,
        description,
        netAmount, 
        status: PurchaseOrderStatus.COMPLETED,
        notes
      };

      const expenseAcc = accounts.find(a => a.id === selectedExpenseAccount);
      let taxRate = 0;
      if (expenseAcc?.name.includes('19%')) taxRate = 19;
      if (expenseAcc?.name.includes('7%')) taxRate = 7;
      
      const taxVal = invoiceAmount * (taxRate / 100);
      const grossVal = invoiceAmount + taxVal;

      const transactionId = crypto.randomUUID();
      const invoiceId = crypto.randomUUID();

      const newTransaction: Transaction = {
          id: transactionId,
          date: invoiceDate,
          invoiceId: invoiceId,
          description: `ER: ${invoiceNumber} (${description})`,
          contactId: selectedContactId,
          lines: [
              { accountId: selectedExpenseAccount, debit: invoiceAmount, credit: 0 },
              { accountId: '1600000', debit: 0, credit: grossVal } 
          ]
      };
      
      if (taxRate > 0) {
          // SKR 03 Vorsteuer: 1576 (19%), 1571 (7%)
          const taxAccCode = taxRate === 19 ? '1576000' : '1571000';
          const taxAcc = accounts.find(a => a.code === taxAccCode);
          if (taxAcc) {
              newTransaction.lines.push({ accountId: taxAcc.id, debit: taxVal, credit: 0 });
          }
      }

      const newInvoice: Invoice = {
          id: invoiceId,
          number: invoiceNumber,
          contactId: selectedContactId,
          date: invoiceDate,
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], 
          description: description,
          netAmount: invoiceAmount,
          taxRate: taxRate,
          taxAmount: taxVal,
          grossAmount: grossVal,
          transactionId: transactionId
      };

      onSave(updatedOrder, newTransaction, newInvoice);
      onClose();
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const diffAmount = invoiceAmount - netAmount;
  const isDiffSignificant = Math.abs(diffAmount) > 0.01;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-orange-600"/>
                {step === 2 ? 'Rechnungsprüfung & Buchung' : 'Bestellvorgang verwalten'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
                {step === 0 && 'Schritt 1: Angebot erfassen'}
                {step === 1 && 'Schritt 2: Status & Bestellung'}
                {step === 2 && 'Schritt 3: Abgleich mit Rechnung'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            
            {step === 0 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Lieferant</label>
                            <select 
                                value={selectedContactId} 
                                onChange={(e) => setSelectedContactId(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                disabled={!!order} 
                            >
                                <option value="">-- Lieferant wählen --</option>
                                {contacts.filter(c => c.type === 'VENDOR').map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Interne Bestellnummer</label>
                             <input 
                                type="text" 
                                value={orderNumber} 
                                onChange={(e) => setOrderNumber(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono bg-slate-50"
                             />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Was wird beschafft? (Kurztext)</label>
                             <input 
                                type="text" 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="z.B. 5x Bürostuhl Modell 'Ergo'"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                             />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
                             <input 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                             />
                        </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-orange-900 mb-1">Angebotssumme (Netto)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={netAmount || ''} 
                                        onChange={(e) => setNetAmount(parseFloat(e.target.value))}
                                        className="w-full p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-right font-bold text-lg"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">€</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-orange-900 mb-1">Angebots-Nr. (Lieferant)</label>
                                <input 
                                    type="text" 
                                    value={offerNumber} 
                                    onChange={(e) => setOfferNumber(e.target.value)}
                                    className="w-full p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="z.B. AG-2023-999"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Interne Notizen</label>
                        <textarea 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none h-20 text-sm"
                            placeholder="Genehmigt von XY am..."
                        />
                    </div>
                </div>
            )}

            {step === 1 && (
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800">Status aktualisieren</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <button 
                            onClick={() => setStatus(PurchaseOrderStatus.OFFER)}
                            className={`p-4 rounded-lg border flex items-center justify-between transition-all ${status === PurchaseOrderStatus.OFFER ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center">
                                <FileText className={`w-5 h-5 mr-3 ${status === PurchaseOrderStatus.OFFER ? 'text-blue-600' : 'text-slate-400'}`}/>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800">Angebot liegt vor</p>
                                    <p className="text-xs text-slate-500">Wir prüfen das Angebot noch.</p>
                                </div>
                            </div>
                            {status === PurchaseOrderStatus.OFFER && <CheckCircle className="w-5 h-5 text-blue-600"/>}
                        </button>

                        <button 
                            onClick={() => setStatus(PurchaseOrderStatus.ORDERED)}
                            className={`p-4 rounded-lg border flex items-center justify-between transition-all ${status === PurchaseOrderStatus.ORDERED ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center">
                                <ShoppingCart className={`w-5 h-5 mr-3 ${status === PurchaseOrderStatus.ORDERED ? 'text-orange-600' : 'text-slate-400'}`}/>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800">Bestellung ausgelöst</p>
                                    <p className="text-xs text-slate-500">Bestellung wurde an Lieferant gesendet.</p>
                                </div>
                            </div>
                            {status === PurchaseOrderStatus.ORDERED && <CheckCircle className="w-5 h-5 text-orange-600"/>}
                        </button>

                        <button 
                            onClick={() => setStatus(PurchaseOrderStatus.DELIVERED)}
                            className={`p-4 rounded-lg border flex items-center justify-between transition-all ${status === PurchaseOrderStatus.DELIVERED ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center">
                                <Truck className={`w-5 h-5 mr-3 ${status === PurchaseOrderStatus.DELIVERED ? 'text-purple-600' : 'text-slate-400'}`}/>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800">Ware / Leistung erhalten</p>
                                    <p className="text-xs text-slate-500">Lieferung ist erfolgt, warten auf Rechnung.</p>
                                </div>
                            </div>
                            {status === PurchaseOrderStatus.DELIVERED && <CheckCircle className="w-5 h-5 text-purple-600"/>}
                        </button>
                    </div>

                    <div className="bg-slate-100 p-4 rounded-lg text-sm text-slate-600 mt-4">
                        <strong>Hinweis:</strong> Wenn die Rechnung vorliegt, nutzen Sie bitte den Button "Zur Rechnungsprüfung" unten, um den Vorgang abzuschließen und zu buchen.
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col h-full">
                    <div className="grid grid-cols-2 gap-8 h-full">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="font-bold text-slate-500 text-xs uppercase mb-4 pb-2 border-b border-slate-200">Bestelldaten (Referenz)</h4>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <span className="text-slate-400 block text-xs">Artikel / Leistung</span>
                                    <span className="font-bold text-slate-800">{description}</span>
                                </div>
                                <div className="grid grid-cols-2">
                                    <div>
                                        <span className="text-slate-400 block text-xs">Bestell-Nr.</span>
                                        <span className="font-mono">{orderNumber}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-xs">Angebot</span>
                                        <span className="font-mono">{offerNumber || '-'}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-xs">Erwarteter Preis (Netto)</span>
                                    <span className="font-bold text-lg text-slate-700">{netAmount.toFixed(2)} €</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm relative">
                             <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">BUCHUNGSDATEN</div>
                             <h4 className="font-bold text-blue-600 text-xs uppercase mb-4 pb-2 border-b border-blue-100">Rechnungsdaten (Eingabe)</h4>
                             
                             <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Rechnungs-Nr.</label>
                                        <input 
                                            type="text" 
                                            autoFocus
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            className="w-full p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Belegdatum</label>
                                        <input 
                                            type="date" 
                                            value={invoiceDate}
                                            onChange={(e) => setInvoiceDate(e.target.value)}
                                            className="w-full p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Rechnungsbetrag (Netto)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={invoiceAmount || ''}
                                        onChange={(e) => setInvoiceAmount(parseFloat(e.target.value))}
                                        className={`w-full p-2 border rounded focus:ring-1 outline-none text-right font-bold text-lg ${isDiffSignificant ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700'}`}
                                    />
                                </div>

                                {isDiffSignificant && (
                                    <div className="flex items-start text-xs text-red-600 bg-red-100 p-2 rounded">
                                        <AlertTriangle className="w-4 h-4 mr-2 shrink-0"/>
                                        <span>Abweichung zur Bestellung: {(diffAmount > 0 ? '+' : '')}{diffAmount.toFixed(2)} €</span>
                                    </div>
                                )}

                                <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Aufwandskonto</label>
                                     <select
                                        value={selectedExpenseAccount}
                                        onChange={(e) => setSelectedExpenseAccount(e.target.value)}
                                        className="w-full p-1.5 border border-slate-300 rounded text-sm outline-none"
                                     >
                                         {expenseAccounts.map(a => (
                                             <option key={a.id} value={a.id}>{a.code} {a.name}</option>
                                         ))}
                                     </select>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <div className="flex gap-2">
                 {step > 0 && (
                     <button onClick={prevStep} className="text-sm text-slate-500 hover:text-slate-800 px-3 py-1">Zurück</button>
                 )}
            </div>
            
            <div className="flex gap-3">
                {step < 2 ? (
                    <>
                        <button onClick={handleSave} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium">
                            <Save className="w-4 h-4 inline-block mr-2"/>
                            Als Entwurf speichern
                        </button>
                        {step === 1 ? (
                            <button onClick={nextStep} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center">
                                Zur Rechnungsprüfung <ArrowRight className="w-4 h-4 ml-2"/>
                            </button>
                        ) : (
                            <button onClick={nextStep} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium flex items-center">
                                Weiter <ArrowRight className="w-4 h-4 ml-2"/>
                            </button>
                        )}
                    </>
                ) : (
                    <button 
                        onClick={handleBookInvoice}
                        disabled={!invoiceNumber || !invoiceAmount}
                        className={`px-6 py-2 rounded-lg text-white font-bold shadow-md transition-transform active:scale-95 flex items-center ${isDiffSignificant ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {isDiffSignificant ? 'Trotz Abweichung buchen' : 'Prüfung OK & Buchen'}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};