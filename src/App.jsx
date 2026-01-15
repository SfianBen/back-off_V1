import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Importe tes pages (Vérifie que les noms correspondent à tes fichiers)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Map from './pages/Map';
import BornesList from './pages/BornesList';
import Stats from './pages/Stats';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      {/* --- MENU TEMPORAIRE POUR TESTER --- */}
      <nav style={{ padding: '10px', borderBottom: '2px solid black' }}>
        <Link to="/" style={{ marginRight: '10px' }}>Login</Link>
        <Link to="/dashboard" style={{ marginRight: '10px' }}>Dashboard</Link>
        <Link to="/map" style={{ marginRight: '10px' }}>Carte</Link>
        <Link to="/list" style={{ marginRight: '10px' }}>Liste</Link>
        <Link to="/stats" style={{ marginRight: '10px' }}>Stats</Link>
        <Link to="/settings">Settings</Link>
      </nav>

      {/* --- LE CONTENU QUI CHANGE --- */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/map" element={<Map />} />
        <Route path="/list" element={<BornesList />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;