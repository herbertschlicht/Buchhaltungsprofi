
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
    Key
} from 'lucide-react';

// Fix for TypeScript build error: process is not defined in browser context types
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
  
  // Vite replaces process.env.API_KEY with the actual string value during build.
  // We check if that string is truthy.
  const hasApiKey = !!process.env.API_KEY;

  const menuItems = [
    {
      id: 'ai-coach',
      label: 'AI-Coach',
      subLabel: 'Dein Mentor',
      description: 'Lerne Buchhaltung spielerisch! Stelle Fragen und lass dir Konzepte aufzeichnen.',
      icon: Bot,
      targetTab: 'ai-coach',
      color: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      textColor: 'text-indigo-600'
    },
    {
      id: 'contacts-debtors',
      label: 'Debitorenbuchhaltung',
      subLabel: 'Kunden & Einnahmen',
      description: 'Rechnungen schreiben, Kunden verwalten und Mahnungen versenden.',
      icon: Users,
      targetTab: 'debtors',
      color: 'bg-gradient-to-br from-blue-400 to-blue-600',
      textColor: 'text-blue-600'
    },
    {
      id: 'contacts-creditors',
      label: 'Kreditorenbuchhaltung',
      subLabel: 'Lieferanten & Ausgaben',
      description: 'Eingangsrechnungen erfassen, Bestellungen aufgeben und Zahlungen prüfen.',
      icon: Briefcase,
      targetTab: 'creditors',
      color: 'bg-gradient-to-br from-orange-400 to-orange-600',
       textColor: 'text-orange-600'
    },
    {
      id: 'ledger',
      label: 'Finanzbuchhaltung',
      subLabel: 'Journal & Hauptbuch',
      description: 'Alle Buchungen im Detail sehen und manuelle Buchungen vornehmen.',
      icon: BookOpen,
      targetTab: 'ledger',
      color: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
       textColor: 'text-indigo-600'
    },
    {
      id: 'assets',
      label: 'Anlagenbuchhaltung',
      subLabel: 'Inventar & Abschreibung',
      description: 'Verwaltung teurer Anschaffungen (PKW, Laptop) und deren Wertverlust.',
      icon: Monitor,
      targetTab: 'assets',
      color: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
       textColor: 'text-emerald-600'
    },
    {
      id: 'reports',
      label: 'Berichtswesen',
      subLabel: 'Bilanz & Steuer',
      description: 'Finanzamt-Meldungen (UStVA) und Jahresabschluss (GuV/Bilanz).',
      icon: FileText,
      targetTab: 'reports',
      color: 'bg-gradient-to-br from-slate-500 to-slate-700',
       textColor: 'text-slate-600'
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
                                <Wifi className="w-3 h-3 mr-1" /> System Online v1.3
                            </span>
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Übersicht & Navigation</h1>
                    <p className="text-blue-100 text-lg max-w-2xl font-light leading-relaxed">
                        Wählen Sie einen Arbeitsbereich unten oder nutzen Sie den Wegweiser, um sich mit den Funktionen vertraut zu machen.
                    </p>
                </div>
                <div className="hidden md:block text-right">
                     <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1 block">Aktuelles Ergebnis</span>
                     <div className={`text-4xl font-bold ${metrics.netIncome >= 0 ? 'text-white' : 'text-red-200'}`}>
                         {metrics.netIncome >= 0 ? '+' : ''}{metrics.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                     </div>
                </div>
            </div>
        </div>
      </div>

      {/* NETLIFY API KEY WARNING */}
      {!hasApiKey && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4 shadow-sm animate-pulse">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0">
                <Key className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-red-900 font-bold text-lg mb-1">Wichtig: AI-Funktionen konfigurieren (Netlify)</h3>
                <p className="text-red-800 text-sm leading-relaxed mb-3">
                    Der API-Schlüssel wurde nicht gefunden. Damit der <strong>AI-Coach</strong> und die <strong>Finanzanalyse</strong> auf der veröffentlichten Webseite funktionieren, müssen Sie dies auf Netlify einstellen:
                </p>
                <div className="bg-white/60 rounded-lg p-3 border border-red-100 text-xs text-red-900 font-mono">
                    <ol className="list-decimal list-inside space-y-2">
                        <li>Öffnen Sie Ihr Projekt auf <a href="https://app.netlify.com" target="_blank" rel="noreferrer" className="underline font-bold">Netlify</a>.</li>
                        <li>Gehen Sie zu <strong>Site configuration</strong> &rarr; <strong>Environment variables</strong>.</li>
                        <li>Klicken Sie auf <strong>Add a variable</strong>.</li>
                        <li>Key: <strong>API_KEY</strong></li>
                        <li>Value: <em>(Ihr Google Gemini API Key, beginnt mit AIza...)</em></li>
                        <li>Wichtig: Starten Sie danach einen neuen Deploy (unter <strong>Deploys</strong> &rarr; <strong>Trigger deploy</strong>).</li>
                    </ol>
                </div>
            </div>
        </div>
      )}

      {/* Info Cards Row (Status & Deployment Help) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <Code className="w-6 h-6" />
              </div>
              <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Entwicklungsumgebung</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Änderungen am Code werden hier sofort angezeigt. Oben rechts <strong>"Sync to GitHub"</strong> klicken zum Speichern.
                  </p>
              </div>
          </div>
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                  <Cloud className="w-6 h-6" />
              </div>
              <div>
                  <h4 className="font-bold text-amber-900 text-sm mb-1">Bereitstellung auf Netlify</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Nach dem Import auf Netlify: Sie müssen <strong>keine Domain kaufen</strong>. Klicken Sie im Netlify-Dashboard einfach auf den Link oben links (z.B. <code>xyz.netlify.app</code>), um Ihre App zu öffnen.
                  </p>
              </div>
          </div>
      </div>

      {/* Grid Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.targetTab)}
            className="group relative bg-white rounded-2xl p-6 shadow-[0_2px_15px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 hover:-translate-y-1 transition-all duration-300 text-left flex flex-col h-full overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl ${item.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wide group-hover:bg-slate-100">
                    {item.subLabel}
                </div>
            </div>
            
            <h3 className={`text-lg font-bold text-slate-800 mb-2 group-hover:${item.textColor} transition-colors relative z-10`}>
              {item.label}
            </h3>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1 relative z-10">
              {item.description}
            </p>

            <div className={`flex items-center text-xs font-bold text-slate-400 group-hover:${item.textColor} transition-colors relative z-10`}>
              Öffnen <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      {/* BEGINNER GUIDE SECTION */}
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
                      <h2 className="text-xl font-bold text-slate-800">Wegweiser für Einsteiger</h2>
                      <p className="text-slate-500 text-sm">Wie arbeite ich mit diesem Programm? Eine einfache Erklärung der Module.</p>
                  </div>
              </div>
              <button className="text-slate-400">
                  {showGuide ? <ChevronUp className="w-6 h-6"/> : <ChevronDown className="w-6 h-6"/>}
              </button>
          </div>

          {showGuide && (
              <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                  
                  {/* Left Column: Daily Work */}
                  <div className="space-y-8">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Tägliche Aufgaben</h3>
                      
                      <div className="flex gap-4 group">
                          <div className="mt-1">
                              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <ArrowUpCircle className="w-5 h-5"/>
                              </div>
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => setActiveTab('debtors')}>1. Ich schreibe eine Rechnung</h4>
                              <p className="text-slate-600 text-sm leading-relaxed mt-1">
                                  Sie haben eine Leistung erbracht oder Ware verkauft? Gehen Sie zu <strong>"Debitorenbuchhaltung"</strong>. 
                                  Dort klicken Sie auf "Neue Ausgangsrechnung". Das Programm erstellt die Buchung automatisch und behält im Auge, ob der Kunde bezahlt.
                              </p>
                          </div>
                      </div>

                      <div className="flex gap-4 group">
                          <div className="mt-1">
                              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                  <ArrowDownCircle className="w-5 h-5"/>
                              </div>
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg group-hover:text-orange-600 transition-colors cursor-pointer" onClick={() => setActiveTab('creditors')}>2. Ich habe eine Rechnung erhalten</h4>
                              <p className="text-slate-600 text-sm leading-relaxed mt-1">
                                  Sie haben etwas gekauft? Gehen Sie zu <strong>"Kreditorenbuchhaltung"</strong>. 
                                  Erfassen Sie die Rechnung hier als "Eingangsrechnung". So wissen Sie immer, wem Sie noch Geld schulden und können Zahlungslisten erstellen.
                              </p>
                          </div>
                      </div>

                      <div className="flex gap-4 group">
                          <div className="mt-1">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                  <BookOpen className="w-5 h-5"/>
                              </div>
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => setActiveTab('ledger')}>3. Sonstige Ausgaben (Kasse/Bank)</h4>
                              <p className="text-slate-600 text-sm leading-relaxed mt-1">
                                  Für Miete, Bankgebühren oder Barzahlungen nutzen Sie die <strong>"Finanzbuchhaltung"</strong>. 
                                  Dort können Sie manuelle Buchungen vornehmen, die keine Rechnung an einen Kunden/Lieferanten sind.
                              </p>
                          </div>
                      </div>
                  </div>

                  {/* Right Column: Special & Monthly */}
                  <div className="space-y-8">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Monatlich / Jährlich</h3>

                      <div className="flex gap-4 group">
                          <div className="mt-1">
                              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                  <Monitor className="w-5 h-5"/>
                              </div>
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors cursor-pointer" onClick={() => setActiveTab('assets')}>4. Teure Anschaffungen (Anlagen)</h4>
                              <p className="text-slate-600 text-sm leading-relaxed mt-1">
                                  Haben Sie einen Computer, ein Auto oder Maschinen über 800€ gekauft? Das ist <strong>"Anlagenvermögen"</strong>. 
                                  Das Programm hilft Ihnen, diese Dinge über mehrere Jahre abzuschreiben (den Wertverlust steuerlich geltend zu machen).
                              </p>
                          </div>
                      </div>

                      <div className="flex gap-4 group">
                          <div className="mt-1">
                              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 group-hover:bg-slate-600 group-hover:text-white transition-colors">
                                  <FileText className="w-5 h-5"/>
                              </div>
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg group-hover:text-slate-600 transition-colors cursor-pointer" onClick={() => setActiveTab('reports')}>5. Finanzamt & Abschluss</h4>
                              <p className="text-slate-600 text-sm leading-relaxed mt-1">
                                  Unter <strong>"Berichtswesen"</strong> finden Sie die Auswertungen. 
                                  Hier erstellen Sie die Umsatzsteuervoranmeldung (UStVA) für das Finanzamt und sehen in der GuV (Gewinn- und Verlustrechnung), ob Sie Gewinn machen.
                              </p>
                          </div>
                      </div>

                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-6">
                          <h5 className="font-bold text-blue-800 flex items-center mb-2">
                              <CheckCircle2 className="w-4 h-4 mr-2"/>
                              Tipp: Das Hauptbuch arbeitet automatisch
                          </h5>
                          <p className="text-sm text-blue-700 leading-relaxed">
                              Wenn Sie Rechnungen in den Bereichen "Debitoren" oder "Kreditoren" schreiben, bucht das System automatisch im Hintergrund auf die richtigen Sachkonten (Erlöse, Aufwand, Steuer). Sie müssen meistens keine manuellen Buchungssätze bilden!
                          </p>
                      </div>
                  </div>

              </div>
          )}
      </div>
    </div>
  );
};
