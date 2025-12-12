import React, { useState } from 'react';
import { CompanySettings, DunningLevelConfig } from '../types';
import { Save, Building2, BadgeEuro, CreditCard, FileText, AlertCircle, CheckCircle, RotateCcw, Trash2 } from 'lucide-react';

interface SettingsViewProps {
  settings: CompanySettings;
  onUpdate: (newSettings: CompanySettings) => void;
  onResetData?: () => void; // New prop for resetting data
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate, onResetData }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'dunning'>('general');
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [saved, setSaved] = useState(false);

  // Initialize dunningConfig if it doesn't exist (safety fallback)
  if (!formData.dunningConfig) {
      formData.dunningConfig = {
          level1: { title: 'Erinnerung', subjectTemplate: '', bodyTemplate: '', fee: 0, daysToPay: 7 },
          level2: { title: '1. Mahnung', subjectTemplate: '', bodyTemplate: '', fee: 5, daysToPay: 5 },
          level3: { title: '2. Mahnung', subjectTemplate: '', bodyTemplate: '', fee: 10, daysToPay: 3 }
      };
  }

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  // Helper to update nested dunning config
  const handleDunningChange = (level: 'level1' | 'level2' | 'level3', field: keyof DunningLevelConfig, value: string | number) => {
      if (!formData.dunningConfig) return;
      
      setFormData(prev => ({
          ...prev,
          dunningConfig: {
              ...prev.dunningConfig!,
              [level]: {
                  ...prev.dunningConfig![level],
                  [field]: value
              }
          }
      }));
      setSaved(false);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
      if (window.confirm("ACHTUNG: Möchten Sie wirklich alle lokalen Daten (Buchungen, Rechnungen, Kontakte) löschen und auf die Demo-Daten zurücksetzen? Dies kann nicht rückgängig gemacht werden.")) {
          if (onResetData) onResetData();
      }
  };

  const renderDunningLevel = (levelKey: 'level1' | 'level2' | 'level3', defaultTitle: string, colorClass: string) => {
      const config = formData.dunningConfig![levelKey];
      return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${colorClass} border-slate-200 mb-6`}>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-slate-500"/> {defaultTitle}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dokumententitel</label>
                    <input 
                        type="text" 
                        value={config.title}
                        onChange={(e) => handleDunningChange(levelKey, 'title', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mahngebühr (€)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={config.fee}
                        onChange={(e) => handleDunningChange(levelKey, 'fee', parseFloat(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frist (Tage)</label>
                    <input 
                        type="number" 
                        value={config.daysToPay}
                        onChange={(e) => handleDunningChange(levelKey, 'daysToPay', parseInt(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Betreffzeile (Template)</label>
                <input 
                    type="text" 
                    value={config.subjectTemplate}
                    onChange={(e) => handleDunningChange(levelKey, 'subjectTemplate', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Anschreiben Text (Template)</label>
                <textarea 
                    rows={6}
                    value={config.bodyTemplate}
                    onChange={(e) => handleDunningChange(levelKey, 'bodyTemplate', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono whitespace-pre-wrap"
                />
            </div>
        </div>
      );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Einstellungen</h2>
            <p className="text-slate-500">Verwaltung Ihrer Unternehmensdaten und Konfiguration.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'general' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
             <Building2 className="w-4 h-4 mr-2"/> Stammdaten
          </button>
          <button 
            onClick={() => setActiveTab('dunning')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'dunning' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
             <AlertCircle className="w-4 h-4 mr-2"/> Mahnwesen Konfiguration
          </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {activeTab === 'general' && (
            <div className="space-y-6 animate-fadeIn">
                {/* General Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <Building2 className="w-5 h-5 mr-2 text-blue-600"/> Allgemeines & Adresse
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Firmenname</label>
                            <input 
                                type="text" 
                                value={formData.companyName}
                                onChange={(e) => handleChange('companyName', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Geschäftsführer / Inhaber</label>
                            <input 
                                type="text" 
                                value={formData.ceo}
                                onChange={(e) => handleChange('ceo', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Straße & Hausnummer</label>
                            <input 
                                type="text" 
                                value={formData.street}
                                onChange={(e) => handleChange('street', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">PLZ</label>
                                <input 
                                    type="text" 
                                    value={formData.zip}
                                    onChange={(e) => handleChange('zip', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Ort</label>
                                <input 
                                    type="text" 
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Land</label>
                            <input 
                                type="text" 
                                value={formData.country}
                                onChange={(e) => handleChange('country', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Tax & Legal */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <BadgeEuro className="w-5 h-5 mr-2 text-slate-500"/> Steuern & Register
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Steuernummer (wichtig für UStVA)</label>
                            <input 
                                type="text" 
                                value={formData.taxNumber}
                                onChange={(e) => handleChange('taxNumber', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="12/345/67890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">USt-IdNr.</label>
                            <input 
                                type="text" 
                                value={formData.vatId}
                                onChange={(e) => handleChange('vatId', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="DE..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Handelsregister-Nr.</label>
                            <input 
                                type="text" 
                                value={formData.registerNumber}
                                onChange={(e) => handleChange('registerNumber', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="HRB 12345"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Amtsgericht</label>
                            <input 
                                type="text" 
                                value={formData.registerCourt}
                                onChange={(e) => handleChange('registerCourt', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Bank & Contact */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-slate-500"/> Bank & Kommunikation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Bankname</label>
                            <input 
                                type="text" 
                                value={formData.bankName}
                                onChange={(e) => handleChange('bankName', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">IBAN</label>
                            <input 
                                type="text" 
                                value={formData.iban}
                                onChange={(e) => handleChange('iban', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">BIC</label>
                            <input 
                                type="text" 
                                value={formData.bic}
                                onChange={(e) => handleChange('bic', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">E-Mail (Absender)</label>
                            <input 
                                type="email" 
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Telefon</label>
                            <input 
                                type="text" 
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Webseite</label>
                            <input 
                                type="text" 
                                value={formData.website}
                                onChange={(e) => handleChange('website', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'dunning' && formData.dunningConfig && (
             <div className="space-y-6 animate-fadeIn">
                 
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                     <strong>Hinweis zu Platzhaltern:</strong><br/>
                     Sie können folgende Platzhalter in den Texten verwenden, diese werden beim Erstellen automatisch ersetzt:<br/>
                     <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 font-mono text-xs">
                         <span>[NR] = Rechnungsnummer</span>
                         <span>[DATUM] = Rechnungsdatum</span>
                         <span>[BETRAG] = Offener Betrag</span>
                         <span>[GEBUEHR] = Mahngebühr</span>
                         <span>[GESAMT] = Gesamtbetrag</span>
                         <span>[FRIST] = Neues Zahldatum</span>
                     </div>
                 </div>

                 {renderDunningLevel('level1', 'Stufe 1 (Erinnerung)', 'border-slate-400')}
                 {renderDunningLevel('level2', 'Stufe 2 (1. Mahnung)', 'border-yellow-400')}
                 {renderDunningLevel('level3', 'Stufe 3 (2. Mahnung)', 'border-red-600')}

             </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
             {onResetData && (
                 <button 
                    type="button"
                    onClick={handleReset}
                    className="flex items-center text-red-600 hover:text-red-800 text-xs font-bold transition-colors"
                 >
                     <Trash2 className="w-4 h-4 mr-1"/> Daten zurücksetzen (Demo)
                 </button>
             )}

             <div className="flex items-center">
                {saved && (
                    <span className="flex items-center text-green-600 mr-4 font-bold animate-fadeIn">
                        <CheckCircle className="w-5 h-5 mr-2"/> Gespeichert!
                    </span>
                )}
                <button 
                    type="submit"
                    className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95"
                >
                    <Save className="w-5 h-5 mr-2" />
                    Einstellungen speichern
                </button>
             </div>
        </div>

      </form>
    </div>
  );
};