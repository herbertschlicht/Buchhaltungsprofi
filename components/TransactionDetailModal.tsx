
import React from 'react';
import { Transaction, Account, Invoice, TransactionType } from '../types';
import { X, ArrowRightLeft, History, FileText, AlertCircle } from 'lucide-react';

interface TransactionDetailModalProps {
    transaction: Transaction;
    invoice?: Invoice;
    accounts: Account[];
    onClose: () => void;
    onStorno: (invoiceId: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ 
    transaction, invoice, accounts, onClose, onStorno 
}) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] p-4 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-fadeIn">
                {/* Header */}
                <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg text-white">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Beleg-Buchungssatz</h2>
                            <p className="text-xs text-slate-500">
                                Beleg: <span className="font-mono font-bold uppercase text-blue-600">{invoice?.number || transaction.reference || 'Manuelle Buchung'}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-white rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <div className="space-y-1">
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Buchungstext / Beschreibung</p>
                            <p className="text-slate-800 font-bold text-base">{transaction.description}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Buchungsdatum</p>
                            <p className="text-slate-800 font-bold text-base">{new Date(transaction.date).toLocaleDateString('de-DE')}</p>
                        </div>
                    </div>

                    {transaction.isReversed && (
                        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-800 animate-pulse">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div className="text-xs">
                                <p className="font-bold uppercase">Stornierter Beleg</p>
                                <p>Dieser Geschäftsvorfall wurde durch eine General-Stornobuchung neutralisiert.</p>
                            </div>
                        </div>
                    )}

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black border-b border-slate-200">
                                <tr>
                                    <th className="p-4">Konto-Code</th>
                                    <th className="p-4">Kontobezeichnung</th>
                                    <th className="p-4 text-right">Soll (€)</th>
                                    <th className="p-4 text-right">Haben (€)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium">
                                {transaction.lines.map((line, idx) => {
                                    const acc = accounts.find(a => a.id === line.accountId);
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="p-4 font-mono font-bold text-slate-600">{acc?.code}</td>
                                            <td className="p-4 text-slate-800">{acc?.name}</td>
                                            <td className="p-4 text-right font-mono font-bold text-blue-700">
                                                {line.debit !== 0 ? line.debit.toLocaleString('de-DE', {minimumFractionDigits: 2}) : ''}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-orange-700">
                                                {line.credit !== 0 ? line.credit.toLocaleString('de-DE', {minimumFractionDigits: 2}) : ''}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-5 border-t bg-slate-50 flex justify-between items-center">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                        System-ID: {transaction.id.substring(0,13)}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm">Schließen</button>
                        {!transaction.isReversed && invoice && (
                            <button 
                                onClick={() => onStorno(invoice.id)}
                                className="flex items-center gap-2 px-8 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-100 transition-all active:scale-95"
                            >
                                <History className="w-4 h-4" /> Buchung stornieren
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
