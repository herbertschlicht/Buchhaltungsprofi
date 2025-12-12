
import React, { useState, useMemo } from 'react';
import { Transaction, Account, AccountType, Asset, TransactionType } from '../types';
import { Monitor, TrendingUp, Building2, Layers, Briefcase, Calendar, Info, Printer, Calculator, Save, PlusCircle, FileText, PenLine } from 'lucide-react';
import { AssetForm } from './AssetForm';

interface AssetAccountingViewProps {
  transactions: Transaction[];
  accounts: Account[];
  assets: Asset[];
  onBookDepreciation: (transaction: Transaction) => void;
  onSaveAsset?: (asset: Asset) => void; // New callback
}

// Helper to calculate depreciation for a specific year
const calculateAssetDepreciation = (asset: Asset, targetYear: number) => {
    // Wenn Nutzungsdauer 0 ist, ist das Gut nicht abnutzbar (z.B. Grund & Boden)
    if (asset.usefulLifeYears === 0) {
        return {
            currentAfA: 0,
            accumulatedAfA: 0,
            bookValue: asset.cost
        };
    }

    const purchaseDate = new Date(asset.purchaseDate);
    const purchaseYear = purchaseDate.getFullYear();
    const purchaseMonth = purchaseDate.getMonth() + 1; // 1-12

    // Simple Linear Depreciation Logic
    const yearlyAfA = asset.cost / asset.usefulLifeYears;
    
    // Check if asset is active in target year
    if (targetYear < purchaseYear) return { currentAfA: 0, accumulatedAfA: 0, bookValue: 0 };
    
    const endYear = purchaseYear + asset.usefulLifeYears;
    
    // Calculate Accumulated AfA up to BEGINNING of target year
    let accumulatedPrior = 0;
    for (let y = purchaseYear; y < targetYear; y++) {
        if (y === purchaseYear) {
            // Pro Rata Temporis for first year
            const months = 13 - purchaseMonth;
            accumulatedPrior += (yearlyAfA / 12) * months;
        } else if (y < endYear) {
            accumulatedPrior += yearlyAfA;
        }
    }

    // Calculate CURRENT Year AfA
    let currentAfA = 0;
    if (targetYear === purchaseYear) {
        const months = 13 - purchaseMonth;
        currentAfA = (yearlyAfA / 12) * months;
    } else if (targetYear < endYear) {
        currentAfA = yearlyAfA;
    } else if (targetYear === endYear) {
        const remainingVal = asset.cost - accumulatedPrior;
        currentAfA = Math.min(remainingVal, yearlyAfA);
    }

    // Safety Cap
    if (accumulatedPrior + currentAfA > asset.cost) {
        currentAfA = Math.max(0, asset.cost - accumulatedPrior);
    }

    const accumulatedTotal = accumulatedPrior + currentAfA;
    const bookValue = asset.cost - accumulatedTotal;

    return {
        currentAfA,
        accumulatedAfA: accumulatedTotal,
        bookValue
    };
};

