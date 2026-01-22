import React, { useState } from 'react';
import { List, Search, Filter, MapPin } from 'lucide-react';
import { getAllBornesList } from '../data/mockData';

function BornesList() {
  const allBornes = getAllBornesList();

  // ÉTATS POUR LES FILTRES
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  // Villes dynamiques
  const availableCities = [...new Set(allBornes.map(b => b.ville))];

  // LOGIQUE DE FILTRAGE
  const filteredBornes = allBornes.filter(borne => {
    const matchSearch = 
      borne.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      borne.parkingNom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || borne.statut === statusFilter;
    const matchCity = cityFilter === 'all' || borne.ville === cityFilter;

    return matchSearch && matchStatus && matchCity;
  });

  return (
    <div style={styles.pageContainer}>
      {/* HEADER */}
      <div style={styles.header}>
        <List size={32} style={{ marginRight: '15px', color: '#222' }} />
        <div>
          <h1 style={styles.title}>Liste des bornes</h1>
          <p style={styles.subtitle}>Vue détaillée et filtrable de toutes les bornes</p>
        </div>
      </div>

      {/* FILTRES */}
      <div style={styles.filterCard}>
        <h3 style={styles.filterTitle}>Filtres</h3>
        
        <div style={styles.filterRow}>
          {/* Recherche */}
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

          {/* Statut */}
          <div style={styles.selectWrapper}>
            <Filter size={16} color="#666" style={{ marginRight: '8px' }} />
            <select 
              style={styles.select} 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="libre">Libre</option>
              <option value="occupée">Occupée</option>
              <option value="anomalie">Anomalie</option>
            </select>
          </div>

          {/* Ville */}
          <div style={styles.selectWrapper}>
            <MapPin size={16} color="#666" style={{ marginRight: '8px' }} />
            <select 
              style={styles.select}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="all">Toutes les villes</option>
              {availableCities.map(ville => (
                <option key={ville} value={ville}>{ville}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLEAU */}
      <div style={styles.tableCard}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={styles.sectionTitle}>
            Bornes ({filteredBornes.length})
          </h3>
          <p style={styles.subtitle}>Affichage des résultats</p>
        </div>

        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>ID</th>
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
                  <td style={styles.td}>
                    <span style={styles.badgeVille}>{borne.ville}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={getStatusStyle(borne.statut)}>{borne.statut}</span>
                  </td>
                  <td style={{...styles.td, color: '#888'}}>{borne.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                  Aucune borne ne correspond à votre recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// STYLES
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
  filterTitle: { fontSize: '16px', fontWeight: '700', margin: '0 0 15px 0' },
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