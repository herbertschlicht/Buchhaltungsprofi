
import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
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
  ChevronDown,
  LogOut,
  Plus,
  ChevronsUpDown,
  Check,
  Bot,
  Target,
  Archive
} from 'lucide-react';
import { ClientProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewTransaction: () => void;
  // Multi-Tenancy Props
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

  const navItems = [
    { id: 'home', label: 'Startseite', icon: Home },
    { id: 'ai-coach', label: 'AI-Coach', icon: Bot },
    { id: 'analytics', label: 'Finanzanalyse', icon: PieChart },
    { id: 'controlling', label: 'Controlling / KLR', icon: Target }, 
    { id: 'ledger', label: 'Finanzbuchhaltung', icon: BookOpen },
    { id: 'assets', label: 'Anlagenbuchhaltung', icon: Monitor },
    { id: 'payroll', label: 'Personalwesen', icon: UserCheck },
    { id: 'debtors', label: 'Debitorenbuchhaltung', icon: Users },
    { id: 'creditors', label: 'Kreditorenbuchhaltung', icon: Briefcase },
    { id: 'payments', label: 'Zahlungsverkehr', icon: ArrowLeftRight },
    { id: 'reports', label: 'Berichtswesen', icon: FileText },
    { id: 'closing', label: 'Jahresabschluss', icon: Archive }, // NEW
  ];

  return (
    <div className="flex h-screen bg-[#f5f7fa] text-slate-900 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10 hidden md:flex shadow-[2px_0_10px_rgba(0,0,0,0.03)] no-print">
        
        {/* Mandanten Switcher Header */}
        <div className="p-3 border-b border-slate-100 bg-white relative z-50">
          <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setShowClientMenu(!showClientMenu)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-md flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                        {activeClient?.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <h1 className="text-sm font-bold text-slate-800 leading-tight truncate">{activeClient?.name}</h1>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider group-hover:text-blue-600">Mandant wechseln</p>
                    </div>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
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
                                    <Building className={`w-4 h-4 ${activeClientId === client.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    <span className="truncate">{client.name}</span>
                                </div>
                                {activeClientId === client.id && <Check className="w-3 h-3 text-blue-600"/>}
                            </button>
                        ))}
                    </div>
                    <div className="p-2 border-t border-slate-100 bg-slate-50">
                        <button 
                            onClick={() => {
                                onCreateClient();
                                setShowClientMenu(false);
                            }}
                            className="w-full flex items-center justify-center px-3 py-2 text-xs font-bold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
                        >
                            <Plus className="w-3 h-3 mr-1" /> Neuen Mandant anlegen
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isCoach = item.id === 'ai-coach';
            return (
              <div key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`relative group flex items-center w-full px-5 py-3 transition-all duration-200 outline-none
                      ${isActive 
                        ? 'bg-blue-50 text-blue-800 font-semibold' 
                        : isCoach 
                            ? 'text-indigo-600 hover:bg-indigo-50 font-medium'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-700 rounded-r-full" />
                    )}
                    <item.icon 
                      className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-blue-700' : isCoach ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600'}`} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className="text-sm">{item.label}</span>
                  </button>

                  {item.id === 'ledger' && (
                      <div className="px-5 pb-2 pt-1 bg-slate-50/50 border-b border-slate-100">
                          <button
                            onClick={onNewTransaction}
                            className="flex items-center w-full px-3 py-2 text-xs font-bold text-blue-700 bg-blue-100/50 hover:bg-blue-100 rounded-md transition-all border border-blue-200"
                          >
                              <PlusCircle className="w-3.5 h-3.5 mr-2" />
                              Neue Buchung erfassen
                          </button>
                      </div>
                  )}
              </div>
            );
          })}
          
           <div className="mt-4 pt-4 border-t border-slate-100 mx-4">
              <button
                onClick={() => setActiveTab('settings')}
                className={`relative group flex items-center w-full px-2 py-3 transition-all duration-200 outline-none rounded-lg
                  ${activeTab === 'settings' 
                    ? 'bg-slate-100 text-slate-900 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                 <Settings className="w-5 h-5 mr-3 text-slate-500" />
                 <span className="text-sm">Einstellungen</span>
              </button>
           </div>
        </nav>

        <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
            &copy; {new Date().getFullYear()} BuchhaltungsProfi
        </div>
      </aside>

      <main className="flex-1 md:ml-64 overflow-y-auto bg-[#f5f7fa]">
        <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20 no-print">
             <div className="flex items-center gap-2" onClick={() => setShowClientMenu(!showClientMenu)}>
                <div className="w-6 h-6 bg-slate-800 rounded-sm flex items-center justify-center text-white text-xs font-bold">
                    {activeClient?.name.substring(0,1)}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800 truncate max-w-[150px] leading-tight">{activeClient?.name}</span>
                    <span className="text-[9px] text-blue-600 font-bold uppercase">▼ Mandant wechseln</span>
                </div>
             </div>
             <button className="text-slate-500">
                <Menu className="w-6 h-6"/>
             </button>
        </header>
        
        {/* Mobile Client Menu Overlay */}
        {showClientMenu && (
            <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex justify-end">
                <div className="w-72 bg-white h-full p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
                        <span className="font-bold text-slate-800 text-lg">Mandanten</span>
                        <button onClick={() => setShowClientMenu(false)} className="p-2 bg-slate-100 rounded-full"><LogOut className="w-5 h-5 text-slate-500"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {clients.map(client => (
                              <button
                                key={client.id}
                                onClick={() => {
                                    onSwitchClient(client.id);
                                    setShowClientMenu(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm flex items-center shadow-sm border ${activeClientId === client.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}
                              >
                                  <Building className={`w-4 h-4 mr-3 ${activeClientId === client.id ? 'text-blue-200' : 'text-slate-400'}`} />
                                  <span className="font-bold">{client.name}</span>
                                  {activeClientId === client.id && <Check className="ml-auto w-4 h-4 text-white"/>}
                              </button>
                          ))}
                    </div>
                    <button 
                        onClick={() => { onCreateClient(); setShowClientMenu(false); }}
                        className="w-full mt-4 flex items-center justify-center px-4 py-3 bg-slate-800 text-white rounded-xl font-bold shadow-lg"
                    >
                        <Plus className="w-5 h-5 mr-2"/> Neuer Mandant
                    </button>
                </div>
            </div>
        )}

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 text-slate-600 p-2 flex justify-around z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] no-print">
          {navItems.slice(0, 4).map((item) => (
             <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)} 
                className={`p-2 rounded-lg flex flex-col items-center ${activeTab === item.id ? 'text-blue-700 bg-blue-50' : 'text-slate-500'}`}
             >
                 <item.icon className="w-6 h-6" strokeWidth={activeTab === item.id ? 2.5 : 2} />
             </button>
          ))}
          <button 
                onClick={onNewTransaction} 
                className="p-2 rounded-lg flex flex-col items-center text-blue-600 bg-blue-50 font-bold"
             >
             <PlusCircle className="w-6 h-6" />
          </button>
      </div>
    </div>
  );
};
