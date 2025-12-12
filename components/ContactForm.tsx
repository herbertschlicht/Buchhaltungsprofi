import React, { useState, useEffect } from 'react';
import { Contact, ContactType, ContactPerson } from '../types';
import { X, Save, User, Mail, Building, MapPin, Phone, Globe, FileText, BadgeEuro, UserCircle, CreditCard, Loader2, AlertTriangle, Info, Plus, Trash2 } from 'lucide-react';

interface ContactFormProps {
  type: ContactType;
  nextId: string;
  onSave: (contact: Contact) => void;
  onClose: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ type, nextId, onSave, onClose }) => {
  // Base Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Contact Persons List (Multiple)
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
      { name: '', role: 'Geschäftsführung', email: '', phone: '' }
  ]);

  // Address
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Deutschland');
  const [isLoadingCity, setIsLoadingCity] = useState(false);

  // Bank
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [bankName, setBankName] = useState('');
  const [isBankLoading, setIsBankLoading] = useState(false);
  const [showBankWarning, setShowBankWarning] = useState(false);

  // Legal
  const [vatId, setVatId] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');

  // --- CONTACT PERSON LOGIC ---
  const addContactPerson = () => {
      setContactPersons([...contactPersons, { name: '', role: '', email: '', phone: '' }]);
  };

  const removeContactPerson = (index: number) => {
      const newList = contactPersons.filter((_, i) => i !== index);
      setContactPersons(newList);
  };

  const updateContactPerson = (index: number, field: keyof ContactPerson, value: string) => {
      const newList = [...contactPersons];
      newList[index] = { ...newList[index], [field]: value };
      setContactPersons(newList);
  };

  // --- AUTOMATION LOGIC ---

  // 1. Automatic City Lookup via ZIP (Germany only)
  const handleZipChange = async (value: string) => {
      setZip(value);

      // Normalize country check
      const isGermany = ['deutschland', 'germany', 'de'].includes(country.toLowerCase());

      // Only attempt lookup for Germany and 5 digits
      if (isGermany && value.length === 5 && /^\d+$/.test(value)) {
          setIsLoadingCity(true);
          try {
              // Using zippopotam.us for free ZIP lookup
              const response = await fetch(`https://api.zippopotam.us/de/${value}`);
              if (response.ok) {
                  const data = await response.json();
                  if (data.places && data.places.length > 0) {
                      setCity(data.places[0]['place name']);
                  }
              }
          } catch (e) {
              // Silent fail, user can type manually
              console.warn("ZIP lookup failed", e);
          } finally {
              setIsLoadingCity(false);
          }
      }
  };

  // 2. Smart IBAN Formatting & Auto-Lookup
  useEffect(() => {
    const fetchBankData = async () => {
        const cleanIban = iban.replace(/[^A-Z0-9]/g, '');
        
        // Basic length check to avoid spamming API (DE is 22, min IBAN is usually 15)
        if (cleanIban.length >= 20) {
            setIsBankLoading(true);
            try {
                // Using openiban.com (free public API)
                const response = await fetch(`https://openiban.com/validate/${cleanIban}?getBIC=true&validateBankCode=true`);
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.valid && data.bankData) {
                        // Only auto-fill if fields are empty to not overwrite user corrections
                        if (!bic || bic === data.bankData.bic) setBic(data.bankData.bic || '');
                        if (!bankName || bankName === data.bankData.name) setBankName(data.bankData.name || '');
                        
                        // Show warning that data was auto-filled
                        setShowBankWarning(true);
                    }
                }
            } catch (error) {
                console.warn("Bank lookup failed", error);
            } finally {
                setIsBankLoading(false);
            }
        } else {
            setShowBankWarning(false);
        }
    };

    // Debounce the call slightly
    const timer = setTimeout(() => {
        if (iban) fetchBankData();
    }, 800);

    return () => clearTimeout(timer);
  }, [iban]); // Dependency on IBAN

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    let raw = val.replace(/[^A-Z0-9]/g, '');

    // Smart Auto-DE
    if (/^\d/.test(raw)) {
        raw = 'DE' + raw;
    }

    // Formatting 4-blocks
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;

    setIban(formatted);
    // Hide warning if user clears input
    if (raw.length < 10) setShowBankWarning(false);
  };

  // 3. Smart VAT ID Input (for consistency)
  const handleVatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.toUpperCase();
      val = val.replace(/[^A-Z0-9]/g, '');
      const isGermany = ['deutschland', 'germany', 'de'].includes(country.toLowerCase());

      if (isGermany && val.length > 0 && /^\d/.test(val)) {
          val = 'DE' + val;
      }
      setVatId(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    // Filter empty contacts
    const validContactPersons = contactPersons.filter(cp => cp.name.trim() !== '');

    const newContact: Contact = {
      id: nextId,
      name,
      type,
      email: email || undefined,
      phone: phone || undefined,
      website: website || undefined,
      contactPersons: validContactPersons.length > 0 ? validContactPersons : undefined,
      street: street || undefined,
      zip: zip || undefined,
      city: city || undefined,
      country: country || undefined,
      iban: iban || undefined,
      bic: bic || undefined,
      bankName: bankName || undefined,
      vatId: vatId || undefined,
      taxNumber: taxNumber || undefined,
      registerNumber: registerNumber || undefined
    };

    onSave(newContact);
    onClose();
  };

  const title = type === ContactType.CUSTOMER ? 'Neuen Kunden anlegen' : 'Neuen Lieferanten anlegen';
  const label = type === ContactType.CUSTOMER ? 'Debitor' : 'Kreditor';
  const isVendor = type === ContactType.VENDOR;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center ${isVendor ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-slate-100'}`}>
          <h2 className={`text-lg font-bold flex items-center ${isVendor ? 'text-orange-800' : 'text-slate-800'}`}>
             <User className={`w-5 h-5 mr-2 ${isVendor ? 'text-orange-600' : 'text-blue-600'}`}/>
             {title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 1. SECTION: BASISDATEN */}
            <div className="space-y-4">
                <div className={`border p-3 rounded-lg flex justify-between items-center mb-4 ${isVendor ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'}`}>
                    <span className={`text-sm font-medium ${isVendor ? 'text-orange-800' : 'text-blue-800'}`}>Automatische Nummer ({label}):</span>
                    <span className={`font-mono font-bold text-lg ${isVendor ? 'text-orange-700' : 'text-blue-700'}`}>{nextId}</span>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Firmenname / Nachname *</label>
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                        <input 
                            type="text" 
                            required
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                            placeholder="z.B. Muster GmbH"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">E-Mail (Rechnungsempfang)</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="buchhaltung@firma.de"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Zentrale Adresse für Rechnungen</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Telefon (Zentrale)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                            <input 
                                type="tel" 
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)} 
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="+49 123 45678"
                            />
                        </div>
                    </div>
                </div>
            </div>

             {/* 2. SECTION: ANSPRECHPARTNER (MULTIPLE) */}
             <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center">
                        <UserCircle className="w-4 h-4 mr-2 text-slate-500"/> Ansprechpartner & Geschäftsführung
                    </h3>
                </div>
                
                <div className="space-y-3">
                    {contactPersons.map((person, index) => (
                        <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg relative group">
                            {/* Remove Button (only if more than 1 or not first) */}
                            {contactPersons.length > 0 && (
                                <button 
                                    type="button"
                                    onClick={() => removeContactPerson(index)}
                                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Entfernen"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rolle / Funktion</label>
                                    <input 
                                        type="text" 
                                        list="roles"
                                        value={person.role}
                                        onChange={(e) => updateContactPerson(index, 'role', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                                        placeholder="z.B. Geschäftsführung"
                                    />
                                    <datalist id="roles">
                                        <option value="Geschäftsführung" />
                                        <option value="Inhaber/in" />
                                        <option value="Buchhaltung" />
                                        <option value="Vertrieb" />
                                        <option value="Einkauf" />
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name</label>
                                    <input 
                                        type="text" 
                                        value={person.name}
                                        onChange={(e) => updateContactPerson(index, 'name', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="Max Mustermann"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="relative">
                                     <Mail className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3"/>
                                     <input 
                                        type="email" 
                                        value={person.email || ''}
                                        onChange={(e) => updateContactPerson(index, 'email', e.target.value)}
                                        className="w-full pl-7 pr-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                                        placeholder="Persönliche E-Mail"
                                    />
                                </div>
                                <div className="relative">
                                     <Phone className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3"/>
                                     <input 
                                        type="tel" 
                                        value={person.phone || ''}
                                        onChange={(e) => updateContactPerson(index, 'phone', e.target.value)}
                                        className="w-full pl-7 pr-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                                        placeholder="Durchwahl / Mobil"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <button 
                        type="button"
                        onClick={addContactPerson}
                        className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs font-medium flex items-center justify-center"
                    >
                        <Plus className="w-3 h-3 mr-1" /> Weiteren Ansprechpartner hinzufügen
                    </button>
                </div>
            </div>

            {/* 3. SECTION: ANSCHRIFT */}
            <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center mb-4">
                    <MapPin className="w-4 h-4 mr-2 text-slate-500"/> Anschrift
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Straße & Hausnummer</label>
                        <input 
                            type="text" 
                            value={street} 
                            onChange={(e) => setStreet(e.target.value)} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Musterstraße 1"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                         <div className="col-span-1 relative">
                            <label className="block text-xs font-medium text-slate-500 mb-1">PLZ</label>
                            <input 
                                type="text" 
                                value={zip} 
                                onChange={(e) => handleZipChange(e.target.value)} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="12345"
                            />
                         </div>
                         <div className="col-span-2 relative">
                            <label className="block text-xs font-medium text-slate-500 mb-1 flex justify-between">
                                Ort
                                {isLoadingCity && <span className="text-blue-600 flex items-center text-[10px]"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Suche...</span>}
                            </label>
                            <input 
                                type="text" 
                                value={city} 
                                onChange={(e) => setCity(e.target.value)} 
                                className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${isLoadingCity ? 'bg-blue-50 border-blue-200' : ''}`}
                                placeholder="Musterstadt"
                            />
                         </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Land</label>
                        <input 
                            type="text" 
                            value={country} 
                            onChange={(e) => setCountry(e.target.value)} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Deutschland"
                        />
                    </div>
                </div>
            </div>

            {/* 4. SECTION: BANKVERBINDUNG */}
            <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center">
                        <CreditCard className="w-4 h-4 mr-2 text-slate-500"/> Bankverbindung
                    </h3>
                    {isVendor && (
                         <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">Wichtig für Auszahlungen</span>
                    )}
                </div>

                {/* Context Aware Hint */}
                <div className={`mb-4 p-3 rounded-lg flex items-start text-xs ${isVendor ? 'bg-orange-50 text-orange-800 border border-orange-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                    <Info className={`w-4 h-4 mr-2 shrink-0 ${isVendor ? 'text-orange-600' : 'text-slate-400'}`} />
                    {isVendor 
                        ? "Bitte erfassen Sie hier die Bankdaten des Lieferanten sorgfältig. Diese werden für ausgehende Überweisungen benötigt." 
                        : "Die Bankverbindung ist beim Kunden primär für SEPA-Lastschriften relevant. Für Rechnungszahler optional."}
                </div>

                {/* --- BLINKING WARNING IF BANK DATA IS AUTO-FILLED --- */}
                {showBankWarning && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start animate-pulse">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-yellow-800">Bankdaten automatisch ermittelt</p>
                            <p className="text-xs text-yellow-700">Bitte überprüfen Sie BIC und Bankname unbedingt auf Richtigkeit!</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1 flex justify-between">
                            IBAN {isVendor && '*'}
                            {isBankLoading && <span className="text-blue-600 flex items-center text-[10px]"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Prüfe...</span>}
                        </label>
                        <input 
                            type="text" 
                            value={iban} 
                            onChange={handleIbanChange}
                            maxLength={50} // Increased to support long international IBANs + spaces
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-700 tracking-wide"
                            placeholder="DE12 3456... oder internationale IBAN"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            Deutsche IBANs werden automatisch mit &quot;DE&quot; ergänzt, wenn Sie mit Zahlen beginnen.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">BIC</label>
                            <input 
                                type="text" 
                                value={bic} 
                                onChange={(e) => setBic(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                placeholder="GENODEF1XXX"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Bankname</label>
                            <input 
                                type="text" 
                                value={bankName} 
                                onChange={(e) => setBankName(e.target.value)} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Musterbank AG"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. SECTION: STEUER & REGISTER */}
            <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center mb-4">
                    <FileText className="w-4 h-4 mr-2 text-slate-500"/> Rechtliches & Steuer
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">USt-IdNr.</label>
                        <div className="relative">
                            <BadgeEuro className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                            <input 
                                type="text" 
                                value={vatId} 
                                onChange={handleVatChange} 
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="DE123456789"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Einfach Zahlen tippen, &quot;DE&quot; wird automatisch ergänzt.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Steuernummer</label>
                        <input 
                            type="text" 
                            value={taxNumber} 
                            onChange={(e) => setTaxNumber(e.target.value)} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="12/345/67890"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Handelsregister (HRB/HRA)</label>
                        <input 
                            type="text" 
                            value={registerNumber} 
                            onChange={(e) => setRegisterNumber(e.target.value)} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="HRB 12345"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Webseite</label>
                         <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                            <input 
                                type="text" 
                                value={website} 
                                onChange={(e) => setWebsite(e.target.value)} 
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="www.firma.de"
                            />
                        </div>
                    </div>
                </div>
            </div>

        </form>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors text-sm font-medium"
            >
                Abbrechen
            </button>
            <button 
                onClick={handleSubmit}
                className={`flex items-center px-4 py-2 text-white rounded-lg font-medium shadow-sm transition-colors text-sm ${isVendor ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                <Save className="w-4 h-4 mr-2" />
                {isVendor ? 'Lieferant anlegen' : 'Kunde anlegen'}
            </button>
        </div>
      </div>
    </div>
  );
};