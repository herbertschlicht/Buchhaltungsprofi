
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
import { Account, AccountType, Contact, ContactType, Transaction, TransactionType, Invoice, PurchaseOrder, PurchaseOrderStatus, CompanySettings, Asset, ClientProfile, CostCenter, Project } from './types';
import { skr03Accounts } from './data/skr03';

// --- INITIAL DATA SEEDING ---
const initialAccounts: Account[] = skr03Accounts;

const initialCompanySettings: CompanySettings = {
  companyName: 'LedgerLens Demo Corp',
  ceo: 'Max Mustermann',
  street: 'Musterstraße 1',
  zip: '10115',
  city: 'Berlin',
  country: 'Deutschland',
  taxNumber: '12/345/67890',
  vatId: 'DE123456789',
  registerCourt: 'Amtsgericht Berlin-Charlottenburg',
  registerNumber: 'HRB 12345',
  bankName: 'Berliner Volksbank',
  iban: 'DE99 1001 0010 1234 5678 90',
  bic: 'GENODEF1BRL',
  email: 'buchhaltung@ledgerlens.de',
  phone: '030 / 123 456 78',
  website: 'www.ledgerlens.de',
  
  dunningConfig: {
      level1: {
          title: "Zahlungserinnerung",
          subjectTemplate: "Zahlungserinnerung zur Rechnung Nr. [NR]",
          bodyTemplate: `sehr geehrte Damen und Herren,\n\nsicherlich haben Sie in der Hektik des Alltags übersehen, unsere Rechnung Nr. [NR] vom [DATUM] zu begleichen.\n\nWir bitten Sie, den fälligen Betrag in Höhe von [BETRAG] € bis zum [FRIST] auf unser unten genanntes Konto zu überweisen.\n\nSollten Sie die Zahlung inzwischen geleistet haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.`,
          fee: 0.00,
          daysToPay: 7
      },
      level2: {
          title: "1. Mahnung",
          subjectTemplate: "1. Mahnung zur Rechnung Nr. [NR]",
          bodyTemplate: `sehr geehrte Damen und Herren,\n\nleider konnten wir bis heute keinen Zahlungseingang für unsere Rechnung Nr. [NR] feststellen. Auch auf unsere Zahlungserinnerung haben Sie nicht reagiert.\n\nWir bitten Sie nunmehr nachdrücklich, den offenen Betrag zuzüglich einer Mahngebühr von [GEBUEHR] € sofort zu überweisen.\n\nGesamtbetrag fällig: [GESAMT] €`,
          fee: 5.00,
          daysToPay: 5
      },
      level3: {
          title: "Letzte Mahnung",
          subjectTemplate: "LETZTE MAHNUNG zur Rechnung Nr. [NR]",
          bodyTemplate: `sehr geehrte Damen und Herren,\n\nda Sie auf unsere bisherigen Schreiben nicht reagiert haben, fordern wir Sie hiermit letztmalig auf, den fälligen Gesamtbetrag bis zum [FRIST] zu begleichen.\n\nSollte der Betrag nicht fristgerecht eingehen, werden wir die Forderung ohne weitere Ankündigung an unser Inkassobüro übergeben. Die hierdurch entstehenden Mehrkosten gehen zu Ihren Lasten.\n\nMahngebühr: [GEBUEHR] €\nGesamtbetrag fällig: [GESAMT] €`,
          fee: 10.00,
          daysToPay: 3
      }
  }
};

const initialContacts: Contact[] = [
  { id: 'D10000', name: 'Müller GmbH', type: ContactType.CUSTOMER, city: 'München' },
  { id: 'K70000', name: 'Immobilien Meier', type: ContactType.VENDOR, city: 'Hamburg' }
];

