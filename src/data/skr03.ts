import { Account, AccountType } from '../types';

// SKR 03 Standardkontenrahmen (7-stellig)
export const skr03Accounts: Account[] = [
  // --- KLASSE 0: ANLAGEVERMÖGEN & LANGFRISTIGES KAPITAL ---
  { id: '0010000', code: '0010000', name: 'Konzessionen, Lizenzen', type: AccountType.ASSET },
  { id: '0027000', code: '0027000', name: 'EDV-Software', type: AccountType.ASSET },
  { id: '0035000', code: '0035000', name: 'Geschäfts- oder Firmenwert', type: AccountType.ASSET },
  
  { id: '0050000', code: '0050000', name: 'Unbebaute Grundstücke', type: AccountType.ASSET },
  { id: '0080000', code: '0080000', name: 'Bauten auf eigenen Grundstücken', type: AccountType.ASSET },
  { id: '0085000', code: '0085000', name: 'Grundstücksanteil bebauter Grundstücke', type: AccountType.ASSET },
  { id: '0090000', code: '0090000', name: 'Geschäftsbauten', type: AccountType.ASSET },
  { id: '0100000', code: '0100000', name: 'Außenanlagen', type: AccountType.ASSET },

  { id: '0200000', code: '0200000', name: 'Technische Anlagen und Maschinen', type: AccountType.ASSET },
  { id: '0320000', code: '0320000', name: 'PKW', type: AccountType.ASSET },
  { id: '0350000', code: '0350000', name: 'LKW', type: AccountType.ASSET },
  
  { id: '0400000', code: '0400000', name: 'Betriebsausstattung', type: AccountType.ASSET },
  { id: '0410000', code: '0410000', name: 'Geschäftsausstattung', type: AccountType.ASSET },
  { id: '0420000', code: '0420000', name: 'Büroeinrichtung', type: AccountType.ASSET },
  { id: '0480000', code: '0480000', name: 'Geringwertige Wirtschaftsgüter (GWG) bis 800 €', type: AccountType.ASSET },
  { id: '0485000', code: '0485000', name: 'Wirtschaftsgüter (Sammelposten)', type: AccountType.ASSET },
  { id: '0500000', code: '0500000', name: 'Anteile an verbundenen Unternehmen', type: AccountType.ASSET },

  // Eigenkapital
  { id: '0800000', code: '0800000', name: 'Gezeichnetes Kapital', type: AccountType.EQUITY },
  { id: '0860000', code: '0860000', name: 'Gewinnvortrag vor Verwendung', type: AccountType.EQUITY },
  
  // Rückstellungen (Im SKR 03 in Klasse 0, meist 09xx)
  { id: '0950000', code: '0950000', name: 'Pensionsrückstellungen', type: AccountType.LIABILITY },
  { id: '0970000', code: '0970000', name: 'Sonstige Rückstellungen', type: AccountType.LIABILITY },

  // --- KLASSE 1: FINANZUMLAUFVERMÖGEN ---
  { id: '1000000', code: '1000000', name: 'Kasse', type: AccountType.ASSET },
  { id: '1100000', code: '1100000', name: 'Postbank', type: AccountType.ASSET },
  { id: '1200000', code: '1200000', name: 'Bank (Girokonto)', type: AccountType.ASSET },
  { id: '1210000', code: '1210000', name: 'Bank 2 (Sparkonto/Tagesgeld)', type: AccountType.ASSET },
  { id: '1220000', code: '1220000', name: 'Verrechnungskonto Kreditkarten (VISA/MC)', type: AccountType.ASSET }, // NEU
  { id: '1360000', code: '1360000', name: 'Geldtransit', type: AccountType.ASSET },
  
  { id: '1400000', code: '1400000', name: 'Forderungen a.L.L.', type: AccountType.ASSET },
  { id: '1410000', code: '1410000', name: 'Forderungen a.L.L. ohne Kontokorrent', type: AccountType.ASSET },
  
  { id: '1500000', code: '1500000', name: 'Sonstige Vermögensgegenstände', type: AccountType.ASSET },
  { id: '1530000', code: '1530000', name: 'Forderungen gegen Personal', type: AccountType.ASSET },
  
  { id: '1570000', code: '1570000', name: 'Abziehbare Vorsteuer', type: AccountType.ASSET },
  { id: '1571000', code: '1571000', name: 'Abziehbare Vorsteuer 7%', type: AccountType.ASSET },
  { id: '1576000', code: '1576000', name: 'Abziehbare Vorsteuer 19%', type: AccountType.ASSET },

  // Verbindlichkeiten (In SKR 03 oft Klasse 1 ab 16xx)
  { id: '1600000', code: '1600000', name: 'Verbindlichkeiten a.L.L.', type: AccountType.LIABILITY },
  { id: '1610000', code: '1610000', name: 'Verbindlichkeiten a.L.L. ohne Kontokorrent', type: AccountType.LIABILITY },
  { id: '1700000', code: '1700000', name: 'Sonstige Verbindlichkeiten', type: AccountType.LIABILITY },
  { id: '1705000', code: '1705000', name: 'Darlehen', type: AccountType.LIABILITY },
  { id: '1740000', code: '1740000', name: 'Verbindlichkeiten aus Lohn und Gehalt', type: AccountType.LIABILITY },
  { id: '1741000', code: '1741000', name: 'Verbindlichkeiten Lohnsteuer', type: AccountType.LIABILITY },
  { id: '1742000', code: '1742000', name: 'Verbindlichkeiten Soz.Vers.', type: AccountType.LIABILITY },
  
  { id: '1770000', code: '1770000', name: 'Umsatzsteuer', type: AccountType.LIABILITY },
  { id: '1771000', code: '1771000', name: 'Umsatzsteuer 7%', type: AccountType.LIABILITY },
  { id: '1776000', code: '1776000', name: 'Umsatzsteuer 19%', type: AccountType.LIABILITY },
  { id: '1780000', code: '1780000', name: 'Umsatzsteuer-Vorauszahlungen', type: AccountType.LIABILITY },
  { id: '1789000', code: '1789000', name: 'Umsatzsteuer laufendes Jahr', type: AccountType.LIABILITY },
  { id: '1790000', code: '1790000', name: 'Umsatzsteuer Vorjahr', type: AccountType.LIABILITY },

  // Privat (Klasse 1 Ende)
  { id: '1800000', code: '1800000', name: 'Privatentnahmen', type: AccountType.EQUITY },
  { id: '1890000', code: '1890000', name: 'Privateinlagen', type: AccountType.EQUITY },

  // --- KLASSE 2: ABGRENZUNG ---
  { id: '2100000', code: '2100000', name: 'Zinsen und ähnliche Aufwendungen', type: AccountType.EXPENSE },

  // --- KLASSE 3: WARENEINSATZ ---
  { id: '3120000', code: '3120000', name: 'Bauleistungen §13b UStG', type: AccountType.EXPENSE },
  { id: '3200000', code: '3200000', name: 'Wareneingang 7% Vorsteuer', type: AccountType.EXPENSE },
  { id: '3300000', code: '3300000', name: 'Wareneingang 7% (ohne Vorsteuer)', type: AccountType.EXPENSE },
  { id: '3400000', code: '3400000', name: 'Wareneingang 19% Vorsteuer', type: AccountType.EXPENSE },
  { id: '3425000', code: '3425000', name: 'IG Erwerb 19%', type: AccountType.EXPENSE },
  { id: '3800000', code: '3800000', name: 'Anschaffungsnebenkosten', type: AccountType.EXPENSE },
  { id: '3960000', code: '3960000', name: 'Bestandsveränderung', type: AccountType.EXPENSE },

  // --- KLASSE 4: BETRIEBLICHE AUFWENDUNGEN ---
  { id: '4100000', code: '4100000', name: 'Löhne und Gehälter', type: AccountType.EXPENSE },
  { id: '4110000', code: '4110000', name: 'Gesetzliche soziale Aufwendungen', type: AccountType.EXPENSE },
  { id: '4130000', code: '4130000', name: 'Gesetzliche soziale Aufwendungen GF', type: AccountType.EXPENSE },
  { id: '4200000', code: '4200000', name: 'Raumkosten (Miete)', type: AccountType.EXPENSE },
  { id: '4210000', code: '4210000', name: 'Miete', type: AccountType.EXPENSE },
  { id: '4230000', code: '4230000', name: 'Heizung', type: AccountType.EXPENSE },
  { id: '4240000', code: '4240000', name: 'Gas, Strom, Wasser', type: AccountType.EXPENSE },
  { id: '4250000', code: '4250000', name: 'Reinigung', type: AccountType.EXPENSE },
  { id: '4360000', code: '4360000', name: 'Versicherungen', type: AccountType.EXPENSE },
  { id: '4380000', code: '4380000', name: 'Beiträge', type: AccountType.EXPENSE },
  { id: '4500000', code: '4500000', name: 'Fahrzeugkosten', type: AccountType.EXPENSE },
  { id: '4530000', code: '4530000', name: 'Laufende Kfz-Betriebskosten', type: AccountType.EXPENSE },
  { id: '4600000', code: '4600000', name: 'Werbekosten', type: AccountType.EXPENSE },
  { id: '4610000', code: '4610000', name: 'Werbekosten (Internet)', type: AccountType.EXPENSE },
  { id: '4640000', code: '4640000', name: 'Repräsentationskosten', type: AccountType.EXPENSE },
  { id: '4660000', code: '4660000', name: 'Reisekosten Arbeitnehmer', type: AccountType.EXPENSE },
  { id: '4670000', code: '4670000', name: 'Reisekosten Unternehmer', type: AccountType.EXPENSE },
  { id: '4830000', code: '4830000', name: 'Abschreibungen auf Sachanlagen', type: AccountType.EXPENSE },
  { id: '4855000', code: '4855000', name: 'Sofortabschreibung GWG', type: AccountType.EXPENSE },
  { id: '4900000', code: '4900000', name: 'Sonstige betriebliche Aufwendungen', type: AccountType.EXPENSE },
  { id: '4910000', code: '4910000', name: 'Porto', type: AccountType.EXPENSE },
  { id: '4920000', code: '4920000', name: 'Telefon', type: AccountType.EXPENSE },
  { id: '4930000', code: '4930000', name: 'Bürobedarf', type: AccountType.EXPENSE },
  { id: '4950000', code: '4950000', name: 'Rechts- und Beratungskosten', type: AccountType.EXPENSE },
  { id: '4970000', code: '4970000', name: 'Nebenkosten des Geldverkehrs', type: AccountType.EXPENSE },
  { id: '4980000', code: '4980000', name: 'Betriebsbedarf', type: AccountType.EXPENSE },

  // --- KLASSE 7: ZINSEN & STEUERN ---
  { id: '7100000', code: '7100000', name: 'Zinserträge', type: AccountType.REVENUE },
  { id: '7300000', code: '7300000', name: 'Zinsaufwendungen (langfristig)', type: AccountType.EXPENSE },
  { id: '7310000', code: '7310000', name: 'Zinsaufwendungen (kurzfristig)', type: AccountType.EXPENSE }
];