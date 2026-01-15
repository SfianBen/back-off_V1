import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, List, BarChart3, Settings, LogOut } from 'lucide-react';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate('/');
  };

  const getLinkStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      ...styles.link,
      color: isActive ? 'black' : '#666',
      fontWeight: isActive ? 'bold' : 'normal',
      borderLeft: isActive ? '4px solid black' : '4px solid transparent',
      backgroundColor: isActive ? '#f5f5f5' : 'transparent',
    };
  };

  return (
    <div style={styles.sidebar}>
      {/* --- LOGO --- */}
      <div style={styles.logoContainer}>
        <img src="/logo.svg" alt="WL" style={{ width: '50px', height: '50px', marginRight: '15px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#222', lineHeight: '1.2' }}>WHEELOCK</h2>
          <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>Back-Office</span>
        </div>
      </div>

      <nav style={styles.nav}>
        <Link to="/dashboard" style={getLinkStyle('/dashboard')}>
          <LayoutDashboard size={20} style={{ marginRight: '10px' }} /> Dashboard
        </Link>
        <Link to="/map" style={getLinkStyle('/map')}>
          <MapPin size={20} style={{ marginRight: '10px' }} /> Carte des bornes
        </Link>
        <Link to="/list" style={getLinkStyle('/list')}>
          <List size={20} style={{ marginRight: '10px' }} /> Liste des bornes
        </Link>
        <Link to="/stats" style={getLinkStyle('/stats')}>
          <BarChart3 size={20} style={{ marginRight: '10px' }} /> Statistiques
        </Link>
        <Link to="/settings" style={getLinkStyle('/settings')}>
          <Settings size={20} style={{ marginRight: '10px' }} /> Paramètres
        </Link>
      </nav>

      <div style={styles.footer}>
        <button onClick={handleLogout} style={styles.logoutButton}>
          <LogOut size={20} style={{ marginRight: '10px' }} /> Déconnexion
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '220px',
    height: '100vh',
    backgroundColor: 'white',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0, top: 0,
    zIndex: 100,
  },
  logoContainer: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center', 
    borderBottom: '1px solid #f0f0f0',
  },
  nav: { paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 },
  link: { display: 'flex', alignItems: 'center', textDecoration: 'none', fontSize: '16px', padding: '12px 20px', transition: '0.2s' },
  footer: { padding: '20px', borderTop: '1px solid #e0e0e0' },
  logoutButton: { display: 'flex', alignItems: 'center', background: 'none', border: 'none', color: '#333', fontSize: '16px', cursor: 'pointer', width: '100%', fontWeight: '500' }
};

export default Sidebar;