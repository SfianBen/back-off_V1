import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard } from 'lucide-react';
import { calculateRealTimeStats, getAllBornesList, GRAPH_DATA } from '../data/mockData';

function Dashboard() {
  const stats = calculateRealTimeStats();
  const bornesList = getAllBornesList();

  return (
    <div style={styles.pageContainer}>
      {/* HEADER */}
      <div style={styles.header}>
        <LayoutDashboard size={32} style={{ marginRight: '15px' }} />
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Vue d'ensemble de l'activité WHEELOCK</p>
        </div>
      </div>

      {/* CARTES KPI */}
      <div style={styles.cardsGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Total Bornes</h3>
          <div style={{...styles.bigNumber, color: 'black'}}>{stats.total}</div>
          <div style={styles.subText}> Dispositifs actifs</div>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Bornes Libres</h3>
          <div style={{...styles.bigNumber, color: '#82ca9d'}}>{stats.libres}</div>
          <div style={styles.subText}> Disponibles maintenant</div>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Bornes Occupées</h3>
          <div style={{...styles.bigNumber, color: '#448aff'}}>{stats.occupees}</div>
          <div style={styles.subText}> {stats.total > 0 ? Math.round((stats.occupees / stats.total) * 100) : 0}% d'occupation</div>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Bornes HS</h3>
          <div style={{...styles.bigNumber, color: '#ff5252'}}>{stats.pannes}</div>
          <div style={{...styles.subText, color: '#ff5252'}}> Maintenance requise</div>
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div style={styles.chartCard}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={styles.sectionTitle}>Taux d'occupation du jour</h3>
          <p style={styles.subtitle}>Évolution heure par heure</p>
        </div>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={GRAPH_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="heure" tick={{fill: '#999'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill: '#999'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="occupation" stroke="#5c6bc0" strokeWidth={3} dot={{ r: 4, fill: "#5c6bc0" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLEAU LISTE */}
      <div style={styles.tableCard}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={styles.sectionTitle}>Activité Récente des Bornes</h3>
          <p style={styles.subtitle}>État actuel du parc</p>
        </div>

        <table style={styles.table}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#888', fontSize: '14px' }}>
              <th style={styles.th}>ID Borne</th>
              <th style={styles.th}>Parking</th>
              <th style={styles.th}>GPS</th>
              <th style={styles.th}>Ville</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.th}>Dernière activité</th>
            </tr>
          </thead>
          <tbody>
            {bornesList.map((borne, index) => (
              <tr key={index} style={styles.tr}>
                {/* ID */}
                <td style={{...styles.td, fontWeight: 'bold', color: '#666'}}>{borne.id}</td>
                
                {/* Nom Parking */}
                <td style={{...styles.td, fontWeight: 'bold'}}>{borne.parkingNom}</td>
                
                {/* GPS */}
                <td style={{...styles.td, fontFamily: 'monospace', color: '#555'}}>{borne.coordonnees}</td>
                
                {/* Ville (Vient du MockData directement) */}
                <td style={styles.td}>
                  <span style={styles.badgeVille}>{borne.ville}</span>
                </td>

                {/* Statut */}
                <td style={styles.td}>
                  <span style={getStatusStyle(borne.statut)}>
                    {borne.statut}
                  </span>
                </td>

                {/* Date */}
                <td style={{...styles.td, color: '#888'}}>{borne.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// STYLES
const getStatusStyle = (status) => {
  const base = { padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' };
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
  
  sectionTitle: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#222' },
  
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' },
  
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: 'none' },
  cardTitle: { fontSize: '14px', color: '#555', margin: '0 0 8px 0', fontWeight: '500' },
  
  bigNumber: { fontSize: '36px', fontWeight: '800', marginBottom: '5px', lineHeight: '1' },
  subText: { fontSize: '12px', color: '#888', fontWeight: '500' },
  
  chartCard: { backgroundColor: 'white', padding: '25px', borderRadius: '20px', marginBottom: '25px' },
  tableCard: { backgroundColor: 'white', padding: '25px', borderRadius: '20px' },
  
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
  th: { padding: '12px 10px', fontWeight: '600', color: '#999', fontSize: '11px', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '12px 10px', fontSize: '13px', color: '#333' },
  badgeVille: { backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#555', fontWeight: '600' }
};

export default Dashboard;