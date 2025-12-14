
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
import { AIAssistantView } from './components/AIAssistantView';
import { TransactionForm } from './components/TransactionForm';
import { ControllingView } from './components/ControllingView'; // NEW
import { Account, AccountType, Contact, ContactType, Transaction, Invoice, PurchaseOrder, CompanySettings, Asset, TransactionType, ClientProfile, CostCenter, Project, ProjectStatus } from './types';
import { skr03Accounts } from './data/skr03';

// --- INITIAL DATA SEEDING (Defaults for NEW Clients) ---
const defaultAccounts: Account[] = skr03Accounts;

const defaultCompanySettings: CompanySettings = {
  companyName: 'Neue Firma',
  ceo: '',
  street: '',
  zip: '',
  city: '',
  country: 'Deutschland',
  taxNumber: '',
  vatId: '',
  registerCourt: '',
  registerNumber: '',
  bankName: '',
  iban: '',
  bic: '',
  email: '',
  phone: '',
  website: '',
  dunningConfig: {
      level1: { title: 'Erinnerung', subjectTemplate: 'Zahlungserinnerung Rg. [NR]', bodyTemplate: 'Bitte begleichen Sie den offenen Betrag von [BETRAG] €.', fee: 0, daysToPay: 7 },
      level2: { title: '1. Mahnung', subjectTemplate: 'Mahnung Rg. [NR]', bodyTemplate: 'Sie sind in Verzug. Bitte zahlen Sie [GESAMT] €.', fee: 5, daysToPay: 5 },
      level3: { title: '2. Mahnung', subjectTemplate: 'Letzte Mahnung Rg. [NR]', bodyTemplate: 'Letzte Aufforderung vor Inkasso.', fee: 10, daysToPay: 3 }
  }
};

// Initial Contacts
const initialContacts: Contact[] = [
  { 
      id: 'D10000', 
      name: 'Müller GmbH', 
      type: ContactType.CUSTOMER, 
      email: 'buchhaltung@mueller.de',
      street: 'Industriestraße 5',
      zip: '80331',
      city: 'München',
      vatId: 'DE123456789',
      registerNumber: 'HRB 998877',
      contactPersons: [
        { name: 'Klaus Müller', role: 'Geschäftsführung', email: 'klaus@mueller.de' }
      ]
  },
  { 
      id: 'D10001', 
      name: 'Schmidt & Co', 
      type: ContactType.CUSTOMER, 
      email: 'info@schmidt-co.de',
      street: 'Hauptstraße 22',
      zip: '10115',
      city: 'Berlin',
      taxNumber: '33/444/55555'
  },
  { 
      id: 'K70000', 
      name: 'Immobilienverwaltung Meier', 
      type: ContactType.VENDOR, 
      email: 'miete@meier-immo.de',
      street: 'Verwalterweg 3',
      zip: '20095',
      city: 'Hamburg',
      iban: 'DE55 2005 0550 1234 5678 90',
      bic: 'HASPAHH1',
      bankName: 'Hamburger Sparkasse',
      contactPersons: [
        { name: 'Sabine Meier', role: 'Inhaberin', phone: '040-123456' }
      ]
  },
  { 
      id: 'K70001', 
      name: 'Stadtwerke AG', 
      type: ContactType.VENDOR, 
      email: 'service@stadtwerke.de',
      city: 'Frankfurt',
      vatId: 'DE987654321',
      iban: 'DE11 5005 0000 0987 6543 21',
      bic: 'HELAFF1',
      bankName: 'Frankfurter Volksbank'
  },
  {
      id: 'K70005',
      name: 'IT-Systemhaus Zukunft',
      type: ContactType.VENDOR,
      city: 'München',
      email: 'rechnung@it-zukunft.de'
  },
  {
      id: 'K70090',
      name: 'Finanzamt München',
      type: ContactType.VENDOR,
      city: 'München',
      iban: 'DE99 7005 0000 1234 5678 99'
  },
  {
      id: 'K70091',
      name: 'AOK Bayern - Die Gesundheitskasse',
      type: ContactType.VENDOR,
      city: 'München',
      iban: 'DE88 8005 0000 8765 4321 00'
  }
];

// Initial Cost Centers
const initialCostCenters: CostCenter[] = [
    { id: 'cc1', code: '1000', name: 'Verwaltung' },
    { id: 'cc2', code: '2000', name: 'Vertrieb' },
    { id: 'cc3', code: '3000', name: 'Fertigung / Baustelle' },
    { id: 'cc4', code: '4000', name: 'Fuhrpark' }
];

