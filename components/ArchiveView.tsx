
import React, { useState } from 'react';
import { Invoice, Transaction, Contact, Account } from '../types';
import { getInvoicePaymentStatus } from '../utils/accounting';
import { 
    Search, 
    Archive, 
    FileText, 
    ArrowUpRight, 
    ArrowDownLeft, 
    History, 
    Eye, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Filter
} from 'lucide-react';
import { TransactionDetailModal } from './TransactionDetailModal';

interface ArchiveViewProps {
    invoices: Invoice[];
    transactions: Transaction[];
    contacts: Contact[];
    accounts: Account[];
    onOpenStorno: (invoiceId: string, contactId: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ 
    invoices, transactions, contacts, accounts, onOpenStorno 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 're' | 'er'>('all');
    
    // Modal State
    const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
    const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

    const allInvoices = invoices.map(inv => {
        const contact = contacts.find(c => c.id === inv.contactId);
        const stats = getInvoicePaymentStatus(inv, transactions);
        return { ...inv, contactName: contact?.name || 'Unbekannt', contact, ...stats };
    }).filter(inv => {
        const matchesSearch = inv.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             inv.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             inv.grossAmount.toString().includes(searchTerm);
        
        const isRE = inv.number.startsWith('RE');
        const isER = inv.number.startsWith('ER');
        
        if (filterType === 're') return matchesSearch && isRE;
        if (filterType === 'er') return matchesSearch && isER;
        return matchesSearch;
    }).sort((a, b) => b.date.localeCompare(a.date));

    const handleShowDetails = (inv: any) => {
        const tx = transactions.find(t => t.id === inv.transactionId);
        if (tx) {
            setDetailTransaction(tx);
            setDetailInvoice(inv);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b pb-4 border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Archive className="w-6 h-6 mr-3 text-indigo-600" />
                        Zentrales Belegarchiv
                    </h2>
                    <p className="text-slate-500">Alle Ausgangs- (RE) und Eingangsrechnungen (ER) im Überblick.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Suche nach Nr., Name oder Betrag..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                    <button onClick={() => setFilterType('all')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Alle</button>
                    <button onClick={() => setFilterType('re')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 're' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Verkauf (RE)</button>
                    <button onClick={() => setFilterType('er')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'er' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Einkauf (ER)</button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black border-b border-slate-200">
                                <th className="p-4">Typ</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Beleg-Nr.</th>
                                <th className="p-4">Datum</th>
                                <th className="p-4">Partner</th>
                                <th className="p-4 text-right">Betrag (Brutto)</th>
                                <th className="p-4 text-center">Aktion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {allInvoices.map(inv => (
                                <tr key={inv.id} className={`hover:bg-slate-50 transition-colors group ${inv.isReversed ? 'bg-rose-50/20' : ''}`}>
                                    <td className="p-4">
                                        {inv.number.startsWith('RE') ? (
                                            <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[10px] uppercase">
                                                <ArrowUpRight className="w-3 h-3" /> Verkauf
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-orange-600 font-bold text-[10px] uppercase">
                                                <ArrowDownLeft className="w-3 h-3" /> Einkauf
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {inv.isReversed ? (
                                            <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase flex items-center gap-1 w-fit"><AlertCircle className="w-2.5 h-2.5" /> Storniert</span>
                                        ) : inv.status === 'PAID' ? (
                                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase flex items-center gap-1 w-fit"><CheckCircle2 className="w-2.5 h-2.5" /> Bezahlt</span>
                                        ) : (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase flex items-center gap-1 w-fit"><Clock className="w-2.5 h-2.5" /> Offen</span>
                                        )}
                                    </td>
                                    <td className="p-4 font-mono font-bold text-slate-600">{inv.number}</td>
                                    <td className="p-4 text-slate-500">{new Date(inv.date).toLocaleDateString('de-DE')}</td>
                                    <td className="p-4 font-bold text-slate-800">{inv.contactName}</td>
                                    <td className={`p-4 text-right font-mono font-bold ${inv.isReversed ? 'text-slate-300 line-through' : 'text-slate-900'}`}>
                                        {inv.grossAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => handleShowDetails(inv)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title="Buchungssatz anzeigen"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {!inv.isReversed && (
                                                <button 
                                                    onClick={() => onOpenStorno(inv.id, inv.contactId)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                                    title="Sofort stornieren"
                                                >
                                                    <History className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {allInvoices.length === 0 && (
                    <div className="p-20 text-center text-slate-400 italic">
                        Keine Belege im Archiv gefunden.
                    </div>
                )}
            </div>

            {detailTransaction && (
                <TransactionDetailModal 
                    transaction={detailTransaction}
                    invoice={detailInvoice || undefined}
                    accounts={accounts}
                    onClose={() => setDetailTransaction(null)}
                    onStorno={(invId) => {
                        onOpenStorno(invId, detailInvoice?.contactId || '');
                        setDetailTransaction(null);
                    }}
                />
            )}
        </div>
    );
};
