export interface AfAEntry {
    label: string;
    years: number;
    category: string;
}

export const afaTable: AfAEntry[] = [
    { label: 'Computer, Notebooks, Tablets, Peripherie', years: 3, category: 'Büro / EDV' },
    { label: 'Software (Standard, ERP)', years: 3, category: 'Büro / EDV' },
    { label: 'Drucker, Scanner, Kopierer', years: 3, category: 'Büro / EDV' },
    { label: 'Büromöbel (Schreibtische, Stühle, Schränke)', years: 13, category: 'Büro / EDV' },
    { label: 'Tresore', years: 23, category: 'Büro / EDV' },
    { label: 'Telekommunikationsanlagen', years: 10, category: 'Büro / EDV' },
    { label: 'Mobiltelefone / Smartphones', years: 5, category: 'Büro / EDV' },
    { label: 'Personenkraftwagen (Pkw)', years: 6, category: 'Fuhrpark' },
    { label: 'Lastkraftwagen (Lkw)', years: 9, category: 'Fuhrpark' },
    { label: 'Anhänger', years: 11, category: 'Fuhrpark' },
    { label: 'Motorräder / Mopeds', years: 7, category: 'Fuhrpark' },
    { label: 'Fahrräder / E-Bikes', years: 7, category: 'Fuhrpark' },
    { label: 'Betriebsgebäude (Massivbau)', years: 33, category: 'Immobilien' }, 
    { label: 'Wohngebäude (im Betriebsvermögen)', years: 50, category: 'Immobilien' }, 
    { label: 'Leichtbauten / Hallen', years: 14, category: 'Immobilien' },
    { label: 'Außenanlagen (Zäune, Hofbefestigung)', years: 19, category: 'Immobilien' },
    { label: 'Grund und Boden (nicht abnutzbar)', years: 0, category: 'Immobilien' },
    { label: 'Werkzeuge (allgemein)', years: 5, category: 'Betriebsausstattung' },
    { label: 'Regale (Lager)', years: 14, category: 'Betriebsausstattung' },
    { label: 'Verpackungsmaschinen', years: 15, category: 'Betriebsausstattung' },
    { label: 'GWG (Sofortabschreibung bis 800€)', years: 1, category: 'GWG' },
    { label: 'Sammelposten (Poolabschreibung)', years: 5, category: 'GWG' }
];