// Initial Projects
const initialProjects: Project[] = [
    { id: 'p1', code: 'BV-2023-001', name: 'Neubau Bürogebäude München', status: ProjectStatus.ACTIVE, startDate: '2023-01-10', budget: 500000 },
    { id: 'p2', code: 'BV-2023-002', name: 'Sanierung Wohnpark West', status: ProjectStatus.ACTIVE, startDate: '2023-05-01', budget: 150000 }
];

// Dummy Transactions
const initialTransactions: Transaction[] = [
  {
    id: 't1',
    date: '2023-01-01',
    type: TransactionType.STANDARD,
    reference: 'EB-001',
    description: 'Privateinlage / Startkapital',
    lines: [
      { accountId: '1200000', debit: 150000, credit: 0 }, 
      { accountId: '1890000', debit: 0, credit: 150000 }  
    ]
  },
  {
    id: 't2',
    date: '2023-10-05',
    type: TransactionType.STANDARD,
    reference: 'MZ-10',
    description: 'Mietzahlung Büro',
    contactId: 'K70000', 
    lines: [
      { accountId: '4200000', debit: 2000, credit: 0, costCenterId: 'cc1' }, // Raumkosten -> Verwaltung
      { accountId: '1200000', debit: 0, credit: 2000 }
    ]
  },
  {
    id: 't3',
    invoiceId: 'inv1', 
    date: '2023-10-10',
    type: TransactionType.STANDARD,
    description: 'Ausgangsrechnung #RE-2023-1001 - Beratungsdienstleistungen',
    contactId: 'D10000', 
    lines: [
      { accountId: '1400000', debit: 5950, credit: 0 }, 
      { accountId: '8400000', debit: 0, credit: 5000, projectId: 'p1' }, // Erlöse -> BV-2023-001
      { accountId: '1776000', debit: 0, credit: 950 }   
    ]
  },
  {
     id: 't4',
     date: '2023-10-12',
     type: TransactionType.STANDARD,
     reference: 'BAR-04',
     description: 'Einkauf Bürobedarf',
     lines: [
         { accountId: '4930000', debit: 350.50, credit: 0, costCenterId: 'cc1' }, // Bürobedarf -> Verwaltung
         { accountId: '1200000', debit: 0, credit: 350.50 }
     ]
  },
  {
    id: 't6',
    date: '2023-10-20',
    type: TransactionType.STANDARD,
    description: 'Kauf Firmenwagen',
    lines: [
      { accountId: '0320000', debit: 45000, credit: 0 }, 
      { accountId: '1200000', debit: 0, credit: 45000 }
    ]
  },
  {
      id: 't-2025-1',
      date: '2025-11-15',
      type: TransactionType.STANDARD,
      description: 'Eingangsrechnung Hardware-Upgrade',
      contactId: 'K70005',
      invoiceId: 'inv-2025-1',
      lines: [
          { accountId: '0485000', debit: 1000, credit: 0, costCenterId: 'cc2' }, // GWG -> Vertrieb
          { accountId: '1576000', debit: 190, credit: 0 },  
          { accountId: '1600000', debit: 0, credit: 1190 }  
      ]
  }
];

// Initial Assets
const initialAssets: Asset[] = [
    {
        id: 'a1-building',
        inventoryNumber: 'INV-001-A',
        name: 'Bürogebäude (Anteil Bauten)',
        glAccountId: '0090000', 
        purchaseDate: '2023-01-15',
        documentRef: 'NOTAR-55/23',
        cost: 50000,
        usefulLifeYears: 33, 
        afaCategory: 'Betriebsgebäude (Massivbau)',
        residualValue: 0,
        status: 'ACTIVE'
    },
    {
        id: 'a1-land',
        inventoryNumber: 'INV-001-B',
        name: 'Bürogebäude (Anteil Grund & Boden)',
        glAccountId: '0085000', 
        purchaseDate: '2023-01-15',
        documentRef: 'NOTAR-55/23',
        cost: 30000,
        usefulLifeYears: 0, 
        residualValue: 30000, 
        afaCategory: 'Grund und Boden (nicht abnutzbar)',
        status: 'ACTIVE'
    },
    {
        id: 'a2',
        inventoryNumber: 'INV-002',
        name: 'Firmenwagen VW Passat',
        glAccountId: '0320000', 
        purchaseDate: '2023-10-20',
        documentRef: 'RE-VW-2023',
        cost: 45000,
        usefulLifeYears: 6,
        afaCategory: 'Personenkraftwagen (Pkw)',
        residualValue: 1, 
        status: 'ACTIVE'
    }
];

