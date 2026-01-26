import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { API_URL } from '../config';

function Settings() {
  const [exportType, setExportType] = useState('usage');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const d = new Date(today);
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const handleExportStats = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        alert('Veuillez vous connecter pour exporter les statistiques.');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      let rows = [];
      let sheetName = 'export';
      let fileName = 'wheelock_export.xlsx';

      if (exportType === 'usage') {
        const url = `${API_URL}/api/admin/stats/usage-by-day?start_date=${startDate}&end_date=${endDate}`;
        const res = await fetch(url, { headers });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();

        // Aplatir les données par capteur / jour en lignes pour Excel
        (data || []).forEach((sensor) => {
          const base = {
            sensor_id: sensor.sensor_id,
            sensor_name: sensor.sensor_name,
            dock_id: sensor.dock_id,
          };
          (sensor.daily_usage || []).forEach((d) => {
            rows.push({
              ...base,
              date: d.date,
              occupied_seconds: d.occupied_seconds,
              occupied_hours: d.occupied_hours,
            });
          });
        });

        sheetName = 'usage_by_day';
        fileName = 'wheelock_stats_usage_by_day.xlsx';
      } else if (exportType === 'sensors') {
        const res = await fetch(`${API_URL}/api/admin/stats/sensors`, { headers });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();

        rows = [data];
        sheetName = 'sensors_stats';
        fileName = 'wheelock_stats_sensors.xlsx';
      }

      if (!rows.length) {
        alert('Aucune donnée à exporter sur la période sélectionnée.');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, fileName);
    } catch (e) {
      console.error('Erreur export XLSX:', e);
      alert('Erreur lors de lexport des statistiques.');
    }
  };

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.title}>Paramètres & Export</h1>

      <div style={styles.card}>
        <div style={{ marginBottom: '12px' }}>
          <h2 style={styles.cardTitle}>Export des données</h2>
          <p style={styles.subtitle}>
            Choisissez le type de données et la période à exporter au format Excel.
          </p>
        </div>

        <div style={styles.filtersRow}>
          <div style={styles.filterBlock}>
            <span style={styles.filterLabel}>Type d'export</span>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              style={styles.select}
            >
              <option value="usage">Utilisation par jour</option>
              <option value="sensors">Statistiques capteurs (instantané)</option>
            </select>
          </div>

          {exportType === 'usage' && (
            <div style={styles.filterBlock}>
              <span style={styles.filterLabel}>Période</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={styles.dateInput}
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={styles.dateInput}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '16px' }}>
          <button
            onClick={handleExportStats}
            style={styles.exportButton}
          >
            Exporter en XLSX
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;

const styles = {
  pageContainer: {
    padding: '24px 32px',
    backgroundColor: '#e0e0e0',
    minHeight: '100vh',
  },
  title: {
    margin: 0,
    marginBottom: '16px',
    fontSize: '24px',
    fontWeight: 700,
    color: '#222',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '18px',
    padding: '18px 20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    maxWidth: '800px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
  },
  subtitle: {
    margin: 0,
    marginTop: '4px',
    fontSize: '13px',
    color: '#777',
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    marginTop: '16px',
  },
  filterBlock: {
    flex: 1,
    minWidth: '220px',
  },
  filterLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#666',
    marginBottom: '8px',
  },
  select: {
    borderRadius: '999px',
    border: '1px solid #ddd',
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: '#f9f9f9',
  },
  dateInput: {
    borderRadius: '999px',
    border: '1px solid #ddd',
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: '#f9f9f9',
  },
  exportButton: {
    marginTop: '10px',
    padding: '10px 16px',
    borderRadius: '999px',
    border: 'none',
    backgroundColor: '#1e88e5',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 500,
  },
};