
import React, { useState } from 'react';
import { Contact, Transaction, Account, ContactType, Invoice, PurchaseOrder, PurchaseOrderStatus, CompanySettings, Asset, CostCenter, Project } from '../types';
import { getContactBalance, getInvoicePaymentStatus, getContactLedgerStats } from '../utils/accounting';
import { 
    PlusCircle, 
    FileText, 
    AlertCircle, 
    Briefcase, 
    Users, 
    Send, 
    Search,
    LayoutDashboard,
    Wallet,
    Database,
    ShoppingCart,
    Calendar,
    Printer,
    Building2,
    ListChecks,
    TrendingUp,
    Ban,
    CheckCircle
} from 'lucide-react';
import { InvoiceForm } from './InvoiceForm';
import { ContactForm } from './ContactForm';

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
    nextInvoiceNumber = "RE-2023-1000",
    viewMode
}) => {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'opos' | 'list' | 'balances' | 'invoices'>('cockpit');
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceDate, setBalanceDate] = useState(new Date().toISOString().split('T')[0]);

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const relevantContacts = contacts.filter(c => 
      viewMode === 'debtors' ? c.type === ContactType.CUSTOMER : c.type === ContactType.VENDOR
  );

  const masterDataList = relevantContacts.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.includes(searchTerm)
  ).sort((a,b) => a.name.localeCompare(b.name));

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

  const fmt = (n: number) => n === 0 ? '-' : n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
          <button onClick={() => setActiveTab('list')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center whitespace-nowrap ${activeTab === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Database className="w-4 h-4 mr-2"/> Stammdaten
          </button>
          <button onClick={() => setActiveTab('balances')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center whitespace-nowrap ${activeTab === 'balances' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Wallet className="w-4 h-4 mr-2"/> Saldenliste
          </button>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          
          {activeTab === 'cockpit' && (
              <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                          <p className="text-slate-500 text-sm font-medium uppercase">{viewMode === 'debtors' ? 'Offene Forderungen' : 'Offene Verbindlichkeiten'}</p>
                          <p className="text-3xl font-bold text-slate-800 mt-2">{calculateTotalDue().toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</p>
                      </div>
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col justify-center items-start">
                          <p className="text-blue-600 text-sm font-medium uppercase mb-3">Schnellzugriff</p>
                          <button 
                                onClick={() => setShowInvoiceForm(true)}
                                className={`w-full flex items-center justify-center px-4 py-3 text-white rounded-lg font-bold shadow-md transition-all hover:scale-105 ${viewMode === 'debtors' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                            >
                                <PlusCircle className="w-5 h-5 mr-2" />
                                {viewMode === 'debtors' ? 'Neue Ausgangsrechnung' : 'Neue Eingangsrechnung'}
                            </button>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col justify-center items-start">
                        <p className="text-slate-500 text-sm font-medium uppercase mb-3">Verwaltung</p>
                        <button 
                                onClick={() => setShowContactForm(true)}
                                className="w-full flex items-center justify-center px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-all"
                            >
                                <Users className="w-4 h-4 mr-2"/> Neuer Kontakt anlegen
                            </button>
                      </div>
                  </div>
              </div>
          )}
          
          {activeTab === 'list' && (
              <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder="Suche nach Namen, Ort, ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none bg-white shadow-sm"/>
                        </div>
                        <button onClick={() => setShowContactForm(true)} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-all shadow-sm flex items-center">
                            <PlusCircle className="w-4 h-4 mr-2"/> Kontakt hinzufügen
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
                                   <th className="p-4">Steuer / Bank</th>
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
                                            <div className="flex gap-2">
                                                <span className="text-slate-400 w-12">Konto:</span> <span className="font-mono">{contact.glAccount || '-'}</span>
                                            </div>
                                       </td>
                                       <td className="p-4 text-[11px]">
                                            <div className="font-mono text-slate-500">{contact.vatId || 'Keine USt-ID'}</div>
                                            <div className="text-slate-400 mt-0.5 truncate max-w-[150px]">{contact.iban || 'Keine Bankdaten'}</div>
                                       </td>
                                       <td className="p-4 text-center">
                                            {contact.isBlocked ? (
                                                <div className="flex flex-col items-center" title={contact.blockNote}>
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
              <div className="p-8 text-center text-slate-400">... Saldenliste per Stichtag ...</div>
          )}
          {activeTab === 'opos' && (
              <div className="p-8 text-center text-slate-400">... OPOS Liste ...</div>
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
    </div>
  );
};
