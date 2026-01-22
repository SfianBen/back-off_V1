import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(username, password);
      
      // Stocker le token dans localStorage
      localStorage.setItem("userToken", response.access_token);
      localStorage.setItem("username", username);
      
      // Rediriger vers le dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Erreur de connexion:", error);
      alert("Erreur de connexion. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.background}>
      <div style={styles.card}>
        
        <div style={styles.header}>
          <img src="/logo.svg" alt="Logo Wheelock" style={styles.logo} />
          <h2 style={styles.title}>Back-Office Administration</h2>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nom d'utilisateur</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mot de passe</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={styles.footer}>
          2025 - ©WHEELOCK. Créé par INSA-HDF.
        </div>
      </div>
    </div>
  );
}

const styles = {
  background: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#9ca3af',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px 50px',
    borderRadius: '25px',
    width: '380px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: { textAlign: 'center', marginBottom: '30px', width: '100%' },
  logo: { width: '100px', marginBottom: '15px' },
  title: { color: '#9e9e9e', fontSize: '16px', fontWeight: 'normal', margin: 0 },
  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: '500', fontSize: '14px', color: '#333', marginLeft: '5px' },
  input: { padding: '12px 15px', borderRadius: '15px', border: 'none', backgroundColor: '#dcdcdc', outline: 'none' },
  button: { marginTop: '20px', padding: '12px', backgroundColor: '#899092', color: 'white', border: 'none', borderRadius: '15px', fontSize: '16px', cursor: 'pointer' },
  footer: { marginTop: '40px', fontSize: '10px', color: '#a0a0a0', textAlign: 'center' }
};

export default Login;