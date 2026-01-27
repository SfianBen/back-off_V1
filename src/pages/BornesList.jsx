import React, { useState, useEffect } from 'react';
import { List, Search, Filter, MapPin } from 'lucide-react';
import { API_URL } from '../config';

function BornesList() {
  const [bornes, setBornes] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  // FILTRES
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const [docksRes, logsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/docks?radius_meters=1000000`, { headers }), 
          fetch(`${API_URL}/api/admin/logs?limit=1000`, { headers })             
        ]);

        if (docksRes.ok) {
          const parkingsData = await docksRes.json();
          
          // --- A. DATES ---
          let logsMap = {}; 
          if (logsRes.ok) {
            const logsData = await logsRes.json();
            logsData.logs.forEach(log => {
              if (!logsMap[log.sensor_id]) {
                logsMap[log.sensor_id] = log.changed_at;
              }
            });
          }

          // --- B. VILLES (Nominatim) ---
          const geoEntries = await Promise.all(
            parkingsData.map(async (group) => {
              if (!group.latitude || !group.longitude) return [group.id, "Ville inconnue"];
              try {
                const url = `https://nominatim.openstreetmap.org/reverse?lat=${group.latitude}&lon=${group.longitude}&format=json&accept-language=fr`;
                const resp = await fetch(url, {
                  headers: { 'User-Agent': 'wheelock-frontend' },
                });
                
                if (!resp.ok) return [group.id, "Ville inconnue"];
                const j = await resp.json();
                const addr = j.address || {};
                const villeTrouvee = addr.city || addr.town || addr.village || addr.municipality || "Ville inconnue";
                return [group.id, villeTrouvee];
              } catch {
                return [group.id, "Ville inconnue"];
              }
            })
          );

          const geoMap = {};
          geoEntries.forEach(([id, ville]) => {
            geoMap[id] = ville;
          });

          // --- C. FUSION ---
          let allBornesFlat = [];

          parkingsData.forEach(parking => {
            if (parking.docks && Array.isArray(parking.docks)) {
              
              const gpsFormat = parking.latitude && parking.longitude 
                ? `${parking.latitude.toFixed(4)}, ${parking.longitude.toFixed(4)}` 
                : "-";

              const villeReelle = geoMap[parking.id] || "-";

              parking.docks.forEach(dock => {
                const sensorId = dock.sensor_id || dock.name || String(dock.id);

                // --- MODIFICATION 1 : Traduction simplifiée ---
                const traductions = {
                    "available": "libre",
                    "occupied": "occupée",
                    // Tout le reste (out_of_service) sera géré par le défaut "anomalie"
                };

                // Si le statut est "out_of_service", il tombera dans le || "anomalie"
                const statutFinal = traductions[dock.status] || "anomalie";

                allBornesFlat.push({
                  id: sensorId,
                  parkingNom: parking.name || "Parking Inconnu",
                  coordonnees: gpsFormat,
                  ville: villeReelle, 
                  statut: statutFinal,
                  date: logsMap[sensorId] || "-"
                });
              });
            }
          });

          setBornes(allBornesFlat);
        }
      } catch (error) {
        console.error("Erreur générale", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // FILTRES AUTOMATIQUES
  const availableCities = [...new Set(bornes.map(b => b.ville))].sort(); 

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
          <p style={styles.subtitle}>Géolocalisation & Statuts temps réel</p>
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

          {/* --- MODIFICATION 2 : Filtre simplifié --- */}
          <div style={styles.selectWrapper}>
            <Filter size={16} color="#666" style={{ marginRight: '8px' }} />
            <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="libre">Libre</option>
              <option value="occupée">Occupée</option>
              {/* Option "Hors service" supprimée */}
              <option value="anomalie">Anomalie</option>
            </select>
          </div>

          <div style={styles.selectWrapper}>
            <MapPin size={16} color="#666" style={{ marginRight: '8px' }} />
            <select style={styles.select} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="all">Toutes les villes</option>
              {availableCities.map(ville => (
                <option key={ville} value={ville}>{ville}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={styles.sectionTitle}>Bornes ({filteredBornes.length})</h3>
          <p style={styles.subtitle}>
             {isLoading ? "Récupération des adresses..." : "Données synchronisées"}
          </p>
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
                  <td style={{...styles.td, color: '#666', fontSize: '12px'}}>{borne.date}</td>
                </tr>
              ))
            ) : (
               <tr><td colSpan="6" style={{padding: '30px', textAlign: 'center', color: '#888'}}>
                 {isLoading ? "Chargement..." : "Aucune donnée trouvée."}
               </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- MODIFICATION 3 : Styles simplifiés (3 couleurs) ---
const getStatusStyle = (status) => {
  const base = { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'lowercase', display: 'inline-block' };
  
  if (status === 'libre') return { ...base, backgroundColor: '#e8f5e9', color: '#2e7d32' }; // Vert
  if (status === 'occupée') return { ...base, backgroundColor: '#e3f2fd', color: '#1565c0' }; // Bleu
  
  // Anomalie (Rouge) regroupe tout le reste (dont hors service)
  return { ...base, backgroundColor: '#ffebee', color: '#c62828' };
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