

import React, { useState, useEffect } from 'react';
import { Contact, ContactType, ContactPerson, CostCenter, Project } from '../types';
import { 
  X, Save, User, Mail, Building, MapPin, Phone, Globe, FileText, 
  BadgeEuro, UserCircle, CreditCard, Loader2, AlertTriangle, 
  Info, Plus, Trash2, Printer, ShieldAlert, Truck, Briefcase, Target,
  // Added missing CheckCircle import
  CheckCircle 
} from 'lucide-react';

interface ContactFormProps {
  type: ContactType;
  nextId: string;
  costCenters?: CostCenter[];
  projects?: Project[];
  onSave: (contact: Contact) => void;
  onClose: () => void;
}

type TabType = 'identity' | 'address' | 'finance' | 'bank' | 'internal';

export const ContactForm: React.FC<ContactFormProps> = ({ 
    type, nextId, costCenters = [], projects = [], onSave, onClose 
}) => {
  const isVendor = type === ContactType.VENDOR;
  const [activeTab, setActiveTab] = useState<TabType>('identity');

  // FORM STATE
  const [formData, setFormData] = useState<Partial<Contact>>({
    id: nextId,
    type: type,
    name: '',
    country: 'Deutschland',
    taxStatus: 'DOMESTIC',
    paymentTermsDays: 14,
    discountRate: 0,
    discountDays: 0,
    isBlocked: false,
    contactPersons: [{ name: '', role: isVendor ? 'Einkauf' : 'Geschäftsführung', email: '', phone: '' }]
  });

  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [isBankLoading, setIsBankLoading] = useState(false);

  const updateField = (field: keyof Contact, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleZipLookup = async (zip: string) => {
    updateField('zip', zip);
    if (formData.country === 'Deutschland' && zip.length === 5) {
      setIsLoadingCity(true);
      try {
        const response = await fetch(`https://api.zippopotam.us/de/${zip}`);
        if (response.ok) {
          const data = await response.json();
          if (data.places?.[0]) updateField('city', data.places[0]['place name']);
        }
      } catch (e) {} finally { setIsLoadingCity(false); }
    }
  };

  const handleIbanChange = (val: string) => {
    let raw = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (/^\d/.test(raw)) raw = 'DE' + raw;
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    updateField('iban', formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
        alert("Bitte geben Sie einen Namen an.");
        return;
    }
    onSave(formData as Contact);
    onClose();
  };

  const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
        activeTab === id 
          ? `border-${isVendor ? 'orange' : 'blue'}-600 text-${isVendor ? 'orange' : 'blue'}-700 bg-${isVendor ? 'orange' : 'blue'}-50/30` 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center ${isVendor ? 'bg-orange-50' : 'bg-blue-50'}`}>
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
               {isVendor ? <Briefcase className="w-6 h-6 mr-2 text-orange-600"/> : <UserCircle className="w-6 h-6 mr-2 text-blue-600"/>}
               {isVendor ? 'Kreditoren-Stammdaten' : 'Debitoren-Stammdaten'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Ident-Nr: <span className="font-mono font-bold text-slate-700">{formData.id}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-full transition-all"><X className="w-6 h-6" /></button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto no-scrollbar">
          <TabButton id="identity" label="Identität & Kontakt" icon={User} />
          <TabButton id="address" label="Adresse & Lieferung" icon={MapPin} />
          <TabButton id="finance" label="Finanzen & Steuer" icon={BadgeEuro} />
          <TabButton id="bank" label="Bank & SEPA" icon={CreditCard} />
          <TabButton id="internal" label="Intern & Mahnwesen" icon={ShieldAlert} />
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
          
          {activeTab === 'identity' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isVendor ? 'Firmenname / Lieferant *' : 'Kundenname / Firma *'}</label>
                    <input type="text" required value={formData.name} onChange={e => updateField('name', e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg" placeholder="z.B. Musterbau GmbH"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-Mail (Zentral)</label>
                    <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} className="w-full p-2.5 border rounded-lg" placeholder="info@firma.de"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefon</label>
                    <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)} className="w-full p-2.5 border rounded-lg" placeholder="+49..."/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fax</label>
                    <input type="tel" value={formData.fax} onChange={e => updateField('fax', e.target.value)} className="w-full p-2.5 border rounded-lg"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Webseite</label>
                    <input type="url" value={formData.website} onChange={e => updateField('website', e.target.value)} className="w-full p-2.5 border rounded-lg" placeholder="https://..."/>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><UserCircle className="w-4 h-4 mr-2 text-slate-400"/> Ansprechpartner</h3>
                {formData.contactPersons?.map((cp, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-2 relative group">
                    <input type="text" value={cp.name} onChange={e => {
                      const newCp = [...(formData.contactPersons || [])];
                      newCp[idx].name = e.target.value;
                      updateField('contactPersons', newCp);
                    }} placeholder="Name" className="p-2 border rounded-lg text-sm"/>
                    <input type="text" value={cp.role} onChange={e => {
                      const newCp = [...(formData.contactPersons || [])];
                      newCp[idx].role = e.target.value;
                      updateField('contactPersons', newCp);
                    }} placeholder="Funktion" className="p-2 border rounded-lg text-sm"/>
                    <input type="email" value={cp.email} onChange={e => {
                      const newCp = [...(formData.contactPersons || [])];
                      newCp[idx].email = e.target.value;
                      updateField('contactPersons', newCp);
                    }} placeholder="E-Mail" className="p-2 border rounded-lg text-sm"/>
                  </div>
                ))}
                <button type="button" onClick={() => updateField('contactPersons', [...(formData.contactPersons || []), {name: '', role: ''}])} className="text-xs font-bold text-blue-600 flex items-center mt-2 hover:underline"><Plus className="w-3 h-3 mr-1"/> Weiteren Ansprechpartner hinzufügen</button>
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Straße & Hausnummer</label>
                    <input type="text" value={formData.street} onChange={e => updateField('street', e.target.value)} className="w-full p-2.5 border rounded-lg"/>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PLZ</label>
                    <input type="text" value={formData.zip} onChange={e => handleZipLookup(e.target.value)} className="w-full p-2.5 border rounded-lg"/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
                        Ort {isLoadingCity && <Loader2 className="w-3 h-3 animate-spin"/>}
                    </label>
                    <input type="text" value={formData.city} onChange={e => updateField('city', e.target.value)} className="w-full p-2.5 border rounded-lg"/>
                  </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Land</label>
                    <input type="text" value={formData.country} onChange={e => updateField('country', e.target.value)} className="w-full p-2.5 border rounded-lg"/>
                </div>
              </div>

              {isVendor && (
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><Truck className="w-4 h-4 mr-2 text-slate-400"/> Lieferdetails</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lieferbedingungen</label>
                            <input type="text" value={formData.deliveryTerms} onChange={e => updateField('deliveryTerms', e.target.value)} className="w-full p-2.5 border rounded-lg" placeholder="z.B. frei Haus"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Versandart</label>
                            {/* Corrected field name from preferredShippingMethod to shippingMethod to match interface */}
                            <input type="text" value={formData.shippingMethod} onChange={e => updateField('shippingMethod', e.target.value)} className="w-full p-2.5 border rounded-lg" placeholder="z.B. Spedition / Paket"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Abweichende Lieferadresse</label>
                        <textarea value={formData.altDeliveryAddress} onChange={e => updateField('altDeliveryAddress', e.target.value)} className="w-full p-2.5 border rounded-lg h-20 text-sm" placeholder="Nur falls abweichend..."/>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zahlungsziel (Tage)</label>
                    <input type="number" value={formData.paymentTermsDays} onChange={e => updateField('paymentTermsDays', parseInt(e.target.value))} className="w-full p-2.5 border rounded-lg font-bold"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Skonto (%)</label>
                    <input type="number" step="0.1" value={formData.discountRate} onChange={e => updateField('discountRate', parseFloat(e.target.value))} className="w-full p-2.5 border rounded-lg"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">innerhalb (Tagen)</label>
                    <input type="number" value={formData.discountDays} onChange={e => updateField('discountDays', parseInt(e.target.value))} className="w-full p-2.5 border rounded-lg"/>
                  </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kreditlimit (€)</label>
                    <input type="number" value={formData.creditLimit} onChange={e => updateField('creditLimit', parseFloat(e.target.value))} className="w-full p-2.5 border rounded-lg"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{isVendor ? 'Kreditorenkonto' : 'Debitorenkonto'}</label>
                    <input type="text" value={formData.glAccount} onChange={e => updateField('glAccount', e.target.value)} className="w-full p-2.5 border rounded-lg font-mono" placeholder={isVendor ? 'z.B. 1600' : 'z.B. 1400'}/>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><BadgeEuro className="w-4 h-4 mr-2 text-slate-400"/> Steuerdaten</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">USt-IdNr.</label>
                        <input type="text" value={formData.vatId} onChange={e => updateField('vatId', e.target.value.toUpperCase())} className="w-full p-2.5 border rounded-lg font-mono" placeholder="DE123456789"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Steuerstatus</label>
                        <select value={formData.taxStatus} onChange={e => updateField('taxStatus', e.target.value)} className="w-full p-2.5 border rounded-lg bg-white">
                            <option value="DOMESTIC">Inland</option>
                            <option value="EU">EU-Ausland (Reverse Charge)</option>
                            <option value="THIRD">Drittland (Steuerfrei)</option>
                        </select>
                    </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bankname</label>
                      <input type="text" value={formData.bankName} onChange={e => updateField('bankName', e.target.value)} className="w-full p-2.5 border rounded-lg"/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">IBAN</label>
                        <input type="text" value={formData.iban} onChange={e => handleIbanChange(e.target.value)} className="w-full p-2.5 border rounded-lg font-mono" placeholder="DE..."/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">BIC</label>
                        <input type="text" value={formData.bic} onChange={e => updateField('bic', e.target.value.toUpperCase())} className="w-full p-2.5 border rounded-lg font-mono"/>
                    </div>
                  </div>
                </div>

                {!isVendor && (
                  <div className="pt-4">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-slate-400"/> SEPA-Lastschriftmandat</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mandatsreferenz</label>
                            <input type="text" value={formData.sepaMandateReference} onChange={e => updateField('sepaMandateReference', e.target.value)} className="w-full p-2