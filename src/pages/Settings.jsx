import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { API_URL } from '../config';
import { Lock, Save } from 'lucide-react'; // J'ai ajouté des icônes pour le style

function Settings() {
  // --- PARTIE 1 : EXPORT (Ton code existant) ---
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

  // --- PARTIE 2 : MOT DE PASSE (Nouveau !) ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  // --- LOGIQUE EXPORT ---
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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

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
      alert("Erreur lors de l'export des statistiques.");
    }
  };

  // --- LOGIQUE CHANGEMENT MOT DE PASSE ---
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      alert("Veuillez remplir l'ancien et le nouveau mot de passe.");
      return;
    }

    setIsLoadingPassword(true);
    try {
      const token = localStorage.getItem('userToken');
      
      // Appel API selon Swagger (POST /api/admin/change-password)
      const response = await fetch(`${API_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          old_password: oldPassword, // Correspond au Swagger
          new_password: newPassword
        })
      });

      if (response.ok) {
        alert("Mot de passe modifié avec succès !");
        setOldPassword('');
        setNewPassword('');
      } else {
        // Gestion des erreurs (ex: ancien mot de passe incorrect)
        const errorData = await response.json();
        const msg = errorData.detail || "Erreur lors du changement de mot de passe.";
        alert("Erreur : " + msg);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion au serveur.");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.title}>Paramètres & Export</h1>

      {/* CARTE 1 : EXPORT (Ton code) */}
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
                  style={styles.input} // J'ai renommé dateInput en input pour réutiliser
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '16px' }}>
          <button
            onClick={handleExportStats}
            style={styles.primaryButton}
          >
            Exporter en XLSX
          </button>
        </div>
      </div>

      {/* CARTE 2 : SÉCURITÉ (Nouveau code) */}
      <div style={{ ...styles.card, marginTop: '25px' }}>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lock size={20} color="#333" />
          <div>
            <h2 style={styles.cardTitle}>Sécurité</h2>
            <p style={styles.subtitle}>Modifier votre mot de passe administrateur</p>
          </div>
        </div>

        <div style={styles.filtersRow}>
          <div style={styles.filterBlock}>
            <label style={styles.filterLabel}>Ancien mot de passe</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              style={{...styles.input, width: '100%'}}
            />
          </div>

          <div style={styles.filterBlock}>
            <label style={styles.filterLabel}>Nouveau mot de passe</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{...styles.input, width: '100%'}}
            />
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={handleChangePassword}
            disabled={isLoadingPassword}
            style={{...styles.primaryButton, backgroundColor: '#333'}} // Bouton noir pour différencier
          >
            {isLoadingPassword ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </div>
      </div>

    </div>
  );
}

const styles = {
  pageContainer: {
    padding: '24px 32px',
    minHeight: '100vh',
    // Le background est géré globalement ou tu peux remettre backgroundColor: '#e0e0e0'
  },
  title: {
    margin: 0,
    marginBottom: '20px',
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-main)', // Utilise tes variables si tu as le mode sombre
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '18px',
    padding: '24px',
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
    borderRadius: '8px',
    border: '1px solid #ddd',
    padding: '8px 12px',
    fontSize: '13px',
    backgroundColor: '#f9f9f9',
    width: '100%',
    boxSizing: 'border-box'
  },
  input: {
    borderRadius: '8px',
    border: '1px solid #ddd',
    padding: '8px 12px',
    fontSize: '13px',
    backgroundColor: '#f9f9f9',
    width: '100%', 
    boxSizing: 'border-box'
  },
  primaryButton: {
    marginTop: '5px',
    padding: '10px 20px',
    borderRadius: '999px',
    border: 'none',
    backgroundColor: '#1e88e5',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
};

export default Settings;