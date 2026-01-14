
import React, { useState, useMemo } from 'react';
import { Transaction, Invoice, TransactionType, Contact } from '../types';
import { X, AlertTriangle, ArrowRight, History, Save, FileText } from 'lucide-react';

interface StornoFormProps {
    contact: Contact;
    invoices: Invoice[];
    transactions: Transaction[];
    onSave: (stornoTransaction: Transaction, originalInvoiceId: string) => void;
    onClose: () => void;
}

const STORNO_REASONS = [
    "Retoure / Gutschrift",
    "Rechnungsfehler (falscher Betrag)",
    "Falscher Empfänger",
    "Doppelbuchung",
    "Sonstige Korrektur"
];

export const StornoForm: React.FC<StornoFormProps> = ({ contact, invoices, transactions, onSave, onClose }) => {
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [stornoDate, setStornoDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState(STORNO_REASONS[0]);
    const [comment, setComment] = useState('');

    // Filter: Nur Rechnungen dieses Kontakts, die noch nicht storniert wurden
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

        // Das Herzstück: Generalstorno-Logik
        // Wir kopieren die Zeilen und negieren die Beträge auf der SELBEN Seite
        const stornoLines = originalTransaction.lines.map(line => ({
            ...line,
            debit: line.debit !== 0 ? -Math.abs(line.debit) : 0,
            credit: line.credit !== 0 ? -Math.abs(line.credit) : 0
        }));

        const stornoTransaction: Transaction = {
            id: crypto.randomUUID(),
            date: stornoDate,
            type: TransactionType.REVERSAL,
            description: `STORNO (${reason}): ${selectedInvoice.number} - ${selectedInvoice.description}`,
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[250] p-4 font-sans backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-fadeIn">
                <div className={`p-5 border-b flex justify-between items-center ${contact.type === 'VENDOR' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <History className="w-5 h-5" /> Stornierung erfassen
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Kontakt: <span className="font-bold">{contact.name}</span></p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[80vh]">
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="text-xs text-amber-800 leading-relaxed">
                            <p className="font-bold mb-1">Generalstorno-Regel:</p>
                            Die Korrektur erfolgt automatisch mit negativem Vorzeichen auf der Originalseite. 
                            Dies korrigiert die Verkehrszahlen direkt für Umsatz- und Bonusberichte.
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ursprungsbeleg wählen</label>
                        <select 
                            required
                            value={selectedInvoiceId}
                            onChange={e => setSelectedInvoiceId(e.target.value)}
                            className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-red-500 outline-none font-medium"
                        >
                            <option value="">-- Beleg auswählen --</option>
                            {stornableInvoices.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.number} ({new Date(inv.date).toLocaleDateString('de-DE')}) - {inv.grossAmount.toLocaleString('de-DE', {minimumFractionDigits:2})} €
                                </option>
                            ))}
                        </select>
                        {stornableInvoices.length === 0 && (
                            <p className="text-[10px] text-red-500 mt-1 font-bold">Keine stornierbaren Belege für diesen Kontakt gefunden.</p>
                        )}
                    </div>

                    {selectedInvoice && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fadeIn">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Zusammenfassung Original</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-400 text-[10px] uppercase">Bruttobetrag</p>
                                    <p className="font-bold text-slate-700">{selectedInvoice.grossAmount.toLocaleString('de-DE', {minimumFractionDigits:2})} €</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] uppercase">Storno-Effekt</p>
                                    <p className="font-bold text-red-600">-{selectedInvoice.grossAmount.toLocaleString('de-DE', {minimumFractionDigits:2})} €</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Storno-Datum</label>
                            <input 
                                type="date" 
                                required 
                                value={stornoDate} 
                                onChange={e => setStornoDate(e.target.value)}
                                className="w-full p-2.5 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Storno-Grund</label>
                            <select 
                                value={reason} 
                                onChange={e => setReason(e.target.value)}
                                className="w-full p-2.5 border rounded-lg bg-white"
                            >
                                {STORNO_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Kommentar (Optional)</label>
                        <textarea 
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="w-full p-3 border rounded-xl h-20 text-sm"
                            placeholder="Details zum Stornogrund..."
                        />
                    </div>
                </form>

                <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Abbrechen</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!selectedInvoice}
                        className="flex items-center gap-2 px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all disabled:opacity-50 active:scale-95"
                    >
                        <Save className="w-4 h-4" /> Storno buchen
                    </button>
                </div>
            </div>
        </div>
    );
};
