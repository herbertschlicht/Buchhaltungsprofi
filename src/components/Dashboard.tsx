
import React, { useState } from 'react';
import { Transaction, Account, AccountType } from '../types';
import { generateFinancialInsight } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Sparkles, TrendingUp, TrendingDown, DollarSign, Wallet, AlertTriangle, Activity } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, accounts }) => {
  const [insight, setInsight] = useState<string>("");
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Calculate High Level Metrics
  const revenue = transactions.flatMap(t => t.lines).reduce((acc, line) => {
    const act = accounts.find(a => a.id === line.accountId);
    return (act?.type === AccountType.REVENUE) ? acc + line.credit : acc;
  }, 0);

  const expenses = transactions.flatMap(t => t.lines).reduce((acc, line) => {
    const act = accounts.find(a => a.id === line.accountId);
    return (act?.type === AccountType.EXPENSE) ? acc + line.debit : acc;
  }, 0);

  const netIncome = revenue - expenses;

  // Calculate Cash Balance
  const cashAccounts = accounts.filter(a => 
      a.type === AccountType.ASSET && 
      (a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('kasse') || a.name.toLowerCase().includes('cash'))
  );
  let cashBalance = 0;
  cashAccounts.forEach(ca => {
      transactions.forEach(t => {
          t.lines.forEach(l => {
              if (l.accountId === ca.id) cashBalance += (l.debit - l.credit);
          })
      })
  });

  // Prepare Chart Data
  const chartData = transactions.slice(0, 7).map(t => ({
      name: t.date,
      amount: t.lines.reduce((acc, l) => acc + l.debit, 0)
  })).reverse();

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    setInsight(""); // Reset old insight
    setTokensUsed(null);
    try {
        const result = await generateFinancialInsight(transactions, accounts);
        // Correctly access .text from the result object
        setInsight(result.text);
        setTokensUsed(result.totalTokens);
    } catch (error) {
        console.error("Analysis failed", error);
        setInsight("Die Analyse konnte momentan nicht durchgeführt werden. Bitte überprüfen Sie Ihre Internetverbindung oder den API-Schlüssel.");
    } finally {
        // CRITICAL: Ensure loading state is reset even on error to stop the spinner
        setLoadingInsight(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
           <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Finanzübersicht</h2>
           <p className="text-slate-500 mt-1">Ein detaillierter Blick auf Ihre Kennzahlen.</p>
        </div>
        <button 
            onClick={handleGenerateInsight}
            disabled={loadingInsight}
            className={`mt-4 md:mt-0 flex items-center px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all font-medium text-white ${loadingInsight ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:-translate-y-0.5'}`}
        >
            {loadingInsight ? (
                <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analysiere...
                </>
            ) : (
                <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    KI-Analyse starten
                </>
            )}
        </button>
      </div>

      {insight && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-6 rounded-3xl text-indigo-900 animate-fadeIn shadow-inner relative">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold flex items-center text-lg"><Sparkles className="w-5 h-5 mr-2 text-purple-600"/> KI-Analyse Ergebnis</h3>
                {tokensUsed !== null && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 border border-indigo-200 rounded-full text-[10px] font-bold text-indigo-600 shadow-sm">
                        <Activity className="w-3 h-3" />
                        {tokensUsed.toLocaleString()} TOKENS
                    </div>
                )}
            </div>
            <p className="text-base leading-relaxed text-slate-700 whitespace-pre-wrap">{insight}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-50 hover:border-slate-200 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${netIncome >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {netIncome >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
                {netIncome >= 0 && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Gut</span>}
            </div>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Nettoergebnis</p>
            <h3 className={`text-3xl font-bold mt-1 ${netIncome >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                {netIncome.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
            </h3>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-50 hover:border-slate-200 transition-colors">
            <div className="flex justify-between items-start mb-4">
                 <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                    <DollarSign className="w-6 h-6" />
                </div>
            </div>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Einnahmen</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{revenue.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-50 hover:border-slate-200 transition-colors">
             <div className="flex justify-between items-start mb-4">
                 <div className="p-3 rounded-2xl bg-orange-50 text-orange-600">
                    <TrendingDown className="w-6 h-6" />
                </div>
            </div>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Ausgaben</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{expenses.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-50 hover:border-slate-200 transition-colors">
             <div className="flex justify-between items-start mb-4">
                 <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                    <Wallet className="w-6 h-6" />
                </div>
            </div>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Liquidität</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{cashBalance.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</h3>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-50 h-96">
            <h3 className="text-xl font-bold mb-6 text-slate-800">Transaktionsvolumen</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top: 10, right: 10, left: 0, bottom: 40}}>
                    <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} 
                        cursor={{stroke: '#cbd5e1', strokeWidth: 1}}
                        formatter={(value: number) => [`${value.toLocaleString('de-DE', {minimumFractionDigits: 2})} €`, 'Betrag']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-50 h-96">
             <h3 className="text-xl font-bold mb-6 text-slate-800">Ertragsübersicht</h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'YTD', Revenue: revenue, Expenses: expenses }]} margin={{top: 10, right: 10, left: 0, bottom: 40}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} 
                        formatter={(value: number) => [`${value.toLocaleString('de-DE', {minimumFractionDigits: 2})} €`]}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="Revenue" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={50} name="Einnahmen" />
                    <Bar dataKey="Expenses" fill="#fb923c" radius={[6, 6, 6, 6]} barSize={50} name="Ausgaben" />
                </BarChart>
             </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
