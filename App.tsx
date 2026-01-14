
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { LedgerView } from './components/LedgerView';
import { ContactsView } from './components/ContactsView';
import { ReportsView } from './components/ReportsView';
import { AssetAccountingView } from './components/AssetAccountingView';
import { PayrollView } from './components/PayrollView'; 
import { HomeView } from './components/HomeView';
import { SettingsView } from './components/SettingsView';
import { PaymentsView } from './components/PaymentsView';
import { TransactionForm } from './components/TransactionForm';
import { AIAssistantView } from './components/AIAssistantView';
import { ControllingView } from './components/ControllingView';
import { ClosingView } from './components/ClosingView';
import { Account, AccountType, Contact, ContactType, Transaction, TransactionType, Invoice, CompanySettings, Asset, ClientProfile, CostCenter, Project, PurchaseOrder } from './types';
import { skr03Accounts } from './data/skr03';

// Initialisierungsdaten
const initialAccounts: Account[] = skr03Accounts;
const initialCompanySettings: CompanySettings = {
  companyName: 'BuchhaltungsProfi Demo',
  ceo: 'Max Mustermann',
  street: 'Beispielweg 10',
  zip: '10115',
  city: 'Berlin',
  country: 'Deutschland',
  taxNumber: '12/345/67890',
  vatId: 'DE123456789',
  registerCourt: 'Amtsgericht Berlin',
  registerNumber: 'HRB 99999',
  bankName: 'Berliner Bank',
  iban: 'DE99 1234 5678 9012 3456 78',
  bic: 'BERLDEF1XXX',
  email: 'info@buchhaltungsprofi.de',
  phone: '030 / 123 456 78',
  website: 'www.buchhaltungsprofi.de'
};

const initialContacts: Contact[] = [
  { id: 'D10000', name: 'Müller Bau GmbH', type: ContactType.CUSTOMER, city: 'München', glAccount: '1400000' },
  { id: 'K70000', name: 'Baustoff SE', type: ContactType.VENDOR, city: 'Hamburg', glAccount: '1600000' }
];

