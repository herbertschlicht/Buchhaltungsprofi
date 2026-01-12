
import { GoogleGenAI, Chat } from "@google/genai";
import { Transaction, Account, AccountType } from "../types";

declare const process: any;

const apiKey = process.env.API_KEY || '';

// Safely initialize the AI client only if the key exists (handled in UI if missing)
const getAiClient = () => {
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateFinancialInsight = async (
  transactions: Transaction[],
  accounts: Account[]
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "API-Schlüssel fehlt. Bitte konfigurieren Sie Ihre Umgebung.";

  // Summarize data for the prompt to save tokens
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
    // Using gemini-3-flash-preview as per guidelines for basic text tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Konnte keine Einsicht generieren.";
  } catch (error) {
    console.error("KI-Fehler:", error);
    return "Finanzanalyse derzeit nicht möglich.";
  }
};

export const suggestTransactionCategory = async (description: string): Promise<string | null> => {
    const ai = getAiClient();
    if (!ai) return null;

    try {
        // Using gemini-3-flash-preview as per guidelines
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Gegeben ist die Transaktionsbeschreibung "${description}", schlagen Sie die wahrscheinlichste Buchungskategorie vor (z.B. Bürobedarf, Reisekosten, Umsatz, Nebenkosten, Beratungsleistungen). Antworten Sie NUR mit dem Kategorienamen auf Deutsch.`,
        });
        return response.text?.trim() || null;
    } catch (e) {
        return null;
    }
}

// --- NEW: AI COACH FUNCTIONALITY ---

let chatSession: Chat | null = null;

export const  initializeCoachChat = () => {
    const ai = getAiClient();
    if (!ai) return null;

    const systemInstruction = `
        Du bist "Buchi", ein freundlicher, geduldiger und lustiger Buchhaltungs-Coach für absolute Anfänger.
        Deine Aufgabe ist es, dem Nutzer die doppelte Buchführung, Steuern und Finanzen von Grund auf zu erklären.
        
        Regeln:
        1. Stelle dem Nutzer Fragen, um sein Verständnis zu prüfen oder sein Geschäft zu verstehen (z.B. "Verkaufst du Waren oder Dienstleistungen?").
        2. Verwende einfache Sprache, keine Fachbegriffe ohne Erklärung. Nutze Emojis 🎓🚀.
        3. Wenn ein Konzept visuell erklärt werden sollte (z.B. wie eine Rechnung aussieht, ein T-Konto, ein Geldsack für Gewinn), dann füge am Ende deiner Antwort folgenden Tag ein:
           [GENERATE_IMAGE: <detaillierte englische beschreibung des bildes>]
           Beispiel: Das ist ein T-Konto. [GENERATE_IMAGE: A simple accounting T-Account diagram sketched on paper, showing Debit on left and Credit on right]
        4. Führe den Nutzer Schritt für Schritt. Überfordere ihn nicht.
    `;

    chatSession = ai.chats.create({
        // Using gemini-3-flash-preview as per guidelines for complex text tasks
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
        // Extract token usage metadata for the UI
        const totalTokens = result.usageMetadata?.totalTokenCount || 0;
        
        // Check for Image Tag
        let imagePrompt = undefined;
        const imgTagRegex = /\[GENERATE_IMAGE: (.*?)\]/;
        const match = text.match(imgTagRegex);
        
        if (match) {
            imagePrompt = match[1];
            text = text.replace(match[0], '').trim(); // Remove tag from display text
        }

        return { text, imagePrompt, totalTokens };
    } catch (error) {
        console.error("Chat Error:", error);
        return { text: "Entschuldigung, ich habe gerade Verbindungsprobleme. Versuche es gleich nochmal! 🤯", totalTokens: 0 };
    }
};

export const generateCoachImage = async (prompt: string): Promise<string | null> => {
    const ai = getAiClient();
    if (!ai) return null;

    try {
        // Updated to use the preferred gemini-2.5-flash-image model with generateContent for images
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                {
                  text: `A friendly, clean, educational illustration style: ${prompt}`,
                },
              ],
            },
        });

        // Iterate through response parts to find the inline image data
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64EncodeString: string = part.inlineData.data;
                return `data:image/png;base64,${base64EncodeString}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Image Gen Error:", error);
        return null;
    }
};
