import { Account, AccountType } from '../types';

// SKR 04 Standardkontenrahmen (7-stellig)
export const skr04Accounts: Account[] = [
  // --- KLASSE 0: ANLAGEVERMÖGEN ---
  { id: '0100000', code: '0100000', name: 'Konzessionen, Lizenzen', type: AccountType.ASSET },
  { id: '0135000', code: '0135000', name: 'EDV-Software', type: AccountType.ASSET },
  { id: '0150000', code: '0150000', name: 'Geschäfts- oder Firmenwert', type: AccountType.ASSET },
  
  { id: '0200000', code: '0200000', name: 'Unbebaute Grundstücke', type: AccountType.ASSET },
  { id: '0210000', code: '0210000', name: 'Bebauter Grund und Boden', type: AccountType.ASSET },
  { id: '0240000', code: '0240000', name: 'Geschäftsbauten', type: AccountType.ASSET },
  { id: '0280000', code: '0280000', name: 'Außenanlagen', type: AccountType.ASSET },

  { id: '0400000', code: '0400000', name: 'Technische Anlagen und Maschinen', type: AccountType.ASSET },
  
  { id: '0520000', code: '0520000', name: 'PKW', type: AccountType.ASSET },
  { id: '0530000', code: '0530000', name: 'LKW', type: AccountType.ASSET },
  
  { id: '0620000', code: '0620000', name: 'Büroeinrichtung', type: AccountType.ASSET },
  { id: '0630000', code: '0630000', name: 'Geschäftsausstattung', type: AccountType.ASSET },
  { id: '0650000', code: '0650000', name: 'Betriebsausstattung', type: AccountType.ASSET },
  { id: '0680000', code: '0680000', name: 'Geringwertige Wirtschaftsgüter (GWG) bis 800 €', type: AccountType.ASSET },
  { id: '0690000', code: '0690000', name: 'Sammelposten GWG', type: AccountType.ASSET },

  { id: '0800000', code: '0800000', name: 'Beteiligungen', type: AccountType.ASSET },

  // --- KLASSE 1: UMLAUFVERMÖGEN ---
  
  // Forderungen
  { id: '1200000', code: '1200000', name: 'Forderungen aus Lieferungen und Leistungen', type: AccountType.ASSET },
  { id: '1210000', code: '1210000', name: 'Forderungen a.L.L. ohne Kontokorrent', type: AccountType.ASSET },
  { id: '1300000', code: '1300000', name: 'Sonstige Vermögensgegenstände', type: AccountType.ASSET },
  { id: '1340000', code: '1340000', name: 'Forderungen gegen Personal', type: AccountType.ASSET },

  // Vorsteuer
  { id: '1400000', code: '1400000', name: 'Abziehbare Vorsteuer', type: AccountType.ASSET },
  { id: '1401000', code: '1401000', name: 'Abziehbare Vorsteuer 7%', type: AccountType.ASSET },
  { id: '1406000', code: '1406000', name: 'Abziehbare Vorsteuer 19%', type: AccountType.ASSET },
  
  // Bank / Kasse
  { id: '1600000', code: '1600000', name: 'Kasse', type: AccountType.ASSET },
  { id: '1800000', code: '1800000', name: 'Bank (Girokonto)', type: AccountType.ASSET },
  { id: '1810000', code: '1810000', name: 'Bank 2 (Tagesgeld)', type: AccountType.ASSET },
  { id: '1820000', code: '1820000', name: 'Verrechnungskonto Kreditkarten (VISA/MC)', type: AccountType.ASSET }, // NEU
  { id: '1890000', code: '1890000', name: 'Finanzmittelfonds (Geldtransit)', type: AccountType.ASSET }, // SKR03 1360

  // --- KLASSE 2: EIGENKAPITAL ---
  { id: '2000000', code: '2000000', name: 'Gezeichnetes Kapital / Festkapital', type: AccountType.EQUITY },
  { id: '2100000', code: '2100000', name: 'Privatenlagen', type: AccountType.EQUITY },
  { id: '2150000', code: '2150000', name: 'Privatentnahmen', type: AccountType.EQUITY },
  { id: '2180000', code: '2180000', name: 'Privatsteuern', type: AccountType.EQUITY },
  { id: '2970000', code: '2970000', name: 'Gewinnvortrag vor Verwendung', type: AccountType.EQUITY },

  // --- KLASSE 3: FREMDKAPITAL ---
  
  // Rückstellungen
  { id: '3095000', code: '3095000', name: 'Rückstellungen für Abschlusskosten', type: AccountType.LIABILITY },
  
  // Verbindlichkeiten Bank
  { id: '3150000', code: '3150000', name: 'Verbindlichkeiten gegenüber Kreditinstituten (Darlehen)', type: AccountType.LIABILITY },

  // Verbindlichkeiten aLL
  { id: '3300000', code: '3300000', name: 'Verbindlichkeiten aus Lieferungen und Leistungen', type: AccountType.LIABILITY },
  { id: '3310000', code: '3310000', name: 'Verbindlichkeiten a.L.L. ohne Kontokorrent', type: AccountType.LIABILITY },

  // Sonstige Verbindlichkeiten
  { id: '3500000', code: '3500000', name: 'Sonstige Verbindlichkeiten', type: AccountType.LIABILITY },
  { id: '3720000', code: '3720000', name: 'Verbindlichkeiten aus Lohn und Gehalt', type: AccountType.LIABILITY },
  { id: '3730000', code: '3730000', name: 'Verbindlichkeiten aus Lohn- und Kirchensteuer', type: AccountType.LIABILITY },
  { id: '3740000', code: '3740000', name: 'Verbindlichkeiten im Rahmen der sozialen Sicherheit', type: AccountType.LIABILITY },

  // Umsatzsteuer
  { id: '3800000', code: '3800000', name: 'Umsatzsteuer', type: AccountType.LIABILITY },
  { id: '3801000', code: '3801000', name: 'Umsatzsteuer 7%', type: AccountType.LIABILITY },
  { id: '3806000', code: '3806000', name: 'Umsatzsteuer 19%', type: AccountType.LIABILITY },
  { id: '3820000', code: '3820000', name: 'Umsatzsteuer-Vorauszahlungen', type: AccountType.LIABILITY },
  { id: '3840000', code: '3840000', name: 'Umsatzsteuer laufendes Jahr', type: AccountType.LIABILITY },
  { id: '3845000', code: '3845000', name: 'Umsatzsteuer Vorjahr', type: AccountType.LIABILITY },

  // --- KLASSE 4: BETRIEBLICHE ERTRÄGE ---
  { id: '4100000', code: '4100000', name: 'Steuerfreie Umsätze § 4 Nr. 8 ff. UStG', type: AccountType.REVENUE },
  { id: '4120000', code: '4120000', name: 'Steuerfreie Umsätze § 4 Nr. 1a UStG', type: AccountType.REVENUE },
  { id: '4200000', code: '4200000', name: 'Erlöse (Kleinunternehmer/Steuerfrei)', type: AccountType.REVENUE },
  { id: '4300000', code: '4300000', name: 'Erlöse 7% USt', type: AccountType.REVENUE },
  { id: '4400000', code: '4400000', name: 'Erlöse 19% USt', type: AccountType.REVENUE },
  { id: '4401000', code: '4401000', name: 'Erlöse aus Beratungsleistungen 19%', type: AccountType.REVENUE },
  { id: '4600000', code: '4600000', name: 'Unentgeltliche Wertabgaben (Eigenverbrauch)', type: AccountType.REVENUE },
  { id: '4720000', code: '4720000', name: 'Erlösschmälerungen 19%', type: AccountType.REVENUE },
  { id: '4830000', code: '4830000', name: 'Sonstige betriebliche Erträge', type: AccountType.REVENUE },

  // --- KLASSE 5: MATERIALAUFWAND ---
  { id: '5200000', code: '5200000', name: 'Wareneingang 7% Vorsteuer', type: AccountType.EXPENSE },
  { id: '5300000', code: '5300000', name: 'Wareneingang 7% (ohne VSt)', type: AccountType.EXPENSE },
  { id: '5400000', code: '5400000', name: 'Wareneingang 19% Vorsteuer', type: AccountType.EXPENSE },
  { id: '5425000', code: '5425000', name: 'Innergemeinschaftlicher Erwerb 19%', type: AccountType.EXPENSE },
  { id: '5800000', code: '5800000', name: 'Bezugsnebenkosten', type: AccountType.EXPENSE },
  { id: '5900000', code: '5900000', name: 'Fremdleistungen', type: AccountType.EXPENSE },

  // --- KLASSE 6: SONSTIGER BETRIEBLICHER AUFWAND ---
  
  // Personal
  { id: '6000000', code: '6000000', name: 'Löhne und Gehälter', type: AccountType.EXPENSE },
  { id: '6020000', code: '6020000', name: 'Gehälter', type: AccountType.EXPENSE },
  { id: '6110000', code: '6110000', name: 'Gesetzliche soziale Aufwendungen', type: AccountType.EXPENSE },
  { id: '6120000', code: '6120000', name: 'Beiträge zur Berufsgenossenschaft', type: AccountType.EXPENSE },
  { id: '6130000', code: '6130000', name: 'Freiwillige soziale Aufwendungen', type: AccountType.EXPENSE },

  // Abschreibung
  { id: '6220000', code: '6220000', name: 'Abschreibungen auf Sachanlagen', type: AccountType.EXPENSE },
  { id: '6260000', code: '6260000', name: 'Sofortabschreibung GWG', type: AccountType.EXPENSE },

  // Raumkosten
  { id: '6310000', code: '6310000', name: 'Miete (unbewegliche Wirtschaftsgüter)', type: AccountType.EXPENSE },
  { id: '6320000', code: '6320000', name: 'Heizung', type: AccountType.EXPENSE },
  { id: '6325000', code: '6325000', name: 'Gas, Strom, Wasser', type: AccountType.EXPENSE },
  { id: '6330000', code: '6330000', name: 'Reinigung', type: AccountType.EXPENSE },
  { id: '6335000', code: '6335000', name: 'Instandhaltung Betriebsräume', type: AccountType.EXPENSE },

  // Versicherungen / Beiträge
  { id: '6400000', code: '6400000', name: 'Versicherungen', type: AccountType.EXPENSE },
  { id: '6420000', code: '6420000', name: 'Beiträge (Kammern, Verbände)', type: AccountType.EXPENSE },
  { id: '6430000', code: '6430000', name: 'Sonstige Abgaben', type: AccountType.EXPENSE },

  // Kfz
  { id: '6520000', code: '6520000', name: 'Kfz-Versicherungen', type: AccountType.EXPENSE },
  { id: '6530000', code: '6530000', name: 'Laufende Kfz-Betriebskosten (Benzin)', type: AccountType.EXPENSE },
  { id: '6540000', code: '6540000', name: 'Kfz-Reparaturen', type: AccountType.EXPENSE },
  { id: '6595000', code: '6595000', name: 'Fremdfahrzeuge', type: AccountType.EXPENSE },

  // Werbe / Reise
  { id: '6600000', code: '6600000', name: 'Werbekosten', type: AccountType.EXPENSE },
  { id: '6640000', code: '6640000', name: 'Bewirtungskosten (nicht abzugsfähig)', type: AccountType.EXPENSE },
  { id: '6644000', code: '6644000', name: 'Bewirtungskosten (abzugsfähig)', type: AccountType.EXPENSE },
  { id: '6650000', code: '6650000', name: 'Reisekosten Arbeitnehmer', type: AccountType.EXPENSE },
  { id: '6660000', code: '6660000', name: 'Reisekosten Unternehmer', type: AccountType.EXPENSE },

  // Verschiedene
  { id: '6800000', code: '6800000', name: 'Porto', type: AccountType.EXPENSE },
  { id: '6805000', code: '6805000', name: 'Telefon', type: AccountType.EXPENSE },
  { id: '6815000', code: '6815000', name: 'Bürobedarf', type: AccountType.EXPENSE },
  { id: '6820000', code: '6820000', name: 'Zeitschriften, Bücher', type: AccountType.EXPENSE },
  { id: '6825000', code: '6825000', name: 'Rechts- und Beratungskosten', type: AccountType.EXPENSE },
  { id: '6830000', code: '6830000', name: 'Buchführungskosten', type: AccountType.EXPENSE },
  { id: '6855000', code: '6855000', name: 'Nebenkosten des Geldverkehrs', type: AccountType.EXPENSE },

  // --- KLASSE 7: ZINSEN & STEUERN ---
  { id: '7100000', code: '7100000', name: 'Zinserträge', type: AccountType.REVENUE },
  { id: '7300000', code: '7300000', name: 'Zinsaufwendungen (langfristig)', type: AccountType.EXPENSE },
  { id: '7310000', code: '7310000', name: 'Zinsaufwendungen (kurzfristig)', type: AccountType.EXPENSE }
];