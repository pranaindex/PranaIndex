"use client";
import React, { useState } from 'react';

export default function PranaIndex() {
  const [screen, setScreen] = useState('landing');
  const [email, setEmail] = useState('');

  // Standard CSS styles to bypass Tailwind issues
  const styles = {
    wrapper: { backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, fontFamily: 'sans-serif' },
    nav: { padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'center' },
    logo: { height: '80px', width: 'auto', marginBottom: '10px' },
    main: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const, padding: '20px' },
    title: { fontSize: '3rem', fontWeight: '800', marginBottom: '20px', color: '#22d3ee' },
    button: { backgroundColor: '#22d3ee', color: '#0f172a', padding: '15px 40px', borderRadius: '50px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.2rem' },
    input: { padding: '15px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', width: '100%', maxWidth: '300px', marginBottom: '10px' }
  };

  return (
    <div style={styles.wrapper}>
      <nav style={styles.nav}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/gold-pi-logo.png" alt="Logo" style={styles.logo} />
          <h1 style={{ fontSize: '1.5rem', letterSpacing: '-1px', margin: 0 }}>PRANA INDEX</h1>
        </div>
      </nav>

      <main style={styles.main}>
        {screen === 'landing' && (
          <div>
            <h2 style={styles.title}>Master Your Focus.</h2>
            <p style={{ color: '#94a3b8', marginBottom: '30px' }}>A 60-second test to index your vitality.</p>
            <button style={styles.button} onClick={() => setScreen('game')}>Start Stress Test</button>
          </div>
        )}

        {screen === 'game' && (
          <div style={{ padding: '40px', backgroundColor: '#1e293b', borderRadius: '20px' }}>
            <h2>Game Loading...</h2>
            <p>Ready to test your reaction time?</p>
            <button style={{ color: '#22d3ee', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setScreen('email')}>
              (Click here to go to Email Screen)
            </button>
          </div>
        )}

        {screen === 'email' && (
          <div>
            <h3 style={{ fontSize: '2rem', marginBottom: '20px' }}>Test Complete.</h3>
            <p style={{ marginBottom: '20px' }}>Enter email to see your score.</p>
            <input 
              style={styles.input}
              type="email" 
              placeholder="your@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <br />
            <button style={styles.button} onClick={() => setScreen('regulation')}>Get My Score</button>
          </div>
        )}

        {screen === 'regulation' && (
          <div>
            <h3 style={{ fontSize: '2.5rem', color: '#4ade80' }}>Regulation Mode</h3>
            <p>Breathe with the rhythm...</p>
            <button style={{ marginTop: '20px', color: '#94a3b8' }} onClick={() => setScreen('landing')}>Restart</button>
          </div>
        )}
      </main>

      <footer style={{ padding: '20px', color: '#475569', fontSize: '0.8rem' }}>
        &copy; 2026 PRANA INDEX
      </footer>
    </div>
  );
}
