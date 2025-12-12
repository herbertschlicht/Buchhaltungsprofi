
import React from 'react';
import { Invoice, Contact, CompanySettings } from '../types';
import { X, Printer, Send } from 'lucide-react';

interface DunningLetterModalProps {
  invoice: Invoice;
  contact: Contact;
  companySettings: CompanySettings; 
  targetLevel: number; 
  onClose: () => void;
  onConfirm?: () => void;
  isReadOnly?: boolean;
}

export const DunningLetterModal: React.FC<DunningLetterModalProps> = ({ 
    invoice, 
    contact, 
    companySettings,
    targetLevel, 
    onClose, 
    onConfirm,
    isReadOnly = false 
}) => {
  
  const today = new Date().toLocaleDateString('de-DE');
  
  let title = "";
  let subject = "";
  let body = "";
  let fee = 0;

  switch (targetLevel) {
      case 1:
          title = "Zahlungserinnerung";
          subject = `Zahlungserinnerung zur Rechnung Nr. ${invoice.number}`;
          body = `
            sehr geehrte Damen und Herren,

            sicherlich haben Sie in der Hektik des Alltags übersehen, unsere Rechnung Nr. ${invoice.number} vom ${new Date(invoice.date).toLocaleDateString('de-DE')} zu begleichen.
            
            Wir bitten Sie, den fälligen Betrag in Höhe von ${invoice.grossAmount.toFixed(2)} € bis zum ${new Date(Date.now() + 7 * 86400000).toLocaleDateString('de-DE')} auf unser unten genanntes Konto zu überweisen.

            Sollten Sie die Zahlung inzwischen geleistet haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.
          `;
          break;
      case 2:
          title = "1. Mahnung";
          subject = `1. Mahnung zur Rechnung Nr. ${invoice.number}`;
          fee = 5.00;
          body = `
            sehr geehrte Damen und Herren,

            leider konnten wir bis heute keinen Zahlungseingang für unsere Rechnung Nr. ${invoice.number} feststellen. Auch auf unsere Zahlungserinnerung haben Sie nicht reagiert.

            Wir bitten Sie nunmehr nachdrücklich, den offenen Betrag zuzüglich einer Mahngebühr von ${fee.toFixed(2)} € sofort zu überweisen.

            Gesamtbetrag fällig: ${(invoice.grossAmount + fee).toFixed(2)} €
          `;
          break;
      case 3:
          title = "2. Mahnung / Letzte Aufforderung";
          subject = `LETZTE MAHNUNG zur Rechnung Nr. ${invoice.number}`;
          fee = 10.00;
          body = `
            sehr geehrte Damen und Herren,

            da Sie auf unsere bisherigen Schreiben nicht reagiert haben, fordern wir Sie hiermit letztmalig auf, den fälligen Gesamtbetrag bis zum ${new Date(Date.now() + 5 * 86400000).toLocaleDateString('de-DE')} zu begleichen.

            Sollte der Betrag nicht fristgerecht eingehen, werden wir die Forderung ohne weitere Ankündigung an unser Inkassobüro übergeben. Die hierdurch entstehenden Mehrkosten gehen zu Ihren Lasten.
            
            Mahngebühr inkl. Verzugszinsen: ${fee.toFixed(2)} €
            Gesamtbetrag fällig: ${(invoice.grossAmount + fee).toFixed(2)} €
          `;
          break;
      default:
          title = "Information";
          body = "Keine Details verfügbar.";
  }

  const handlePrint = () => {
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
          alert('Der Browser hat das Druck-Fenster blockiert. Bitte erlauben Sie Popups für diese Seite.');
          return;
      }

      const content = document.getElementById('printable-letter');
      if (!content) return;

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <title>${title} - ${invoice.number}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { 
                font-family: 'Inter', sans-serif; 
                background: white;
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            @page {
                size: A4;
                margin: 0;
            }
            /* Override container styles for the print window context */
            #printable-letter {
                box-shadow: none !important;
                margin: 0 auto !important;
                width: 100% !important;
                min-height: 100vh;
                padding: 25mm !important; 
            }
          </style>
        </head>
        <body>
          ${content.outerHTML}
          <script>
            setTimeout(() => {
                window.print();
            }, 800);
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-slate-100 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md shrink-0">
            <div className="flex items-center gap-3">
                <span className="bg-slate-700 px-3 py-1 rounded text-sm font-mono text-slate-300">Vorschau</span>
                <h2 className="font-bold text-lg">{title}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-200/50">
            
            <div id="printable-letter" className="bg-white w-[210mm] min-h-[297mm] shadow-lg p-[25mm] text-slate-800 relative text-sm leading-relaxed mx-auto">
                
                <div className="text-[10px] text-slate-400 underline mb-12">
                    {companySettings.companyName} • {companySettings.street} • {companySettings.zip} {companySettings.city}
                </div>

                <div className="mb-20 text-base">
                    <strong>{contact.name}</strong><br />
                    {contact.street || 'Adresse nicht gepflegt'}<br />
                    {contact.zip || ''} {contact.city || 'Stadt nicht gepflegt'}<br />
                    {contact.country !== 'Deutschland' ? contact.country : ''}
                </div>

                <div className="text-right mb-12">
                    <p>{companySettings.city}, den {today}</p>
                </div>

                <div className="font-bold text-lg mb-8">
                    {subject}
                </div>

                <div className="whitespace-pre-line mb-12">
                    {body}
                </div>

                <div className="border-t border-slate-200 pt-8 mt-auto text-xs text-slate-500 grid grid-cols-3 gap-4 absolute bottom-[20mm] left-[25mm] right-[25mm]">
                    <div>
                        <strong>{companySettings.companyName}</strong><br/>
                        Geschäftsführer: {companySettings.ceo}<br/>
                        {companySettings.registerCourt}<br/>
                        {companySettings.registerNumber}
                    </div>
                    <div>
                        <strong>Kontakt</strong><br/>
                        Tel: {companySettings.phone}<br/>
                        Mail: {companySettings.email}<br/>
                        Web: {companySettings.website}
                    </div>
                    <div>
                        <strong>Bankverbindung</strong><br/>
                        {companySettings.bankName}<br/>
                        IBAN: {companySettings.iban}<br/>
                        BIC: {companySettings.bic}
                    </div>
                </div>

            </div>
        </div>

        <div className="bg-white p-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
            <button 
                onClick={handlePrint}
                className="flex items-center px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
                <Printer className="w-4 h-4 mr-2"/>
                Drucken / PDF
            </button>
            
            <button 
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
                Schließen
            </button>
            
            {!isReadOnly && onConfirm && (
                <button 
                    onClick={onConfirm}
                    className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all hover:scale-105"
                >
                    <Send className="w-4 h-4 mr-2"/>
                    {targetLevel === 0 ? 'Mahnlauf starten' : 'Mahnung jetzt versenden'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
