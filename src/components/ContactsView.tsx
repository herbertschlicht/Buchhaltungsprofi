
import React, { useState } from 'react';
import { Contact, Transaction, Account, ContactType, Invoice, PurchaseOrder, CompanySettings, Asset, CostCenter, Project } from '../types';
import { getContactBalance, getInvoicePaymentStatus, getContactLedgerStats } from '../utils/accounting';
import { 
    PlusCircle, 
    FileText, 
    Briefcase, 
    Users, 
    Search,
    LayoutDashboard,
    Wallet,
    Database,
    Calendar,
    Building2,
    ListChecks,
    TrendingUp,
    Ban,
    CheckCircle,
    History,
    Archive,
    ArrowRight
} from 'lucide-react';
import { InvoiceForm } from './InvoiceForm';
import { ContactForm } from './ContactForm';
import { StornoForm } from './StornoForm';

interface ContactsViewProps {
  contacts: Contact[];
  transactions: Transaction[];
  accounts: Account[];
  invoices?: Invoice[];
  purchaseOrders?: PurchaseOrder[];
  costCenters?: CostCenter[];
  projects?: Project[];
  companySettings: CompanySettings;
  onSaveInvoice?: (invoice: Invoice, transaction: Transaction, newAsset?: Asset) => void;
  onSavePurchaseOrder?: (order: PurchaseOrder, transaction?: Transaction, invoice?: Invoice) => void;
  onUpdateInvoice?: (updatedInvoice: Invoice) => void;
  onAddContact?: (contact: Contact) => void; 
  onSaveStorno?: (stornoTx: Transaction, originalInvoiceId: string) => void;
  nextInvoiceNumber?: string;
  nextOrderNumber?: string;
  nextAssetId?: string; 
  viewMode: 'debtors' | 'creditors'; 
}

