

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
    Eye,
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
    ShieldAlert,
    Ban,
    // Added missing CheckCircle import
    CheckCircle
} from 'lucide-react';
import { InvoiceForm } from './InvoiceForm';
import { DunningLetterModal } from './DunningLetterModal';
import { ContactForm } from './ContactForm';
import { PurchaseOrderForm } from './PurchaseOrderForm';

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
    purchaseOrders = [],
    costCenters = [],
    projects = [],
    companySettings,
    onSaveInvoice,
    onSavePurchaseOrder,
    onUpdateInvoice,
    onAddContact,
    nextInvoiceNumber = "RE-2023-1000",
    nextOrderNumber = "B-2023-001",
    nextAssetId,
    viewMode
}) => {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'opos' | 'list' | 'balances' | 'invoices' | 'dunning' | 'procurement'>('cockpit');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceDate, setBalanceDate] = useState(new Date().toISOString().split('T')[0]);

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | undefined>(undefined);
  const [showOrderForm, setShowOrderForm] = useState(false);

  const [dunningModalData, setDunningModalData] = useState<{invoice: Invoice, contact: Contact, nextLevel: number, isReadOnly: boolean} | null>(null);

  const relevantContacts = contacts.filter(c => 
      viewMode === 'debtors' ? c.type === ContactType.CUSTOMER : c.type === ContactType.VENDOR
  );

  const displayedInvoices = invoices
    .filter(inv => {
        const c = contacts.find(c => c.id === inv.contactId);
        return c?.type === (viewMode === 'debtors' ? ContactType.CUSTOMER : ContactType.VENDOR);
    })
    .sort((a,b) => b.date.localeCompare(a.date));

  const balancesList = relevantContacts.map(contact => {
      const stats = getContactLedgerStats(contact.id, transactions, accounts, balanceDate);
      return {
          ...contact,
          ...stats,
          status: Math.abs(stats.endingBalance) < 0.01 ? 'balanced' : 'open'
      };
  }).filter(c => 
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.includes(searchTerm))
  );
  
  const topOpenContacts = balancesList
      .filter(c => Math.abs(c.endingBalance) > 0.01)
      .sort((a, b) => Math.abs(b.endingBalance) - Math.abs(a.endingBalance)) 
      .slice(0, 5);

  const masterDataList = relevantContacts.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.includes(searchTerm)
  ).sort((a,b) => a.name.localeCompare(b.name));

  const procurementList = purchaseOrders.filter(po => 
      po.status !== PurchaseOrderStatus.COMPLETED 
  ).sort((a,b) => b.date.localeCompare(a.date));

  const dunningList = invoices.map(inv => {
      const stats = getInvoicePaymentStatus(inv, transactions);
      return { ...inv, ...stats, contactName: contacts.find(c => c.id === inv.contactId)?.name };
  }).filter(item => {
      const contact = contacts.find(c => c.id === item.contactId);
      if (contact?.type !== ContactType.CUSTOMER) return false;
      return item.status === 'OVERDUE' || (item.status === 'OPEN' && item.dunningLevel && item.dunningLevel > 0);
  }); 

  const oposList = invoices.map(inv => {
      const stats = getInvoicePaymentStatus(inv, transactions);
      const contact = contacts.find(c => c.id === inv.contactId);
      return { ...inv, ...stats, contactName: contact?.name, contactId: contact?.id };
  }).filter(item => {
      const contact = contacts.find(c => c.id === item.contactId);
      if (contact?.type !== (viewMode === 'debtors' ? ContactType.CUSTOMER : ContactType.VENDOR)) return false;
      return item.status !== 'PAID' && item.status !== 'CREDIT_NOTE';
  }).sort((a,b) => a.dueDate.localeCompare(b.dueDate)); 

  const totalOposAmount = oposList.reduce((sum, item) => sum + item.remainingAmount, 0);

  const calculateTotalDue = () => {
      return relevantContacts.reduce((acc, c) => acc + getContactBalance(c.id, transactions, accounts), 0);
  };

  const initiateDunningStep = (invoice: Invoice, nextLevel: number) => {
      const contact = contacts.find(c => c.id === invoice.contactId);
      if(contact) {
          setDunningModalData({ invoice, contact, nextLevel, isReadOnly: false });
      }
  };

  const viewDunningLetter = (invoice: Invoice) => {
      const contact = contacts.find(c => c.id === invoice.contactId);
      if(contact && invoice.dunningLevel) {
          setDunningModalData({ invoice, contact, nextLevel: invoice.dunningLevel, isReadOnly: true });
      }
  };

  const confirmDunningEscalation = () => {
      if (!dunningModalData || !onUpdateInvoice) return;
      const { invoice, nextLevel } = dunningModalData;
      const today = new Date().toISOString().split('T')[0];
      const updatedInvoice: Invoice = { ...invoice, dunningLevel: nextLevel, lastDunningDate: today };
      onUpdateInvoice(updatedInvoice);
      setDunningModalData(null);
  };

  const startNumber = viewMode === 'debtors' ? 10000 : 70000;
  const prefix = viewMode === 'debtors' ? 'D' : 'K';
  
  const getNextContactId = () => {
      const existingIds = relevantContacts
        .map(c => {
            const cleanId = c.id.replace(prefix, '');
            return parseInt(cleanId);
        })
        .filter(id => !isNaN(id) && id >= startNumber && id < startNumber + 29999);
      
      const maxId = existingIds.length > 0 ? Math.max(...existingIds) : startNumber - 1;
      return prefix + (maxId + 1).toString();
  };

  const openOrderForm = (order?: PurchaseOrder) => {
      setSelectedOrder(order);
      setShowOrderForm(true);
  }

  const handleSwitchToOrder = (order: PurchaseOrder) => {
      setShowInvoiceForm(false);
      setSelectedOrder(order);
      setShowOrderForm(true);
  }

  const handlePrint = () => {
    window.print();
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
          {viewMode === 'creditors' && (
               <button onClick={() => setActiveTab('procurement')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center whitespace-nowrap ${activeTab === 'procurement' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <ShoppingCart className="w-4 h-4 mr-2"/> Bestellwesen
               </button>
          )}
          <button onClick={() => setActiveTab('balances')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center whitespace-nowrap ${activeTab === 'balances' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Wallet className="w-4 h-4 mr-2"/> Saldenliste
          </button>
          <button onClick={() => setActiveTab('invoices')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center whitespace-nowrap ${activeTab === 'invoices' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <FileText className="w-4 h-4 mr-2"/> {viewMode === 'debtors' ? 'Rechnungsarchiv' : 'Eingangsarchiv'}
          </button>
          {viewMode === 'debtors' && (
              <button onClick={() => setActiveTab('dunning')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center whitespace-nowrap ${activeTab === 'dunning' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <AlertCircle className="w-4 h-4 mr-2"/> Mahnwesen
              </button>
          )}
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none print:overflow-visible">
          
          {activeTab === 'cockpit' && (
              <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                          <p className="text-slate-500 text-sm font-medium uppercase">{viewMode === 'debtors' ? 'Offene Forderungen' : 'Offene Verbindlichkeiten'}</p>
                          <p className="text-3xl font-bold text-slate-800 mt-2">{calculateTotalDue().toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</p>
                      </div>
                      
                      {viewMode === 'debtors' && (
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                            <p className="text-red-600 text-sm font-medium uppercase">Überfällige Rechnungen</p>
                            <p className="text-3xl font-bold text-red-700 mt-2">{dunningList.filter(i => i.daysOverdue > 0).length}</p>
                        </div>
                      )}
                      
                      {viewMode === 'creditors' && (
                          <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                              <p className="text-orange-600 text-sm font-medium uppercase">Offene Bestellungen</p>
                              <p className="text-3xl font-bold text-orange-700 mt-2">{procurementList.length}</p>
                              <p className="text-xs text-orange-600 mt-1">{procurementList.filter(p => p.status === 'DELIVERED').length} warten auf Rechnung</p>
                          </div>
                      )}

                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col justify-center items-start">
                          <p className="text-blue-600 text-sm font-medium uppercase mb-3">Schnellzugriff</p>
                          {viewMode === 'debtors' && onSaveInvoice && (
                              <button 
                                  onClick={() => setShowInvoiceForm(true)}
                                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all hover:scale-105"
                              >
                                  <PlusCircle className="w-5 h-5 mr-2" />
                                  Neue Ausgangsrechnung
                              </button>
                          )}
                          {viewMode === 'creditors' && onSaveInvoice && (
                              <>
                                <button 
                                    onClick={() => openOrderForm()}
                                    className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-md transition-all hover:scale-105"
                                >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Neuer Bestellvorgang
                                </button>
                                <button 
                                    onClick={() => setShowInvoiceForm(true)}
                                    className="mt-2 w-full flex items-center justify-center px-4 py-2 bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 rounded-lg font-medium transition-all"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Eingangsrechnung direkt erfassen
                                </button>
                              </>
                          )}
                          <button 
                              onClick={() => setShowContactForm(true)}
                              className="mt-3 w-full flex items-center justify-center px-4 py-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-all"
                          >
                              <Users className="w-4 h-4 mr-2"/> Neuer Kontakt anlegen
                          </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                          <h3 className="text-slate-800 font-bold mb-4 flex items-center">
                              <TrendingUp className="w-5 h-5 mr-2 text-slate-500"/>
                              Top 5 {viewMode === 'debtors' ? 'Schuldner' : 'Gläubiger'}
                          </h3>
                          <div className="space-y-3">
                              {topOpenContacts.map(c => (
                                  <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${viewMode === 'debtors' ? 'bg-blue-400' : 'bg-orange-400'}`}>
                                              {c.name.substring(0,1)}
                                          </div>
                                          <div className="min-w-0">
                                              <div className="font-bold text-sm text-slate-800 truncate">{c.name}</div>
                                              <div className="text-xs text-slate-500 font-mono">{c.id}</div>
                                          </div>
                                      </div>
                                      <div className={`font-mono font-bold text-sm ${viewMode === 'debtors' ? 'text-blue-600' : 'text-orange-600'}`}>
                                          {c.endingBalance.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                                      </div>
                                  </div>
                              ))}
                              {topOpenContacts.length === 0 && <div className="text-center text-slate-400 text-sm py-4">Alles ausgeglichen.</div>}
                          </div>
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
                            <PlusCircle className="w-4 h-4 mr-2"/> Neuer Kontakt
                        </button>
                  </div>
                  <div className="overflow-auto flex-1">
                       <table className="w-full text-left">
                           <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase font-semibold border-b border-slate-200">
                               <tr>
                                   <th className="p-4 w-24">Ident-Nr</th>
                                   <th className="p-4">Name / Firma</th>
                                   <th className="p-4">Ansprechpartner</th>
                                   <th className="p-4">Ort / Kontakt</th>
                                   <th className="p-4">Finanzen</th>
                                   <th className="p-4">Steuer / Intern</th>
                                   <th className="p-4 text-center">Status</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 bg-white">
                               {masterDataList.map(contact => (
                                   <tr key={contact.id} className={`hover:bg-slate-50 transition-colors ${contact.isBlocked ? 'bg-red-50/30' : ''}`}>
                                       <td className="p-4 text-xs font-mono font-bold text-slate-500">{contact.id}</td>
                                       <td className="p-4">
                                            <div className="font-bold text-slate-800 text-sm">{contact.name}</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">{contact.category || 'Keine Kat.'}</div>
                                       </td>
                                       <td className="p-4 text-xs text-slate-600">
                                            {contact.contactPersons?.[0] ? (
                                                <>
                                                    <div className="font-medium">{contact.contactPersons[0].name}</div>
                                                    <div className="text-[10px] text-slate-400 italic">{contact.contactPersons[0].role}</div>
                                                </>
                                            ) : '-'}
                                       </td>
                                       <td className="p-4 text-xs">
                                            <div className="text-slate-600">{contact.zip} {contact.city}</div>
                                            <div className="text-blue-600 mt-0.5">{contact.email}</div>
                                       </td>
                                       <td className="p-4 text-xs">
                                            <div className="flex gap-2">
                                                <span className="text-slate-400">Ziel:</span> <span className="font-bold">{contact.paymentTermsDays || 0} Tage</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-slate-400">Limit:</span> <span>{contact.creditLimit ? contact.creditLimit.toLocaleString() + ' €' : '-'}</span>
                                            </div>
                                       </td>
                                       <td className="p-4 text-[11px]">
                                            <div className="font-mono text-slate-500">{contact.vatId || '-'}</div>
                                            <div className="text-slate-400 mt-0.5 truncate max-w-[150px]">{contact.notes || ''}</div>
                                       </td>
                                       <td className="p-4 text-center">
                                            {contact.isBlocked ? (
                                                <div className="flex flex-col items-center" title={contact.blockNote}>
                                                    <Ban className="w-5 h-5 text-red-500"/>
                                                    <span className="text-[9px] font-bold text-red-600 uppercase mt-0.5">Gesperrt</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    {/* Corrected missing CheckCircle icon */}
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

          {/* ... andere Tabs ... */}
          {activeTab === 'cockpit' && (
            <div className="p-8 text-center text-slate-400 italic">
                {/* Platzhalter für Cockpit Inhalt (oben bereits definiert) */}
            </div>
          )}
          {activeTab === 'opos' && (
              <div className="p-8 text-center text-slate-400">... OPOS Liste ...</div>
          )}
          {activeTab === 'balances' && (
              <div className="p-8 text-center text-slate-400">... Saldenliste ...</div>
          )}
          {activeTab === 'invoices' && (
              <div className="p-8 text-center text-slate-400">... Archiv ...</div>
          )}
          {activeTab === 'dunning' && (
              <div className="p-8 text-center text-slate-400">... Mahnwesen ...</div>
          )}
          {activeTab === 'procurement' && (
              <div className="p-8 text-center text-slate-400">... Bestellwesen ...</div>
          )}

      </div>

      {showInvoiceForm && onSaveInvoice && (
        <InvoiceForm 
            type={viewMode === 'debtors' ? 'outgoing' : 'incoming'}
            contacts={contacts} 
            accounts={accounts}
            purchaseOrders={purchaseOrders}
            invoices={invoices}
            costCenters={costCenters}
            projects={projects}
            transactions={transactions}
            nextInvoiceNumber={nextInvoiceNumber}
            onSave={onSaveInvoice}
            onSwitchToOrder={handleSwitchToOrder}
            onClose={() => setShowInvoiceForm(false)} 
            {...({ nextAssetNumber: nextAssetId } as any)}
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