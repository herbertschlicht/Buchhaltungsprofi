
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
import { Account, AccountType, Contact, ContactType, Transaction, TransactionType, Invoice, PurchaseOrder, PurchaseOrderStatus, CompanySettings, Asset } from './types';
import { calculateAccountBalance } from './utils/accounting';
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
  
  // Default Dunning Texts with Placeholders
  dunningConfig: {
      level1: {
          title: "Zahlungserinnerung",
          subjectTemplate: "Zahlungserinnerung zur Rechnung Nr. [NR]",
          bodyTemplate: `sehr geehrte Damen und Herren,

sicherlich haben Sie in der Hektik des Alltags übersehen, unsere Rechnung Nr. [NR] vom [DATUM] zu begleichen.

Wir bitten Sie, den fälligen Betrag in Höhe von [BETRAG] € bis zum [FRIST] auf unser unten genanntes Konto zu überweisen.

Sollten Sie die Zahlung inzwischen geleistet haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.`,
          fee: 0.00,
          daysToPay: 7
      },
      level2: {
          title: "1. Mahnung",
          subjectTemplate: "1. Mahnung zur Rechnung Nr. [NR]",
          bodyTemplate: `sehr geehrte Damen und Herren,

leider konnten wir bis heute keinen Zahlungseingang für unsere Rechnung Nr. [NR] feststellen. Auch auf unsere Zahlungserinnerung haben Sie nicht reagiert.

Wir bitten Sie nunmehr nachdrücklich, den offenen Betrag zuzüglich einer Mahngebühr von [GEBUEHR] € sofort zu überweisen.

Gesamtbetrag fällig: [GESAMT] €`,
          fee: 5.00,
          daysToPay: 5
      },
      level3: {
          title: "Letzte Mahnung",
          subjectTemplate: "LETZTE MAHNUNG zur Rechnung Nr. [NR]",
          bodyTemplate: `sehr geehrte Damen und Herren,

da Sie auf unsere bisherigen Schreiben nicht reagiert haben, fordern wir Sie hiermit letztmalig auf, den fälligen Gesamtbetrag bis zum [FRIST] zu begleichen.

Sollte der Betrag nicht fristgerecht eingehen, werden wir die Forderung ohne weitere Ankündigung an unser Inkassobüro übergeben. Die hierdurch entstehenden Mehrkosten gehen zu Ihren Lasten.

Mahngebühr: [GEBUEHR] €
Gesamtbetrag fällig: [GESAMT] €`,
          fee: 10.00,
          daysToPay: 3
      }
  }
};

// Updated to match 5-digit Debit/Credit Account Logic AND new Address/Tax/Bank Fields
const initialContacts: Contact[] = [
  { 
      id: '10000', 
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
      id: '10001', 
      name: 'Schmidt & Co', 
      type: ContactType.CUSTOMER, 
      email: 'info@schmidt-co.de',
      street: 'Hauptstraße 22',
      zip: '10115',
      city: 'Berlin',
      taxNumber: '33/444/55555'
  },
  { 
      id: '70000', 
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
      id: '70001', 
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
      id: '70005',
      name: 'IT-Systemhaus Zukunft',
      type: ContactType.VENDOR,
      city: 'München',
      email: 'rechnung@it-zukunft.de'
  },
  {
      id: '70090',
      name: 'Finanzamt München',
      type: ContactType.VENDOR,
      city: 'München',
      iban: 'DE99 7005 0000 1234 5678 99'
  },
  {
      id: '70091',
      name: 'AOK Bayern - Die Gesundheitskasse',
      type: ContactType.VENDOR,
      city: 'München',
      iban: 'DE88 8005 0000 8765 4321 00'
  }
];

