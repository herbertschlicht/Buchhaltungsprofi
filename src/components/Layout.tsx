
import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  FileText, 
  PlusCircle,
  Home,
  Monitor,
  PieChart,
  Menu,
  Briefcase,
  Settings,
  ArrowLeftRight,
  UserCheck,
  Building,
  Plus,
  ChevronsUpDown,
  Check,
  Bot,
  Target,
  Archive,
  ChevronRight
} from 'lucide-react';
import { ClientProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewTransaction: () => void;
  clients: ClientProfile[];
  activeClientId: string;
  onSwitchClient: (id: string) => void;
  onCreateClient: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, activeTab, setActiveTab, onNewTransaction,
    clients, activeClientId, onSwitchClient, onCreateClient
}) => {
  const [showClientMenu, setShowClientMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const activeClient = clients.find(c => c.id === activeClientId) || clients[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowClientMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navGroups = [
    {
        title: "Übersicht",
        items: [
            { id: 'home', label: 'Dashboard', icon: Home },
            { id: 'ai-coach', label: 'AI-Coach Buchi', icon: Bot, special: true },
            { id: 'analytics', label: 'Finanzanalyse', icon: PieChart },
        ]
    },
    {
        title: "Operatives Geschäft",
        items: [
            { id: 'debtors', label: 'Verkauf (Debitoren)', icon: Users },
            { id: 'creditors', label: 'Einkauf (Kreditoren)', icon: Briefcase },
            { id: 'payments', label: 'Zahlungsverkehr', icon: ArrowLeftRight },
        ]
    },
    {
        title: "Buchhaltung & System",
        items: [
            { id: 'ledger', label: 'Hauptbuch (Fibu)', icon: BookOpen },
            { id: 'assets', label: 'Anlagen / Inventar', icon: Monitor },
            { id: 'payroll', label: 'Personal / Lohn', icon: UserCheck },
            { id: 'controlling', label: 'Controlling / KLR', icon: Target },
        ]
    },
    {
        title: "Auswertung & Legal",
        items: [
            { id: 'reports', label: 'Berichtswesen', icon: FileText },
            { id: 'closing', label: 'Jahresabschluss', icon: Archive },
        ]
    }
  ];

  const NavItem: React.FC<{ item: any }> = ({ item }) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;
    
    return (
        <button
            onClick={() => setActiveTab(item.id)}
            className={`group flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 mb-0.5
                ${isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : item.special 
                        ? 'text-indigo-600 hover:bg-indigo-50 font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
        >
            <Icon 
                className={`w-4 h-4 mr-3 shrink-0 ${isActive ? 'text-white' : item.special ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600'}`} 
                strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="text-sm font-medium">{item.label}</span>
            {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
        </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10 hidden md:flex no-print">
        
        {/* Mandant Selection */}
        <div className="p-4 border-b border-slate-100 relative z-50">
          <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setShowClientMenu(!showClientMenu)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 border border-slate-100 transition-all group"
            >
                <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
                    {activeClient?.name.substring(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <h1 className="text-sm font-bold text-slate-800 truncate">{activeClient?.name}</h1>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">Mandant wechseln</p>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-slate-400" />
            </button>

            {showClientMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn origin-top">
                    <div className="p-2 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50">
                        Verfügbare Mandanten
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {clients.map(client => (
                            <button
                                key={client.id}
                                onClick={() => {
                                    onSwitchClient(client.id);
                                    setShowClientMenu(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between group transition-colors ${activeClientId === client.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <Building className={`w-4 h-4 ${activeClientId === client.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <span className="truncate">{client.name}</span>
                                </div>
                                {activeClientId === client.id && <Check className="w-3 h-3 text-blue-600"/>}
                            </button>
                        ))}
                    </div>
                    <div className="p-2 border-t border-slate-100 bg-slate-50">
                        <button 
                            onClick={() => { onCreateClient(); setShowClientMenu(false); }}
                            className="w-full flex items-center justify-center px-3 py-2 text-xs font-bold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-all"
                        >
                            <Plus className="w-3 h-3 mr-1" /> Neuer Mandant
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
        
        {/* Navigation Content */}
        <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-thin">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx}>
                <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{group.title}</h3>
                <div className="space-y-0.5">
                    {group.items.map((item) => (
                        <NavItem key={item.id} item={item} />
                    ))}
                    
                    {/* Special Action Button for Ledger Section */}
                    {group.title === "Buchhaltung & System" && (
                        <div className="mt-2 px-1">
                            <button
                                onClick={onNewTransaction}
                                className="flex items-center w-full px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-200 border-dashed"
                            >
                                <PlusCircle className="w-3.5 h-3.5 mr-2" />
                                Neue Direktbuchung
                            </button>
                        </div>
                    )}
                </div>
            </div>
          ))}
        </nav>

        {/* Footer Navigation */}
        <div className="p-3 border-t border-slate-100 space-y-1">
            <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200
                    ${activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
                <Settings className={`w-4 h-4 mr-3 ${activeTab === 'settings' ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-sm font-medium">Einstellungen</span>
            </button>
            <div className="px-3 pt-2 text-[10px] text-slate-400 flex justify-between items-center">
                <span>&copy; {new Date().getFullYear()} BP v1.4</span>
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Bereit</span>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 overflow-y-auto bg-[#f8fafc]">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20 no-print">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    {activeClient?.name.substring(0,1)}
                </div>
                <div className="flex flex-col leading-tight">
                    <span className="font-bold text-slate-800 text-sm">{activeClient?.name}</span>
                    <button onClick={() => setShowClientMenu(!showClientMenu)} className="text-[10px] text-blue-600 font-bold text-left uppercase">Mandant wechseln ▾</button>
                </div>
             </div>
             <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                <Menu className="w-6 h-6"/>
             </button>
        </header>

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen">
          {children}
        </div>
      </main>
      
      {/* Mobile Quick Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 text-slate-600 px-4 py-2 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] no-print">
          <button onClick={() => setActiveTab('home')} className={`p-2 rounded-xl flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
             <Home className="w-6 h-6" />
             <span className="text-[9px] font-bold">Home</span>
          </button>
          <button onClick={() => setActiveTab('debtors')} className={`p-2 rounded-xl flex flex-col items-center gap-1 ${activeTab === 'debtors' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
             <Users className="w-6 h-6" />
             <span className="text-[9px] font-bold">Verkauf</span>
          </button>
          
          <button 
                onClick={onNewTransaction} 
                className="w-12 h-12 -mt-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 border-4 border-white active:scale-90 transition-transform"
             >
             <Plus className="w-6 h-6" strokeWidth={3} />
          </button>

          <button onClick={() => setActiveTab('creditors')} className={`p-2 rounded-xl flex flex-col items-center gap-1 ${activeTab === 'creditors' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
             <Briefcase className="w-6 h-6" />
             <span className="text-[9px] font-bold">Einkauf</span>
          </button>
          <button onClick={() => setActiveTab('reports')} className={`p-2 rounded-xl flex flex-col items-center gap-1 ${activeTab === 'reports' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
             <FileText className="w-6 h-6" />
             <span className="text-[9px] font-bold">Berichte</span>
          </button>
      </div>
    </div>
  );
};
