import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, MapPin, Clock3, Activity, TrendingUp } from 'lucide-react';
import { API_URL } from '../config';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const TIME_GRAIN_OPTIONS = [
  'jour',
  'semaine',
  'mois',
  'trimestre',
  'semestre',
  'année',
];

function aggregateByTime(sessions, grain) {
  const buckets = new Map();

  sessions.forEach((s) => {
    const d = s.startDate;
    let key = '';

    switch (grain) {
      case 'jour':
        key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        break;
      case 'semaine': {
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(
          ((d - onejan) / 86400000 + onejan.getDay() + 1) / 7
        );
        key = `${d.getFullYear()}-S${week}`;
        break;
      }
      case 'mois':
        key = `${d.getFullYear()}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
        break;
      case 'trimestre': {
        const quart = Math.floor(d.getMonth() / 3) + 1;
        key = `${d.getFullYear()}-T${quart}`;
        break;
      }
      case 'semestre': {
        const sem = d.getMonth() < 6 ? 1 : 2;
        key = `${d.getFullYear()}-S${sem}`;
        break;
      }
      case 'année':
      default:
        key = `${d.getFullYear()}`;
        break;
    }

    if (!buckets.has(key)) {
      buckets.set(key, { key, totalRate: 0, count: 0 });
    }
    const b = buckets.get(key);
    b.totalRate += s.occupancyRate;
    b.count += 1;
  });

  const result = Array.from(buckets.values())
    .sort((a, b) => (a.key > b.key ? 1 : -1))
    .map((b) => ({ label: b.key, occupation: Math.round(b.totalRate / b.count) }));

  return result;
}

function computeKpi(sessions) {
  if (!sessions.length) {
    return {
      avgOccupation: 0,
      avgDurationMinutes: 0,
      totalSessions: 0,
      occupationRate: 0,
    };
  }

  const totalRate = sessions.reduce((acc, s) => acc + s.occupancyRate, 0);
  const avgOccupation = Math.round(totalRate / sessions.length);

  const totalMinutes = sessions.reduce((acc, s) => {
    const diff = (s.endDate - s.startDate) / 60000;
    return acc + diff;
  }, 0);
  const avgDurationMinutes = Math.round(totalMinutes / sessions.length);

  const totalSessions = sessions.length;

  return {
    avgOccupation,
    avgDurationMinutes,
    totalSessions,
    // alias pour compat avec l'UI existante
    occupationRate: avgOccupation,
  };
}

function computeActiveZone(sessions, level) {
  const keyField =
    level === 'Région'
      ? 'departement'
      : level === 'Département'
      ? 'ville'
      : 'parking';

  const buckets = new Map();
  sessions.forEach((s) => {
    const key = s[keyField] || 'Inconnu';
    if (!buckets.has(key)) {
      buckets.set(key, { key, totalRate: 0, count: 0 });
    }
    const b = buckets.get(key);
    b.totalRate += s.occupancyRate;
    b.count += 1;
  });

  if (!buckets.size) {
    return { label: '-', value: 0 };
  }

  let best = null;
  buckets.forEach((b) => {
    const avg = b.totalRate / b.count;
    if (!best || avg > best.value) {
      best = { label: b.key, value: Math.round(avg) };
    }
  });

  return best;
}

function Stats() {
  const [docksGroups, setDocksGroups] = useState([]);
  const [sensorStats, setSensorStats] = useState(null);
  const [geoByParkingId, setGeoByParkingId] = useState({});
  const [usageByDay, setUsageByDay] = useState([]);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [backendError, setBackendError] = useState(null);

  const [timeGrain, setTimeGrain] = useState('jour');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');

  const [selectedRegion, setSelectedRegion] = useState('Tous');
  const [selectedDepartement, setSelectedDepartement] = useState('Tous');
  const [selectedVille, setSelectedVille] = useState('Tous');

  const geoOptions = useMemo(() => {
    const regions = Array.from(
      new Set(Object.values(geoByParkingId).map((g) => g.region).filter(Boolean))
    );
    const departements = Array.from(
      new Set(Object.values(geoByParkingId).map((g) => g.departement).filter(Boolean))
    );
    const villes = Array.from(
      new Set(Object.values(geoByParkingId).map((g) => g.ville).filter(Boolean))
    );
    return { regions, departements, villes };
  }, [geoByParkingId]);

  useEffect(() => {
    const fetchDocksGroups = async () => {
      try {
        setIsLoadingBackend(true);
        setBackendError(null);

        const res = await fetch(`${API_URL}/api/public/docks-groups`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setDocksGroups(data || []);

        const geoEntries = await Promise.all(
          (data || []).map(async (group) => {
            try {
              const url = `https://nominatim.openstreetmap.org/reverse?lat=${group.latitude}&lon=${group.longitude}&format=json&accept-language=fr`;
              const resp = await fetch(url, {
                headers: {
                  'User-Agent': 'wheelock-frontend-demo',
                },
              });
              if (!resp.ok) return [group.id, { parking: group.name }];
              const j = await resp.json();
              const addr = j.address || {};
              const ville = addr.city || addr.town || addr.village || group.name;
              const departement = addr.county || addr.state || '';
              const region = addr.region || addr.state || '';
              return [group.id, {
                parking: group.name,
                ville,
                departement,
                region,
              }];
            } catch {
              return [group.id, { parking: group.name }];
            }
          })
        );

        const geoMap = {};
        geoEntries.forEach(([id, value]) => {
          geoMap[id] = value;
        });
        setGeoByParkingId(geoMap);
      } catch (e) {
        setBackendError(e.message || 'Erreur backend');
      } finally {
        setIsLoadingBackend(false);
      }
    };

    fetchDocksGroups();
  }, []);

  // Récupération des statistiques des capteurs (endpoint admin, nécessite token)
  useEffect(() => {
    const fetchSensorStats = async () => {
      try {
        setIsLoadingBackend(true);
        const token = localStorage.getItem('userToken');
        const headers = token
          ? {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          : {};

        const res = await fetch(`${API_URL}/api/admin/stats/sensors`, { headers });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setSensorStats(data);
      } catch (e) {
        console.error('Erreur lors de la récupération des stats des capteurs:', e);
        setBackendError(e.message || 'Erreur lors de la récupération des statistiques');
      } finally {
        setIsLoadingBackend(false);
      }
    };

    fetchSensorStats();
  }, []);

  // Récupération des stats d'utilisation par jour (endpoint admin, nécessite token)
  useEffect(() => {
    const fetchUsageByDay = async () => {
      try {
        setIsLoadingBackend(true);
        const token = localStorage.getItem('userToken');
        const headers = token
          ? {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          : {};

        const url = `${API_URL}/api/admin/stats/usage-by-day?start_date=${startDate}&end_date=${endDate}`;
        const res = await fetch(url, { headers });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setUsageByDay(data || []);
      } catch (e) {
        console.error('Erreur usage-by-day:', e);
      } finally {
        setIsLoadingBackend(false);
      }
    };

    fetchUsageByDay();
  }, [startDate, endDate]);

  // Fonction pour calculer le taux d'occupation en temps réel
  const getRealTimeOccupancy = useMemo(() => {
    if (!sensorStats || !docksGroups.length) return 0;
    
    const totalDocks = docksGroups.reduce((acc, g) => acc + (g.total_docks || 0), 0);
    const availableDocks = docksGroups.reduce(
      (acc, g) => acc + (g.available_docks || 0),
      0
    );
    const occupiedDocks = totalDocks - availableDocks;
    
    return totalDocks > 0 ? Math.round((occupiedDocks / totalDocks) * 100) : 0;
  }, [sensorStats, docksGroups]);

  // Fonction pour calculer la journée de pointe
  const getPeakDay = useMemo(() => {
    if (!sensorStats?.daily_usage) return null;
    
    // Trouver le jour avec le plus d'utilisation
    let peakDay = null;
    let maxUsage = -1;
    
    Object.entries(sensorStats.daily_usage).forEach(([date, usage]) => {
      if (usage > maxUsage) {
        maxUsage = usage;
        peakDay = date;
      }
    });
    
    return peakDay ? {
      date: new Date(peakDay).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      usage: maxUsage
    } : null;
  }, [sensorStats]);

  // Agrégation usage-by-day : total d'heures occupées par date (tous capteurs)
  const usageByDate = useMemo(() => {
    const map = new Map();
    (usageByDay || []).forEach((sensor) => {
      (sensor.daily_usage || []).forEach((d) => {
        const prev = map.get(d.date) || 0;
        map.set(d.date, prev + (d.occupied_hours || 0));
      });
    });
    return map;
  }, [usageByDay]);

  // KPI basés sur usage-by-day (occupation moyenne / durée moyenne)
  const usageKpi = useMemo(() => {
    if (!usageByDate.size) {
      return { occupationRate: null, avgDurationMinutes: null };
    }

    const entries = Array.from(usageByDate.entries());
    const totalDays = entries.length;
    let sumPct = 0;
    let sumMinutes = 0;

    entries.forEach(([_, hours]) => {
      const h = Number(hours) || 0;
      const pct = Math.max(0, Math.min(100, (h / 24) * 100));
      sumPct += pct;
      sumMinutes += h * 60;
    });

    return {
      occupationRate: Math.round(sumPct / totalDays),
      avgDurationMinutes: Math.round(sumMinutes / totalDays),
    };
  }, [usageByDate]);

  const backendInstantStats = useMemo(() => {
    if (!docksGroups.length) {
      return {
        totalDocks: 0,
        availableDocks: 0,
        occupiedDocks: 0,
        occupationRate: 0,
        mostActiveParking: null,
      };
    }

    const totalDocks = docksGroups.reduce((acc, g) => acc + (g.total_docks || 0), 0);
    const availableDocks = docksGroups.reduce(
      (acc, g) => acc + (g.available_docks || 0),
      0
    );
    const occupiedDocks = totalDocks - availableDocks;
    const occupationRate = totalDocks
      ? Math.round((occupiedDocks / totalDocks) * 100)
      : 0;

    let mostActive = null;
    docksGroups.forEach((g) => {
      const occ = (g.total_docks || 0) - (g.available_docks || 0);
      const rate = g.total_docks ? (occ / g.total_docks) * 100 : 0;
      if (!mostActive || rate > mostActive.rate) {
        mostActive = { group: g, rate: Math.round(rate) };
      }
    });

    return {
      totalDocks,
      availableDocks,
      occupiedDocks,
      occupationRate,
      mostActiveParking: mostActive,
    };
  }, [docksGroups]);

  const activeZoneLevel = useMemo(() => {
    if (selectedVille !== 'Tous') return 'Ville';
    if (selectedDepartement !== 'Tous') return 'Département';
    if (selectedRegion !== 'Tous') return 'Région';
    return 'Région';
  }, [selectedRegion, selectedDepartement, selectedVille]);

  const activeZoneName =
    selectedVille !== 'Tous'
      ? selectedVille
      : selectedDepartement !== 'Tous'
      ? selectedDepartement
      : selectedRegion !== 'Tous'
      ? selectedRegion
      : 'Toutes les régions';

  // Journée de pointe basée sur usageByDate (jour avec le plus d'heures occupées)
  const peakDayFromUsage = useMemo(() => {
    if (!usageByDate.size) return null;

    let bestDate = null;
    let bestHours = -1;
    usageByDate.forEach((hours, date) => {
      const h = Number(hours) || 0;
      if (h > bestHours) {
        bestHours = h;
        bestDate = date;
      }
    });

    if (!bestDate) return null;

    const [yyyy, mm, dd] = bestDate.split('-');
    const jsDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    const formatted = jsDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const occupationPct = Math.round(
      Math.max(0, Math.min(100, ((bestHours || 0) / 24) * 100))
    );

    return { dateLabel: formatted, occupationPct };
  }, [usageByDate]);

  // Données du graphique d'occupation inspiré du Dashboard
  const occupationGraphData = useMemo(() => {
    const aggregation = {};

    (usageByDay || []).forEach((sensor) => {
      (sensor.daily_usage || []).forEach((day) => {
        if (!aggregation[day.date]) {
          aggregation[day.date] = { totalSeconds: 0, count: 0 };
        }
        aggregation[day.date].totalSeconds += day.occupied_seconds || 0;
        aggregation[day.date].count += 1;
      });
    });

    return Object.keys(aggregation)
      .sort()
      .map((date) => {
        const item = aggregation[date];
        const maxCapacitySeconds = item.count * 86400; // 24h par capteur
        const percentage = maxCapacitySeconds
          ? Math.round((item.totalSeconds / maxCapacitySeconds) * 100)
          : 0;

        const [yyyy, mm, dd] = date.split('-');
        const dateObj = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
        const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

        return {
          date: `${jours[dateObj.getDay()]} ${dd}/${mm}`,
          occupation: percentage,
        };
      });
  }, [usageByDay]);

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <BarChart3 size={32} style={{ marginRight: '15px' }} />
        <div>
          <h1 style={styles.title}>Statistiques & KPI</h1>
          <p style={styles.subtitle}>
            Analyse approfondie pour la prise de décision stratégique
          </p>
        </div>
      </div>

      <div style={styles.filtersCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontWeight: 600, color: '#555' }}>Filtres</div>
        </div>

        <div style={styles.filtersRow}>
          <div style={styles.filterBlock}>
            <span style={styles.filterLabel}>Granularité temporelle</span>
            <div style={styles.timeGrainContainer}>
              {TIME_GRAIN_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setTimeGrain(opt)}
                  style={{
                    ...styles.timeGrainButton,
                    backgroundColor:
                      timeGrain === opt ? '#1e88e5' : 'rgba(0,0,0,0.04)',
                    color: timeGrain === opt ? 'white' : '#555',
                  }}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>

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
              <div style={styles.kpiValue}>
                {Number.isFinite(usageKpi.occupationRate)
                  ? `${usageKpi.occupationRate}%`
                  : '--'}
              </div>
            </div>
          </div>

          <div style={styles.filterBlock}>
            <span style={styles.filterLabel}>Localisation</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setSelectedDepartement('Tous');
                  setSelectedVille('Tous');
                }}
                style={styles.select}
              >
                <option value="Tous">Toutes les régions</option>
                {geoOptions.regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <select
                value={selectedDepartement}
                onChange={(e) => {
                  setSelectedDepartement(e.target.value);
                  setSelectedVille('Tous');
                }}
                style={styles.select}
              >
                <option value="Tous">Tous les départements</option>
                {geoOptions.departements.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={selectedVille}
                onChange={(e) => setSelectedVille(e.target.value)}
                style={styles.select}
              >
                <option value="Tous">Toutes les villes</option>
                {geoOptions.villes.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Journée de pointe : visible seulement pour granularité >= semaine */}
      {timeGrain !== 'jour' && peakDayFromUsage && (
        <div style={{ ...styles.card, marginBottom: '20px' }}>
          <h3 style={styles.cardTitle}>Journée de pointe</h3>
          <div style={{ ...styles.bigNumber, color: '#1e88e5', fontSize: '24px' }}>
            {peakDayFromUsage.dateLabel}
          </div>
          <div style={styles.subTextRow}>
            <TrendingUp size={16} style={{ marginRight: '6px' }} />
            <span style={{ fontSize: '13px', color: '#777' }}>
              {peakDayFromUsage.occupationPct}% de taux d'occupation ce jour-là
            </span>
          </div>
        </div>
      )}

      <div style={styles.cardsGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Taux d'occupation moyen</h3>
          <div style={{ ...styles.bigNumber, color: '#1e88e5' }}>
            {Number.isFinite(usageKpi.occupationRate)
              ? `${usageKpi.occupationRate}%`
              : '--'}
          </div>
          <div style={styles.subTextRow}>
            <TrendingUp size={16} style={{ marginRight: '6px' }} />
            <span style={{ fontSize: '13px', color: '#777' }}>
              Sur la période sélectionnée
            </span>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Durée moyenne</h3>
          <div style={{ ...styles.bigNumber, color: '#1e88e5' }}>
            {Number.isFinite(usageKpi.avgDurationMinutes)
              ? `${usageKpi.avgDurationMinutes} min`
              : '--'}
          </div>
          <div style={styles.subTextRow}>
            <Clock3 size={16} style={{ marginRight: '6px' }} />
            <span style={{ fontSize: '13px', color: '#777' }}>Par session</span>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Total emplacements</h3>
          <div style={{ ...styles.bigNumber, color: '#1e88e5' }}>
            {backendInstantStats.totalDocks.toLocaleString('fr-FR')}
          </div>
          <div style={styles.subTextRow}>
            <Activity size={16} style={{ marginRight: '6px' }} />
            <span style={{ fontSize: '13px', color: '#777' }}>Période sélectionnée</span>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Zone la plus active</h3>
          <div style={{ ...styles.bigNumber, color: '#1e88e5', fontSize: '26px' }}>
            {backendInstantStats.mostActiveParking?.group?.name || '-'}
          </div>
          <div style={styles.subTextRow}>
            <MapPin size={16} style={{ marginRight: '6px' }} />
            <span style={{ fontSize: '13px', color: '#777' }}>
              {backendInstantStats.mostActiveParking
                ? `${backendInstantStats.mostActiveParking.rate}% d'occupation`
                : 'Aucune donnée'}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={styles.sectionTitle}>Taux d'occupation (période sélectionnée)</h3>
            <p style={styles.subtitle}>Données réelles du parc</p>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occupationGraphData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#999' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#999' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  formatter={(value) => [`${value} %`, 'Occupation']}
                  contentStyle={{
                    borderRadius: '10px',
                    border: 'none',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="occupation"
                  stroke="#5c6bc0"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#5c6bc0' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    padding: '24px 32px',
    backgroundColor: '#e0e0e0',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 700,
    color: '#222',
  },
  subtitle: {
    margin: 0,
    marginTop: '4px',
    fontSize: '13px',
    color: '#777',
  },
  filtersCard: {
    backgroundColor: 'white',
    borderRadius: '18px',
    padding: '18px 20px',
    marginBottom: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
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
  timeGrainContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  timeGrainButton: {
    border: 'none',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  dateInput: {
    borderRadius: '999px',
    border: '1px solid #ddd',
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: '#f9f9f9',
  },
  select: {
    borderRadius: '999px',
    border: '1px solid #ddd',
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: '#f9f9f9',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '18px',
    padding: '16px 18px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardTitle: {
    margin: 0,
    fontSize: '13px',
    color: '#777',
    marginBottom: '12px',
  },
  bigNumber: {
    fontSize: '30px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  subTextRow: {
    display: 'flex',
    alignItems: 'center',
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: '18px',
    padding: '16px 18px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: '#333',
  },
  exportButton: {
    borderRadius: '999px',
    border: 'none',
    padding: '6px 14px',
    fontSize: '12px',
    cursor: 'pointer',
    backgroundColor: '#1e88e5',
    color: 'white',
    fontWeight: 500,
  },
};

export default Stats;