const initialTransactions: Transaction[] = [
  {
    id: 't1',
    date: '2023-01-01',
    type: TransactionType.STANDARD,
    reference: 'EB-001',
    description: 'Privateinlage / Startkapital',
    lines: [
      { accountId: '1200', debit: 150000, credit: 0 },
      { accountId: '1890', debit: 0, credit: 150000 }
    ]
  },
  {
    id: 't-asset-1',
    date: '2023-01-15',
    type: TransactionType.STANDARD,
    reference: 'N-K-01',
    description: 'Kauf Geschäftsgrundstück (Anteil Gebäude)',
    lines: [
        { accountId: '0090', debit: 50000, credit: 0 }, // Geschäftsbauten (Abschreibbar)
        { accountId: '1200', debit: 0, credit: 50000 }
    ]
  },
  {
    id: 't-asset-1b',
    date: '2023-01-15',
    type: TransactionType.STANDARD,
    reference: 'N-K-01-B',
    description: 'Kauf Geschäftsgrundstück (Anteil Grund & Boden)',
    lines: [
        { accountId: '0085', debit: 30000, credit: 0 }, // Grund und Boden (NICHT Abschreibbar)
        { accountId: '1200', debit: 0, credit: 30000 }
    ]
  },
  {
    id: 't2',
    date: '2023-10-05',
    type: TransactionType.STANDARD,
    reference: 'MZ-10',
    description: 'Mietzahlung Büro',
    contactId: '70000', // Updated ID
    lines: [
      { accountId: '4200', debit: 2000, credit: 0 },
      { accountId: '1200', debit: 0, credit: 2000 }
    ]
  },
  {
    id: 't3',
    invoiceId: 'inv1', 
    date: '2023-10-10',
    type: TransactionType.STANDARD,
    description: 'Ausgangsrechnung #RE-2023-1001 - Beratungsdienstleistungen',
    contactId: '10000', 
    lines: [
      { accountId: '1400', debit: 5950, credit: 0 },
      { accountId: '8400', debit: 0, credit: 5000 },
      { accountId: '1776', debit: 0, credit: 950 }
    ]
  },
  {
     id: 't4',
     date: '2023-10-12',
     type: TransactionType.STANDARD,
     reference: 'BAR-04',
     description: 'Einkauf Bürobedarf',
     lines: [
         { accountId: '4930', debit: 350.50, credit: 0 },
         { accountId: '1200', debit: 0, credit: 350.50 }
     ]
  },
  // Auto purchase - MATCHES INITIAL ASSET
  {
    id: 't6',
    date: '2023-10-20',
    type: TransactionType.STANDARD,
    description: 'Kauf Firmenwagen',
    lines: [
      { accountId: '0320', debit: 45000, credit: 0 },
      { accountId: '1200', debit: 0, credit: 45000 }
    ]
  },
  {
      id: 't-2025-1',
      date: '2025-11-15',
      type: TransactionType.STANDARD,
      description: 'Eingangsrechnung Hardware-Upgrade',
      contactId: '70005',
      invoiceId: 'inv-2025-1',
      lines: [
          { accountId: '0485', debit: 1000, credit: 0 }, // GWG Sammelposten
          { accountId: '1576', debit: 190, credit: 0 },  // Vorsteuer
          { accountId: '1600', debit: 0, credit: 1190 }  // Verb. aLL
      ]
  },
  {
      id: 't-lohn-1',
      date: '2025-11-28',
      type: TransactionType.PAYROLL, 
      reference: 'LOB-2025-11', 
      description: 'Lohnbuchhaltung 11/2025 (Buchungsliste DATEV/LODAS)',
      lines: [
          { accountId: '4100', debit: 12500.00, credit: 0 }, 
          { accountId: '4130', debit: 2600.00, credit: 0 },  
          { accountId: '1740', debit: 0, credit: 8200.00 }, 
          { accountId: '1741', debit: 0, credit: 2300.00 }, 
          { accountId: '1742', debit: 0, credit: 4600.00 }  
      ]
  },
  {
      id: 't-lohn-pay-1',
      date: '2025-11-29',
      type: TransactionType.STANDARD,
      reference: 'BW-25-1101',
      description: 'Gehaltszahlungen 11/2025 (Sammelüberweisung)',
      lines: [
          { accountId: '1740', debit: 8200.00, credit: 0 }, 
          { accountId: '1200', debit: 0, credit: 8200.00 }  
      ]
  },
  {
      id: 't-lohn-pay-2',
      contactId: '70091', 
      date: '2025-11-27', 
      type: TransactionType.STANDARD,
      description: 'Beitragsnachweis AOK / SV-Beiträge 11/2025',
      lines: [
          { accountId: '1742', debit: 4600.00, credit: 0 }, 
          { accountId: '1200', debit: 0, credit: 4600.00 }
      ]
  },
  {
      id: 't-lohn-pay-3',
      contactId: '70090', 
      date: '2025-12-10', 
      type: TransactionType.STANDARD,
      description: 'Lohnsteueranmeldung 11/2025',
      lines: [
          { accountId: '1741', debit: 2300.00, credit: 0 }, 
          { accountId: '1200', debit: 0, credit: 2300.00 }
      ]
  }
];

