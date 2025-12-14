
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
    TrendingUp
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
  // KLR Data needed for InvoiceForm
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

  const fmt = (n: number) => n === 0 ? '-' : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
                          <p className="text-3xl font-bold text-slate-800 mt-2">{calculateTotalDue().toFixed(2)} €</p>
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

                  {/* Top Open Items List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                          <h3 className="text-slate-800 font-bold mb-4 flex items-center">
                              <TrendingUp className="w-5 h-5 mr-2 text-slate-500"/>
                              Top 5 {viewMode === 'debtors' ? 'Schuldner (Wer schuldet uns Geld?)' : 'Gläubiger (Wem schulden wir Geld?)'}
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
                                          {c.endingBalance.toLocaleString(undefined, {minimumFractionDigits: 2})} €
                                      </div>
                                  </div>
                              ))}
                              {topOpenContacts.length === 0 && <div className="text-center text-slate-400 text-sm py-4">Alles ausgeglichen. Keine offenen Posten.</div>}
                          </div>
                      </div>
                  </div>
              </div>
          )}
          
          {/* ... Other Tabs (OPOS, List, Balances, Invoices, Dunning, Procurement) unchanged in structure but re-rendered ... */}
          {activeTab === 'opos' && (
              <div className="flex flex-col h-full print:block">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden">
                        <div className="flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-slate-500" />
                            <h3 className="font-bold text-slate-800">Offene Posten Liste ({viewMode === 'debtors' ? 'Debitoren' : 'Kreditoren'})</h3>
                        </div>
                        <button onClick={handlePrint} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 bg-white border border-slate-300 px-3 py-2 rounded-lg shadow-sm">
                            <Printer className="w-4 h-4"/> Drucken
                        </button>
                  </div>

                  <div className="hidden print:block p-8 pb-0">
                        <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
                                    Offene Posten Liste ({viewMode === 'debtors' ? 'Debitoren' : 'Kreditoren'})
                                </h1>
                                <div className="flex items-center mt-2 text-sm text-slate-600">
                                        <Building2 className="w-4 h-4 mr-2 text-slate-400"/>
                                        <span className="font-semibold mr-2">Mandant:</span>
                                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 print:bg-transparent print:p-0 print:border print:border-slate-300">
                                        {companySettings.companyName}
                                        </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-semibold">Stichtag</p>
                                <p className="text-lg font-bold text-slate-900">{new Date().toLocaleDateString('de-DE')}</p>
                            </div>
                        </div>
                  </div>

                  <div className="overflow-auto flex-1 print:overflow-visible print:h-auto">
                       <table className="w-full text-left">
                           <thead className="bg-slate-100 text-xs text-slate-500 uppercase font-semibold sticky top-0 z-10 print:static print:bg-white print:border-b-2 print:border-black">
                               <tr>
                                   <th className="p-4 w-32 print:p-2">Belegdatum</th>
                                   <th className="p-4 w-32 print:p-2">Beleg-Nr.</th>
                                   {viewMode === 'creditors' && <th className="p-4 print:p-2">Ext. Ref.</th>}
                                   <th className="p-4 print:p-2">{viewMode === 'debtors' ? 'Kunde' : 'Lieferant'}</th>
                                   <th className="p-4 w-32 print:p-2">Fällig am</th>
                                   <th className="p-4 w-24 text-center print:p-2">Verzug</th>
                                   <th className="p-4 w-24 text-center print:p-2">Status</th>
                                   <th className="p-4 text-right print:p-2">Offener Betrag</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                               {oposList.map(item => {
                                   const isOverdue = item.daysOverdue > 0;
                                   return (
                                       <tr key={item.id} className="hover:bg-slate-50">
                                           <td className="p-4 text-sm text-slate-600 print:p-2">{item.date}</td>
                                           <td className="p-4 text-sm font-mono font-medium print:p-2">{item.number}</td>
                                           {viewMode === 'creditors' && (
                                               <td className="p-4 text-sm font-mono text-slate-500 print:p-2">{item.externalNumber || '-'}</td>
                                           )}
                                           <td className="p-4 text-sm font-bold text-slate-800 print:p-2">
                                               {item.contactName} 
                                               <span className="text-xs font-normal text-slate-400 block font-mono">{item.contactId}</span>
                                           </td>
                                           <td className="p-4 text-sm text-slate-600 print:p-2">{new Date(item.dueDate).toLocaleDateString('de-DE')}</td>
                                           <td className={`p-4 text-sm text-center font-bold print:p-2 ${isOverdue ? 'text-red-600' : 'text-slate-400'}`}>
                                               {isOverdue ? `${item.daysOverdue} T` : '-'}
                                           </td>
                                           <td className="p-4 text-center print:p-2">
                                               {item.status === 'PARTIAL' 
                                                ? <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200">Teilgezahlt</span>
                                                : <span className={`px-2 py-1 rounded text-xs font-bold border ${isOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>Offen</span>
                                               }
                                           </td>
                                           <td className="p-4 text-sm text-right font-mono font-bold text-slate-800 print:p-2">
                                               {item.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                                           </td>
                                       </tr>
                                   );
                               })}
                               {oposList.length === 0 && (
                                   <tr>
                                       <td colSpan={viewMode === 'creditors' ? 8 : 7} className="p-8 text-center text-slate-400 italic">
                                           Keine offenen Posten vorhanden. Alles bezahlt!
                                       </td>
                                   </tr>
                               )}
                           </tbody>
                           <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-800 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:static print:shadow-none print:bg-white print:border-t-2 print:border-black text-sm">
                               <tr>
                                   <td colSpan={viewMode === 'creditors' ? 7 : 6} className="px-4 py-3 uppercase tracking-wider text-right print:px-2">Gesamtsumme Offen</td>
                                   <td className="px-4 py-3 text-right font-mono text-base print:px-2">
                                      {totalOposAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                                   </td>
                               </tr>
                           </tfoot>
                       </table>
                  </div>
              </div>
          )}

          {activeTab === 'procurement' && viewMode === 'creditors' && (
               <div className="flex flex-col h-full">
                   {/* ... Procurement List Logic ... */}
                   <div className="p-4 border-b border-slate-100 bg-orange-50/30 flex justify-between items-center">
                       <div>
                           <h3 className="font-bold text-orange-900 flex items-center">
                               <ShoppingCart className="w-5 h-5 mr-2 text-orange-600"/>
                               Laufende Bestellvorgänge
                           </h3>
                           <p className="text-xs text-slate-500">Vom Angebot bis zur Rechnungsprüfung</p>
                       </div>
                       <button 
                            onClick={() => openOrderForm()}
                            className="text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center shadow-sm"
                        >
                            <PlusCircle className="w-4 h-4 mr-2"/> Neuer Vorgang
                       </button>
                   </div>
                   <div className="overflow-auto flex-1">
                       <table className="w-full text-left">
                           <thead className="bg-slate-100 text-xs text-slate-500 uppercase font-semibold">
                               <tr>
                                   <th className="p-4">Datum</th>
                                   <th className="p-4">Bestell-Nr.</th>
                                   <th className="p-4">Lieferant</th>
                                   <th className="p-4">Beschreibung</th>
                                   <th className="p-4">Status</th>
                                   <th className="p-4 text-right">Netto (Plan)</th>
                                   <th className="p-4 text-right">Aktion</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 bg-white">
                               {procurementList.map(po => {
                                   const vendor = contacts.find(c => c.id === po.contactId);
                                   return (
                                       <tr key={po.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openOrderForm(po)}>
                                           <td className="p-4 text-sm text-slate-600">{po.date}</td>
                                           <td className="p-4 text-sm font-mono font-medium">{po.orderNumber}</td>
                                           <td className="p-4 text-sm font-bold text-slate-800">{vendor?.name}</td>
                                           <td className="p-4 text-sm text-slate-600 truncate max-w-xs">{po.description}</td>
                                           <td className="p-4">{po.status}</td>
                                           <td className="p-4 text-sm text-right font-mono">{po.netAmount.toFixed(2)} €</td>
                                           <td className="p-4 text-right">
                                               <button className="text-slate-400 hover:text-blue-600">
                                                   <Eye className="w-4 h-4"/>
                                               </button>
                                           </td>
                                       </tr>
                                   );
                               })}
                           </tbody>
                       </table>
                   </div>
               </div>
          )}

          {activeTab === 'list' && (
              <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Suche nach Namen, Ort, ID..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                            />
                        </div>
                        <button 
                              onClick={() => setShowContactForm(true)}
                              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-all shadow-sm flex items-center"
                          >
                              <PlusCircle className="w-4 h-4 mr-2"/> Kontakt
                          </button>
                  </div>
                  <div className="overflow-auto flex-1">
                       <table className="w-full text-left">
                           <thead className="bg-slate-100 text-xs text-slate-500 uppercase font-semibold">
                               <tr>
                                   <th className="p-4 w-32">Nr.</th>
                                   <th className="p-4">Name</th>
                                   <th className="p-4">Ansprechpartner</th>
                                   <th className="p-4">Kontakt</th>
                                   <th className="p-4">Ort</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 bg-white">
                               {masterDataList.map(contact => (
                                   <tr key={contact.id} className="hover:bg-slate-50">
                                       <td className="p-4 text-sm font-mono text-slate-500">{contact.id}</td>
                                       <td className="p-4 text-sm font-bold text-slate-800">{contact.name}</td>
                                       <td className="p-4 text-sm text-slate-600">{contact.contactPersons?.[0]?.name || '-'}</td>
                                       <td className="p-4 text-sm text-slate-600">{contact.email || contact.phone || '-'}</td>
                                       <td className="p-4 text-sm text-slate-600">{contact.city || '-'}</td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                  </div>
              </div>
          )}

          {activeTab === 'balances' && (
              <div className="flex flex-col h-full bg-white print:block">
                  <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50/50 print:hidden">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Filtern..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-2 rounded-lg shadow-sm">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <label className="text-xs font-semibold text-slate-500 mr-2">Stichtag:</label>
                            <input 
                                type="date"
                                value={balanceDate}
                                onChange={(e) => setBalanceDate(e.target.value)}
                                className="text-sm bg-transparent border-none focus:ring-0 text-slate-800 font-medium cursor-pointer outline-none"
                            />
                        </div>
                        <button onClick={handlePrint} className="ml-auto text-slate-500 hover:text-blue-600"><Printer className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="hidden print:block p-8 pb-0">
                        <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
                                    {viewMode === 'debtors' ? 'Debitoren' : 'Kreditoren'}-Saldenliste
                                </h1>
                                <div className="flex items-center mt-2 text-sm text-slate-600">
                                        <Building2 className="w-4 h-4 mr-2 text-slate-400"/>
                                        <span className="font-semibold mr-2">Mandant:</span>
                                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 print:bg-transparent print:p-0 print:border print:border-slate-300">
                                        {companySettings.companyName}
                                        </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-semibold">Stichtag</p>
                                <p className="text-lg font-bold text-slate-900">{new Date(balanceDate).toLocaleDateString('de-DE')}</p>
                            </div>
                        </div>
                  </div>

                  <div className="overflow-auto flex-1 print:overflow-visible print:h-auto">
                       <table className="w-full text-left">
                           <thead className="bg-slate-100 text-[10px] md:text-xs text-slate-500 uppercase font-semibold sticky top-0 z-10 print:static print:bg-white print:border-b-2 print:border-black">
                               <tr>
                                   <th className="px-4 py-3 print:p-2">Konto</th>
                                   <th className="px-4 py-3 w-48 print:p-2">Name / Firma</th>
                                   <th className="px-2 py-3 text-right print:p-2">EB-Wert</th>
                                   <th className="px-2 py-3 text-right print:p-2">Soll</th>
                                   <th className="px-2 py-3 text-right print:p-2">Haben</th>
                                   <th className="px-2 py-3 text-right print:p-2">Soll kum.</th>
                                   <th className="px-2 py-3 text-right print:p-2">Haben kum.</th>
                                   <th className="px-4 py-3 text-right font-bold print:p-2">Endsaldo</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                               {balancesList.map(c => (
                                   <tr key={c.id} className="hover:bg-slate-50">
                                       <td className="px-4 py-2 text-xs font-mono text-slate-500 font-bold print:p-2">{c.id}</td>
                                       <td className="px-4 py-2 text-xs font-bold text-slate-800 truncate max-w-[200px] print:p-2 print:max-w-none">{c.name}</td>
                                       <td className="px-2 py-2 text-xs text-right font-mono text-slate-500 print:p-2">{fmt(c.openingBalance)}</td>
                                       <td className="px-2 py-2 text-xs text-right font-mono text-slate-600 print:p-2">{fmt(c.debitMonth)}</td>
                                       <td className="px-2 py-2 text-xs text-right font-mono text-slate-600 print:p-2">{fmt(c.creditMonth)}</td>
                                       <td className="px-2 py-2 text-xs text-right font-mono text-slate-600 print:p-2">{fmt(c.debitYTD)}</td>
                                       <td className="px-2 py-2 text-xs text-right font-mono text-slate-600 print:p-2">{fmt(c.creditYTD)}</td>
                                       <td className={`px-4 py-2 text-xs text-right font-mono font-bold print:p-2 ${c.endingBalance !== 0 ? (viewMode === 'debtors' ? 'text-blue-700' : 'text-orange-700') : 'text-slate-400'}`}>
                                           {c.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                  </div>
              </div>
          )}

          {activeTab === 'invoices' && (
              <div className="flex flex-col h-full">
                   <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-end">
                       <button onClick={() => setShowInvoiceForm(true)} className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm flex items-center ${viewMode === 'debtors' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                           <PlusCircle className="w-4 h-4 mr-2"/>
                           {viewMode === 'debtors' ? 'Ausgangsrechnung' : 'Eingangsrechnung'}
                       </button>
                   </div>
                   <div className="overflow-auto flex-1">
                       <table className="w-full text-left">
                           <thead className="bg-slate-100 text-xs text-slate-500 uppercase font-semibold">
                               <tr>
                                   <th className="p-4">Datum</th>
                                   <th className="p-4">Beleg-Nr. (Intern)</th>
                                   <th className="p-4">{viewMode === 'debtors' ? 'Kunde' : 'Lieferant'}</th>
                                   {viewMode === 'creditors' && <th className="p-4">Ext. Referenz</th>}
                                   <th className="p-4">Beschreibung</th>
                                   <th className="p-4">Fällig am</th>
                                   <th className="p-4 text-right">Betrag (Brutto)</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 bg-white">
                               {displayedInvoices.map(inv => (
                                   <tr key={inv.id} className="hover:bg-slate-50">
                                       <td className="p-4 text-sm text-slate-600">{inv.date}</td>
                                       <td className="p-4 text-sm font-mono font-medium">{inv.number}</td>
                                       <td className="p-4 text-sm font-bold text-slate-800">{contacts.find(c => c.id === inv.contactId)?.name}</td>
                                       {viewMode === 'creditors' && <td className="p-4 text-sm font-mono text-slate-500">{inv.externalNumber || '-'}</td>}
                                       <td className="p-4 text-sm text-slate-600 truncate max-w-xs">{inv.description}</td>
                                       <td className="p-4 text-sm text-slate-600">{new Date(inv.dueDate).toLocaleDateString('de-DE')}</td>
                                       <td className="p-4 text-sm text-right font-mono font-medium">{inv.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
              </div>
          )}

          {activeTab === 'dunning' && viewMode === 'debtors' && (
              <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-slate-100 bg-red-50/50">
                      <h3 className="text-red-800 font-bold flex items-center">
                          <AlertCircle className="w-5 h-5 mr-2"/>
                          Mahnvorschlagsliste
                      </h3>
                  </div>
                  <div className="overflow-auto flex-1">
                       <table className="w-full text-left">
                           <thead className="bg-slate-100 text-xs text-slate-500 uppercase font-semibold">
                               <tr>
                                   <th className="p-4">Fällig seit</th>
                                   <th className="p-4">Rechnung</th>
                                   <th className="p-4">Kunde</th>
                                   <th className="p-4 text-right">Offener Betrag</th>
                                   <th className="p-4 text-center">Mahnstufe</th>
                                   <th className="p-4 text-right">Aktion</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 bg-white">
                               {dunningList.map(item => (
                                   <tr key={item.id} className="hover:bg-red-50/10">
                                       <td className="p-4 text-sm font-bold text-red-600">{item.daysOverdue} Tage</td>
                                       <td className="p-4 text-sm font-mono">{item.number}</td>
                                       <td className="p-4 text-sm font-bold text-slate-800">{item.contactName}</td>
                                       <td className="p-4 text-sm text-right font-mono">{item.remainingAmount.toFixed(2)} €</td>
                                       <td className="p-4 text-center">
                                           <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-500 text-white">Stufe {item.dunningLevel || 0}</span>
                                       </td>
                                       <td className="p-4 text-right flex justify-end gap-2">
                                           <button onClick={() => viewDunningLetter(item)} className="text-slate-400 hover:text-blue-600"><FileText className="w-4 h-4"/></button>
                                           <button onClick={() => initiateDunningStep(item, (item.dunningLevel || 0) + 1)} className="text-red-600 hover:text-red-800 font-bold text-xs"><Send className="w-4 h-4"/></button>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                  </div>
              </div>
          )}
      </div>

      
      {showInvoiceForm && onSaveInvoice && (
        <InvoiceForm 
            type={viewMode === 'debtors' ? 'outgoing' : 'incoming'}
            contacts={contacts} 
            accounts={accounts}
            purchaseOrders={purchaseOrders}
            // Pass KLR and Transaction Data for Budget Check
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
            onSave={onAddContact}
            onClose={() => setShowContactForm(false)}
          />
      )}

      {showOrderForm && onSavePurchaseOrder && (
          <PurchaseOrderForm 
              order={selectedOrder}
              contacts={contacts}
              accounts={accounts}
              nextOrderNumber={nextOrderNumber}
              onSave={onSavePurchaseOrder}
              onClose={() => { setShowOrderForm(false); setSelectedOrder(undefined); }}
          />
      )}

      {dunningModalData && (
          <DunningLetterModal
              invoice={dunningModalData.invoice}
              contact={dunningModalData.contact}
              companySettings={companySettings}
              targetLevel={dunningModalData.nextLevel}
              isReadOnly={dunningModalData.isReadOnly}
              onClose={() => setDunningModalData(null)}
              onConfirm={confirmDunningEscalation}
          />
      )}
    </div>
  );
};
