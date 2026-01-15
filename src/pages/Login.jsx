import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simult de connexion
    if (email === "gael.verhaeghe@wheelock.fr" && password === "admin123") {
      localStorage.setItem("userToken", "token-secret-wheelock");
      navigate('/dashboard');
    } else {
      alert("Erreur : Essayez gael.verhaeghe@wheelock.fr et admin123");
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
            <label style={styles.label}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mot de passe</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>
            Se connecter
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