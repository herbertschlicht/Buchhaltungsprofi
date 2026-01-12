
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Transaction, Account, AccountType } from "../types";

declare const process: any;

const apiKey = process.env.API_KEY || '';

const getAiClient = () => {
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export interface AiResponse {
    text: string;
    totalTokens: number;
}

/**
 * EXTRAHIERT RECHNUNGSDATEN AUS EINEM DOKUMENT (BILD/PDF)
 */
export const extractInvoiceData = async (base64Data: string, mimeType: string) => {
    const ai = getAiClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{
                parts: [
                    { inlineData: { data: base64Data, mimeType: mimeType } },
                    { text: "Analysiere diesen Beleg und extrahiere alle verfügbaren Daten. Achte besonders auf die Kontaktdaten des Ausstellers (vendorName, street, zip, city, vatId). Zudem: Belegdatum (date YYYY-MM-DD), Rechnungsnummer (invoiceNumber), Nettobetrag (netAmount), Steuersatz (taxRate 7/19) und Beschreibung. Antworte ausschließlich im JSON Format." }
                ]
            }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        vendorName: { type: Type.STRING },
                        street: { type: Type.STRING },
                        zip: { type: Type.STRING },
                        city: { type: Type.STRING },
                        vatId: { type: Type.STRING },
                        date: { type: Type.STRING },
                        invoiceNumber: { type: Type.STRING },
                        netAmount: { type: Type.NUMBER },
                        taxRate: { type: Type.NUMBER },
                        description: { type: Type.STRING }
                    },
                    required: ["vendorName", "netAmount"]
                }
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
    } catch (error) {
        console.error("Smart Scan Error:", error);
        return null;
    }
};

/**
 * Generiert eine finanzielle Zusammenfassung und Empfehlungen.
 */
export const generateFinancialInsight = async (
  transactions: Transaction[],
  accounts: Account[]
): Promise<AiResponse> => {
  const ai = getAiClient();
  if (!ai) return { text: "API-Schlüssel fehlt.", totalTokens: 0 };

  const revenue = transactions.flatMap(t => t.lines).reduce((acc, line) => {
     const account = accounts.find(a => a.id === line.accountId);
     if (account?.type === AccountType.REVENUE) return acc + line.credit;
     return acc;
  }, 0);

  const expenses = transactions.flatMap(t => t.lines).reduce((acc, line) => {
    const account = accounts.find(a => a.id === line.accountId);
    if (account?.type === AccountType.EXPENSE) return acc + line.debit;
    return acc;
 }, 0);

  const prompt = `
    Analysiere: Einnahmen ${revenue}€, Ausgaben ${expenses}€. 
    Gib eine kurze Analyse und einen Tipp auf Deutsch.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return { 
        text: response.text || "Keine Analyse möglich.",
        totalTokens: response.usageMetadata?.totalTokenCount || 0
    };
  } catch (error) {
    return { text: "Fehler bei der KI-Analyse.", totalTokens: 0 };
  }
};

/**
 * Schlägt eine Buchungskategorie basierend auf der Beschreibung vor.
 */
export const suggestTransactionCategory = async (description: string): Promise<string | null> => {
    const ai = getAiClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Gegeben ist die Transaktionsbeschreibung "${description}", schlagen Sie die wahrscheinlichste Buchungskategorie vor (z.B. Bürobedarf, Reisekosten, Umsatz, Nebenkosten, Beratungsleistungen). Antworten Sie NUR mit dem Kategorienamen auf Deutsch.`,
        });
        return response.text?.trim() || null;
    } catch (e) {
        return null;
    }
};

// --- AI COACH ---
let chatSession: Chat | null = null;

export const initializeCoachChat = () => {
    const ai = getAiClient();
    if (!ai) return null;
    chatSession = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
            systemInstruction: "Du bist Buchi, ein Buchhaltungs-Coach. Erkläre Konzepte einfach mit Emojis.",
            temperature: 0.7,
        }
    });
    return chatSession;
};

export const sendMessageToCoach = async (message: string): Promise<{ text: string, imagePrompt?: string, totalTokens: number }> => {
    if (!chatSession) initializeCoachChat();
    if (!chatSession) return { text: "KI nicht bereit.", totalTokens: 0 };
    try {
        const result = await chatSession.sendMessage({ message });
        const text = result.text || "";
        const imgMatch = text.match(/\[GENERATE_IMAGE: (.*?)\]/);
        return { 
            text: text.replace(/\[GENERATE_IMAGE: .*?\]/, '').trim(), 
            imagePrompt: imgMatch ? imgMatch[1] : undefined,
            totalTokens: result.usageMetadata?.totalTokenCount || 0
        };
    } catch (e) {
        return { text: "Fehler.", totalTokens: 0 };
    }
};

export const generateCoachImage = async (prompt: string): Promise<string | null> => {
    const ai = getAiClient();
    if (!ai) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `Educational sketch: ${prompt}` }] },
        });
        const data = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        return data ? `data:image/png;base64,${data}` : null;
    } catch (e) { return null; }
};
