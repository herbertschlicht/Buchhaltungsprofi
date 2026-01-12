
import { GoogleGenAI, Chat } from "@google/genai";
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
    Sie sind ein erfahrener Buchhalter. Analysieren Sie die folgende Zusammenfassung:
    Gesamteinnahmen: ${revenue.toFixed(2)} €
    Gesamtausgaben: ${expenses.toFixed(2)} €
    Nettoergebnis: ${(revenue - expenses).toFixed(2)} €
    Anzahl der Transaktionen: ${transactions.length}

    Bitte geben Sie eine prägnante Zusammenfassung (max. 3 Sätze) der finanziellen Gesundheit und einen umsetzbaren Verbesserungstipp auf Deutsch.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return { 
        text: response.text || "Konnte keine Einsicht generieren.",
        totalTokens: response.usageMetadata?.totalTokenCount || 0
    };
  } catch (error) {
    console.error("KI-Fehler:", error);
    return { text: "Finanzanalyse derzeit nicht möglich.", totalTokens: 0 };
  }
};

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
}

// --- AI COACH ---
let chatSession: Chat | null = null;

export const initializeCoachChat = () => {
    const ai = getAiClient();
    if (!ai) return null;

    const systemInstruction = `
        Du bist "Buchi", ein freundlicher, geduldiger und lustiger Buchhaltungs-Coach für absolute Anfänger.
        Deine Aufgabe ist es, dem Nutzer die doppelte Buchführung, Steuern und Finanzen von Grund auf zu erklären.
        
        Regeln:
        1. Stelle dem Nutzer Fragen, um sein Verständnis zu prüfen oder sein Geschäft zu verstehen.
        2. Verwende einfache Sprache. Nutze Emojis 🎓🚀.
        3. Wenn ein Konzept visuell erklärt werden sollte, füge am Ende ein: [GENERATE_IMAGE: <description>]
    `;

    chatSession = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
        }
    });

    return chatSession;
};

export const sendMessageToCoach = async (message: string): Promise<{ text: string, imagePrompt?: string, totalTokens: number }> => {
    if (!chatSession) initializeCoachChat();
    if (!chatSession) return { text: "Fehler: KI nicht initialisiert.", totalTokens: 0 };

    try {
        const result = await chatSession.sendMessage({ message });
        let text = result.text || "";
        const totalTokens = result.usageMetadata?.totalTokenCount || 0;
        
        let imagePrompt = undefined;
        const imgTagRegex = /\[GENERATE_IMAGE: (.*?)\]/;
        const match = text.match(imgTagRegex);
        
        if (match) {
            imagePrompt = match[1];
            text = text.replace(match[0], '').trim();
        }

        return { text, imagePrompt, totalTokens };
    } catch (error) {
        console.error("Chat Error:", error);
        return { text: "Entschuldigung, ich habe gerade Verbindungsprobleme.", totalTokens: 0 };
    }
};

export const generateCoachImage = async (prompt: string): Promise<string | null> => {
    const ai = getAiClient();
    if (!ai) return null;
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: `Educational illustration: ${prompt}`,
            config: { numberOfImages: 1, aspectRatio: '4:3', outputMimeType: 'image/jpeg' }
        });
        const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        return imageBytes ? `data:image/jpeg;base64,${imageBytes}` : null;
    } catch (error) {
        return null;
    }
};
