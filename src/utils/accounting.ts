
import { Transaction, Account, AccountType, Invoice, TransactionType } from '../types';

export const calculateAccountBalance = (
  accountId: string,
  transactions: Transaction[],
  accountType: AccountType
): number => {
  let balance = 0;
  transactions.forEach(t => {
    t.lines.forEach(line => {
      if (line.accountId === accountId) {
        if ([AccountType.ASSET, AccountType.EXPENSE].includes(accountType)) {
          balance += line.debit - line.credit;
        } else {
          balance += line.credit - line.debit;
        }
      }
    });
  });
  return balance;
};

export const getContactBalance = (
  contactId: string,
  transactions: Transaction[],
  accounts: Account[],
  endDate?: string
): number => {
  let balance = 0;
  transactions.forEach(t => {
    if (endDate && t.date > endDate) return;
    if (t.contactId === contactId) {
        t.lines.forEach(line => {
            const acct = accounts.find(a => a.id === line.accountId);
            if (!acct) return;
             if (acct.type === AccountType.ASSET) {
                 balance += line.debit - line.credit;
             } else if (acct.type === AccountType.LIABILITY) {
                 balance += line.credit - line.debit;
             }
        })
    }
  });
  return balance;
};

export interface LedgerStats {
    openingBalance: number;
    debitMonth: number;
    creditMonth: number;
    debitYTD: number;
    creditYTD: number;
    endingBalance: number;
}

// Logic to identify if a transaction should count towards the "Opening Balance" column
const isOpeningTransaction = (t: Transaction): boolean => {
    // Explicit Type Check (Best)
    if (t.type === TransactionType.OPENING_BALANCE) return true;

    // Fallback: Legacy Text Check
    const ref = t.reference?.toUpperCase() || '';
    const desc = t.description.toLowerCase();
    return ref.startsWith('EB') || 
           desc.includes('saldovortrag') || 
           desc.includes('eröffnungsbilanz') || 
           desc.includes('startkapital') ||
           desc.includes('vortrag');
};

export const getContactLedgerStats = (
    contactId: string,
    transactions: Transaction[],
    accounts: Account[],
    targetDateStr: string
): LedgerStats => {
    const targetDate = new Date(targetDateStr);
    const currentYear = targetDate.getFullYear();
    const currentMonth = targetDate.getMonth();

    let stats: LedgerStats = {
        openingBalance: 0,
        debitMonth: 0,
        creditMonth: 0,
        debitYTD: 0,
        creditYTD: 0,
        endingBalance: 0
    };

    const isCreditor = transactions.some(t => t.contactId === contactId && t.lines.some(l => {
         const a = accounts.find(acc => acc.id === l.accountId);
         return a?.type === AccountType.LIABILITY; 
    }));

    transactions.forEach(t => {
        if (t.contactId !== contactId) return;
        if (t.date > targetDateStr) return;

        const tDate = new Date(t.date);
        const tYear = tDate.getFullYear();
        const tMonth = tDate.getMonth();

        const isPreviousYear = tYear < currentYear;
        const isCurrentYear = tYear === currentYear;
        const isCurrentMonth = isCurrentYear && tMonth === currentMonth;
        const isEB = isOpeningTransaction(t);

        t.lines.forEach(line => {
            const acct = accounts.find(a => a.id === line.accountId);
            if (!acct) return;

            if (acct.type === AccountType.ASSET || acct.type === AccountType.LIABILITY) {
                const debit = line.debit;
                const credit = line.credit;

                if (isPreviousYear || (isCurrentYear && isEB)) {
                    if (acct.type === AccountType.ASSET) {
                        stats.openingBalance += (debit - credit);
                    } else {
                        stats.openingBalance += (credit - debit);
                    }
                }
                else if (isCurrentYear && !isEB) {
                    stats.debitYTD += debit;
                    stats.creditYTD += credit;
                    if (isCurrentMonth) {
                        stats.debitMonth += debit;
                        stats.creditMonth += credit;
                    }
                }
            }
        });
    });

    if (isCreditor) {
        stats.endingBalance = stats.openingBalance + stats.creditYTD - stats.debitYTD;
    } else {
        stats.endingBalance = stats.openingBalance + stats.debitYTD - stats.creditYTD;
    }
    return stats;
};

export const getAccountLedgerStats = (
    accountId: string,
    transactions: Transaction[],
    accountType: AccountType,
    targetDateStr: string
): LedgerStats => {
    const targetDate = new Date(targetDateStr);
    const currentYear = targetDate.getFullYear();
    const currentMonth = targetDate.getMonth();

    let stats: LedgerStats = {
        openingBalance: 0,
        debitMonth: 0,
        creditMonth: 0,
        debitYTD: 0,
        creditYTD: 0,
        endingBalance: 0
    };

    transactions.forEach(t => {
        if (t.date > targetDateStr) return;

        const tDate = new Date(t.date);
        const tYear = tDate.getFullYear();
        const tMonth = tDate.getMonth();

        const isPreviousYear = tYear < currentYear;
        const isCurrentYear = tYear === currentYear;
        const isCurrentMonth = isCurrentYear && tMonth === currentMonth;
        const isEB = isOpeningTransaction(t);

        t.lines.forEach(line => {
            if (line.accountId !== accountId) return;

            const debit = line.debit;
            const credit = line.credit;
            
            // Should this account type carry forward? (Balance Sheet vs P&L)
            // Note: If user explicitly books an EB for an Expense account (unusual but possible), we show it.
            const shouldCarryForward = [AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY].includes(accountType);

            if ((isPreviousYear && shouldCarryForward) || (isCurrentYear && isEB)) {
                 if ([AccountType.ASSET, AccountType.EXPENSE].includes(accountType)) {
                     stats.openingBalance += (debit - credit);
                 } else {
                     stats.openingBalance += (credit - debit);
                 }
            }
            else if (isCurrentYear && !isEB) {
                stats.debitYTD += debit;
                stats.creditYTD += credit;
                if (isCurrentMonth) {
                    stats.debitMonth += debit;
                    stats.creditMonth += credit;
                }
            }
        });
    });

    if ([AccountType.ASSET, AccountType.EXPENSE].includes(accountType)) {
        stats.endingBalance = stats.openingBalance + stats.debitYTD - stats.creditYTD;
    } else {
        stats.endingBalance = stats.openingBalance + stats.creditYTD - stats.debitYTD;
    }
    return stats;
};

export const getInvoicePaymentStatus = (invoice: Invoice, transactions: Transaction[]) => {
    let paidAmount = 0;
    
    transactions.filter(t => t.invoiceId === invoice.id && t.id !== invoice.transactionId).forEach(t => {
         const totalT = t.lines.reduce((acc, l) => acc + l.debit + l.credit, 0) / 2;
         paidAmount += totalT;
    });

    if (invoice.grossAmount < 0) {
        return {
            paidAmount: 0,
            remainingAmount: 0,
            status: 'CREDIT_NOTE',
            daysOverdue: 0
        };
    }

    const remainingAmount = Math.max(0, invoice.grossAmount - paidAmount);
    
    let status: 'OPEN' | 'PARTIAL' | 'PAID' | 'OVERDUE' = 'OPEN';
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    
    const diffTime = today.getTime() - dueDate.getTime();
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (remainingAmount < 0.05) {
        status = 'PAID';
    } else if (paidAmount > 0.05) {
        status = 'PARTIAL';
    } else if (daysOverdue > 0) {
        status = 'OVERDUE';
    }

    return {
        paidAmount,
        remainingAmount,
        status,
        daysOverdue: status === 'PAID' ? 0 : daysOverdue
    };
};
