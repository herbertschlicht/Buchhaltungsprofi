
import React, { useState } from 'react';
import { CostCenter, Project, ProjectStatus, Transaction, Account, AccountType, ProjectBudgetPosition } from '../types';
import { PlusCircle, Target, Briefcase, BarChart3, Save, X, Trash2, Building2, FolderOpen, PenLine, Coins, Plus, List, Wand2 } from 'lucide-react';

interface ControllingViewProps {
    costCenters: CostCenter[];
    projects: Project[];
    transactions: Transaction[];
    accounts: Account[];
    onSaveCostCenter: (cc: CostCenter) => void;
    onUpdateCostCenter: (cc: CostCenter) => void;
    onSaveProject: (proj: Project) => void;
    onUpdateProject: (proj: Project) => void;
    onDeleteCostCenter: (id: string) => void;
    onDeleteProject: (id: string) => void;
}

export const ControllingView: React.FC<ControllingViewProps> = ({
    costCenters,
    projects,
    transactions,
    accounts,
    onSaveCostCenter,
    onUpdateCostCenter,
    onSaveProject,
    onUpdateProject,
    onDeleteCostCenter,
    onDeleteProject
}) => {
    const [activeTab, setActiveTab] = useState<'projects' | 'costcenters' | 'reports'>('projects');
    
    // Modal State
    const [showCCModal, setShowCCModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);

    // Edit State
    const [editingCC, setEditingCC] = useState<CostCenter | null>(null);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // Form State - CC
    const [ccName, setCcName] = useState('');
    const [ccCode, setCcCode] = useState('');
    
    // Form State - Project
    const [projName, setProjName] = useState('');
    const [projCode, setProjCode] = useState('');
    const [projStart, setProjStart] = useState(new Date().toISOString().split('T')[0]);
    // Budget Plan State
    const [budgetPlan, setBudgetPlan] = useState<ProjectBudgetPosition[]>([]);
    
    // Filter relevant accounts for Budgeting (Revenue & Expense)
    const budgetAccounts = accounts.filter(a => a.type === AccountType.REVENUE || a.type === AccountType.EXPENSE)
                                   .sort((a,b) => a.code.localeCompare(b.code));

    // Number Range Helpers
    const getNextCCCode = () => {
        const nums = costCenters.map(c => parseInt(c.code)).filter(n => !isNaN(n));
        const max = nums.length > 0 ? Math.max(...nums) : 999;
        return (max + 10).toString(); 
    };

    const getNextProjectCode = () => {
        const year = new Date().getFullYear();
        const existingInYear = projects.filter(p => p.code.includes(`BV-${year}`)).length;
        return `BV-${year}-${(existingInYear + 1).toString().padStart(3, '0')}`;
    };

    const openNewCC = () => {
        setEditingCC(null);
        setCcCode(getNextCCCode());
        setCcName('');
        setShowCCModal(true);
    };

    const openEditCC = (cc: CostCenter) => {
        setEditingCC(cc);
        setCcCode(cc.code);
        setCcName(cc.name);
        setShowCCModal(true);
    };

    const openNewProject = () => {
        setEditingProject(null);
        setProjCode(getNextProjectCode());
        setProjName('');
        setProjStart(new Date().toISOString().split('T')[0]);
        setBudgetPlan([]);
        setShowProjectModal(true);
    };

    const openEditProject = (proj: Project) => {
        setEditingProject(proj);
        setProjCode(proj.code);
        setProjName(proj.name);
        setProjStart(proj.startDate || new Date().toISOString().split('T')[0]);
        setBudgetPlan(proj.budgetPlan || (proj.budget ? [{ accountId: 'global', amount: proj.budget }] : []));
        setShowProjectModal(true);
    };

    const handleSaveCC = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCC) {
            onUpdateCostCenter({ ...editingCC, code: ccCode, name: ccName });
        } else {
            onSaveCostCenter({
                id: crypto.randomUUID(),
                code: ccCode,
                name: ccName
            });
        }
        setShowCCModal(false);
    };

    const handleAddBudgetLine = () => {
        setBudgetPlan([...budgetPlan, { accountId: '', amount: 0 }]);
    };

    // Helper to quick-fill standard construction/project accounts
    const handleFillStandardBudget = () => {
        // SKR03 Standard Accounts for Projects
        const standardCodes = ['3400', '4100', '5900', '4900']; // Wareneingang, Lohn, Fremdleistung, Sonstiges
        // Note: My data/skr03 might have 4 digit or 7 digit codes depending on version used. 
        // Based on types.ts it seems we use whatever is in accounts. 
        // Let's try to match by prefix.
        
        const newLines: ProjectBudgetPosition[] = [];
        
        // Material (Wareneingang 19%)
        const matAcc = accounts.find(a => a.code.startsWith('3400'));
        if (matAcc) newLines.push({ accountId: matAcc.id, amount: 0 });

        // Fremdleistungen (Subunternehmer)
        const subAcc = accounts.find(a => a.code.startsWith('5900') || a.code.startsWith('3100')); 
        // If SKR03, Fremdleistung is often 3100 or class 4? 
        // In my provided skr03.ts: 
        // 3120 = Bauleistungen
        // 3400 = Wareneingang
        // 4900 = Sonstige
        // Let's grab some typical ones
        
        const servicesAcc = accounts.find(a => a.code.startsWith('3120')); // Bauleistungen
        if (servicesAcc) newLines.push({ accountId: servicesAcc.id, amount: 0 });

        const wageAcc = accounts.find(a => a.code.startsWith('4100')); // Lohn
        if (wageAcc) newLines.push({ accountId: wageAcc.id, amount: 0 });

        setBudgetPlan([...budgetPlan, ...newLines]);
    };

    const updateBudgetLine = (index: number, field: keyof ProjectBudgetPosition, value: any) => {
        const newPlan = [...budgetPlan];
        (newPlan[index] as any)[field] = value;
        setBudgetPlan(newPlan);
    };

    const removeBudgetLine = (index: number) => {
        setBudgetPlan(budgetPlan.filter((_, i) => i !== index));
    };

    const calculateTotalBudget = () => {
        return budgetPlan.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const handleSaveProj = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clean up budget plan (remove empty lines)
        const cleanBudgetPlan = budgetPlan.filter(b => b.amount > 0 && b.accountId);
        const totalBudget = cleanBudgetPlan.reduce((sum, item) => sum + item.amount, 0);

        if (editingProject) {
            onUpdateProject({ 
                ...editingProject, 
                code: projCode, 
                name: projName, 
                startDate: projStart,
                budget: totalBudget,
                budgetPlan: cleanBudgetPlan
            });
        } else {
            onSaveProject({
                id: crypto.randomUUID(),
                code: projCode,
                name: projName,
                status: ProjectStatus.ACTIVE,
                startDate: projStart,
                budget: totalBudget,
                budgetPlan: cleanBudgetPlan
            });
        }
        setShowProjectModal(false);
    };

    // --- CALCULATION LOGIC FOR REPORTS ---
    const getProjectStats = (projectId: string) => {
        let actuals = 0;
        let revenue = 0;
        transactions.forEach(t => {
            t.lines.forEach(l => {
                if (l.projectId === projectId) {
                    const acc = accounts.find(a => a.id === l.accountId);
                    if (acc?.type === AccountType.EXPENSE) actuals += l.debit - l.credit;
                    if (acc?.type === AccountType.REVENUE) revenue += l.credit - l.debit;
                }
            });
        });
        return { actuals, revenue, margin: revenue - actuals };
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Target className="w-6 h-6 mr-3 text-rose-600"/>
                        Controlling & KLR
                    </h2>
                    <p className="text-slate-500">Kostenstellenrechnung und Projektcontrolling (Kostenträger).</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
                <button onClick={() => setActiveTab('projects')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'projects' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>
                    <Briefcase className="w-4 h-4 mr-2"/> Bauvorhaben / Projekte
                </button>
                <button onClick={() => setActiveTab('costcenters')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'costcenters' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>
                    <Building2 className="w-4 h-4 mr-2"/> Kostenstellen
                </button>
                <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'reports' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>
                    <BarChart3 className="w-4 h-4 mr-2"/> Auswertungen
                </button>
            </div>

            <div className="flex-1 overflow-auto">
                
                {/* --- PROJECTS TAB --- */}
                {activeTab === 'projects' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex justify-end">
                            <button onClick={openNewProject} className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg font-bold shadow-sm hover:bg-rose-700 transition-colors">
                                <PlusCircle className="w-4 h-4 mr-2"/> Neues Bauvorhaben (BV)
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map(proj => {
                                const stats = getProjectStats(proj.id);
                                const totalBudget = proj.budget || 0;
                                const remainingBudget = totalBudget - stats.actuals;
                                const progress = totalBudget > 0 ? Math.min(100, (stats.actuals / totalBudget) * 100) : 0;
                                const isOverBudget = remainingBudget < 0;
                                const hasDetailedBudget = proj.budgetPlan && proj.budgetPlan.length > 0;

                                return (
                                    <div key={proj.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">{proj.code}</span>
                                                <h3 className="font-bold text-slate-800 mt-2 text-lg">{proj.name}</h3>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <div className={`w-3 h-3 rounded-full mt-1 ${proj.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-300'}`} title={proj.status}></div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between text-slate-600">
                                                <span>Erlöse (Umsatz):</span>
                                                <span className="font-bold text-green-600">{stats.revenue.toLocaleString()} €</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Kosten (Ist):</span>
                                                <span className="font-bold text-red-600">{stats.actuals.toLocaleString()} €</span>
                                            </div>
                                            <div className="flex justify-between font-bold border-t border-slate-100 pt-2">
                                                <span>Deckungsbeitrag:</span>
                                                <span className={stats.margin >= 0 ? 'text-green-600' : 'text-red-600'}>{stats.margin.toLocaleString()} €</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-xl">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                                    <Coins className="w-3 h-3 mr-1"/> Budget 
                                                    {hasDetailedBudget && <span className="ml-1 px-1 bg-white border border-slate-200 text-[9px] rounded text-slate-400">Detail</span>}
                                                </span>
                                                <span className={`text-xs font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                                                    {remainingBudget.toLocaleString()} € Verfügbar
                                                </span>
                                            </div>
                                            <div className="w-full bg-white rounded-full h-2 mb-2 border border-slate-100">
                                                <div className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-rose-500'}`} style={{width: `${progress}%`}}></div>
                                            </div>
                                            
                                            <div className="flex justify-between items-center mt-3">
                                                <button 
                                                    onClick={() => openEditProject(proj)} 
                                                    className="text-xs flex items-center bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                                                >
                                                    <Coins className="w-3 h-3 mr-1"/> Budget planen
                                                </button>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditProject(proj)} className="text-slate-400 hover:text-blue-600 p-1" title="Bearbeiten"><PenLine className="w-4 h-4"/></button>
                                                    <button onClick={() => onDeleteProject(proj.id)} className="text-slate-400 hover:text-red-600 p-1" title="Löschen"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {projects.length === 0 && (
                                <div className="col-span-full p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50"/>
                                    Noch keine Bauvorhaben angelegt.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- COST CENTERS TAB --- */}
                {activeTab === 'costcenters' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex justify-end">
                            <button onClick={openNewCC} className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg font-bold shadow-sm hover:bg-slate-900 transition-colors">
                                <PlusCircle className="w-4 h-4 mr-2"/> Neue Kostenstelle
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 w-32">KSt-Nr.</th>
                                        <th className="p-4">Bezeichnung</th>
                                        <th className="p-4 text-right">Kosten (Lfd. Jahr)</th>
                                        <th className="p-4 w-32 text-right">Aktion</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {costCenters.map(cc => {
                                        const costs = transactions.reduce((sum, t) => {
                                            return sum + t.lines.filter(l => l.costCenterId === cc.id).reduce((lSum, l) => {
                                                const acc = accounts.find(a => a.id === l.accountId);
                                                return (acc?.type === AccountType.EXPENSE) ? lSum + (l.debit - l.credit) : lSum;
                                            }, 0);
                                        }, 0);

                                        return (
                                            <tr key={cc.id} className="hover:bg-slate-50 group">
                                                <td className="p-4 font-mono font-bold text-slate-700">{cc.code}</td>
                                                <td className="p-4 font-medium">{cc.name}</td>
                                                <td className="p-4 text-right font-mono text-slate-600">{costs.toLocaleString(undefined, {minimumFractionDigits: 2})} €</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => openEditCC(cc)} className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors" title="Bearbeiten"><PenLine className="w-4 h-4"/></button>
                                                        <button onClick={() => onDeleteCostCenter(cc.id)} className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors" title="Löschen"><Trash2 className="w-4 h-4"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {costCenters.length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">Keine Kostenstellen definiert.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- REPORTS TAB --- */}
                {activeTab === 'reports' && (
                    <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300"/>
                        <h3 className="text-lg font-bold text-slate-800">Detailauswertungen</h3>
                        <p>Hier erscheinen bald detaillierte BAB (Betriebsabrechnungsbogen) und Projekt-Journal Auswertungen.</p>
                    </div>
                )}

            </div>

            {/* MODAL: COST CENTER (CREATE / EDIT) */}
            {showCCModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">{editingCC ? 'Kostenstelle bearbeiten' : 'Neue Kostenstelle'}</h3>
                            <button onClick={() => setShowCCModal(false)}><X className="w-6 h-6 text-slate-400"/></button>
                        </div>
                        <form onSubmit={handleSaveCC} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nummer (Code)</label>
                                <input type="text" value={ccCode} onChange={e => setCcCode(e.target.value)} className="w-full p-2 border rounded font-mono" required/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bezeichnung</label>
                                <input type="text" value={ccName} onChange={e => setCcName(e.target.value)} className="w-full p-2 border rounded" placeholder="z.B. Verwaltung" required/>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900">Speichern</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: PROJECT (CREATE / EDIT) */}
            {showProjectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">{editingProject ? 'Bauvorhaben bearbeiten' : 'Neues Bauvorhaben (BV)'}</h3>
                            <button onClick={() => setShowProjectModal(false)}><X className="w-6 h-6 text-slate-400"/></button>
                        </div>
                        <form onSubmit={handleSaveProj} className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* BASE DATA */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Stammdaten</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">BV-Nummer</label>
                                        <input type="text" value={projCode} onChange={e => setProjCode(e.target.value)} className="w-full p-2 border rounded font-mono" required/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Startdatum</label>
                                        <input type="date" value={projStart} onChange={e => setProjStart(e.target.value)} className="w-full p-2 border rounded"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Projektname / Baustelle</label>
                                    <input type="text" value={projName} onChange={e => setProjName(e.target.value)} className="w-full p-2 border rounded font-bold" placeholder="z.B. Neubau EFH Müller" required/>
                                </div>
                            </div>

                            {/* BUDGET PLANUNG */}
                            <div className="border-t border-slate-200 pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-rose-700 flex items-center">
                                            <Coins className="w-4 h-4 mr-2"/>
                                            Budget-Planung
                                        </h4>
                                        <p className="text-xs text-slate-500">Legen Sie fest, wie viel Geld für welche Konten ausgegeben werden darf.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            type="button" 
                                            onClick={handleFillStandardBudget}
                                            className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-100 flex items-center transition-colors"
                                            title="Füllt typische Kostenarten (Material, Lohn, etc.) automatisch ein"
                                        >
                                            <Wand2 className="w-3 h-3 mr-1"/> Standard-Kostenarten laden
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleAddBudgetLine}
                                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center transition-colors border border-slate-300"
                                        >
                                            <Plus className="w-3 h-3 mr-1"/> Konto hinzufügen
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
                                    {budgetPlan.length === 0 && (
                                        <div className="text-center py-6 text-slate-400">
                                            <p className="mb-2">Noch kein Budget definiert.</p>
                                            <button type="button" onClick={handleFillStandardBudget} className="text-rose-600 underline text-xs font-bold">Standard-Vorschlag laden</button>
                                        </div>
                                    )}
                                    {budgetPlan.map((line, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <select 
                                                className="flex-1 p-2 text-sm border rounded bg-white shadow-sm"
                                                value={line.accountId}
                                                onChange={(e) => updateBudgetLine(idx, 'accountId', e.target.value)}
                                            >
                                                <option value="">- Konto wählen -</option>
                                                {budgetAccounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.code} {acc.name} ({acc.type === 'REVENUE' ? 'Erlös' : 'Kosten'})
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="relative w-32">
                                                <input 
                                                    type="number" 
                                                    className="w-full p-2 pr-6 text-sm border rounded text-right font-mono"
                                                    placeholder="0.00"
                                                    value={line.amount || ''}
                                                    onChange={(e) => updateBudgetLine(idx, 'amount', parseFloat(e.target.value))}
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                                            </div>
                                            <button type="button" onClick={() => removeBudgetLine(idx)} className="text-slate-400 hover:text-red-500 p-2"><X className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex justify-end mt-3 items-center text-sm font-bold text-slate-700 bg-white p-2 rounded border border-slate-100 shadow-sm w-fit ml-auto">
                                    <span className="mr-3 text-slate-500 uppercase text-xs">Gesamtbudget:</span>
                                    <span className="text-lg">{calculateTotalBudget().toLocaleString()} €</span>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button type="submit" className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-700 shadow-sm">Speichern</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
