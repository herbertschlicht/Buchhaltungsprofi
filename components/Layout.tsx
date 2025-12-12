import React from 'react';
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
  UserCheck
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewTransaction: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onNewTransaction }) => {
  const navItems = [
    { id: 'home', label: 'Startseite', icon: Home },
    { id: 'analytics', label: 'Finanzanalyse', icon: PieChart },
    { id: 'ledger', label: 'Finanzbuchhaltung', icon: BookOpen },
    { id: 'assets', label: 'Anlagenbuchhaltung', icon: Monitor },
    { id: 'payroll', label: 'Personalwesen', icon: UserCheck }, // NEW
    { id: 'debtors', label: 'Debitorenbuchhaltung', icon: Users },
    { id: 'creditors', label: 'Kreditorenbuchhaltung', icon: Briefcase },
    { id: 'payments', label: 'Zahlungsverkehr', icon: ArrowLeftRight },
    { id: 'reports', label: 'Berichtswesen', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-[#f5f7fa] text-slate-900 font-sans">
      {/* Sidebar - SAP Style (Light/Quartz Theme inspired) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10 hidden md:flex shadow-[2px_0_10px_rgba(0,0,0,0.03)] no-print">
        {/* Header Area */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-md flex items-center justify-center text-white font-bold shadow-sm">
              B
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-tight">BuchhaltungsProfi</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Enterprise Edition</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <div key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`relative group flex items-center w-full px-5 py-3 transition-all duration-200 outline-none
                      ${isActive 
                        ? 'bg-blue-50 text-blue-800 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    {/* Active Indicator Strip */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-700 rounded-r-full" />
                    )}
                    
                    <item.icon 
                      className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'}`} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className="text-sm">{item.label}</span>
                  </button>

                  {/* Context Action: Neue Buchung unter Finanzbuchhaltung */}
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
          
           {/* Settings Item - Separated */}
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

        {/* Footer Area (User Profile or similar could go here, button removed) */}
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
            &copy; {new Date().getFullYear()} LedgerLens
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 overflow-y-auto bg-[#f5f7fa]">
        {/* Top Shell Bar (Mobile only usually, but good for structure) */}
        <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20 no-print">
             <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-700 rounded-sm flex items-center justify-center text-white text-xs font-bold">B</div>
                <span className="font-bold text-slate-800">BuchhaltungsProfi</span>
             </div>
             <button className="text-slate-500">
                <Menu className="w-6 h-6"/>
             </button>
        </header>

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
      
      {/* Mobile Nav Bar */}
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