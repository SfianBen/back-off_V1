import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard } from 'lucide-react';
import { API_URL } from '../config';

function Dashboard() {
  // 1. ÉTATS
  const [stats, setStats] = useState({ total: 0, available: 0, occupied: 0, out_of_service: 0 });
  const [graphData, setGraphData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const headers = { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // --- 1. LES KPIs ---
        const statsRes = await fetch(`${API_URL}/api/admin/stats/sensors`, { headers });
        if (statsRes.ok) setStats(await statsRes.json());

        // --- 2. LE GRAPHIQUE ---
        const graphRes = await fetch(`${API_URL}/api/admin/stats/usage-by-day`, { headers });
        if (graphRes.ok) {
          const sensorsData = await graphRes.json();
          const aggregation = {};
          sensorsData.forEach(sensor => {
             sensor.daily_usage.forEach(day => {
               if (!aggregation[day.date]) aggregation[day.date] = { totalSeconds: 0, count: 0 };
               aggregation[day.date].totalSeconds += day.occupied_seconds;
               aggregation[day.date].count += 1;
             });
          });
          
          const formattedGraphData = Object.keys(aggregation).sort().map(date => {
             const item = aggregation[date];
             const maxCapacitySeconds = item.count * 86400; 
             const percentage = Math.round((item.totalSeconds / maxCapacitySeconds) * 100);
             const [yyyy, mm, dd] = date.split('-');
             const dateObj = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
             const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
             return { date: `${jours[dateObj.getDay()]} ${dd}/${mm}`, occupation: percentage };
          });
          setGraphData(formattedGraphData);
        }

        // --- 3. LE TABLEAU (Logs récents) ---
        // CORRECTION ICI : On utilise bien /api/admin/logs
        const logsRes = await fetch(`${API_URL}/api/admin/logs?limit=5`, { headers });
        
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          
          // Mapping basé sur ton exemple JSON (Successful Response)
          const formattedLogs = logsData.logs.map(log => ({
            id: log.sensor_id,           // ex: ESP32_TEST_001
            parkingNom: log.sensor_name, // ex: Quai A - Position 1
            ville: "-",                  // Vide pour l'instant
            // Traduction des statuts
            statut: log.status === "available" ? "libre" 
                  : log.status === "out_of_service" ? "hors service"
                  : (log.status === "occupied" ? "occupée" : "inconnu"),
            date: log.changed_at         // ex: 2026-01-22 14:30:45
          }));

          setRecentActivity(formattedLogs);
        } else {
            console.error("Erreur chargement logs:", logsRes.status);
        }

      } catch (error) {
        console.error("Erreur API", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealData();
  }, []);

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <LayoutDashboard size={32} style={{ marginRight: '15px', color: '#222' }} />
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Vue d'ensemble de l'activité WHEELOCK</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={styles.cardsGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Total Bornes</h3>
          <div style={{...styles.bigNumber, color: 'black'}}>{isLoading ? "..." : stats.total}</div>
           <div style={styles.subText}> Dispositifs actifs</div>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Bornes Libres</h3>
          <div style={{...styles.bigNumber, color: '#82ca9d'}}>{isLoading ? "..." : stats.available}</div>
           <div style={styles.subText}> Disponibles maintenant</div>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Bornes Occupées</h3>
          <div style={{...styles.bigNumber, color: '#448aff'}}>{isLoading ? "..." : stats.occupied}</div>
           <div style={styles.subText}> En cours d'utilisation</div>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Bornes HS</h3>
          <div style={{...styles.bigNumber, color: '#ff5252'}}>{isLoading ? "..." : stats.out_of_service}</div>
           <div style={{...styles.subText, color: '#ff5252'}}> Maintenance requise</div>
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div style={styles.chartCard}>
         <div style={{ marginBottom: '20px' }}>
          <h3 style={styles.sectionTitle}>Taux d'occupation (7 derniers jours)</h3>
          <p style={styles.subtitle}>Données réelles du parc</p>
        </div>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tick={{fill: '#999'}} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{fill: '#999'}} axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={(value) => [`${value} %`, "Occupation"]} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="occupation" stroke="#5c6bc0" strokeWidth={3} dot={{ r: 4, fill: "#5c6bc0" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLEAU LOGS RÉCENTS */}
      <div style={styles.tableCard}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3 style={styles.sectionTitle}>Activité Récente des Bornes</h3>
            <p style={styles.subtitle}>Flux d'activité temps réel</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#888', fontSize: '14px' }}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Capteur / Parking</th>
              <th style={styles.th}>Ville</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               <tr><td colSpan="5" style={{padding: '20px', textAlign: 'center'}}>Chargement...</td></tr>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((log, index) => (
                <tr key={index} style={styles.tr}>
                  <td style={{...styles.td, fontWeight: 'bold', color: '#666'}}>{log.id}</td>
                  <td style={{...styles.td, fontWeight: 'bold'}}>{log.parkingNom}</td>
                  <td style={styles.td}><span style={styles.badgeVille}>{log.ville}</span></td>
                  <td style={styles.td}><span style={getStatusStyle(log.statut)}>{log.statut}</span></td>
                  <td style={{...styles.td, color: '#888', fontSize: '12px'}}>{log.date}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{padding: '20px', textAlign: 'center'}}>Aucune activité récente.</td></tr>
            )}
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
  th: { padding: '12px 10px', fontWeight: '600', color: '#999', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '12px 10px', fontSize: '13px', color: '#333' },
  badgeVille: { backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#555', fontWeight: '600' }
};

export default Dashboard;