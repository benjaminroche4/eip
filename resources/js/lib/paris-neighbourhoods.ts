/**
 * Paris neighbourhoods and the arrondissements they belong to (2026-09-28): the search bar accepts « Marais » or
 * « Saint-Germain » and offers the matching arrondissements, so an international buyer who knows a name but not a
 * number finds their way. Proper nouns, the same in both languages; matched accent- and case-insensitively on a prefix
 * of any word (« germain » finds Saint-Germain-des-Prés).
 */
export const NEIGHBOURHOODS: Record<string, number[]> = {
    Louvre: [1],
    'Palais-Royal': [1],
    'Les Halles': [1],
    Sentier: [2],
    Bourse: [2],
    Montorgueil: [2],
    Marais: [3, 4],
    'Haut Marais': [3],
    'Arts-et-Métiers': [3],
    'Île Saint-Louis': [4],
    'Île de la Cité': [4],
    Beaubourg: [4],
    'Quartier latin': [5],
    Mouffetard: [5],
    Panthéon: [5],
    'Saint-Germain-des-Prés': [6],
    Odéon: [6],
    Luxembourg: [6],
    'Saint-Sulpice': [6],
    Invalides: [7],
    'Champ-de-Mars': [7],
    'Gros-Caillou': [7],
    'Tour Eiffel': [7],
    'Champs-Élysées': [8],
    "Triangle d'or": [8],
    Madeleine: [8],
    Monceau: [8, 17],
    Opéra: [9],
    'Nouvelle Athènes': [9],
    Martyrs: [9],
    Pigalle: [9, 18],
    'Grands Boulevards': [9, 10],
    'Canal Saint-Martin': [10],
    République: [3, 10, 11],
    Oberkampf: [11],
    Bastille: [4, 11, 12],
    Charonne: [11, 20],
    Nation: [11, 12, 20],
    Bercy: [12],
    Aligre: [12],
    'Butte-aux-Cailles': [13],
    Gobelins: [13],
    Montparnasse: [14, 15],
    Alésia: [14],
    Montsouris: [14],
    Vaugirard: [15],
    Convention: [15],
    Beaugrenelle: [15],
    Trocadéro: [16],
    Passy: [16],
    Auteuil: [16],
    'La Muette': [16],
    Ternes: [17],
    Batignolles: [17],
    Montmartre: [18],
    Abbesses: [18],
    'Buttes-Chaumont': [19],
    'La Villette': [19],
    Belleville: [19, 20],
    Ménilmontant: [20],
    'Père-Lachaise': [20],
};

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * The neighbourhoods whose name (or one of its words) starts with the query, from three letters on — with the
 * arrondissements each one points to. Empty for numbers, postal codes or too short a text.
 */
export function neighbourhoodsMatching(query: string): { name: string; arrondissements: number[] }[] {
    const q = fold(query.trim());
    if (q.length < 3 || /^\d/.test(q)) return [];
    return Object.entries(NEIGHBOURHOODS)
        .filter(([name]) => {
            const folded = fold(name);
            return folded.startsWith(q) || folded.split(/[\s\-']+/).some((word) => word.startsWith(q));
        })
        .map(([name, arrondissements]) => ({ name, arrondissements }));
}