function useStickyState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem('bp_' + key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem('bp_' + key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  
  const [companySettings, setCompanySettings] = useStickyState<CompanySettings>('settings', initialCompanySettings);
  const [transactions, setTransactions] = useStickyState<Transaction[]>('transactions', []);
  const [accounts, setAccounts] = useStickyState<Account[]>('accounts', initialAccounts);
  const [contacts, setContacts] = useStickyState<Contact[]>('contacts', initialContacts);
  const [invoices, setInvoices] = useStickyState<Invoice[]>('invoices', []);
  const [purchaseOrders, setPurchaseOrders] = useStickyState<PurchaseOrder[]>('purchaseOrders', []); 
  const [assets, setAssets] = useStickyState<Asset[]>('assets', []);
  const [costCenters, setCostCenters] = useStickyState<CostCenter[]>('costCenters', []);
  const [projects, setProjects] = useStickyState<Project[]>('projects', []);

  const [clients, setClients] = useStickyState<ClientProfile[]>('clients', [{ id: '1', name: 'Demo Mandant', created: new Date().toISOString() }]);
  const [activeClientId, setActiveClientId] = useStickyState<string>('activeClientId', '1');

  const currentYear = new Date().getFullYear();
  const [nextInvoiceNum, setNextInvoiceNum] = useStickyState<string>('nextInvoiceNum', `RE-${currentYear}-1001`);

  const handleSaveTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  const handleSaveInvoice = (invoice: Invoice, transaction: Transaction, newAsset?: Asset) => {
    setInvoices(prev => [...prev, invoice]);
    setTransactions(prev => [transaction, ...prev]);
    if (newAsset) setAssets(prev => [...prev, newAsset]);
  };

  const handleSaveStorno = (stornoTx: Transaction, originalInvoiceId: string) => {
      setTransactions(prev => [stornoTx, ...prev]);
      setInvoices(prev => prev.map(inv => 
          inv.id === originalInvoiceId ? { ...inv, isReversed: true } : inv
      ));
      if (stornoTx.reversesId) {
          setTransactions(prev => prev.map(t => 
              t.id === stornoTx.reversesId ? { ...t, isReversed: true, reversedBy: stornoTx.id } : t
          ));
      }
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
      setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
  };

  const handleUpdateAccount = (updatedAccount: Account) => {
    setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
  };

  const handleAddContact = (contact: Contact) => {
      setContacts(prev => [...prev, contact]);
  };

  const handleResetData = () => {
      localStorage.clear();
      window.location.reload();
  };

  const revenue = transactions.flatMap(t => t.lines).reduce((acc, line) => {
    const act = accounts.find(a => a.id === line.accountId);
    return (act?.type === AccountType.REVENUE) ? acc + line.credit : acc;
  }, 0);
  const expenses = transactions.flatMap(t => t.lines).reduce((acc, line) => {
    const act = accounts.find(a => a.id === line.accountId);
    return (act?.type === AccountType.EXPENSE) ? acc + line.debit : acc;
  }, 0);
  const netIncome = revenue - expenses;

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView setActiveTab={setActiveTab} metrics={{ netIncome, pendingTasks: 0 }} />;
      case 'ai-coach':
        return <AIAssistantView />;
      case 'analytics':
        return <Dashboard transactions={transactions} accounts={accounts} />;
      case 'ledger':
        return (
          <LedgerView 
            transactions={transactions} 
            accounts={accounts}
            invoices={invoices} 
            companySettings={companySettings}
            onUpdateAccount={handleUpdateAccount}
            onAddAccount={(acc) => setAccounts([...accounts, acc])}
          />
        );
      case 'controlling':
        return (
            <ControllingView 
                costCenters={costCenters} 
                projects={projects} 
                transactions={transactions} 
                accounts={accounts}
                onSaveCostCenter={(cc) => setCostCenters([...costCenters, cc])}
                onUpdateCostCenter={(cc) => setCostCenters(costCenters.map(c => c.id === cc.id ? cc : c))}
                onSaveProject={(p) => setProjects([...projects, p])}
                onUpdateProject={(p) => setProjects(projects.map(item => item.id === p.id ? p : item))}
                onDeleteCostCenter={(id) => setCostCenters(costCenters.filter(c => c.id !== id))}
                onDeleteProject={(id) => setProjects(projects.filter(p => p.id !== id))}
            />
        );
      case 'debtors':
        return (
            <ContactsView 
                viewMode="debtors"
                contacts={contacts} 
                transactions={transactions} 
                accounts={accounts} 
                invoices={invoices}
                companySettings={companySettings}
                onSaveInvoice={handleSaveInvoice}
                onUpdateInvoice={handleUpdateInvoice}
                onAddContact={handleAddContact}
                onSaveStorno={handleSaveStorno}
                nextInvoiceNumber={nextInvoiceNum}
            />
        );
      case 'creditors':
        return (
            <ContactsView 
                viewMode="creditors"
                contacts={contacts} 
                transactions={transactions} 
                accounts={accounts} 
                invoices={invoices}
                companySettings={companySettings}
                onSaveInvoice={handleSaveInvoice}
                onUpdateInvoice={handleUpdateInvoice}
                onAddContact={handleAddContact}
                onSaveStorno={handleSaveStorno}
                nextInvoiceNumber={nextInvoiceNum} 
            />
        );
      case 'payments':
        return <PaymentsView transactions={transactions} accounts={accounts} contacts={contacts} invoices={invoices} companySettings={companySettings} />;
      case 'assets':
        return <AssetAccountingView transactions={transactions} accounts={accounts} assets={assets} onBookDepreciation={handleSaveTransaction} onSaveAsset={(a) => setAssets([...assets, a])} />;
      case 'payroll': 
        return <PayrollView transactions={transactions} accounts={accounts} onSaveTransaction={handleSaveTransaction} />;
      case 'reports':
        return <ReportsView transactions={transactions} accounts={accounts} companySettings={companySettings} />;
      case 'closing':
        return <ClosingView transactions={transactions} accounts={accounts} onSaveTransaction={handleSaveTransaction} />;
      case 'settings':
        return <SettingsView settings={companySettings} onUpdate={setCompanySettings} onResetData={handleResetData} />;
      default:
        return <HomeView setActiveTab={setActiveTab} metrics={{ netIncome, pendingTasks: 0 }} />;
    }
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onNewTransaction={() => setShowTransactionModal(true)}
        clients={clients}
        activeClientId={activeClientId}
        onSwitchClient={setActiveClientId}
        onCreateClient={() => {
            const name = prompt("Name des Mandanten:");
            if (name) setClients([...clients, { id: crypto.randomUUID(), name, created: new Date().toISOString() }]);
        }}
      >
        {renderContent()}
      </Layout>

      {showTransactionModal && (
        <TransactionForm 
          accounts={accounts}
          costCenters={costCenters}
          projects={projects}
          existingTransactions={transactions}
          onSave={handleSaveTransaction}
          onClose={() => setShowTransactionModal(false)}
        />
      )}
    </>
  );
};

export default App;