export const AssetAccountingView: React.FC<AssetAccountingViewProps> = ({ transactions, accounts, assets, onBookDepreciation, onSaveAsset }) => {
  const currentYear = new Date().getFullYear();
  const [reportYear, setReportYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState<'register' | 'grid'>('register');
  
  // Modal State
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);

  // --- CALCULATION ENGINE ---
  const processedAssets = useMemo(() => {
      return assets.map(asset => {
          const stats = calculateAssetDepreciation(asset, reportYear);
          const account = accounts.find(a => a.id === asset.glAccountId);
          
          // Calculate Rate %
          const ratePercent = asset.usefulLifeYears > 0 ? (100 / asset.usefulLifeYears).toFixed(1) + '%' : '-';

          return {
              ...asset,
              accountCode: account?.code || '???',
              accountName: account?.name || 'Unbekannt',
              ratePercent,
              ...stats
          };
      });
  }, [assets, reportYear, accounts]);

  // Totals
  const totalCost = processedAssets.reduce((sum, a) => sum + a.cost, 0);
  const totalCurrentAfA = processedAssets.reduce((sum, a) => sum + a.currentAfA, 0);
  const totalBookValue = processedAssets.reduce((sum, a) => sum + a.bookValue, 0);

  // Group by Account for "Anlagenspiegel" (Grid)
  const groupedByAccount = useMemo(() => {
      const groups: Record<string, { code: string, name: string, ahk: number, currentAfA: number, bookValue: number }> = {};
      
      processedAssets.forEach(asset => {
          if (!groups[asset.glAccountId]) {
              groups[asset.glAccountId] = {
                  code: asset.accountCode,
                  name: asset.accountName,
                  ahk: 0,
                  currentAfA: 0,
                  bookValue: 0
              };
          }
          groups[asset.glAccountId].ahk += asset.cost;
          groups[asset.glAccountId].currentAfA += asset.currentAfA;
          groups[asset.glAccountId].bookValue += asset.bookValue;
      });
      return Object.values(groups).sort((a,b) => a.code.localeCompare(b.code));
  }, [processedAssets]);

  // Action: Book Depreciation
  const handleRunDepreciation = () => {
      if (totalCurrentAfA <= 0) {
          alert("Keine Abschreibung für dieses Jahr zu buchen.");
          return;
      }

      if (!window.confirm(`Soll die Jahresabschreibung von ${totalCurrentAfA.toLocaleString()} € für das Jahr ${reportYear} jetzt gebucht werden?\n\nDies erzeugt eine Sammelbuchung.`)) {
          return;
      }

      // Create Booking Lines
      const expenseAccount = accounts.find(a => a.code === '4830');
      if (!expenseAccount) {
          alert("Fehler: Konto 4830 (Abschreibungen) nicht gefunden.");
          return;
      }

      const lines = [
          // Debit Total Expense
          { accountId: expenseAccount.id, debit: totalCurrentAfA, credit: 0 }
      ];

      // Credit individual Asset Accounts
      groupedByAccount.forEach(group => {
          if (group.currentAfA > 0) {
              const acc = accounts.find(a => a.code === group.code);
              if (acc) {
                  lines.push({ accountId: acc.id, debit: 0, credit: group.currentAfA });
              }
          }
      });

      const transaction: Transaction = {
          id: crypto.randomUUID(),
          date: `${reportYear}-12-31`,
          type: TransactionType.DEPRECIATION,
          reference: `AfA-${reportYear}`,
          description: `Jahresabschreibung ${reportYear} gem. Anlagenverzeichnis`,
          lines
      };

      onBookDepreciation(transaction);
  };

  const handleEditAsset = (asset: Asset) => {
      setEditingAsset(asset);
      setShowAssetForm(true);
  };

  const handleCreateAsset = () => {
      setEditingAsset(undefined);
      setShowAssetForm(true);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
              <Monitor className="w-6 h-6 mr-3 text-emerald-600"/>
              Anlagenbuchhaltung (Inventar)
          </h2>
          <p className="text-slate-500">Verwaltung der Wirtschaftsgüter und Ermittlung der Abschreibungen.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-2 rounded-lg shadow-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
                <label className="text-xs font-semibold text-slate-500 mr-2">Wirtschaftsjahr:</label>
                <input 
                    type="number" 
                    value={reportYear}
                    onChange={(e) => setReportYear(parseInt(e.target.value))}
                    className="w-16 text-sm bg-transparent border-none focus:ring-0 text-slate-800 font-bold outline-none"
                />
            </div>
             <button onClick={handlePrint} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 bg-white border border-slate-300 px-3 py-2 rounded-lg shadow-sm transition-colors">
                <Printer className="w-4 h-4"/> Drucken
            </button>
            {onSaveAsset && (
                <button 
                    onClick={handleCreateAsset} 
                    title="Nur für manuelle Erfassung (z.B. Altbestand, Einlagen). Neukäufe bitte über die Eingangsrechnung erfassen!"
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-emerald-700 transition-colors"
                >
                    <PlusCircle className="w-4 h-4"/> Manuelle Erfassung
                </button>
            )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold">Anschaffungskosten (Gesamt)</p>
              <p className="text-2xl font-bold text-slate-800">{totalCost.toLocaleString()} €</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
              <p className="text-xs text-emerald-700 uppercase font-bold">Buchwert per 31.12.{reportYear}</p>
              <p className="text-2xl font-bold text-emerald-800">{totalBookValue.toLocaleString()} €</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-xs text-orange-700 uppercase font-bold">Jahres-AfA {reportYear}</p>
                <p className="text-2xl font-bold text-orange-800">{totalCurrentAfA.toLocaleString()} €</p>
              </div>
              <button 
                onClick={handleRunDepreciation}
                className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-lg shadow-md transition-all active:scale-95"
                title="Abschreibung buchen"
              >
                  <Calculator className="w-6 h-6"/>
              </button>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit no-print">
          <button onClick={() => setActiveTab('register')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'register' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
              Anlagenverzeichnis (Einzeln)
          </button>
          <button onClick={() => setActiveTab('grid')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
              Anlagenspiegel (Summiert)
          </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col print:border-none print:shadow-none">
          
          {/* Print Header */}
          <div className="hidden print:block p-8 pb-0">
              <h1 className="text-2xl font-bold">Anlagenverzeichnis {reportYear}</h1>
              <p className="text-sm text-slate-500">Inventarliste und Abschreibungsermittlung gem. HGB/EStG</p>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200 sticky top-0 z-10 print:static">
                    <tr>
                        {activeTab === 'register' ? (
                            <>
                                <th className="p-4 w-20">Inv-Nr.</th>
                                <th className="p-4">Gegenstand / Konto</th>
                                <th className="p-4 w-32">Zugang</th>
                                <th className="p-4 w-32">Beleg</th>
                                <th className="p-4 text-center">ND / Satz</th>
                                <th className="p-4 w-32 text-center">AfA-Art</th>
                                <th className="p-4 text-right">AHK (Netto)</th>
                                <th className="p-4 text-right bg-orange-50/50">AfA {reportYear}</th>
                                <th className="p-4 text-right bg-emerald-50/50">Buchwert</th>
                                {onSaveAsset && <th className="p-4 w-10 no-print"></th>}
                            </>
                        ) : (
                            <>
                                <th className="p-4">Anlagekonto</th>
                                <th className="p-4 text-right">Summe AHK</th>
                                <th className="p-4 text-right bg-orange-50/50">Summe Jahres-AfA</th>
                                <th className="p-4 text-right bg-emerald-50/50">Summe Restbuchwert</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {activeTab === 'register' && processedAssets.map(asset => (
                        <tr key={asset.id} className="hover:bg-slate-50 group">
                            {/* Inventory Nr */}
                            <td className="p-4 text-sm font-mono text-slate-500">{asset.inventoryNumber}</td>
                            
                            {/* Description & Account */}
                            <td className="p-4 text-sm font-bold text-slate-800">
                                <div className="truncate max-w-[200px]" title={asset.name}>{asset.name}</div>
                                <div className="text-xs text-slate-500 font-normal flex items-center mt-1">
                                    <span className="bg-slate-100 px-1 rounded font-mono mr-1">{asset.accountCode}</span>
                                    {asset.accountName}
                                </div>
                            </td>

                            {/* Purchase Date */}
                            <td className="p-4 text-sm text-slate-600">
                                {new Date(asset.purchaseDate).toLocaleDateString('de-DE')}
                            </td>

                            {/* Document Ref (Beleg) */}
                            <td className="p-4 text-sm text-slate-600 font-mono">
                                {asset.documentRef ? (
                                    <span className="flex items-center gap-1">
                                        <FileText className="w-3 h-3 text-slate-400"/> {asset.documentRef}
                                    </span>
                                ) : '-'}
                            </td>

                            {/* Useful Life & Rate */}
                            <td className="p-4 text-sm text-center">
                                {asset.usefulLifeYears === 0 ? (
                                    <span className="text-slate-400">-</span>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold">{asset.usefulLifeYears} J</span>
                                        <span className="text-xs text-slate-500">({asset.ratePercent})</span>
                                    </div>
                                )}
                            </td>

                            {/* AfA Type / Table Ref */}
                            <td className="p-4 text-sm text-center text-slate-500">
                                {asset.afaCategory || (asset.usefulLifeYears === 0 ? 'Nicht abnutzbar' : 'Lin. AfA')}
                            </td>

                            {/* Cost (AHK) */}
                            <td className="p-4 text-sm text-right font-mono">{asset.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</td>
                            
                            {/* Current AfA */}
                            <td className="p-4 text-sm text-right font-mono font-bold text-orange-700 bg-orange-50/20">
                                {asset.currentAfA.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                            </td>
                            
                            {/* Book Value */}
                            <td className="p-4 text-sm text-right font-mono font-bold text-emerald-700 bg-emerald-50/20">
                                {asset.bookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                            </td>

                            {/* Edit Action */}
                            {onSaveAsset && (
                                <td className="p-4 text-right no-print">
                                    <button 
                                        onClick={() => handleEditAsset(asset)}
                                        className="text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Bearbeiten"
                                    >
                                        <PenLine className="w-4 h-4"/>
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}

                    {activeTab === 'grid' && groupedByAccount.map(group => (
                        <tr key={group.code} className="hover:bg-slate-50">
                            <td className="p-4 text-sm font-medium text-slate-800">
                                <span className="font-mono text-slate-500 mr-2">{group.code}</span>
                                {group.name}
                            </td>
                            <td className="p-4 text-sm text-right font-mono">{group.ahk.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</td>
                            <td className="p-4 text-sm text-right font-mono font-bold text-orange-700 bg-orange-50/20">{group.currentAfA.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</td>
                            <td className="p-4 text-sm text-right font-mono font-bold text-emerald-700 bg-emerald-50/20">{group.bookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</td>
                        </tr>
                    ))}

                    {processedAssets.length === 0 && (
                        <tr><td colSpan={10} className="p-8 text-center text-slate-400">Keine Anlagegüter vorhanden.</td></tr>
                    )}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800 text-sm">
                    <tr>
                        <td colSpan={activeTab === 'register' ? 6 : 1} className="p-4 uppercase tracking-wider text-right">Summe</td>
                        <td className="p-4 text-right">{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</td>
                        <td className="p-4 text-right text-orange-800">{totalCurrentAfA.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</td>
                        <td className="p-4 text-right text-emerald-800">{totalBookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</td>
                        {activeTab === 'register' && onSaveAsset && <td></td>}
                    </tr>
                </tfoot>
            </table>
          </div>
      </div>

      {showAssetForm && onSaveAsset && (
          <AssetForm 
              accounts={accounts}
              existingAsset={editingAsset}
              onSave={(asset) => {
                  onSaveAsset(asset);
                  setShowAssetForm(false);
              }}
              onClose={() => setShowAssetForm(false)}
          />
      )}
    </div>
  );
};
