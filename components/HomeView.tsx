
import React, { useState } from 'react';
import { 
    Users, 
    BookOpen, 
    Monitor, 
    FileText, 
    LayoutDashboard, 
    ArrowRight,
    Briefcase,
    Smile,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    ArrowDownCircle,
    ArrowUpCircle,
    Wifi,
    Bot,
    Code,
    Cloud,
    Key,
    Library
} from 'lucide-react';

declare const process: any;

interface HomeViewProps {
  setActiveTab: (tab: string) => void;
  metrics: {
      netIncome: number;
      pendingTasks: number;
  }
}

export const HomeView: React.FC<HomeViewProps> = ({ setActiveTab, metrics }) => {
  const [showGuide, setShowGuide] = useState(true);
  const hasApiKey = !!process.env.API_KEY;

  const menuItems = [
    {
      id: 'ai-coach',
      label: 'AI-Coach Buchi',
      subLabel: 'Interaktives Lernen',
      description: 'Stelle Fragen zur Buchhaltung und lass dir Konzepte von der KI erklären.',
      icon: Bot,
      targetTab: 'ai-coach',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
      textColor: 'text-indigo-600'
    },
    {
        id: 'archive',
        label: 'Belegarchiv',
        subLabel: 'Dokumentenverwaltung',
        description: 'Suchen und Finden Sie alle Rechnungen (ER/RE) an einem zentralen Ort.',
        icon: Library,
        targetTab: 'archive',
        color: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
        textColor: 'text-indigo-600'
    },
    {
      id: 'contacts-debtors',
      label: 'Verkauf (Debitoren)',
      subLabel: 'Rechnungen & Einnahmen',
      description: 'Kunden verwalten, Rechnungen schreiben und Mahnungen versenden.',
      icon: Users,
      targetTab: 'debtors',
      color: 'bg-gradient-to-br from-blue-500 to-blue-700',
      textColor: 'text-blue-600'
    },
    {
      id: 'contacts-creditors',
      label: 'Einkauf (Kreditoren)',
      subLabel: 'Belege & Ausgaben',
      description: 'Eingangsrechnungen erfassen und Lieferantenverbindlichkeiten prüfen.',
      icon: Briefcase,
      targetTab: 'creditors',
      color: 'bg-gradient-to-br from-orange-500 to-orange-700',
       textColor: 'text-orange-600'
    },
    {
      id: 'ledger',
      label: 'Finanzbuchhaltung',
      subLabel: 'Hauptbuch & Journal',
      description: 'Manuelle Buchungen vornehmen und alle Kontenbewegungen einsehen.',
      icon: BookOpen,
      targetTab: 'ledger',
      color: 'bg-gradient-to-br from-slate-600 to-slate-800',
       textColor: 'text-slate-600'
    },
    {
      id: 'reports',
      label: 'Berichtswesen',
      subLabel: 'Bilanz & GuV',
      description: 'Finanzberichte generieren und Umsatzsteuervoranmeldungen erstellen.',
      icon: FileText,
      targetTab: 'reports',
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
       textColor: 'text-emerald-600'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn font-sans pb-12">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-10 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                            <Smile className="w-6 h-6 text-yellow-300" />
                        </div>
                        <span className="text-blue-100 font-medium tracking-wide text-sm uppercase flex items-center">
                            Willkommen zurück
                            <span className="ml-3 bg-green-500/20 text-green-200 text-[10px] px-2 py-0.5 rounded-full border border-green-400/30 flex items-center shadow-sm">
                                <Wifi className="w-3 h-3 mr-1" /> System Bereit
                            </span>
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Übersicht & Schnellzugriff</h1>
                    <p className="text-blue-100 text-lg max-w-2xl font-light leading-relaxed">
                        Verwalten Sie Ihre Finanzen effizient mit dem integrierten Belegarchiv und KI-Unterstützung.
                    </p>
                </div>
                <div className="hidden md:block text-right">
                     <span className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1 block">Nettoergebnis (YTD)</span>
                     <div className={`text-4xl font-black ${metrics.netIncome >= 0 ? 'text-white' : 'text-red-200'}`}>
                         {metrics.netIncome >= 0 ? '+' : ''}{metrics.netIncome.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                     </div>
                </div>
            </div>
        </div>
      </div>

      {!hasApiKey && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4 shadow-sm animate-pulse">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0">
                <Key className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-red-900 font-bold text-lg mb-1">KI-Funktionen nicht konfiguriert</h3>
                <p className="text-red-800 text-sm leading-relaxed mb-3">
                    Damit der <strong>AI-Coach</strong> und der <strong>Beleg-Scan</strong> funktionieren, muss ein API_KEY in den Netlify-Umgebungsvariablen hinterlegt werden.
                </p>
            </div>
        </div>
      )}

      {/* Grid Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.targetTab)}
            className="group relative bg-white rounded-2xl p-6 shadow-[0_2px_15px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] border border-slate-100 hover:-translate-y-1 transition-all duration-300 text-left flex flex-col h-full overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl ${item.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    {item.subLabel}
                </div>
            </div>
            
            <h3 className={`text-lg font-black text-slate-800 mb-2 transition-colors relative z-10`}>
              {item.label}
            </h3>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1 relative z-10">
              {item.description}
            </p>

            <div className={`flex items-center text-xs font-black text-blue-600 relative z-10`}>
              Jetzt öffnen <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      {/* QUICK GUIDE */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden transition-all duration-500">
          <div 
            className="p-6 md:p-8 flex justify-between items-center cursor-pointer bg-white border-b border-slate-100"
            onClick={() => setShowGuide(!showGuide)}
          >
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
                      <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                      <h2 className="text-xl font-bold text-slate-800">Hilfe & Workflow</h2>
                      <p className="text-slate-500 text-sm">Wie arbeite ich korrekt mit dem System?</p>
                  </div>
              </div>
              <button className="text-slate-400">
                  {showGuide ? <ChevronUp className="w-6 h-6"/> : <ChevronDown className="w-6 h-6"/>}
              </button>
          </div>

          {showGuide && (
              <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                      <div className="flex gap-4 group">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                              <Library className="w-5 h-5"/>
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg">Belege finden</h4>
                              <p className="text-slate-600 text-sm leading-relaxed mt-1">
                                  Nutzen Sie das <strong>Zentrale Archiv</strong>, um Belege zu suchen, Buchungssätze zu prüfen oder Korrekturbuchungen (Storno) einzuleiten.
                              </p>
                          </div>
                      </div>

                      <div className="flex gap-4 group">
                          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shrink-0">
                              <History className="w-5 h-5"/>
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg">Fehler korrigieren (Storno)</h4>
                              <p className="text-slate-600 text-sm leading-relaxed mt-1">
                                  Haben Sie sich verbucht? Öffnen Sie den Beleg im Archiv und klicken Sie auf das <strong>History-Icon</strong>. Das System führt automatisch ein rechtssicheres Generalstorno durch.
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-indigo-600 p-8 rounded-3xl text-white relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full"></div>
                        <h4 className="text-xl font-black mb-3">Tipp vom AI-Coach</h4>
                        <p className="text-indigo-100 text-sm leading-relaxed mb-6 italic">
                            "Wusstest du? Du kannst Belege einfach fotografieren und im Belegarchiv oder beim Erfassen hochladen. Mein Smart-Scan erkennt Beträge und Partner automatisch!"
                        </p>
                        <button onClick={() => setActiveTab('ai-coach')} className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold text-sm w-fit hover:bg-indigo-50 transition-colors">Jetzt Coach fragen</button>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