// Helper to safely load from localStorage
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
  
  // Persistent State
  const [companySettings, setCompanySettings] = useStickyState<CompanySettings>('settings', initialCompanySettings);
  const [transactions, setTransactions] = useStickyState<Transaction[]>('transactions', []);
  const [accounts, setAccounts] = useStickyState<Account[]>('accounts', initialAccounts);
  const [contacts, setContacts] = useStickyState<Contact[]>('contacts', initialContacts);
  const [invoices, setInvoices] = useStickyState<Invoice[]>('invoices', []);
  const [purchaseOrders, setPurchaseOrders] = useStickyState<PurchaseOrder[]>('purchaseOrders', []); 
  const [assets, setAssets] = useStickyState<Asset[]>('assets', []);
  const [costCenters, setCostCenters] = useStickyState<CostCenter[]>('costCenters', []);
  const [projects, setProjects] = useStickyState<Project[]>('projects', []);

  // Multi-Tenancy
  const [clients, setClients] = useStickyState<ClientProfile[]>('clients', [{ id: '1', name: 'Demo Mandant', created: new Date().toISOString() }]);
  const [activeClientId, setActiveClientId] = useStickyState<string>('activeClientId', '1');

  const currentYear = new Date().getFullYear();
  const [nextInvoiceNum, setNextInvoiceNum] = useStickyState<string>('nextInvoiceNum', `RE-${currentYear}-1001`);
  const [nextIncomingInvoiceNum, setNextIncomingInvoiceNum] = useStickyState<string>('nextIncomingInvoiceNum', `ER-${currentYear}-001`);
  const [nextOrderNum, setNextOrderNum] = useStickyState<string>('nextOrderNum', `B-${currentYear}-001`);

  const nextAssetId = `INV-${currentYear}-${(assets.length + 1).toString().padStart(3, '0')}`;

  const handleSaveTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  const handleSaveAsset = (asset: Asset) => {
      setAssets(prev => {
          const exists = prev.findIndex(a => a.id === asset.id);
          if (exists >= 0) {
              const updated = [...prev];
              updated[exists] = asset;
              return updated;
          }
          return [...prev, asset];
      });
  };

  // Fixed handleSaveInvoice logic to match the snippet requirement
  const handleSaveInvoice = (invoice: Invoice, transaction: Transaction, newAsset?: Asset) => {
    setInvoices(prev => [...prev, invoice]);
    setTransactions(prev => [transaction, ...prev]);
    
    if (newAsset) handleSaveAsset(newAsset);

    try {
        const parts = invoice.number.split('-');
        const numPart = parseInt(parts[parts.length - 1]);
        if (!isNaN(numPart)) {
            const newNum = numPart + 1;
            const prefix = parts.slice(0, parts.length - 1).join('-');
            const nextStr = `${prefix}-${newNum.toString().padStart(3, '0')}`; 

            if (invoice.number.startsWith("RE-")) {
                 setNextInvoiceNum(nextStr);
            } else if (invoice.number.startsWith("ER-")) {
                 setNextIncomingInvoiceNum(nextStr);
            }
        }
    } catch (e) {}
  };

  const handleSavePurchaseOrder = (order: PurchaseOrder, transaction?: Transaction, invoice?: Invoice) => {
      setPurchaseOrders(prev => {
          const exists = prev.find(o => o.id === order.id);
          if (exists) return prev.map(o => o.id === order.id ? order : o);
          return [...prev, order];
      });

      if (transaction && invoice) {
          handleSaveInvoice(invoice, transaction);
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
                purchaseOrders={purchaseOrders} 
                onSavePurchaseOrder={handleSavePurchaseOrder} 
                onSaveInvoice={handleSaveInvoice}
                onAddContact={handleAddContact}
                nextInvoiceNumber={nextIncomingInvoiceNum} 
                nextOrderNumber={nextOrderNum} 
                nextAssetId={nextAssetId}
            />
        );
      case 'payments':
        return <PaymentsView transactions={transactions} accounts={accounts} contacts={contacts} invoices={invoices} companySettings={companySettings} />;
      case 'assets':
        return <AssetAccountingView transactions={transactions} accounts={accounts} assets={assets} onBookDepreciation={handleSaveTransaction} onSaveAsset={handleSaveAsset} />;
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