// Initial Invoices
const initialInvoices: Invoice[] = [
    {
        id: 'inv1',
        number: 'RE-2023-1001',
        date: '2023-10-10',
        dueDate: '2023-10-24',
        contactId: 'D10000', 
        description: 'Beratungsdienstleistungen',
        netAmount: 5000,
        taxRate: 19,
        taxAmount: 950,
        grossAmount: 5950,
        transactionId: 't3',
        dunningLevel: 0
    },
    {
        id: 'inv-2025-1',
        number: 'ER-2025-999',
        externalNumber: 'RE-12345',
        date: '2025-11-15',
        dueDate: '2025-11-29',
        contactId: 'K70005',
        description: 'Hardware-Upgrade',
        netAmount: 1000,
        taxRate: 19,
        taxAmount: 190,
        grossAmount: 1190,
        transactionId: 't-2025-1'
    }
];

function useStickyState<T>(key: string, defaultValue: T, prefix: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const prefixedKey = prefix + key;
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(prefixedKey);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(prefixedKey, JSON.stringify(state));
  }, [prefixedKey, state]);

  return [state, setState];
}

interface CreateClientModalProps {
    onClose: () => void;
    onCreate: (name: string) => void;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4 font-sans">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-fadeIn">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Neuen Mandanten anlegen</h3>
                <p className="text-sm text-slate-500 mb-6">
                    Geben Sie den Namen der neuen Firma ein. Es wird eine leere Datenbank für diesen Mandanten erstellt.
                </p>
                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Firmenname</label>
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="z.B. Muster GmbH"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg text-slate-800"
                        onKeyDown={e => {
                            if(e.key === 'Enter' && name) onCreate(name);
                        }}
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Abbrechen</button>
                    <button 
                        onClick={() => name && onCreate(name)}
                        disabled={!name}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all hover:-translate-y-0.5"
                    >
                        Anlegen starten
                    </button>
                </div>
            </div>
        </div>
    )
}

interface CompanyWorkspaceProps {
    clientId: string;
    clients: ClientProfile[];
    setClients: React.Dispatch<React.SetStateAction<ClientProfile[]>>;
    onSwitchClient: (id: string) => void;
    onCreateClient: () => void;
}

