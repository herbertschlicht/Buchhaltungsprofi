import { Account, AccountType } from '../types';

export const skr03Accounts: Account[] = [
  // --- KLASSE 0: ANLAGEVERMÖGEN & KAPITAL ---
  
  // Immaterielle Vermögensgegenstände
  { id: '0010', code: '0010', name: 'Konzessionen, Lizenzen', type: AccountType.ASSET },
  { id: '0027', code: '0027', name: 'EDV-Software', type: AccountType.ASSET },
  { id: '0035', code: '0035', name: 'Geschäfts- oder Firmenwert', type: AccountType.ASSET },

  // Sachanlagen - Grundstücke & Bauten (KORRIGIERT & ERWEITERT)
  { id: '0050', code: '0050', name: 'Unbebaute Grundstücke (nicht abnutzbar)', type: AccountType.ASSET },
  { id: '0080', code: '0080', name: 'Bauten auf eigenen Grundstücken', type: AccountType.ASSET },
  { id: '0085', code: '0085', name: 'Grundstücksanteil bebauter Grundstücke (nicht abnutzbar)', type: AccountType.ASSET },
  { id: '0090', code: '0090', name: 'Geschäftsbauten', type: AccountType.ASSET },
  { id: '0100', code: '0100', name: 'Außenanlagen', type: AccountType.ASSET },

  // Sachanlagen - Beweglich
  { id: '0200', code: '0200', name: 'Technische Anlagen und Maschinen', type: AccountType.ASSET },
  { id: '0320', code: '0320', name: 'PKW', type: AccountType.ASSET },
  { id: '0350', code: '0350', name: 'LKW', type: AccountType.ASSET },
  { id: '0400', code: '0400', name: 'Betriebsausstattung', type: AccountType.ASSET },
  { id: '0410', code: '0410', name: 'Geschäftsausstattung', type: AccountType.ASSET },
  { id: '0420', code: '0420', name: 'Büroeinrichtung', type: AccountType.ASSET },
  { id: '0480', code: '0480', name: 'Geringwertige Wirtschaftsgüter (GWG) bis 800 €', type: AccountType.ASSET },
  { id: '0485', code: '0485', name: 'Wirtschaftsgüter (Sammelposten)', type: AccountType.ASSET },

  // Finanzanlagen
  { id: '0500', code: '0500', name: 'Anteile an verbundenen Unternehmen', type: AccountType.ASSET },

  // Eigenkapital (Einzelunternehmen / Personengesellschaften)
  { id: '0800', code: '0800', name: 'Gezeichnetes Kapital', type: AccountType.EQUITY },
  { id: '0860', code: '0860', name: 'Gewinnvortrag vor Verwendung', type: AccountType.EQUITY },
  { id: '0963', code: '0963', name: 'Privatsteuern', type: AccountType.EQUITY },
  { id: '0968', code: '0968', name: 'Sonderausgaben beschränkt abzugsfähig', type: AccountType.EQUITY },
  { id: '0969', code: '0969', name: 'Sonderausgaben unbeschränkt abzugsfähig', type: AccountType.EQUITY },

  // --- KLASSE 1: FINANZUMLAUFVERMÖGEN & VERBINDLICHKEITEN ---

  // Liquide Mittel
  { id: '1000', code: '1000', name: 'Kasse', type: AccountType.ASSET },
  { id: '1100', code: '1100', name: 'Postbank', type: AccountType.ASSET },
  { id: '1200', code: '1200', name: 'Bank (Girokonto)', type: AccountType.ASSET },
  { id: '1210', code: '1210', name: 'Bank 2 (Sparkonto/Tagesgeld)', type: AccountType.ASSET },
  { id: '1300', code: '1300', name: 'Wechsel aus Lieferungen und Leistungen', type: AccountType.ASSET },
  { id: '1360', code: '1360', name: 'Geldtransit', type: AccountType.ASSET },

  // Forderungen
  { id: '1400', code: '1400', name: 'Forderungen aus Lieferungen und Leistungen (a.L.L.)', type: AccountType.ASSET },
  { id: '1410', code: '1410', name: 'Forderungen a.L.L. ohne Kontokorrent', type: AccountType.ASSET },
  { id: '1500', code: '1500', name: 'Sonstige Vermögensgegenstände', type: AccountType.ASSET },
  { id: '1530', code: '1530', name: 'Forderungen gegen Personal', type: AccountType.ASSET },

  // Vorsteuer
  { id: '1570', code: '1570', name: 'Abziehbare Vorsteuer', type: AccountType.ASSET },
  { id: '1571', code: '1571', name: 'Abziehbare Vorsteuer 7%', type: AccountType.ASSET },
  { id: '1576', code: '1576', name: 'Abziehbare Vorsteuer 19%', type: AccountType.ASSET },
  { id: '1577', code: '1577', name: 'Vorsteuer nach § 13b UStG 19%', type: AccountType.ASSET },

  // Verbindlichkeiten
  { id: '1600', code: '1600', name: 'Verbindlichkeiten aus Lieferungen und Leistungen (a.L.L.)', type: AccountType.LIABILITY },
  { id: '1610', code: '1610', name: 'Verbindlichkeiten a.L.L. ohne Kontokorrent', type: AccountType.LIABILITY },
  { id: '1700', code: '1700', name: 'Sonstige Verbindlichkeiten', type: AccountType.LIABILITY },
  { id: '1705', code: '1705', name: 'Darlehen', type: AccountType.LIABILITY },
  { id: '1740', code: '1740', name: 'Verbindlichkeiten aus Lohn und Gehalt', type: AccountType.LIABILITY },
  { id: '1741', code: '1741', name: 'Verbindlichkeiten aus Lohn- und Kirchensteuer', type: AccountType.LIABILITY },
  { id: '1742', code: '1742', name: 'Verbindlichkeiten im Rahmen der sozialen Sicherheit', type: AccountType.LIABILITY },

  // Umsatzsteuer (Verbindlichkeiten)
  { id: '1770', code: '1770', name: 'Umsatzsteuer', type: AccountType.LIABILITY },
  { id: '1771', code: '1771', name: 'Umsatzsteuer 7%', type: AccountType.LIABILITY },
  { id: '1776', code: '1776', name: 'Umsatzsteuer 19%', type: AccountType.LIABILITY },
  { id: '1780', code: '1780', name: 'Umsatzsteuer-Vorauszahlungen', type: AccountType.LIABILITY },
  { id: '1789', code: '1789', name: 'Umsatzsteuer laufendes Jahr', type: AccountType.LIABILITY },
  { id: '1790', code: '1790', name: 'Umsatzsteuer Vorjahr', type: AccountType.LIABILITY },

  // Privatkonten (Eigenkapital-Korrekturen)
  { id: '1800', code: '1800', name: 'Privatentnahmen allgemein', type: AccountType.EQUITY },
  { id: '1890', code: '1890', name: 'Privateinlagen', type: AccountType.EQUITY },

  // --- KLASSE 2: ABGRENZUNGSKONTEN (Ausgewählte) ---
  { id: '2100', code: '2100', name: 'Zinsen und ähnliche Aufwendungen (Verbindlichkeiten)', type: AccountType.LIABILITY },
  { id: '2300', code: '2300', name: 'Sonstige Rückstellungen', type: AccountType.LIABILITY },

  // --- KLASSE 3: WARENEINGANG / BESTAND ---
  { id: '3120', code: '3120', name: 'Bauleistungen §13b UStG', type: AccountType.EXPENSE },
  { id: '3200', code: '3200', name: 'Wareneingang 7% Vorsteuer', type: AccountType.EXPENSE },
  { id: '3300', code: '3300', name: 'Wareneingang 7% (ohne Vorsteuerabzug)', type: AccountType.EXPENSE },
  { id: '3400', code: '3400', name: 'Wareneingang 19% Vorsteuer', type: AccountType.EXPENSE },
  { id: '3425', code: '3425', name: 'Innergemeinschaftlicher Erwerb 19%', type: AccountType.EXPENSE },
  { id: '3550', code: '3550', name: 'Einfuhrzölle', type: AccountType.EXPENSE },
  { id: '3800', code: '3800', name: 'Anschaffungsnebenkosten', type: AccountType.EXPENSE },
  { id: '3960', code: '3960', name: 'Bestandsveränderung Roh-, Hilfs- u. Betriebsstoffe', type: AccountType.EXPENSE },

  // --- KLASSE 4: BETRIEBLICHE AUFWENDUNGEN ---
  
  // Personal
  { id: '4100', code: '4100', name: 'Löhne und Gehälter', type: AccountType.EXPENSE },
  { id: '4110', code: '4110', name: 'Gesetzliche soziale Aufwendungen', type: AccountType.EXPENSE },
  { id: '4120', code: '4120', name: 'Gehälter', type: AccountType.EXPENSE },
  { id: '4130', code: '4130', name: 'Gesetzliche soziale Aufwendungen für Geschäftsführer', type: AccountType.EXPENSE },
  { id: '4140', code: '4140', name: 'Freiwillige soziale Aufwendungen', type: AccountType.EXPENSE },
  { id: '4175', code: '4175', name: 'Fahrtkostenerstattung Arbeitnehmer', type: AccountType.EXPENSE },
  { id: '4190', code: '4190', name: 'Aushilfslöhne', type: AccountType.EXPENSE },

  // Raumkosten
  { id: '4200', code: '4200', name: 'Raumkosten (Miete)', type: AccountType.EXPENSE },
  { id: '4210', code: '4210', name: 'Miete (unbewegliche Wirtschaftsgüter)', type: AccountType.EXPENSE },
  { id: '4230', code: '4230', name: 'Heizung', type: AccountType.EXPENSE },
  { id: '4240', code: '4240', name: 'Gas, Strom, Wasser', type: AccountType.EXPENSE },
  { id: '4250', code: '4250', name: 'Reinigung', type: AccountType.EXPENSE },
  { id: '4260', code: '4260', name: 'Instandhaltung Betriebsräume', type: AccountType.EXPENSE },

  // Versicherung & Beiträge
  { id: '4360', code: '4360', name: 'Versicherungen', type: AccountType.EXPENSE },
  { id: '4380', code: '4380', name: 'Beiträge (Kammern, Verbände)', type: AccountType.EXPENSE },
  { id: '4390', code: '4390', name: 'Sonstige Abgaben', type: AccountType.EXPENSE },

  // Kfz-Kosten
  { id: '4500', code: '4500', name: 'Fahrzeugkosten (allgemein)', type: AccountType.EXPENSE },
  { id: '4520', code: '4520', name: 'Kfz-Versicherungen', type: AccountType.EXPENSE },
  { id: '4530', code: '4530', name: 'Laufende Kfz-Betriebskosten (Benzin)', type: AccountType.EXPENSE },
  { id: '4540', code: '4540', name: 'Kfz-Reparaturen', type: AccountType.EXPENSE },
  { id: '4570', code: '4570', name: 'Fremdfahrzeuge', type: AccountType.EXPENSE },

  // Werbe- und Reisekosten
  { id: '4600', code: '4600', name: 'Werbekosten', type: AccountType.EXPENSE },
  { id: '4610', code: '4610', name: 'Werbekosten (Internet)', type: AccountType.EXPENSE },
  { id: '4640', code: '4640', name: 'Repräsentationskosten', type: AccountType.EXPENSE },
  { id: '4650', code: '4650', name: 'Bewirtungskosten (nicht abzugsfähig)', type: AccountType.EXPENSE },
  { id: '4654', code: '4654', name: 'Bewirtungskosten (abzugsfähig)', type: AccountType.EXPENSE },
  { id: '4660', code: '4660', name: 'Reisekosten Arbeitnehmer', type: AccountType.EXPENSE },
  { id: '4670', code: '4670', name: 'Reisekosten Unternehmer', type: AccountType.EXPENSE },

  // Verschiedene Kosten
  { id: '4800', code: '4800', name: 'Reparaturen Instandhaltung Anlagen', type: AccountType.EXPENSE },
  { id: '4810', code: '4810', name: 'Mietleasing', type: AccountType.EXPENSE },
  { id: '4822', code: '4822', name: 'Abschreibungen auf immaterielle Vermögensgegenstände', type: AccountType.EXPENSE },
  { id: '4830', code: '4830', name: 'Abschreibungen auf Sachanlagen', type: AccountType.EXPENSE },
  { id: '4855', code: '4855', name: 'Sofortabschreibung GWG', type: AccountType.EXPENSE },
  { id: '4900', code: '4900', name: 'Sonstige betriebliche Aufwendungen', type: AccountType.EXPENSE },
  { id: '4910', code: '4910', name: 'Porto', type: AccountType.EXPENSE },
  { id: '4920', code: '4920', name: 'Telefon', type: AccountType.EXPENSE },
  { id: '4925', code: '4925', name: 'Telefax und Internet', type: AccountType.EXPENSE },
  { id: '4930', code: '4930', name: 'Bürobedarf', type: AccountType.EXPENSE },
  { id: '4940', code: '4940', name: 'Zeitschriften, Bücher', type: AccountType.EXPENSE },
  { id: '4950', code: '4950', name: 'Rechts- und Beratungskosten', type: AccountType.EXPENSE },
  { id: '4960', code: '4960', name: 'Mieten für Einrichtungen (bewegliche Güter)', type: AccountType.EXPENSE },
  { id: '4970', code: '4970', name: 'Nebenkosten des Geldverkehrs', type: AccountType.EXPENSE },
  { id: '4980', code: '4980', name: 'Betriebsbedarf', type: AccountType.EXPENSE },

  // Zinsen (Aufwand)
  { id: '2100', code: '2100', name: 'Zinsen und ähnliche Aufwendungen', type: AccountType.EXPENSE }, // SKR03 Class 2, but type Expense

  // --- KLASSE 8: ERLÖSE (UMSATZ) ---
  { id: '8100', code: '8100', name: 'Steuerfreie Umsätze § 4 Nr. 8 ff. UStG', type: AccountType.REVENUE },
  { id: '8120', code: '8120', name: 'Steuerfreie Umsätze § 4 Nr. 1a UStG', type: AccountType.REVENUE },
  { id: '8200', code: '8200', name: 'Erlöse (Umsatzsteuerfrei)', type: AccountType.REVENUE },
  { id: '8300', code: '8300', name: 'Erlöse 7% USt', type: AccountType.REVENUE },
  { id: '8315', code: '8315', name: 'Erlöse aus im Inland steuerpflichtigen EU-Lieferungen 19%', type: AccountType.REVENUE },
  { id: '8400', code: '8400', name: 'Erlöse 19% USt', type: AccountType.REVENUE },
  { id: '8401', code: '8401', name: 'Erlöse aus Beratungsleistungen 19%', type: AccountType.REVENUE },
  { id: '8519', code: '8519', name: 'Provisionserlöse 19% USt', type: AccountType.REVENUE },
  { id: '8591', code: '8591', name: 'Sachbezüge 19% USt (Kfz-Nutzung)', type: AccountType.REVENUE },
  { id: '8611', code: '8611', name: 'Verrechnete sonstige Sachbezüge 19% USt', type: AccountType.REVENUE },
  { id: '8700', code: '8700', name: 'Erlösschmälerungen', type: AccountType.REVENUE }, // Usually debit revenue
  { id: '8900', code: '8900', name: 'Eigenverbrauch (unentgeltliche Wertabgaben)', type: AccountType.REVENUE },

  // --- KLASSE 2/Sonstige: ERTRÄGE (Nicht Umsatz) ---
  { id: '2700', code: '2700', name: 'Sonstige Erträge', type: AccountType.REVENUE },
  { id: '2650', code: '2650', name: 'Zinserträge', type: AccountType.REVENUE }
];