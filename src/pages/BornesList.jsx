import React, { useState, useEffect } from 'react';
import { List, Search, Filter, MapPin } from 'lucide-react';
import { API_URL } from '../config';
// ON A SUPPRIMÉ L'IMPORT DE MOCKDATA 🗑️

function BornesList() {
  const [bornes, setBornes] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  // FILTRES
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  useEffect(() => {
    const fetchBornesAndLogs = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // --- STRATÉGIE DE FUSION ---
        // On lance les deux requêtes en parallèle pour gagner du temps
        const [docksRes, logsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/docks?radius_meters=1000000`, { headers }), // 1. La structure
          fetch(`${API_URL}/api/admin/logs?limit=1000`, { headers })             // 2. Les dates
        ]);

        if (docksRes.ok) {
          const parkingsData = await docksRes.json();
          let logsMap = {}; // Dictionnaire pour retrouver les dates rapidement

          // Si la requête Logs a marché, on prépare le dictionnaire
          if (logsRes.ok) {
            const logsData = await logsRes.json();
            // On parcourt les logs pour associer chaque SensorID à sa dernière date
            logsData.logs.forEach(log => {
              // On ne garde que la date la plus récente pour chaque capteur
              if (!logsMap[log.sensor_id]) {
                logsMap[log.sensor_id] = log.changed_at;
              }
            });
          }

          // APLATISSEMENT : Parking -> Bornes
          let allBornesFlat = [];

          parkingsData.forEach(parking => {
            if (parking.docks && Array.isArray(parking.docks)) {
              
              const gpsFormat = parking.latitude && parking.longitude 
                ? `${parking.latitude.toFixed(4)}, ${parking.longitude.toFixed(4)}` 
                : "-";

              parking.docks.forEach(dock => {
                // On récupère l'ID du capteur
                const sensorId = dock.sensor_id || dock.name || String(dock.id);

                allBornesFlat.push({
                  id: sensorId,
                  parkingNom: parking.name || "Parking Inconnu",
                  coordonnees: gpsFormat,
                  
                  // VILLE : Vide pour l'instant comme demandé
                  ville: "-", 
                  
                  // STATUT : Traduction
                  statut: dock.status === "available" ? "libre" : (dock.status === "occupied" ? "occupée" : "anomalie"),
                  
                  // DATE : On regarde dans notre Map si on a une date, sinon "-"
                  date: logsMap[sensorId] || "-"
                });
              });
            }
          });

          setBornes(allBornesFlat);
        }
      } catch (error) {
        console.error("Erreur API", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBornesAndLogs();
  }, []);

  // --- FILTRES (Reste identique) ---
  const availableCities = [...new Set(bornes.map(b => b.ville))]; 

  const filteredBornes = bornes.filter(borne => {
    const matchSearch = 
      String(borne.id).toLowerCase().includes(searchTerm.toLowerCase()) || 
      String(borne.parkingNom).toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || borne.statut === statusFilter;
    const matchCity = cityFilter === 'all' || borne.ville === cityFilter;
    return matchSearch && matchStatus && matchCity;
  });

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <List size={32} style={{ marginRight: '15px', color: '#222' }} />
        <div>
          <h1 style={styles.title}>Liste des bornes</h1>
          <p style={styles.subtitle}>Vue détaillée et filtrable de toutes les bornes</p>
        </div>
      </div>

      <div style={styles.filterCard}>
        <div style={styles.filterRow}>
          <div style={styles.searchWrapper}>
            <Search size={18} color="#999" style={{ marginRight: '10px' }} />
            <input 
              type="text" 
              placeholder="Rechercher par ID, nom..." 
              style={styles.input}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={styles.selectWrapper}>
            <Filter size={16} color="#666" style={{ marginRight: '8px' }} />
            <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="libre">Libre</option>
              <option value="occupée">Occupée</option>
              <option value="anomalie">Anomalie</option>
            </select>
          </div>
          <div style={styles.selectWrapper}>
            <MapPin size={16} color="#666" style={{ marginRight: '8px' }} />
            <select style={styles.select} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="all">Toutes les villes</option>
              {availableCities.map(ville => (
                <option key={ville} value={ville}>{ville === '-' ? 'Ville non définie' : ville}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={styles.sectionTitle}>Bornes ({filteredBornes.length})</h3>
          <p style={styles.subtitle}>{isLoading ? "Chargement..." : "Données temps réel (API)"}</p>
        </div>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>ID / Capteur</th>
              <th style={styles.th}>Parking</th>
              <th style={styles.th}>Localisation (GPS)</th>
              <th style={styles.th}>Ville</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.th}>Dernière activité</th>
            </tr>
          </thead>
          <tbody>
            {filteredBornes.length > 0 ? (
              filteredBornes.map((borne, index) => (
                <tr key={index} style={styles.tr}>
                  <td style={{...styles.td, fontWeight: 'bold', color: '#666'}}>{borne.id}</td>
                  <td style={{...styles.td, fontWeight: 'bold'}}>{borne.parkingNom}</td>
                  <td style={{...styles.td, fontFamily: 'monospace', color: '#555'}}>{borne.coordonnees}</td>
                  <td style={styles.td}><span style={styles.badgeVille}>{borne.ville}</span></td>
                  <td style={styles.td}><span style={getStatusStyle(borne.statut)}>{borne.statut}</span></td>
                  <td style={{...styles.td, color: '#666', fontSize: '12px'}}>
                    {borne.date}
                  </td>
                </tr>
              ))
            ) : (
               <tr><td colSpan="6" style={{padding: '30px', textAlign: 'center', color: '#888'}}>Aucune donnée trouvée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// STYLES (Inchangés par rapport à ta version)
const getStatusStyle = (status) => {
  const base = { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'lowercase', display: 'inline-block' };
  if (status === 'libre') return { ...base, backgroundColor: '#e8f5e9', color: '#2e7d32' };
  if (status === 'occupée') return { ...base, backgroundColor: '#e3f2fd', color: '#1565c0' };
  if (status === 'anomalie') return { ...base, backgroundColor: '#ffebee', color: '#c62828' };
  return base;
};

const styles = {
  pageContainer: { padding: '25px', width: '100%', boxSizing: 'border-box' },
  header: { display: 'flex', alignItems: 'center', marginBottom: '25px' },
  title: { fontSize: '26px', fontWeight: '800', margin: 0, color: '#1a1a1a', letterSpacing: '-0.5px' },
  subtitle: { margin: '2px 0 0 0', color: '#666', fontSize: '14px' },
  filterCard: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', marginBottom: '25px' },
  filterRow: { display: 'flex', gap: '15px', alignItems: 'center' },
  searchWrapper: { display: 'flex', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '8px 12px', flex: 2 },
  input: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' },
  selectWrapper: { display: 'flex', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '8px 12px', flex: 1 },
  select: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%', cursor: 'pointer', color: '#333' },
  tableCard: { backgroundColor: 'white', padding: '25px', borderRadius: '20px' },
  sectionTitle: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#222' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
  thead: { borderBottom: '1px solid #eee' },
  th: { padding: '12px 10px', fontWeight: '600', color: '#999', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '12px 10px', fontSize: '13px', color: '#333' },
  badgeVille: { backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#555', fontWeight: '600' }
};

export default BornesList;