const CompanyWorkspace: React.FC<CompanyWorkspaceProps> = ({ clientId, clients, setClients, onSwitchClient, onCreateClient }) => {
  const storagePrefix = clientId === 'default' ? 'bp_' : `bp_${clientId}_`;
  
  // DETERMINE if this is the default DEMO client or a new real client
  const isDemo = clientId === 'default';

  const [activeTab, setActiveTab] = useState('home');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  
  // State Initialization
  const [companySettings, setCompanySettings] = useStickyState<CompanySettings>('settings', defaultCompanySettings, storagePrefix);
  
  // DATA
  const [transactions, setTransactions] = useStickyState<Transaction[]>('transactions', isDemo ? initialTransactions : [], storagePrefix);
  const [contacts, setContacts] = useStickyState<Contact[]>('contacts', isDemo ? initialContacts : [], storagePrefix);
  const [invoices, setInvoices] = useStickyState<Invoice[]>('invoices', isDemo ? initialInvoices : [], storagePrefix);
  const [purchaseOrders, setPurchaseOrders] = useStickyState<PurchaseOrder[]>('purchaseOrders', [], storagePrefix); 
  const [assets, setAssets] = useStickyState<Asset[]>('assets', isDemo ? initialAssets : [], storagePrefix);
  
  // KLR DATA
  const [costCenters, setCostCenters] = useStickyState<CostCenter[]>('costcenters', isDemo ? initialCostCenters : [], storagePrefix);
  const [projects, setProjects] = useStickyState<Project[]>('projects', isDemo ? initialProjects : [], storagePrefix);

  // ACCOUNTS: Always load SKR03 for everyone
  const [accounts, setAccounts] = useStickyState<Account[]>('accounts', defaultAccounts, storagePrefix);

  const currentYear = new Date().getFullYear();
  const [nextInvoiceNum, setNextInvoiceNum] = useStickyState<string>('nextInvoiceNum', `RE-${currentYear}-1001`, storagePrefix);
  const [nextIncomingInvoiceNum, setNextIncomingInvoiceNum] = useStickyState<string>('nextIncomingInvoiceNum', `ER-${currentYear}-001`, storagePrefix);
  const [nextOrderNum, setNextOrderNum] = useStickyState<string>('nextOrderNum', `B-${currentYear}-001`, storagePrefix);

  const nextAssetId = `INV-${currentYear}-${(assets.length + 1).toString().padStart(3, '0')}`;

  const revenue = transactions.flatMap(t => t.lines).reduce((acc, line) => {
    const act = accounts.find(a => a.id === line.accountId);
    return (act?.type === AccountType.REVENUE) ? acc + line.credit : acc;
  }, 0);
  
  const expenses = transactions.flatMap(t => t.lines).reduce((acc, line) => {
    const act = accounts.find(a => a.id === line.accountId);
    return (act?.type === AccountType.EXPENSE) ? acc + line.debit : acc;
  }, 0);
  
  const netIncome = revenue - expenses;

  useEffect(() => {
      if (companySettings.companyName && clients.find(c => c.id === clientId)?.name !== companySettings.companyName) {
          setClients(prev => prev.map(c => c.id === clientId ? { ...c, name: companySettings.companyName } : c));
      }
  }, [companySettings.companyName, clientId]);

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
            if (invoice.number.startsWith("RE-")) setNextInvoiceNum(nextStr);
            else if (invoice.number.startsWith("ER-")) setNextIncomingInvoiceNum(nextStr);
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

      if (order.orderNumber === nextOrderNum) {
           try {
            const parts = order.orderNumber.split('-');
            const numPart = parseInt(parts[parts.length - 1]);
            if (!isNaN(numPart)) {
                const newNum = numPart + 1;
                const prefix = parts.slice(0, parts.length - 1).join('-');
                setNextOrderNum(`${prefix}-${newNum.toString().padStart(3, '0')}`);
            }
        } catch (e) { }
      }
  };
  
  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
      setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
  };

  const handleUpdateAccount = (updatedAccount: Account) => {
    setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
  };

  const handleAddAccount = (newAccount: Account) => {
      setAccounts(prev => [...prev, newAccount].sort((a,b) => a.code.localeCompare(b.code)));
  };

  const handleAddContact = (contact: Contact) => {
      setContacts(prev => [...prev, contact]);
  };

  const handleUpdateSettings = (newSettings: CompanySettings) => {
      setCompanySettings(newSettings);
  };

  // KLR Handlers
  const handleSaveCostCenter = (cc: CostCenter) => {
      setCostCenters(prev => [...prev, cc]);
  };

  const handleUpdateCostCenter = (updatedCC: CostCenter) => {
      setCostCenters(prev => prev.map(c => c.id === updatedCC.id ? updatedCC : c));
  };
  
  const handleSaveProject = (proj: Project) => {
      setProjects(prev => [...prev, proj]);
  };

  const handleUpdateProject = (updatedProj: Project) => {
      setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
  };

  const handleDeleteCostCenter = (id: string) => {
      if(window.confirm('Kostenstelle wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) setCostCenters(prev => prev.filter(c => c.id !== id));
  }

  const handleDeleteProject = (id: string) => {
      if(window.confirm('Bauvorhaben/Projekt wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) setProjects(prev => prev.filter(p => p.id !== id));
  }

  const handleResetData = () => {
      if(window.confirm("ACHTUNG: Alle Daten DIESES MANDANTEN wirklich löschen?")) {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(storagePrefix)) {
                localStorage.removeItem(key);
            }
        });
        window.location.reload();
      }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView setActiveTab={setActiveTab} metrics={{ netIncome, pendingTasks: 0 }} />;
      case 'ai-coach': 
        return <AIAssistantView />;
      case 'analytics':
        return <Dashboard transactions={transactions} accounts={accounts} />;
      case 'controlling':
        return (
            <ControllingView 
                costCenters={costCenters}
                projects={projects}
                transactions={transactions}
                accounts={accounts}
                onSaveCostCenter={handleSaveCostCenter}
                onUpdateCostCenter={handleUpdateCostCenter}
                onSaveProject={handleSaveProject}
                onUpdateProject={handleUpdateProject}
                onDeleteCostCenter={handleDeleteCostCenter}
                onDeleteProject={handleDeleteProject}
            />
        );
      case 'ledger':
        return (
          <LedgerView 
            transactions={transactions} 
            accounts={accounts}
            invoices={invoices} 
            companySettings={companySettings}
            onUpdateAccount={handleUpdateAccount}
            onAddAccount={handleAddAccount}
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
                // Pass KLR data to InvoiceForm via ContactsView
                costCenters={costCenters}
                projects={projects}
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
                // Pass KLR data to InvoiceForm via ContactsView
                costCenters={costCenters}
                projects={projects}
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
        return (
            <PaymentsView 
                transactions={transactions}
                accounts={accounts}
                contacts={contacts}
                invoices={invoices}
                companySettings={companySettings}
            />
        );
      case 'assets':
        return (
            <AssetAccountingView 
                transactions={transactions} 
                accounts={accounts} 
                assets={assets}
                onBookDepreciation={handleSaveTransaction}
                onSaveAsset={handleSaveAsset}
            />
        );
      case 'payroll': 
        return (
            <PayrollView 
                transactions={transactions}
                accounts={accounts}
                onSaveTransaction={handleSaveTransaction}
            />
        );
      case 'reports':
        return <ReportsView transactions={transactions} accounts={accounts} companySettings={companySettings} />;
      case 'settings':
        return <SettingsView settings={companySettings} onUpdate={handleUpdateSettings} onResetData={handleResetData} />;
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
        activeClientId={clientId}
        onSwitchClient={onSwitchClient}
        onCreateClient={onCreateClient}
      >
        {renderContent()}
      </Layout>

      {showTransactionModal && (
        <TransactionForm 
          accounts={accounts}
          costCenters={costCenters}
          projects={projects}
          contacts={contacts}
          invoices={invoices}
          existingTransactions={transactions}
          onSave={handleSaveTransaction}
          onClose={() => setShowTransactionModal(false)}
        />
      )}
    </>
  );
};

// --- APP CONTROLLER (Manages Clients) ---
const AppController: React.FC = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [clients, setClients] = useState<ClientProfile[]>(() => {
        try {
            const stored = localStorage.getItem('bp_clients');
            if (stored) return JSON.parse(stored);
            
            // Legacy Migration
            const legacySettings = localStorage.getItem('bp_settings');
            let defaultName = 'Meine Firma GmbH (Demo)';
            if (legacySettings) {
                try {
                    const parsed = JSON.parse(legacySettings);
                    if (parsed.companyName) defaultName = parsed.companyName + ' (Demo)';
                } catch(e) {}
            }

            return [{ id: 'default', name: defaultName, created: new Date().toISOString() }];
        } catch (e) {
            return [{ id: 'default', name: 'Meine Firma GmbH (Demo)', created: new Date().toISOString() }];
        }
    });

    const [activeClientId, setActiveClientId] = useState<string>(() => {
        return localStorage.getItem('bp_active_client_id') || 'default';
    });

    useEffect(() => {
        localStorage.setItem('bp_clients', JSON.stringify(clients));
    }, [clients]);

    useEffect(() => {
        localStorage.setItem('bp_active_client_id', activeClientId);
        document.title = `BuchhaltungsProfi - ${clients.find(c => c.id === activeClientId)?.name || ''}`;
    }, [activeClientId, clients]);

    const handleCreateClient = (name: string) => {
        const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
        const newClient: ClientProfile = { id: newId, name, created: new Date().toISOString() };
        
        // Save initial settings for this client to name it correctly immediately
        const prefix = `bp_${newId}_`;
        const settings: CompanySettings = { ...defaultCompanySettings, companyName: name };
        localStorage.setItem(prefix + 'settings', JSON.stringify(settings));

        setClients(prev => [...prev, newClient]);
        setActiveClientId(newId);
        setShowCreateModal(false);
    };

    return (
        <>
            <CompanyWorkspace 
                key={activeClientId} // Important: Force remount on switch
                clientId={activeClientId} 
                clients={clients}
                setClients={setClients}
                onSwitchClient={setActiveClientId}
                onCreateClient={() => setShowCreateModal(true)}
            />
            
            {showCreateModal && (
                <CreateClientModal 
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateClient}
                />
            )}
        </>
    );
};

export default AppController;
