
import React, { useState, useMemo } from 'react';
import { Invoice, Transaction, Contact, Account, TransactionType } from '../types';
import { getInvoicePaymentStatus } from '../utils/accounting';
import { 
    Search, 
    Archive, 
    ArrowUpRight, 
    ArrowDownLeft, 
    History, 
    Eye, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    UserCheck,
    FileJson,
    Calculator,
    Layers,
    Filter,
    FileText
} from 'lucide-react';
import { TransactionDetailModal } from './TransactionDetailModal';

interface ArchiveViewProps {
    invoices: Invoice[];
    transactions: Transaction[];
    contacts: Contact[];
    accounts: Account[];
    onOpenStorno: (invoiceId: string, contactId: string) => void;
}

type BelegCategory = 'all' | 'invoices' | 'manual' | 'payroll' | 'system';

export const ArchiveView: React.FC<ArchiveViewProps> = ({ 
    invoices, transactions, contacts, accounts, onOpenStorno 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState<BelegCategory>('all');
    
    // Modal State
    const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
    const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

    const processedBelege = useMemo(() => {
        return transactions.map(tx => {
            const invoice = invoices.find(inv => inv.transactionId === tx.id || inv.id === tx.invoiceId);
            const contact = contacts.find(c => c.id === tx.contactId || (invoice && c.id === invoice.contactId));
            
            // Bestimmung des Typs und Icons
            let typeLabel = "Direktbuchung";
            let typeIcon = <FileJson className="w-3 h-3" />;
            let colorClass = "text-indigo-600 bg-indigo-50 border-indigo-100";
            let docCat: BelegCategory = 'manual';

            if (invoice) {
                const isRE = invoice.number.startsWith('RE');
                typeLabel = isRE ? "Ausgangsrechnung" : "Eingangsrechnung";
                typeIcon = isRE ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />;
                colorClass = isRE ? "text-blue-600 bg-blue-50 border-blue-100" : "text-orange-600 bg-orange-50 border-orange-100";
                docCat = 'invoices';
            } else if (tx.type === TransactionType.PAYROLL) {
                typeLabel = "Lohnbeleg";
                typeIcon = <UserCheck className="w-3 h-3" />;
                colorClass = "text-purple-600 bg-purple-50 border-purple-100";
                docCat = 'payroll';
            } else if (tx.type === TransactionType.CLOSING || tx.type === TransactionType.OPENING_BALANCE) {
                typeLabel = "Jahresabschluss";
                typeIcon = <Archive className="w-3 h-3" />;
                colorClass = "text-slate-600 bg-slate-50 border-slate-100";
                docCat = 'system';
            } else if (tx.type === TransactionType.DEPRECIATION) {
                typeLabel = "Abschreibung";
                typeIcon = <Calculator className="w-3 h-3" />;
                colorClass = "text-emerald-600 bg-emerald-50 border-emerald-100";
                docCat = 'system';
            }

            const amount = tx.lines.reduce((sum, l) => sum + Math.max(l.debit, l.credit), 0) / (tx.lines.length > 0 ? 1 : 1); 
            // Summe der Soll-Seite als Belegwert
            const totalValue = tx.lines.reduce((sum, l) => sum + l.debit, 0);

            return {
                ...tx,
                invoice,
                contact,
                typeLabel,
                typeIcon,
                colorClass,
                docCat,
                totalValue
            };
        }).filter(b => {
            const matchesSearch = 
                b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (b.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (b.invoice?.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (b.contact?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCat = category === 'all' || b.docCat === category;
            
            return matchesSearch && matchesCat;
        }).sort((a, b) => b.date.localeCompare(a.date));
    }, [transactions, invoices, contacts, searchTerm, category]);

    const handleShowDetails = (beleg: any) => {
        setDetailTransaction(beleg);
        setDetailInvoice(beleg.invoice || null);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b pb-4 border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Layers className="w-6 h-6 mr-3 text-indigo-600" />
                        Zentrales Belegarchiv
                    </h2>
                    <p className="text-slate-500">Sämtliche Rechnungen, Lohnbelege und Direktbuchungen im Überblick.</p>
                </div>
            </div>

            {/* Enhanced Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Suche nach Nr., Text, Partner oder Konto..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                    />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto max-w-full">
                    <button onClick={() => setCategory('all')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${category === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Alle Belege</button>
                    <button onClick={() => setCategory('invoices')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${category === 'invoices' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Rechnungen</button>
                    <button onClick={() => setCategory('manual')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${category === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Direktbuchungen</button>
                    <button onClick={() => setCategory('payroll')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${category === 'payroll' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Personal</button>
                    <button onClick={() => setCategory('system')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${category === 'system' ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>System</button>
                </div>
            </div>

            {/* Unified Document Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black border-b border-slate-200">
                                <th className="p-4">Kategorie / Status</th>
                                <th className="p-4">Datum</th>
                                <th className="p-4">Referenz / Beleg-Nr.</th>
                                <th className="p-4">Beschreibung / Partner</th>
                                <th className="p-4 text-right">Belegwert</th>
                                <th className="p-4 text-center">Aktion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {processedBelege.map(beleg => (
                                <tr key={beleg.id} className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${beleg.isReversed ? 'bg-rose-50/30' : ''}`} onClick={() => handleShowDetails(beleg)}>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase w-fit ${beleg.colorClass}`}>
                                                {beleg.typeIcon} {beleg.typeLabel}
                                            </div>
                                            {beleg.isReversed && (
                                                <span className="text-rose-600 font-bold text-[8px] uppercase flex items-center gap-1 ml-1"><AlertCircle className="w-2.5 h-2.5" /> Storniert</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-slate-800 font-medium">{new Date(beleg.date).toLocaleDateString('de-DE')}</div>
                                        <div className="text-[10px] text-slate-400 font-mono uppercase">{new Date(beleg.date).toLocaleDateString('de-DE', {weekday: 'short'})}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-mono font-bold text-slate-700">{beleg.invoice?.number || beleg.reference || '-'}</div>
                                        {beleg.invoice?.externalNumber && <div className="text-[9px] text-slate-400 uppercase">Fremd: {beleg.invoice.externalNumber}</div>}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 line-clamp-1">{beleg.contact?.name || 'Diverse / Sachbuchung'}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[250px]">{beleg.description}</div>
                                    </td>
                                    <td className={`p-4 text-right font-mono font-bold ${beleg.isReversed ? 'text-slate-300 line-through' : 'text-slate-900'}`}>
                                        {beleg.totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleShowDetails(beleg); }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Details einsehen"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {!beleg.isReversed && beleg.invoice && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onOpenStorno(beleg.invoice!.id, beleg.invoice!.contactId); }}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Beleg stornieren"
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
                {processedBelege.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
                        <div className="p-4 bg-slate-50 rounded-full">
                            <Archive className="w-8 h-8 text-slate-300" />
                        </div>
                        <div className="text-slate-400 italic">Keine Belege im Archiv gefunden.</div>
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
