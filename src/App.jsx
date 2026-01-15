import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Imports des pages 
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Map from './pages/Map';
import BornesList from './pages/BornesList';
import Stats from './pages/Stats';
import Settings from './pages/Settings';

// Menu à gauche + Contenu à droite
const MainLayout = () => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ 
        marginLeft: '220px', 
        width: 'calc(100% - 220px)', 
        minHeight: '100vh', 
        backgroundColor: '#e0e0e0' 
      }}>
        <Outlet />
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* 1. Route Publique (Le Login) */}
        <Route path="/" element={<Login />} />

        {/* 2. Routes Protégées  */}
        <Route element={<ProtectedRoute />}>
          
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map" element={<Map />} />
            <Route path="/list" element={<BornesList />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;