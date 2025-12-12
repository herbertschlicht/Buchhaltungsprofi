import React, { useState } from 'react';
import { Transaction, Account, Contact, Invoice, ContactType, CompanySettings } from '../types';
import { getInvoicePaymentStatus } from '../utils/accounting';
import { ArrowLeftRight, CheckCircle, AlertCircle, CreditCard, Download, Printer, Banknote } from 'lucide-react';

interface PaymentsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  contacts: Contact[];
  invoices: Invoice[];
  companySettings: CompanySettings;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ 
    transactions, 
    contacts, 
    invoices, 
    companySettings 
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // --- 1. GATHER PAYMENT PROPOSALS (Logic) ---
  // We want OUTGOING payments. This includes:
  // A) Vendors (Kreditoren) with OPEN Invoices (Positive Amounts)
  // B) Debtors (Debitoren) with CREDIT NOTES (Negative Amounts) -> Refunds
  
  const paymentProposals = invoices.map(inv => {
      const stats = getInvoicePaymentStatus(inv, transactions);
      const contact = contacts.find(c => c.id === inv.contactId);
      
      // Basic Filter: Must not be fully paid
      if (stats.status === 'PAID') return null;

      // Determine if it requires a Payment (Cash Out)
      let isPayable = false;
      let reason = "";
      let amountToPay = 0;

      if (contact?.type === ContactType.VENDOR) {
          // Standard Case: We owe vendor money
          if (inv.grossAmount > 0 && stats.remainingAmount > 0) {
              isPayable = true;
              reason = "Lieferantenrechnung";
              amountToPay = stats.remainingAmount;
          }
          // Edge Case: We overpaid (Gross < 0)? No, that's a credit note FROM vendor, usually offset, but if paid out:
          if (inv.grossAmount < 0) {
              // This implies the vendor owes US money. Not a payment proposal unless we are sending money? No.
              // Wait, user asked for "Rückzahlung einer Doppelzahlung eines Kreditors".
              // If a creditor paid US back, that is incoming. 
              // If WE paid a creditor twice, we have a claim. 
              // The list is "Zahlungsvorschlag" (What we pay).
              // So we stick to: We pay Vendors for invoices.
          }
      } else if (contact?.type === ContactType.CUSTOMER) {
          // Standard Case: Customer owes us (Asset). Not a payment proposal.
          
          // Refund Case: Credit Note (Gutschrift) -> Gross Amount is Negative
          if (inv.grossAmount < 0) {
              // Remaining amount logic for negative numbers:
              // Gross: -100. Paid: 0. Remaining: -100.
              // If partial refund made: Paid (Debit) 20. Remaining -80.
              if (stats.remainingAmount < 0) {
                  isPayable = true;
                  reason = "Gutschrift / Erstattung";
                  amountToPay = Math.abs(stats.remainingAmount); // We pay positive amount
              }
          }
      }

      if (!isPayable) return null;

      return {
          invoice: inv,
          contact: contact,
          amountToPay,
          reason,
          stats
      };
  }).filter(item => item !== null).sort((a,b) => a!.invoice.dueDate.localeCompare(b!.invoice.dueDate));

  // --- ACTIONS ---

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedItems);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedItems(newSet);
  };

  const toggleAll = () => {
      if (selectedItems.size === paymentProposals.length) {
          setSelectedItems(new Set());
      } else {
          setSelectedItems(new Set(paymentProposals.map(p => p!.invoice.id)));
      }
  };

  const totalSelectedAmount = paymentProposals
      .filter(p => selectedItems.has(p!.invoice.id))
      .reduce((sum, p) => sum + p!.amountToPay, 0);

  const handlePrint = () => {
      window.print();
  };

  const handleExportSEPA = () => {
      alert("SEPA-XML-Export Funktion wird in Kürze verfügbar sein.\nSumme der Datei: " + totalSelectedAmount.toFixed(2) + " €");
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <ArrowLeftRight className="w-6 h-6 mr-3 text-emerald-600" />
                    Zahlungsverkehr
                </h2>
                <p className="text-slate-500">Zahlungsvorschläge für Überweisungen (Lieferanten & Rückerstattungen).</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <div>
                    <div className="text-xs text-emerald-800 font-bold uppercase">Zahllast ausgewählt</div>
                    <div className="text-xl font-bold text-emerald-700">{totalSelectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</div>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 no-print">
                <h3 className="font-bold text-slate-700">Offene Posten (Zahlungsausgang)</h3>
                <div className="flex gap-2">
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 shadow-sm text-sm">
                        <Printer className="w-4 h-4"/> Drucken
                    </button>
                    <button 
                        onClick={handleExportSEPA}
                        disabled={selectedItems.size === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-sm text-sm transition-all ${selectedItems.size > 0 ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'}`}
                    >
                        <Download className="w-4 h-4"/> SEPA-Datei erstellen
                    </button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block p-8 pb-0">
                <div className="border-b-2 border-slate-800 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Zahlungsvorschlagsliste</h1>
                    <p className="text-slate-600 mt-2">Ausgangszahlungen per {new Date().toLocaleDateString('de-DE')}</p>
                </div>
            </div>

            <div className="overflow-auto flex-1">
                <table className="w-full text-left">
                    <thead className="bg-slate-100 text-xs text-slate-500 uppercase font-semibold sticky top-0 z-10 print:static print:bg-white print:border-b-2 print:border-black">
                        <tr>
                            <th className="p-4 w-12 text-center no-print">
                                <input type="checkbox" checked={selectedItems.size > 0 && selectedItems.size === paymentProposals.length} onChange={toggleAll} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"/>
                            </th>
                            <th className="p-4 w-12 text-center" title="Zahlfähig?">IBAN</th>
                            <th className="p-4">Empfänger / Kontakt</th>
                            <th className="p-4">Verwendungszweck</th>
                            <th className="p-4">Grund</th>
                            <th className="p-4 w-32">Fällig am</th>
                            <th className="p-4 text-right">Zahlbetrag</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                        {paymentProposals.map((item) => {
                            if (!item) return null;
                            const { invoice, contact, amountToPay, reason } = item;
                            const hasIban = contact?.iban && contact.iban.length > 5;
                            const isSelected = selectedItems.has(invoice.id);

                            return (
                                <tr key={invoice.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-emerald-50/30' : ''}`}>
                                    <td className="p-4 text-center no-print">
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected} 
                                            onChange={() => toggleSelection(invoice.id)} 
                                            disabled={!hasIban}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-30"
                                        />
                                    </td>
                                    <td className="p-4 text-center">
                                        {hasIban 
                                            ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                                            : <div className="group relative inline-block">
                                                <AlertCircle className="w-5 h-5 text-red-500 mx-auto cursor-help" />
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Keine IBAN hinterlegt</span>
                                              </div>
                                        }
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{contact?.name}</div>
                                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                                            {hasIban ? contact?.iban : 'Bitte Stammdaten pflegen!'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        Rechnung {invoice.externalNumber || invoice.number}
                                        {invoice.externalNumber && <span className="block text-xs text-slate-400">Intern: {invoice.number}</span>}
                                    </td>
                                    <td className="p-4 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            contact?.type === ContactType.CUSTOMER 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {reason}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-emerald-700 text-base">
                                        {amountToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                                    </td>
                                </tr>
                            );
                        })}
                        {paymentProposals.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                                    <CheckCircle className="w-12 h-12 mb-4 text-slate-200" />
                                    <p>Keine offenen Zahlungen fällig.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800 sticky bottom-0 z-10 print:static print:bg-white print:border-t-2 print:border-black text-sm">
                        <tr>
                            <td colSpan={6} className="px-4 py-3 uppercase tracking-wider text-right">Gesamtsumme Vorschlag</td>
                            <td className="px-4 py-3 text-right font-mono text-base">
                                {paymentProposals.reduce((sum, p) => sum + (p ? p.amountToPay : 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
  );
};