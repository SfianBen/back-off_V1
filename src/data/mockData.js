// src/data/mockData.js

export const PARKINGS_DATA = [
  {
    id: 1,
    nom: "Gare de VA",
    ville: "Valenciennes", 
    latitude: 50.3562,
    longitude: 3.5241,
    bornes: [
      { id: "B001", numero_place: 1, statut: "libre", date: "10/01 10:30" },
      { id: "B002", numero_place: 2, statut: "occupée", date: "10/01 11:00" },
      { id: "B003", numero_place: 3, statut: "libre", date: "09/01 18:00" },
      { id: "B004", numero_place: 4, statut: "anomalie", date: "09/01 17:45" },
    ]
  },
  {
    id: 2,
    nom: "Place de la République",
    ville: "Valenciennes",
    latitude: 50.3585,
    longitude: 3.5238,
    bornes: [
      { id: "B005", numero_place: 1, statut: "libre", date: "10/01 12:30" },
      { id: "B006", numero_place: 2, statut: "libre", date: "10/01 09:15" },
    ]
  },
  {
    id: 3,
    nom: "Campus Mont Houy",
    ville: "Famars", 
    latitude: 50.3220,
    longitude: 3.5110,
    bornes: [
      { id: "B007", numero_place: 1, statut: "occupée", date: "10/01 12:30" },
      { id: "B008", numero_place: 2, statut: "libre", date: "10/01 14:00" },
    ]
  }
];

// --- DONNÉES GRAPHIQUE  ---
export const GRAPH_DATA = [
  { heure: '06h', occupation: 10 },
  { heure: '07h', occupation: 20 },
  { heure: '08h', occupation: 45 },
  { heure: '09h', occupation: 70 },
  { heure: '10h', occupation: 65 },
  { heure: '11h', occupation: 75 },
  { heure: '12h', occupation: 90 }, // Pic 
  { heure: '13h', occupation: 85 },
  { heure: '14h', occupation: 60 },
  { heure: '15h', occupation: 50 },
  { heure: '16h', occupation: 55 },
  { heure: '17h', occupation: 70 },
  { heure: '18h', occupation: 85 }, // Pic soir
  { heure: '19h', occupation: 75 },
  { heure: '20h', occupation: 50 },
  { heure: '21h', occupation: 30 },
  { heure: '22h', occupation: 15 },
];

// --- FONCTIONS UTILITAIRES ---



export const getAllBornesList = () => {
  let list = [];
  
  PARKINGS_DATA.forEach(parking => {
    // Formatage simple des GPS pour l'affichage
    const gpsFormat = `${parking.latitude.toFixed(4)}, ${parking.longitude.toFixed(4)}`;

    parking.bornes.forEach(borne => {
      list.push({ 
        ...borne, 
        parkingNom: parking.nom, 
        ville: parking.ville,
        coordonnees: gpsFormat,
      });
    });
  });
  
  // --- TRI ---
  return list.sort((a, b) => {
    // Petite fonction interne pour convertir en date
    const parseDate = (dateStr) => {
      const [jourMois, heure] = dateStr.split(' ');
      const [jour, mois] = jourMois.split('/');
      // On fixe l'année à 2025 pour la simulation
      return new Date(2025, mois - 1, jour, ...heure.split(':'));
    };
    
    return parseDate(b.date) - parseDate(a.date);
  });
};

export const calculateRealTimeStats = () => {
  const all = getAllBornesList();
  return {
    total: all.length,
    libres: all.filter(b => b.statut === "libre").length,
    occupees: all.filter(b => b.statut === "occupée").length,
    pannes: all.filter(b => b.statut === "anomalie").length,
  };
};