// Initial Assets (Matching Transactions)
const initialAssets: Asset[] = [
    {
        id: 'a1-building',
        inventoryNumber: 'INV-001-A',
        name: 'Bürogebäude (Anteil Bauten)',
        glAccountId: '0090', // 0090 Geschäftsbauten
        purchaseDate: '2023-01-15',
        documentRef: 'NOTAR-55/23',
        cost: 50000,
        usefulLifeYears: 33, // 3% AfA
        afaCategory: 'Betriebsgebäude (Massivbau)',
        residualValue: 0,
        status: 'ACTIVE'
    },
    {
        id: 'a1-land',
        inventoryNumber: 'INV-001-B',
        name: 'Bürogebäude (Anteil Grund & Boden)',
        glAccountId: '0085', // 0085 Grund und Boden (nicht abnutzbar)
        purchaseDate: '2023-01-15',
        documentRef: 'NOTAR-55/23',
        cost: 30000,
        usefulLifeYears: 0, // 0 = Nicht abnutzbar
        residualValue: 30000, 
        afaCategory: 'Grund und Boden (nicht abnutzbar)',
        status: 'ACTIVE'
    },
    {
        id: 'a2',
        inventoryNumber: 'INV-002',
        name: 'Firmenwagen VW Passat',
        glAccountId: '0320', 
        purchaseDate: '2023-10-20',
        documentRef: 'RE-VW-2023',
        cost: 45000,
        usefulLifeYears: 6,
        afaCategory: 'Personenkraftwagen (Pkw)',
        residualValue: 1, // Memo Value
        status: 'ACTIVE'
    }
];

const initialInvoices: Invoice[] = [
    {
        id: 'inv1',
        number: 'RE-2023-1001',
        date: '2023-10-10',
        dueDate: '2023-10-24',
        contactId: '10000', 
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
        contactId: '70005',
        description: 'Hardware-Upgrade',
        netAmount: 1000,
        taxRate: 19,
        taxAmount: 190,
        grossAmount: 1190,
        transactionId: 't-2025-1'
    }
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
  const [transactions, setTransactions] = useStickyState<Transaction[]>('transactions', initialTransactions);
  const [accounts, setAccounts] = useStickyState<Account[]>('accounts', initialAccounts);
  const [contacts, setContacts] = useStickyState<Contact[]>('contacts', initialContacts);
  
  const [invoices, setInvoices] = useStickyState<Invoice[]>('invoices', initialInvoices);
  const [purchaseOrders, setPurchaseOrders] = useStickyState<PurchaseOrder[]>('purchaseOrders', []); 
  const [assets, setAssets] = useStickyState<Asset[]>('assets', initialAssets);

  const currentYear = new Date().getFullYear();
  const [nextInvoiceNum, setNextInvoiceNum] = useStickyState<string>('nextInvoiceNum', `RE-${currentYear}-1001`);
  const [nextIncomingInvoiceNum, setNextIncomingInvoiceNum] = useStickyState<string>('nextIncomingInvoiceNum', `ER-${currentYear}-001`);
  const [nextOrderNum, setNextOrderNum] = useStickyState<string>('nextOrderNum', `B-${currentYear}-001`);

  // Calculate next Asset ID for display in InvoiceForm
  const nextAssetId = `INV-${currentYear}-${(assets.length + 1).toString().padStart(3, '0')}`;

  const handleSaveTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  // --- MANUAL ASSET MANAGEMENT ---
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
    
    if (newAsset) {
        setAssets(prev => [...prev, newAsset]);
    }

    // Auto increment logic
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

  const handleAddContact = (contact: Contact) => {
      setContacts(prev => [...prev, contact]);
  };

  const handleUpdateSettings = (newSettings: CompanySettings) => {
      setCompanySettings(newSettings);
  };

  const handleResetData = () => {
      localStorage.removeItem('bp_transactions');
      localStorage.removeItem('bp_accounts');
      localStorage.removeItem('bp_contacts');
      localStorage.removeItem('bp_invoices');
      localStorage.removeItem('bp_purchaseOrders');
      localStorage.removeItem('bp_assets');
      localStorage.removeItem('bp_settings');
      localStorage.removeItem('bp_nextInvoiceNum');
      localStorage.removeItem('bp_nextIncomingInvoiceNum');
      localStorage.removeItem('bp_nextOrderNum');
      
      // Force reload to pick up defaults
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
                nextAssetId={nextAssetId} // PASS ASSET ID
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
      >
        {renderContent()}
      </Layout>

      {showTransactionModal && (
        <TransactionForm 
          accounts={accounts}
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

export default App;
