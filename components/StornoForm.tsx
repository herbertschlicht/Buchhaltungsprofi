
import React, { useState, useMemo } from 'react';
import { Transaction, Invoice, TransactionType, Contact } from '../types';
import { X, AlertTriangle, History, Save } from 'lucide-react';

interface StornoFormProps {
    contact: Contact;
    invoices: Invoice[];
    transactions: Transaction[];
    onSave: (stornoTransaction: Transaction, originalInvoiceId: string) => void;
    onClose: () => void;
}

const STORNO_REASONS = [
    "Retoure / Gutschrift",
    "Rechnungsfehler (Betrag/Steuer)",
    "Falscher Kontakt",
    "Doppelbuchung",
    "Sonstiges"
];

export const StornoForm: React.FC<StornoFormProps> = ({ contact, invoices, transactions, onSave, onClose }) => {
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [stornoDate, setStornoDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState(STORNO_REASONS[0]);
    const [comment, setComment] = useState('');

    const stornableInvoices = useMemo(() => {
        return invoices.filter(inv => inv.contactId === contact.id && !inv.isReversed);
    }, [invoices, contact]);

    const selectedInvoice = useMemo(() => 
        stornableInvoices.find(inv => inv.id === selectedInvoiceId), 
    [selectedInvoiceId, stornableInvoices]);

    const originalTransaction = useMemo(() => {
        if (!selectedInvoice) return null;
        return transactions.find(t => t.id === selectedInvoice.transactionId);
    }, [selectedInvoice, transactions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice || !originalTransaction) return;

        // Generalstorno: Selbe Kontenseite, negatives Vorzeichen
        const stornoLines = originalTransaction.lines.map(line => ({
            ...line,
            debit: line.debit !== 0 ? -Math.abs(line.debit) : 0,
            credit: line.credit !== 0 ? -Math.abs(line.credit) : 0
        }));

        const stornoTransaction: Transaction = {
            id: crypto.randomUUID(),
            date: stornoDate,
            type: TransactionType.REVERSAL,
            description: `STORNO: ${selectedInvoice.number} - ${reason}`,
            reference: `STO-${selectedInvoice.number}`,
            contactId: contact.id,
            reversesId: originalTransaction.id,
            stornoReason: `${reason}${comment ? ': ' + comment : ''}`,
            lines: stornoLines,
            invoiceId: selectedInvoice.id
        };

        onSave(stornoTransaction, selectedInvoice.id);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[300] p-4 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-fadeIn">
                <div className={`p-5 border-b flex justify-between items-center ${contact.type === 'VENDOR' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <History className="w-5 h-5" /> Beleg stornieren
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Konto: <span className="font-bold">{contact.name}</span></p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg flex gap-3 text-xs text-amber-800">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <div>
                            <p className="font-bold uppercase tracking-tight mb-1">Generalstorno-Regel</p>
                            Das System bucht automatisch mit negativem Vorzeichen auf der Originalseite. 
                            Dies korrigiert die Verkehrszahlen direkt für Provisions- und Umsatzberichte.
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Original-Beleg wählen</label>
                        <select 
                            required
                            value={selectedInvoiceId}
                            onChange={e => setSelectedInvoiceId(e.target.value)}
                            className="w-full p-2.5 border rounded-lg bg-white font-medium"
                        >
                            <option value="">-- Beleg auswählen --</option>
                            {stornableInvoices.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.number} vom {new Date(inv.date).toLocaleDateString('de-DE')} - {inv.grossAmount.toFixed(2)} €
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Storno-Datum</label>
                            <input type="date" required value={stornoDate} onChange={e => setStornoDate(e.target.value)} className="w-full p-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Grund</label>
                            <select value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                                {STORNO_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    {selectedInvoice && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Korrekturbetrag:</span>
                                <span className="font-bold text-red-600">-{selectedInvoice.grossAmount.toFixed(2)} €</span>
                            </div>
                        </div>
                    )}
                </form>

                <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600">Abbrechen</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!selectedInvoice}
                        className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> Storno jetzt buchen
                    </button>
                </div>
            </div>
        </div>
    );
};
