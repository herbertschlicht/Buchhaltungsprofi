
import React, { useState, useEffect } from 'react';
import { Asset, Account, AccountType } from '../types';
import { afaTable } from '../data/afaTable';
import { X, Save, Calculator, BookOpen, Calendar, HelpCircle, AlertCircle, Info } from 'lucide-react';

interface AssetFormProps {
  accounts: Account[];
  existingAsset?: Asset; // If editing
  onSave: (asset: Asset) => void;
  onClose: () => void;
}

export const AssetForm: React.FC<AssetFormProps> = ({ accounts, existingAsset, onSave, onClose }) => {
  // Filter appropriate GL accounts (Class 0)
  const assetAccounts = accounts.filter(a => a.type === AccountType.ASSET && a.code.startsWith('0'));

  // Form State
  const [inventoryNumber, setInventoryNumber] = useState(existingAsset?.inventoryNumber || `INV-${new Date().getFullYear()}-XXX`);
  const [name, setName] = useState(existingAsset?.name || '');
  const [glAccountId, setGlAccountId] = useState(existingAsset?.glAccountId || '');
  
  const [purchaseDate, setPurchaseDate] = useState(existingAsset?.purchaseDate || new Date().toISOString().split('T')[0]);
  const [documentRef, setDocumentRef] = useState(existingAsset?.documentRef || '');
  
  const [cost, setCost] = useState(existingAsset?.cost || 0);
  const [usefulLifeYears, setUsefulLifeYears] = useState(existingAsset?.usefulLifeYears || 3);
  const [afaCategory, setAfaCategory] = useState(existingAsset?.afaCategory || '');
  
  const [residualValue, setResidualValue] = useState(existingAsset?.residualValue || 0);

  // Helper: Calculate Rate
  const currentRate = usefulLifeYears > 0 ? (100 / usefulLifeYears).toFixed(2) : '0';

  const handleAfaSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedLabel = e.target.value;
      const entry = afaTable.find(item => item.label === selectedLabel);
      
      if (entry) {
          setAfaCategory(entry.label);
          setUsefulLifeYears(entry.years);
          
          // Smart Account Suggestion (Demo logic)
          if (entry.years === 0 && !glAccountId) {
              const landAcc = assetAccounts.find(a => a.name.includes('Grund') || a.code === '0085');
              if (landAcc) setGlAccountId(landAcc.id);
          } else if (entry.category.includes('Fuhrpark') && !glAccountId) {
              const carAcc = assetAccounts.find(a => a.name.includes('PKW') || a.code === '0320');
              if (carAcc) setGlAccountId(carAcc.id);
          } else if (entry.category.includes('Büro') && !glAccountId) {
              const officeAcc = assetAccounts.find(a => a.name.includes('Büro') || a.code === '0420');
              if (officeAcc) setGlAccountId(officeAcc.id);
          }
      } else {
          setAfaCategory(''); // Custom
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !glAccountId || cost <= 0) return;

      const asset: Asset = {
          id: existingAsset?.id || crypto.randomUUID(),
          inventoryNumber,
          name,
          glAccountId,
          purchaseDate,
          documentRef,
          cost,
          usefulLifeYears,
          afaCategory: afaCategory || 'Manuell',
          residualValue,
          status: existingAsset?.status || 'ACTIVE'
      };

      onSave(asset);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-600 rounded-lg text-white">
                <Calculator className="w-5 h-5"/>
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">
                    {existingAsset ? 'Anlagegut bearbeiten' : 'Manuelle Inventarisierung'}
                </h2>
                <p className="text-xs text-slate-500">
                    Stammdatenpflege für das Anlageverzeichnis
                </p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-6">
            
            {/* Warning for Manual Entry */}
            {!existingAsset && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start text-sm text-amber-800">
                    <Info className="w-5 h-5 mr-3 shrink-0 text-amber-600 mt-0.5"/>
                    <div>
                        <strong className="block mb-1">Hinweis zur Erfassung</strong>
                        <p>
                            Nutzen Sie dieses Formular bitte nur für <strong>Altbestände</strong> oder <strong>nicht-kreditorische Zugänge</strong> (z.B. Privateinlagen).
                        </p>
                        <p className="mt-2 text-xs text-amber-700">
                            Neue Anlagegüter aus Einkäufen sollten direkt über die <strong>Eingangsrechnung</strong> erfasst werden, um die Finanzbuchhaltung automatisch zu verknüpfen.
                        </p>
                    </div>
                </div>
            )}

            {/* Stammdaten */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Inventarnummer</label>
                    <input 
                        type="text" 
                        value={inventoryNumber}
                        onChange={(e) => setInventoryNumber(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bezeichnung</label>
                    <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        placeholder="z.B. Laptop HP ProBook"
                    />
                </div>
            </div>

            {/* Konto & Beleg */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Anlagekonto (SKR 03)</label>
                    <select 
                        required
                        value={glAccountId}
                        onChange={(e) => setGlAccountId(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    >
                        <option value="">-- Bitte wählen --</option>
                        {assetAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Anschaffung am</label>
                        <input 
                            type="date" 
                            required
                            value={purchaseDate}
                            onChange={(e) => setPurchaseDate(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Beleg-Nr.</label>
                        <input 
                            type="text" 
                            value={documentRef}
                            onChange={(e) => setDocumentRef(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="RE-..."
                        />
                    </div>
                </div>
            </div>

            {/* AfA Block */}
            <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
                <h3 className="text-sm font-bold text-emerald-800 uppercase mb-4 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2"/> Abschreibung (AfA)
                </h3>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Vorlage aus amtlicher AfA-Tabelle wählen
                    </label>
                    <select 
                        className="w-full p-2.5 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        onChange={handleAfaSelection}
                        defaultValue=""
                    >
                        <option value="" disabled>-- Bitte Anlagengruppe wählen --</option>
                        {afaTable.map((entry, idx) => (
                            <option key={idx} value={entry.label}>
                                {entry.label} ({entry.years} Jahre)
                            </option>
                        ))}
                        <option value="custom">Benutzerdefiniert / Andere</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center">
                        <HelpCircle className="w-3 h-3 mr-1"/> Quelle: AfA-Tabelle für die allgemein verwendbaren Anlagegüter (AV)
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nutzungsdauer (Jahre)</label>
                        <input 
                            type="number" 
                            min="0"
                            step="1"
                            value={usefulLifeYears}
                            onChange={(e) => {
                                setUsefulLifeYears(parseInt(e.target.value));
                                setAfaCategory('Benutzerdefiniert'); // Reset category label on manual change
                            }}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">AfA-Satz (Linear)</label>
                        <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono">
                            {currentRate} %
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Restwert / Erinnerungswert</label>
                        <input 
                            type="number" 
                            min="0"
                            step="1"
                            value={residualValue}
                            onChange={(e) => setResidualValue(parseFloat(e.target.value))}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Wert */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Anschaffungskosten (Netto ohne USt)</label>
                <div className="relative">
                    <input 
                        type="number" 
                        step="0.01"
                        required
                        value={cost || ''} 
                        onChange={(e) => setCost(parseFloat(e.target.value))} 
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-right font-bold text-xl"
                        placeholder="0.00"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                </div>
            </div>

        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors"
            >
              Abbrechen
            </button>
            <button 
              onClick={handleSubmit}
              className="flex items-center px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-md transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </button>
        </div>
      </div>
    </div>
  );
};
