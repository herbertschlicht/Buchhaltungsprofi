import { GoogleGenAI } from "@google/genai";
import { Transaction, Account, AccountType } from "../types";

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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Gegeben ist die Transaktionsbeschreibung "${description}", schlagen Sie die wahrscheinlichste Buchungskategorie vor (z.B. Bürobedarf, Reisekosten, Umsatz, Nebenkosten, Beratungsleistungen). Antworten Sie NUR mit dem Kategorienamen auf Deutsch.`,
        });
        return response.text.trim();
    } catch (e) {
        return null;
    }
}