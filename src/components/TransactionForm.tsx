
import React, { useState, useEffect } from 'react';
import { Account, Transaction, TransactionType, CostCenter, Project, AccountType } from '../types';
import { X, Plus, Trash2, Wand2, Calculator, Tags, Paperclip, FileSpreadsheet, FileText, File as FileIcon, Building2, Target, AlertTriangle } from 'lucide-react';
import { suggestTransactionCategory } from '../services/geminiService';

interface TransactionFormProps {
  accounts: Account[];
  costCenters?: CostCenter[]; 
  projects?: Project[]; 
  existingTransactions?: Transaction[]; 
  onSave: (transaction: Transaction) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
    accounts, 
    costCenters = [], 
    projects = [],
    existingTransactions = [], 
    onSave, 
    onClose 
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.STANDARD);
  const [reference, setReference] = useState(''); 
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const [lines, setLines] = useState<{ accountId: string; debit: number; credit: number; costCenterId?: string; projectId?: string }[]>([
    { accountId: '', debit: 0, credit: 0 }, 
    { accountId: '', debit: 0, credit: 0 },
  ]);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
      const year = new Date(date).getFullYear();
      let prefix = 'MAN'; 
      if (transactionType === TransactionType.CLOSING) prefix = 'JAB'; 
      else if (transactionType === TransactionType.OPENING_BALANCE) prefix = 'EB';
      else if (transactionType === TransactionType.CORRECTION) prefix = 'STO'; // Storno Prefix
      else if (transactionType === TransactionType.PAYROLL) prefix = 'LOB';

      const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
      let maxSeq = 0;
      existingTransactions.forEach(t => {
          if (t.reference) {
              const match = t.reference.match(pattern);
              if (match) {
                  const seq = parseInt(match[1], 10);
                  if (seq > maxSeq) maxSeq = seq;
              }
          }
      });
      const nextSeq = maxSeq + 1;
      setReference(`${prefix}-${year}-${nextSeq.toString().padStart(3, '0')}`);
  }, [transactionType, date, existingTransactions]);

  const totalDebit = lines.reduce((acc, line) => acc + (line.debit || 0), 0);
  const totalCredit = lines.reduce((acc, line) => acc + (line.credit || 0), 0);
  
  // Balance Check (Absolutbetrag, da Storno negativ sein kann)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && Math.abs(totalDebit) !== 0;

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;
    setLines(newLines);
  };

  const handleAddLine = () => setLines([...lines, { accountId: '', debit: 0, credit: 0 }]);
  const handleRemoveLine = (index: number) => setLines(lines.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert('Soll und Haben müssen ausgeglichen sein (auch bei negativem Storno)!');
      return;
    }
    
    // Validierung: Wenn Storno, sollten Beträge negativ sein (Generalstorno)
    if (transactionType === TransactionType.CORRECTION) {
        const hasPositive = lines.some(l => l.debit > 0 || l.credit > 0);
        if (hasPositive && !window.confirm('Regelhinweis: Stornobuchungen sollten für korrekte Umsatzstatistiken in der Regel mit negativen Vorzeichen auf der Originalseite erfolgen. Fortfahren?')) {
            return;
        }
    }

    onSave({
      id: crypto.randomUUID(),
      date,
      type: transactionType,
      description,
      reference,
      attachments: attachments.map(f => f.name), 
      lines: lines.map(l => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) }))
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Buchung erfassen</h2>
            {transactionType === TransactionType.CORRECTION && (
                <p className="text-xs text-rose-600 font-bold flex items-center mt-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 mr-1"/> Generalstorno-Modus: Beträge mit Minus (-) erfassen!
                </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Datum</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Buchungstyp</label>
                <select value={transactionType} onChange={(e) => setTransactionType(e.target.value as TransactionType)} className="w-full p-2 border rounded-lg text-sm bg-white">
                    <option value={TransactionType.STANDARD}>Laufende Buchung</option>
                    <option value={TransactionType.CORRECTION}>Storno / Korrektur (Generalstorno)</option>
                    <option value={TransactionType.OPENING_BALANCE}>Eröffnungsbilanz (EB)</option>
                    <option value={TransactionType.CLOSING}>Jahresabschluss</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Beleg-Nr.</label>
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full p-2 border rounded-lg font-mono text-sm font-bold bg-slate-100" />
            </div>
          </div>

          <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Buchungstext</label>
              <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border rounded-lg outline-none" placeholder="z.B. Storno Rechnung RE-2024-001 wegen Retoure"/>
          </div>

          <div className="space-y-2">
            {lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center bg-white border border-slate-200 p-2 rounded-lg">
                    <div className="col-span-5">
                        <select value={line.accountId} onChange={(e) => updateLine(index, 'accountId', e.target.value)} className="w-full p-2 border-none text-sm" required>
                            <option value="">-- Konto wählen --</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                        </select>
                    </div>
                    <div className="col-span-3 border-l border-slate-100">
                        <input type="number" step="0.01" value={line.debit || ''} onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value))} className="w-full p-1 text-right text-sm font-mono" placeholder="Soll 0.00" />
                    </div>
                    <div className="col-span-3 border-l border-slate-100">
                        <input type="number" step="0.01" value={line.credit || ''} onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value))} className="w-full p-1 text-right text-sm font-mono" placeholder="Haben 0.00" />
                    </div>
                    <div className="col-span-1 flex justify-center">
                        <button type="button" onClick={() => handleRemoveLine(index)} className="text-slate-400 hover:text-red-500" disabled={lines.length <= 2}><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>
            ))}
          </div>
          <button type="button" onClick={handleAddLine} className="mt-3 text-sm text-blue-600 font-bold flex items-center"><Plus className="w-4 h-4 mr-1"/> Zeile hinzufügen</button>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500 uppercase text-xs font-bold">Summenprüfung</span>
            <div className="flex gap-8 font-mono text-lg font-bold">
              <span className={Math.abs(totalDebit - totalCredit) > 0.01 ? 'text-red-500' : 'text-slate-800'}>Soll: {totalDebit.toFixed(2)} €</span>
              <span className={Math.abs(totalDebit - totalCredit) > 0.01 ? 'text-red-500' : 'text-slate-800'}>Haben: {totalCredit.toFixed(2)} €</span>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Abbrechen</button>
            <button onClick={handleSubmit} disabled={!isBalanced} className={`px-8 py-2 rounded-lg text-white font-bold ${isBalanced ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300'}`}>Buchen</button>
          </div>
        </div>
      </div>
    </div>
  );
};