export const ContactsView: React.FC<ContactsViewProps> = ({ 
    contacts, 
    transactions, 
    accounts, 
    invoices = [],
    costCenters = [],
    projects = [],
    companySettings,
    onSaveInvoice,
    onAddContact,
    onSaveStorno,
    nextInvoiceNumber = "RE-2023-1000",
    viewMode
}) => {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'opos' | 'list' | 'balances' | 'invoices'>('cockpit');
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceDate, setBalanceDate] = useState(new Date().toISOString().split('T')[0]);

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showStornoForm, setShowStornoForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const relevantContacts = contacts.filter(c => 
      viewMode === 'debtors' ? c.type === ContactType.CUSTOMER : c.type === ContactType.VENDOR
  );

  const masterDataList = relevantContacts.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.includes(searchTerm)
  ).sort((a,b) => a.name.localeCompare(b.name));

  const fullInvoiceArchive = invoices.filter(inv => {
      const contact = contacts.find(c => c.id === inv.contactId);
      const matchesType = contact?.type === (viewMode === 'debtors' ? ContactType.CUSTOMER : ContactType.VENDOR);
      const matchesSearch = inv.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           contact?.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
  }).map(inv => {
      const stats = getInvoicePaymentStatus(inv, transactions);
      const contact = contacts.find(c => c.id === inv.contactId);
      return { ...inv, ...stats, contactName: contact?.name };
  }).sort((a, b) => b.date.localeCompare(a.date));

  const oposList = fullInvoiceArchive.filter(item => item.status !== 'PAID' && item.status !== 'CREDIT_NOTE' && !item.isReversed);

  const calculateTotalDue = () => {
      return relevantContacts.reduce((acc, c) => acc + getContactBalance(c.id, transactions, accounts), 0);
  };

  const getNextContactId = () => {
      const prefix = viewMode === 'debtors' ? 'D' : 'K';
      const startNum = viewMode === 'debtors' ? 10000 : 70000;
      const ids = relevantContacts.map(c => parseInt(c.id.replace(prefix, ''))).filter(n => !isNaN(n));
      const max = ids.length > 0 ? Math.max(...ids) : startNum - 1;
      return prefix + (max + 1).toString();
  };

  const openStorno = (contactId?: string) => {
      if (contactId) {
          const c = contacts.find(con => con.id === contactId);
          if (c) setSelectedContact(c);
      } else {
          setSelectedContact(null);
      }
      setShowStornoForm(true);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-end pb-4 border-b border-slate-200 no-print">
         <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                {viewMode === 'debtors' ? <Users className="w-6 h-6 mr-3 text-blue-600"/> : <Briefcase className="w-6 h-6 mr-3 text-orange-600"/>}
                {viewMode === 'debtors' ? 'Debitorenbuchhaltung' : 'Kreditorenbuchhaltung'}
            </h2>
         </div>
      </div>

      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit no-print overflow-x-auto">
          <button onClick={() => setActiveTab('cockpit')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center whitespace-nowrap ${activeTab === 'cockpit' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <LayoutDashboard className="w-4 h-4 mr-2"/> Cockpit
          </button>
          <button onClick={() => setActiveTab('opos')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center whitespace-nowrap ${activeTab === 'opos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <ListChecks className="w-4 h-4 mr-2"/> OPOS-Liste
          </button>
          <button onClick={() => setActiveTab('invoices')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center whitespace-nowrap ${activeTab === 'invoices' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Archive className="w-4 h-4 mr-2"/> Rechnungsarchiv
          </button>
          <button onClick={() => setActiveTab('list')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center whitespace-nowrap ${activeTab === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Database className="w-4 h-4 mr-2"/> Stammdaten
          </button>
          <button onClick={() => setActiveTab('balances')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center whitespace-nowrap ${activeTab === 'balances' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Wallet className="w-4 h-4 mr-2"/> Saldenliste
          </button>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          
          {activeTab === 'cockpit' && (
              <div className="p-8 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      {/* Status KPI Card */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center">
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{viewMode === 'debtors' ? 'Offene Forderungen' : 'Offene Verbindlichkeiten'}</p>
                          <p className="text-3xl font-black text-slate-800 mt-2">{calculateTotalDue().toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</p>
                      </div>

                      {/* Action: New Invoice */}
                      <button 
                        onClick={() => setShowInvoiceForm(true)}
                        className={`p-6 rounded-2xl text-white flex flex-col justify-between items-start transition-all hover:scale-[1.02] shadow-lg ${viewMode === 'debtors' ? 'bg-blue-600 shadow-blue-100' : 'bg-orange-600 shadow-orange-100'}`}
                      >
                        <PlusCircle className="w-8 h-8 mb-4 opacity-80" />
                        <div className="text-left">
                            <p className="font-bold text-lg leading-tight">{viewMode === 'debtors' ? 'Ausgangsrechnung' : 'Eingangsrechnung'}</p>
                            <p className="text-[10px] opacity-80 uppercase font-bold mt-1">Neu erfassen</p>
                        </div>
                      </button>

                      {/* Action: Open Archive (Der neue Button) */}
                      <button 
                        onClick={() => setActiveTab('invoices')}
                        className="p-6 bg-white border-2 border-slate-100 rounded-2xl flex flex-col justify-between items-start transition-all hover:border-indigo-200 hover:bg-indigo-50 group shadow-sm hover:shadow-md"
                      >
                        <Archive className="w-8 h-8 mb-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                            <p className="font-bold text-lg text-slate-800 leading-tight">Belegarchiv</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mt-1 group-hover:text-indigo-600 flex items-center">Alle Rechnungen <ArrowRight className="w-3 h-3 ml-1" /></p>
                        </div>
                      </button>

                      {/* Action: Storno */}
                      <button 
                        onClick={() => openStorno()}
                        className="p-6 bg-rose-50 border-2 border-rose-100 rounded-2xl flex flex-col justify-between items-start transition-all hover:bg-rose-100 group shadow-sm hover:shadow-md"
                      >
                        <History className="w-8 h-8 mb-4 text-rose-600 group-hover:rotate-[-45deg] transition-transform" />
                        <div className="text-left">
                            <p className="font-bold text-lg text-rose-900 leading-tight">Generalstorno</p>
                            <p className="text-[10px] text-rose-400 uppercase font-bold mt-1">Buchung heilen</p>
                        </div>
                      </button>
                  </div>

                  {/* Recent Activity Mini-List */}
                  <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-6">
                      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" /> Zuletzt fällig
                      </h3>
                      <div className="space-y-3">
                          {oposList.slice(0, 3).map(inv => (
                              <div key={inv.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                                  <div className="flex gap-4 items-center">
                                      <span className="font-mono text-xs font-bold text-slate-400">{inv.number}</span>
                                      <span className="font-bold text-sm text-slate-700">{inv.contactName}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <span className="text-xs text-red-500 font-medium">Fällig: {new Date(inv.dueDate).toLocaleDateString('de-DE')}</span>
                                      <span className="font-mono font-bold text-slate-800">{inv.remainingAmount.toLocaleString('de-DE', {minimumFractionDigits:2})} €</span>
                                  </div>
                              </div>
                          ))}
                          {oposList.length === 0 && <p className="text-sm text-slate-400 italic">Keine überfälligen Posten.</p>}
                          {oposList.length > 3 && (
                              <button onClick={() => setActiveTab('opos')} className="text-xs font-bold text-blue-600 hover:underline px-1">+ {oposList.length - 3} weitere offene Posten anzeigen</button>
                          )}
                      </div>
                  </div>
              </div>
          )}
          
          {activeTab === 'opos' && (
              <div className="overflow-auto flex-1 animate-fadeIn">
                  <table className="w-full text-left">
                      <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase font-semibold border-b border-slate-200">
                          <tr>
                              <th className="p-4">Nr.</th>
                              <th className="p-4">Datum / Fällig</th>
                              <th className="p-4">Kontakt</th>
                              <th className="p-4 text-right">Offen (Netto)</th>
                              <th className="p-4 text-right">Offen (Brutto)</th>
                              <th className="p-4 text-center">Aktion</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {oposList.map(inv => (
                              <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-4 text-xs font-mono font-bold">{inv.number}</td>
                                  <td className="p-4 text-xs">
                                      <div>{new Date(inv.date).toLocaleDateString('de-DE')}</div>
                                      <div className="text-red-500 font-bold">{new Date(inv.dueDate).toLocaleDateString('de-DE')}</div>
                                  </td>
                                  <td className="p-4 font-bold text-slate-800 text-sm">{inv.contactName}</td>
                                  <td className="p-4 text-right font-mono">{inv.netAmount.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                                  <td className="p-4 text-right font-mono font-bold text-blue-700">{inv.remainingAmount.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                                  <td className="p-4 text-center">
                                      <button 
                                        onClick={() => openStorno(inv.contactId)}
                                        className="p-2 text-slate-400 hover:text-red-600"
                                        title="Stornieren"
                                      >
                                          <History className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          {oposList.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-slate-400">Keine offenen Posten vorhanden.</td></tr>}
                      </tbody>
                  </table>
              </div>
          )}

          {activeTab === 'invoices' && (
              <div className="flex flex-col h-full animate-fadeIn">
                  <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder="Suche im Archiv..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none bg-white shadow-sm focus:ring-2 focus:ring-blue-500"/>
                        </div>
                  </div>
                  <div className="overflow-auto flex-1">
                      <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black border-b border-slate-200">
                              <tr>
                                  <th className="p-4">Status</th>
                                  <th className="p-4">Beleg-Nr.</th>
                                  <th className="p-4">Datum</th>
                                  <th className="p-4">Geschäftspartner</th>
                                  <th className="p-4 text-right">Betrag (Brutto)</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {fullInvoiceArchive.map(inv => (
                                  <tr key={inv.id} className={`hover:bg-slate-50 transition-colors ${inv.isReversed ? 'bg-rose-50/30' : ''}`}>
                                      <td className="p-4 text-xs">
                                          {inv.isReversed ? (
                                              <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">Storniert</span>
                                          ) : inv.status === 'PAID' ? (
                                              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">Bezahlt</span>
                                          ) : (
                                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">Offen</span>
                                          )}
                                      </td>
                                      <td className="p-4 font-mono font-bold text-slate-600 text-xs">{inv.number}</td>
                                      <td className="p-4 text-xs text-slate-500">{new Date(inv.date).toLocaleDateString('de-DE')}</td>
                                      <td className="p-4 font-bold text-slate-800 text-sm">{inv.contactName}</td>
                                      <td className={`p-4 text-right font-mono font-bold ${inv.isReversed ? 'text-slate-300 line-through' : 'text-slate-900'}`}>{inv.grossAmount.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</td>
                                  </tr>
                              ))}
                              {fullInvoiceArchive.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">Keine Belege gefunden.</td></tr>}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'list' && (
              <div className="flex flex-col h-full animate-fadeIn">
                  <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder="Suche nach Namen, Ort, ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none bg-white shadow-sm"/>
                        </div>
                        <button onClick={() => setShowContactForm(true)} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-all shadow-sm flex items-center text-sm font-bold">
                            <PlusCircle className="w-4 h-4 mr-2 text-blue-600"/> Kontakt hinzufügen
                        </button>
                  </div>
                  <div className="overflow-auto flex-1">
                       <table className="w-full text-left">
                           <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase font-semibold border-b border-slate-200">
                               <tr>
                                   <th className="p-4 w-24">Ident-Nr</th>
                                   <th className="p-4">Name / Firma</th>
                                   <th className="p-4">Ort / Kontakt</th>
                                   <th className="p-4">Finanzen</th>
                                   <th className="p-4 text-center">Status</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 bg-white">
                               {masterDataList.map(contact => (
                                   <tr key={contact.id} className={`hover:bg-slate-50 transition-colors ${contact.isBlocked ? 'bg-red-50/30' : ''}`}>
                                       <td className="p-4 text-xs font-mono font-bold text-slate-500">{contact.id}</td>
                                       <td className="p-4">
                                            <div className="font-bold text-slate-800 text-sm">{contact.name}</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">{contact.category || 'Standard'}</div>
                                       </td>
                                       <td className="p-4 text-xs">
                                            <div className="text-slate-600">{contact.zip} {contact.city}</div>
                                            <div className="text-blue-600 mt-0.5">{contact.email}</div>
                                       </td>
                                       <td className="p-4 text-xs">
                                            <div className="flex gap-2">
                                                <span className="text-slate-400 w-12">Ziel:</span> <span className="font-bold">{contact.paymentTermsDays || 0} Tage</span>
                                            </div>
                                       </td>
                                       <td className="p-4 text-center">
                                            {contact.isBlocked ? (
                                                <div className="flex flex-col items-center">
                                                    <Ban className="w-5 h-5 text-red-500"/>
                                                    <span className="text-[9px] font-bold text-red-600 uppercase mt-0.5">Gesperrt</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <CheckCircle className="w-5 h-5 text-green-500"/>
                                                    <span className="text-[9px] font-bold text-green-600 uppercase mt-0.5">Aktiv</span>
                                                </div>
                                            )}
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                  </div>
              </div>
          )}

          {activeTab === 'balances' && (
              <div className="p-8 text-center text-slate-400 italic">... Saldenliste per Stichtag wird berechnet ...</div>
          )}

      </div>

      {showInvoiceForm && onSaveInvoice && (
        <InvoiceForm 
            type={viewMode === 'debtors' ? 'outgoing' : 'incoming'}
            contacts={contacts} 
            accounts={accounts}
            invoices={invoices}
            costCenters={costCenters}
            projects={projects}
            transactions={transactions}
            nextInvoiceNumber={nextInvoiceNumber}
            onSave={onSaveInvoice}
            onAddContact={onAddContact || (() => {})} 
            onClose={() => setShowInvoiceForm(false)} 
        />
      )}

      {showContactForm && onAddContact && (
          <ContactForm
            type={viewMode === 'debtors' ? ContactType.CUSTOMER : ContactType.VENDOR}
            nextId={getNextContactId()}
            costCenters={costCenters}
            projects={projects}
            onSave={onAddContact}
            onClose={() => setShowContactForm(false)}
          />
      )}

      {showStornoForm && onSaveStorno && (
          <StornoForm 
            contact={selectedContact || relevantContacts[0]}
            invoices={invoices}
            transactions={transactions}
            onSave={(stornoTx, originalId) => {
                onSaveStorno(stornoTx, originalId);
                setShowStornoForm(false);
            }}
            onClose={() => setShowStornoForm(false)}
          />
      )}
    </div>
  );
};
