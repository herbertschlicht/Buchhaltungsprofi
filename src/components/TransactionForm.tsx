import React, { useState, useEffect } from 'react';
import { Account, Transaction, TransactionType } from '../types';
import { X, Plus, Trash2, Wand2, Calculator, Tags, Paperclip, FileSpreadsheet, FileText, File as FileIcon } from 'lucide-react';
import { suggestTransactionCategory } from '../services/geminiService';

interface TransactionFormProps {
  accounts: Account[];
  contacts?: any[]; 
  invoices?: any[]; 
  existingTransactions?: Transaction[]; 
  onSave: (transaction: Transaction) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ accounts, existingTransactions = [], onSave, onClose }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.STANDARD);
  const [reference, setReference] = useState(''); 
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const [lines, setLines] = useState<{ accountId: string; debit: number; credit: number }[]>([
    { accountId: '', debit: 0, credit: 0 }, 
    { accountId: '', debit: 0, credit: 0 },
  ]);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // Auto-Numbering Logic
  useEffect(() => {
      const year = new Date(date).getFullYear();
      let prefix = 'MAN'; 
      
      if (transactionType === TransactionType.CLOSING) prefix = 'JAB'; 
      else if (transactionType === TransactionType.CORRECTION) prefix = 'UMB'; 
      else if (transactionType === TransactionType.PAYROLL) prefix = 'LOB';
      else if (transactionType === TransactionType.CREDIT_CARD) prefix = 'KK'; // Automatisches Präfix für Kreditkarten

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
      const nextRef = `${prefix}-${year}-${nextSeq.toString().padStart(3, '0')}`;
      
      setReference(nextRef);

  }, [transactionType, date, existingTransactions]);


  const totalDebit = lines.reduce((acc, line) => acc + (line.debit || 0), 0);
  const totalCredit = lines.reduce((acc, line) => acc + (line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && Math.abs(totalDebit) > 0;

  const handleAddLine = () => {
    setLines([...lines, { accountId: '', debit: 0, credit: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;
    setLines(newLines);
  };

  // Tax Automation Helper (SKR 03)
  const applyTax = (index: number, taxCodeStr: string) => {
      const [type, rateStr, mode] = taxCodeStr.split('_');
      const rate = parseFloat(rateStr) / 100;
      
      const line = lines[index];
      const originalAmount = line.debit > 0 ? line.debit : line.credit;
      const isDebit = line.debit > 0;

      if (originalAmount === 0) return;

      let taxAccountCode = '';
      if (type === 'vst') { 
          // SKR 03 Vorsteuer
          taxAccountCode = rateStr === '19' ? '1576000' : '1571000';
      } else { 
          // SKR 03 Umsatzsteuer
          taxAccountCode = rateStr === '19' ? '1776000' : '1771000';
      }

      const taxAccount = accounts.find(a => a.code === taxAccountCode);
      if (!taxAccount) {
          alert(`Steuerkonto ${taxAccountCode} nicht gefunden!`);
          return;
      }

      let netAmount = 0;
      let taxAmount = 0;

      if (mode === 'net') {
          netAmount = originalAmount;
          taxAmount = Number((originalAmount * rate).toFixed(2));
      } else {
          netAmount = Number((originalAmount / (1 + rate)).toFixed(2));
          taxAmount = Number((originalAmount - netAmount).toFixed(2));
          
          const updatedLines = [...lines];
          if (isDebit) updatedLines[index].debit = netAmount;
          else updatedLines[index].credit = netAmount;
          setLines(updatedLines);
      }

      const taxLine = {
          accountId: taxAccount.id,
          debit: isDebit ? taxAmount : 0, 
          credit: !isDebit ? taxAmount : 0 
      };

      setLines(prev => {
          const newL = [...prev];
          const listWithUpdatedBase = newL.map((l, i) => {
              if (i === index && mode === 'gross') {
                  return { ...l, debit: isDebit ? netAmount : 0, credit: !isDebit ? netAmount : 0 };
              }
              return l;
          });
          
          listWithUpdatedBase.splice(index + 1, 0, taxLine);
          return listWithUpdatedBase;
      });
  };

  const handleGetSuggestion = async () => {
    if (!description) return;
    const result = await suggestTransactionCategory(description);
    if (result) setSuggestion(result);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const fileArray = Array.from(e.target.files);
          setAttachments(prev => [...prev, ...fileArray]);
      }
  };

  const removeAttachment = (index: number) => {
      setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert('Soll und Haben müssen ausgeglichen sein!');
      return;
    }
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date,
      type: transactionType,
      description,
      reference: reference || undefined,
      attachments: attachments.map(f => f.name), 
      lines: lines.map(l => ({
          accountId: l.accountId,
          debit: Number(l.debit),
          credit: Number(l.credit)
      }))
    };
    onSave(newTransaction);
    onClose();
  };

  const getFileIcon = (name: string) => {
      if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) return <FileSpreadsheet className="w-4 h-4 text-green-600"/>;
      if (name.endsWith('.pdf')) return <FileText className="w-4 h-4 text-red-600"/>;
      return <FileIcon className="w-4 h-4 text-slate-500"/>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Manuelle Buchung (Sachbuchhaltung)</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Datum</label>
              <input 
                type="date" 
                required
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" 
              />
            </div>
            
            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center">
                    <Tags className="w-3 h-3 mr-1"/> Buchungstyp
                </label>
                <select 
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium bg-white"
                >
                    <option value={TransactionType.STANDARD}>Laufende Buchung (Manuell)</option>
                    <option value={TransactionType.CREDIT_CARD}>Kreditkartenabrechnung (Sammelbuchung)</option>
                    <option value={TransactionType.CORRECTION}>Umbuchung / Korrektur</option>
                    <option value={TransactionType.CLOSING}>Jahresabschluss / Bilanzierung</option>
                    <option value={TransactionType.PAYROLL}>Lohnbuchhaltung (Manuell)</option>
                </select>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Beleg-Nr. (Auto)</label>
                <input 
                    type="text" 
                    value={reference} 
                    onChange={(e) => setReference(e.target.value)} 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm font-bold bg-slate-100 text-slate-600" 
                />
            </div>
          </div>

          <div className="mb-6 relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Buchungstext</label>
              <div className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Detaillierte Beschreibung des Geschäftsvorfalls"
                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base" 
                  />
                  <button 
                    type="button" 
                    onClick={handleGetSuggestion}
                    className="p-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 border border-purple-200 transition-colors"
                    title="KI-Vorschlag abrufen"
                  >
                      <Wand2 className="w-5 h-5"/>
                  </button>
              </div>
              {suggestion && (
                  <p className="text-xs text-purple-600 mt-1 ml-1 animate-fadeIn">
                      KI-Vorschlag: Kategorie <strong>{suggestion}</strong>
                  </p>
              )}
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-12 gap-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-5 pl-1">Konto (Soll/Haben)</div>
              <div className="col-span-2 text-right">Soll (€)</div>
              <div className="col-span-2 text-right">Haben (€)</div>
              <div className="col-span-2 pl-2 flex items-center"><Calculator className="w-3 h-3 mr-1"/> Steuer-Automatik</div>
              <div className="col-span-1"></div>
            </div>
            
            <div className="space-y-2">
                {lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center bg-white border border-slate-200 p-2 rounded-lg hover:border-blue-300 transition-colors shadow-sm">
                    <div className="col-span-5">
                    <select 
                        value={line.accountId}
                        onChange={(e) => updateLine(index, 'accountId', e.target.value)}
                        className="w-full p-2 border-none focus:ring-0 outline-none text-sm font-medium bg-transparent"
                        required
                    >
                        <option value="">-- Konto wählen --</option>
                        {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                        ))}
                    </select>
                    </div>
                    <div className="col-span-2 border-l border-slate-100">
                    <input 
                        type="number" 
                        step="0.01"
                        value={line.debit || ''}
                        onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value))}
                        className="w-full p-1 text-right text-sm focus:ring-0 outline-none font-mono"
                        placeholder="0.00"
                    />
                    </div>
                    <div className="col-span-2 border-l border-slate-100">
                    <input 
                        type="number" 
                        step="0.01"
                        value={line.credit || ''}
                        onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value))}
                        className="w-full p-1 text-right text-sm focus:ring-0 outline-none font-mono"
                        placeholder="0.00"
                    />
                    </div>
                    
                    {/* TAX AUTOMATION DROPDOWN */}
                    <div className="col-span-2 border-l border-slate-100 pl-2">
                        <select 
                            className="w-full p-1 text-[10px] border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-blue-500 outline-none text-slate-600"
                            onChange={(e) => {
                                if (e.target.value) {
                                    applyTax(index, e.target.value);
                                    e.target.value = ""; // Reset after apply
                                }
                            }}
                        >
                            <option value="">+ Steuer...</option>
                            <optgroup label="Vorsteuer (Einkauf)">
                                <option value="vst_19_net">19% auf Netto (Add)</option>
                                <option value="vst_19_gross">19% aus Brutto (Split)</option>
                                <option value="vst_7_net">7% auf Netto (Add)</option>
                                <option value="vst_7_gross">7% aus Brutto (Split)</option>
                            </optgroup>
                            <optgroup label="Umsatzsteuer (Verkauf)">
                                <option value="ust_19_net">19% auf Netto (Add)</option>
                                <option value="ust_19_gross">19% aus Brutto (Split)</option>
                                <option value="ust_7_net">7% auf Netto (Add)</option>
                                <option value="ust_7_gross">7% aus Brutto (Split)</option>
                            </optgroup>
                        </select>
                    </div>

                    <div className="col-span-1 flex justify-center border-l border-slate-100">
                    <button 
                        type="button" 
                        onClick={() => handleRemoveLine(index)}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors p-1"
                        disabled={lines.length <= 2}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                </div>
                ))}
            </div>

            <button 
                type="button" 
                onClick={handleAddLine}
                className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-700 font-bold px-2"
            >
                <Plus className="w-4 h-4 mr-1" /> Zeile hinzufügen
            </button>
          </div>

          {/* ATTACHMENTS SECTION */}
          <div className="mt-8 border-t border-slate-100 pt-6">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <Paperclip className="w-4 h-4 mr-2"/> Anhänge / Belege
              </label>
              <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                      <label className="cursor-pointer flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors">
                          <Plus className="w-3 h-3 mr-2"/> Datei auswählen
                          <input type="file" className="hidden" multiple onChange={handleFileChange} />
                      </label>
                      <span className="text-xs text-slate-400">Unterstützt: PDF, Excel, Word, Bilder (max 5MB)</span>
                  </div>
                  
                  {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                          {attachments.map((file, i) => (
                              <div key={i} className="flex items-center bg-blue-50 border border-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-xs">
                                  {getFileIcon(file.name)}
                                  <span className="ml-2 mr-2 font-medium truncate max-w-[150px]">{file.name}</span>
                                  <button onClick={() => removeAttachment(i)} className="text-blue-400 hover:text-red-500">
                                      <X className="w-3 h-3"/>
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>

        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <div className="flex justify-between items-center mb-4 text-sm font-medium">
            <span className="text-slate-500 uppercase tracking-wider text-xs font-bold">Summenkontrolle</span>
            <div className="flex gap-8 font-mono text-lg">
              <span className={totalDebit !== totalCredit ? 'text-red-500' : 'text-slate-800'}>
                Soll: {totalDebit.toFixed(2)} €
              </span>
              <span className={totalDebit !== totalCredit ? 'text-red-500' : 'text-slate-800'}>
                Haben: {totalCredit.toFixed(2)} €
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors font-medium"
            >
              Abbrechen
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!isBalanced}
              className={`px-8 py-2 rounded-lg text-white font-bold shadow-md transition-all ${
                isBalanced 
                  ? 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5' 
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              Buchen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};