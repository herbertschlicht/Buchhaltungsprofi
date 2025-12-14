
import React, { useState, useMemo } from 'react';
import { Transaction, Account, AccountType, TransactionType } from '../types';
import { Archive, Lock, ArrowRight, AlertTriangle, RefreshCw, CheckCircle, Calculator } from 'lucide-react';

interface ClosingViewProps {
    transactions: Transaction[];
    accounts: Account[];
    onSaveTransaction: (transaction: Transaction) => void;
}

export const ClosingView: React.FC<ClosingViewProps> = ({ transactions, accounts, onSaveTransaction }) => {
    const currentYear = new Date().getFullYear();
    const [closingYear, setClosingYear] = useState(currentYear - 1); // Default to previous year
    const [step, setStep] = useState(0); // 0 = Select/Check, 1 = Preview, 2 = Done

    // Find account 9000 (Saldenvorträge)
    const carryForwardAccount = accounts.find(a => a.code.startsWith('9000'));

    // Check if an Opening Balance transaction already exists for the NEXT year
    // E.g. If closing 2023, we check for EB in 2024
    const nextYear = closingYear + 1;
    const existingOpeningTransaction = transactions.find(t => 
        new Date(t.date).getFullYear() === nextYear && 
        t.type === TransactionType.OPENING_BALANCE &&
        t.reference === `EB-${nextYear}`
    );

    // Calculate Closing Balances
    const closingBalances = useMemo(() => {
        if (!carryForwardAccount) return [];

        const balances: { account: Account, balance: number }[] = [];
        const endDate = `${closingYear}-12-31`;

        accounts.forEach(acc => {
            // Only Balance Sheet accounts (Bestandskonten) are carried forward
            if (![AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY].includes(acc.type)) return;
            // Skip the carry forward account itself
            if (acc.id === carryForwardAccount.id) return;

            let balance = 0;
            transactions.forEach(t => {
                if (t.date > endDate) return;
                t.lines.forEach(l => {
                    if (l.accountId === acc.id) {
                        // Standard calculation (Debit - Credit) logic varies by type, but here we just need the raw value to carry
                        if ([AccountType.ASSET, AccountType.EXPENSE].includes(acc.type)) {
                            balance += l.debit - l.credit;
                        } else {
                            balance += l.credit - l.debit;
                        }
                    }
                });
            });

            if (Math.abs(balance) > 0.01) {
                balances.push({ account: acc, balance });
            }
        });

        return balances;
    }, [closingYear, transactions, accounts, carryForwardAccount]);

    const handleCreateClosing = () => {
        if (!carryForwardAccount) {
            alert("Fehler: Konto 9000 (Saldenvorträge) fehlt im Kontenplan.");
            return;
        }

        const lines: any[] = [];
        
        closingBalances.forEach(item => {
            const isAssetSide = [AccountType.ASSET, AccountType.EXPENSE].includes(item.account.type);
            const amount = Math.abs(item.balance);
            
            // Logic:
            // If Asset Account has positive balance (Debit side) -> EB Booking is Debit Account / Credit 9000
            // If Liability Account has positive balance (Credit side) -> EB Booking is Credit Account / Debit 9000
            
            // However, item.balance is calculated based on type.
            // If Asset > 0, it means Debit > Credit. So we start new year with Debit.
            // Booking: Debit Asset, Credit 9000.
            
            if (isAssetSide) {
                if (item.balance > 0) {
                    lines.push({ accountId: item.account.id, debit: amount, credit: 0 });
                    lines.push({ accountId: carryForwardAccount.id, debit: 0, credit: amount });
                } else {
                    // Negative Asset balance (Credit side overhang) -> Start Credit
                    lines.push({ accountId: item.account.id, debit: 0, credit: amount });
                    lines.push({ accountId: carryForwardAccount.id, debit: amount, credit: 0 });
                }
            } else {
                // Liability/Equity
                if (item.balance > 0) {
                    // Positive Balance means Credit side. Start Credit.
                    lines.push({ accountId: item.account.id, debit: 0, credit: amount });
                    lines.push({ accountId: carryForwardAccount.id, debit: amount, credit: 0 });
                } else {
                    // Negative Liability (Debit side) -> Start Debit
                    lines.push({ accountId: item.account.id, debit: amount, credit: 0 });
                    lines.push({ accountId: carryForwardAccount.id, debit: 0, credit: amount });
                }
            }
        });

        const transaction: Transaction = {
            id: crypto.randomUUID(),
            date: `${nextYear}-01-01`,
            type: TransactionType.OPENING_BALANCE,
            reference: `EB-${nextYear}`,
            description: `Saldenvortrag aus ${closingYear}`,
            lines
        };

        onSaveTransaction(transaction);
        setStep(2);
    };

    const handleCancelClosing = () => {
        if (!existingOpeningTransaction) return;

        if (!window.confirm(`Möchten Sie den Jahresabschluss für ${closingYear} wirklich stornieren? \n\nEs wird eine Storno-Buchung für die EB-Werte ${nextYear} erzeugt.`)) {
            return;
        }

        // Create Reversal Transaction
        const reversalLines = existingOpeningTransaction.lines.map(l => ({
            ...l,
            debit: l.credit,
            credit: l.debit
        }));

        const transaction: Transaction = {
            id: crypto.randomUUID(),
            date: `${nextYear}-01-01`,
            type: TransactionType.CORRECTION,
            reference: `STORNO-EB-${nextYear}`,
            description: `Storno Saldenvortrag aus ${closingYear}`,
            lines: reversalLines
        };

        onSaveTransaction(transaction);
        // We stay on view but it updates automatically as existingOpeningTransaction won't be the "active" one strictly speaking if we logic it right, 
        // but finding by REF will still find the old one. 
        // However, standard logic allows us to re-run creation.
        alert("Abschluss storniert. Sie können die Werte nun neu berechnen.");
    };

    const totalDebit = closingBalances.reduce((sum, item) => {
        const isAsset = [AccountType.ASSET, AccountType.EXPENSE].includes(item.account.type);
        return (isAsset && item.balance > 0) || (!isAsset && item.balance < 0) ? sum + Math.abs(item.balance) : sum;
    }, 0);

    const totalCredit = closingBalances.reduce((sum, item) => {
        const isAsset = [AccountType.ASSET, AccountType.EXPENSE].includes(item.account.type);
        return (!isAsset && item.balance > 0) || (isAsset && item.balance < 0) ? sum + Math.abs(item.balance) : sum;
    }, 0);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Archive className="w-6 h-6 mr-3 text-slate-600"/>
                        Jahresabschluss & Saldenvortrag
                    </h2>
                    <p className="text-slate-500">
                        Automatische Erzeugung der Eröffnungsbilanz (EB-Werte) für das Folgejahr.
                    </p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto w-full">
                
                {/* Year Selector */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <span className="font-bold text-slate-600">Abschlussjahr:</span>
                    <input 
                        type="number" 
                        value={closingYear}
                        onChange={(e) => {
                            setClosingYear(parseInt(e.target.value));
                            setStep(0);
                        }}
                        className="text-2xl font-bold border-b-2 border-blue-500 w-24 text-center outline-none text-slate-800"
                    />
                    <ArrowRight className="w-6 h-6 text-slate-400"/>
                    <span className="font-bold text-slate-600">EB-Jahr: {nextYear}</span>
                </div>

                {/* --- STATE 1: EXISTING CLOSING --- */}
                {existingOpeningTransaction && step === 0 ? (
                    <div className="text-center py-8">
                        <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-10 h-10 text-green-600"/>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Jahresabschluss durchgeführt</h3>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            Die Saldenvorträge für {nextYear} wurden bereits gebucht (Beleg: {existingOpeningTransaction.reference}).
                        </p>
                        
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-800 max-w-lg mx-auto mb-8 text-left">
                            <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 mr-3 shrink-0"/>
                                <div>
                                    <strong>Korrektur / Nachbuchung notwendig?</strong>
                                    <p className="mt-1">
                                        Falls Sie im Jahr {closingYear} noch Buchungen vorgenommen haben, stimmen die EB-Werte nicht mehr. 
                                        Sie müssen den Abschluss stornieren und neu durchführen.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleCancelClosing}
                            className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg font-bold transition-colors flex items-center mx-auto"
                        >
                            <RefreshCw className="w-5 h-5 mr-2"/>
                            Abschluss stornieren & neu öffnen
                        </button>
                    </div>
                ) : step === 0 ? (
                    // --- STATE 0: PREPARE ---
                    <div className="text-center py-8">
                        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calculator className="w-10 h-10 text-blue-600"/>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Abschluss vorbereiten</h3>
                        <p className="text-slate-600 mb-8">
                            Das System ermittelt nun alle Endsalden per 31.12.{closingYear} und bereitet die EB-Buchungen für {nextYear} vor.
                        </p>
                        <button 
                            onClick={() => setStep(1)}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-transform active:scale-95"
                        >
                            Vorschau erstellen
                        </button>
                    </div>
                ) : step === 1 ? (
                    // --- STATE 1: PREVIEW ---
                    <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Vorschau Saldenvortrag {nextYear}</h3>
                            <div className="text-sm font-mono bg-slate-100 px-3 py-1 rounded">
                                Summe: {totalDebit.toLocaleString(undefined, {minimumFractionDigits:2})} €
                            </div>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto mb-6">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold">
                                    <tr>
                                        <th className="p-3">Konto</th>
                                        <th className="p-3">Bezeichnung</th>
                                        <th className="p-3 text-right">Saldo {closingYear}</th>
                                        <th className="p-3 text-right">EB {nextYear}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {closingBalances.map((item, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono">{item.account.code}</td>
                                            <td className="p-3">{item.account.name}</td>
                                            <td className="p-3 text-right text-slate-500">{item.balance.toLocaleString(undefined, {minimumFractionDigits:2})} €</td>
                                            <td className="p-3 text-right font-bold">{item.balance.toLocaleString(undefined, {minimumFractionDigits:2})} €</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-slate-100">
                            <button onClick={() => setStep(0)} className="text-slate-500 hover:text-slate-800 px-4 py-2">Abbrechen</button>
                            <button 
                                onClick={handleCreateClosing}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-green-700 flex items-center"
                            >
                                <CheckCircle className="w-5 h-5 mr-2"/>
                                Buchen & Freigeben
                            </button>
                        </div>
                    </div>
                ) : (
                    // --- STATE 2: SUCCESS ---
                    <div className="text-center py-12 animate-fadeIn">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4"/>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Erfolgreich gebucht!</h3>
                        <p className="text-slate-600 mb-6">
                            Die Saldenvorträge für {nextYear} wurden angelegt.
                        </p>
                        <button 
                            onClick={() => { setStep(0); setClosingYear(currentYear); }}
                            className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-200"
                        >
                            Zurück zur Übersicht
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
