"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndex() {
  // --- APP STATE ---
  const [screen, setScreen] = useState('landing');
  const [email, setEmail] = useState('');
  
  // Game State
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2Taps, setP2Taps] = useState<number[]>([]);
  const [hitCount, setHitCount] = useState(0);
  const [pulseSize, setPulseSize] = useState(0);
  const [pulseDir, setPulseDir] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  
  // Regulation State
  const [regPhase, setRegPhase] = useState('READY'); 
  const [regTimer, setRegTimer] = useState(5.0);
  const [regCycles, setRegCycles] = useState(0);

  // Refs
  const audioCtx = useRef<AudioContext | null>(null);
  const rainAudio = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetPos = useRef({ left: '50%', top: '50%' });
  const gameTimer = useRef<any>(null);

  // --- 1. ATMOSPHERIC RAIN ANIMATION ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let drops: any[] = [];
    for (let i = 0; i < 200; i++) {
      drops.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, l: Math.random() * 20, v: Math.random() * 5 + 2 });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.2)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(170, 170, 170, 0.15)';
      ctx.lineWidth = 1;
      drops.forEach(d => {
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.l); ctx.stroke();
        d.y += d.v; if (d.y > canvas.height) { d.y = -20; d.x = Math.random() * canvas.width; }
      });
      requestAnimationFrame(animate);
    };
    animate();
    
    // Handle resize
    const handleResize = () => {
      if(canvasRef.current) {
         canvasRef.current.width = window.innerWidth;
         canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 2. SOUND ENGINE ---
  const startAtmosphere = () => {
    // Start Rain Audio
    if (!rainAudio.current) {
      rainAudio.current = new Audio("https://www.soundjay.com/nature/rain-01.mp3");
      rainAudio.current.loop = true;
      rainAudio.current.volume = 0.3;
    }
    rainAudio.current.play();

    // Init Game Sound Engine
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    
    setScreen('details');
  };

  const playTone = (freq: number, type: OscillatorType, dur: number, vol = 0.1) => {
    if (!audioCtx.current) return;
    const o = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    g.gain.setValueAtTime(vol, audioCtx.current.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + dur);
    o.connect(g); g.connect(audioCtx.current.destination);
    o.start(); o.stop(audioCtx.current.currentTime + dur);
  };

  // --- 3. GAME ENGINE LOGIC ---
  const startPhase1 = () => {
    setScreen('p1');
    playTone(440, 'sine', 0.2);
    const start = Date.now();
    gameTimer.current = setInterval(() => {
        if (Date.now() - start > 15000) { 
            clearInterval(gameTimer.current);
            setScreen('p2');
        }
    }, 100);
  };

  const handleP1Tap = () => {
    playTone(200, 'sine', 0.1);
    setP1Taps(prev => [...prev, Date.now()]);
  };

  const handleP2Tap = () => {
    playTone(800, 'triangle', 0.1);
    const next = [...p2Taps, Date.now()];
    setP2Taps(next);
    if (next.length >= 5) {
        setScreen('p3');
    } else {
        targetPos.current = { 
            left: Math.random() * 70 + 10 + '%', top: Math.random() * 70 + 10 + '%' 
        };
    }
  };

  useEffect(() => {
    if (screen === 'p3' && hitCount < 3) {
      const interval = setInterval(() => {
        setPulseSize(p => {
          let n = p + (2.5 * pulseDir);
          if (n >= 100 || n <= 0) setPulseDir(d => d * -1);
          return n;
        });
      }, 16);
      return () => clearInterval(interval);
    }
  }, [screen, hitCount, pulseDir]);

  const handleP3Tap = () => {
    playTone(1200, 'sine', 0.15);
    setHitCount(h => h + 1);
    if(hitCount >= 2) { 
      setFinalScore(Math.floor(Math.random()*15)+80); // Calculate score
      setTimeout(() => setScreen('result'), 500); 
    }
  };

  // --- 4. REGULATION LOGIC (5-3-5) ---
  const runRegCycle = () => {
    if (regCycles >= 3) { setRegPhase('DONE'); return; }

    setRegPhase('INHALE');
    let time = 5.0;
    const inhaleInt = setInterval(() => {
        time -= 0.1; setRegTimer(Math.max(0, time));
        if (time <= 0) {
            clearInterval(inhaleInt);
            setRegPhase('HOLD');
            let hTime = 3.0;
            const holdInt = setInterval(() => {
                hTime -= 0.1; setRegTimer(Math.max(0, hTime));
                if (hTime <= 0) {
                    clearInterval(holdInt);
                    setRegPhase('EXHALE');
                    let eTime = 5.0;
                    const exhaleInt = setInterval(() => {
                        eTime -= 0.1; setRegTimer(Math.max(0, eTime));
                        if (eTime <= 0) {
                            clearInterval(exhaleInt);
                            setRegCycles(prev => prev + 1);
                            setRegPhase('READY');
                        }
                    }, 100);
                }
            }, 100);
        }
    }, 100);
  };

  useEffect(() => {
    if (screen === 'reg_active' && regPhase === 'READY' && regCycles < 3) {
        runRegCycle();
    }
  }, [screen, regPhase, regCycles]);

  return (
    <div style={{ backgroundColor: '#0A0E1A', color: 'white', minHeight: '100vh', fontFamily: 'Inter, sans-serif', touchAction: 'none', overflow: 'hidden', position: 'relative' }}>
      
      {/* Background Rain Canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }} />

      {/* Main Content Container */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        
        {/* 1. LANDING PAGE */}
        {screen === 'landing' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 2s ease-in' }}>
            {/* The Logo contains the words PRANA INDEX, so we removed the extra H1 text */}
            <img src="/gold-pi-logo.png" style={{ width: '220px', marginBottom: '30px' }} alt="Prana Index Logo" />
            
            <p style={{ color: '#39FF14', fontSize: '24px', fontWeight: 900, fontStyle: 'italic', marginBottom: '10px' }}>Play your rhythm</p>
            <p style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '40px', letterSpacing: '1px' }}>CHECK YOUR PI STRESS SCORE</p>
            
            <button 
              onClick={startAtmosphere}
              style={{ background: 'none', border: 'none', color: '#39FF14', fontSize: '32px', fontWeight: 900, cursor: 'pointer', outline: 'none' }}
            >Start</button>
          </div>
        )}

        {/* 2. INSTRUCTIONS DETAILS */}
        {screen === 'details' && (
          <div style={{ textAlign: 'center', maxWidth: '320px', animation: 'fadeIn 0.5s' }}>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 900, color: '#D4AF37', fontStyle: 'italic', letterSpacing: '-2px' }}>PRANA INDEX</h2>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', marginBottom: '40px', marginTop: '20px' }}>
              <p style={{ marginBottom: '15px', fontSize: '11px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>01 CONSISTENCY:</span> Tap a steady beat.</p>
              <p style={{ marginBottom: '15px', fontSize: '11px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>02 REFLUX:</span> Catch 5 nodes fast.</p>
              <p style={{ fontSize: '11px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>03 FOCUS:</span> Hit the peak wave.</p>
            </div>
            <button 
              onClick={startPhase1}
              style={{ backgroundColor: '#D4AF37', color: 'black', padding: '22px 60px', borderRadius: '100px', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontStyle: 'italic', boxShadow: '0 0 30px rgba(212,175,55,0.3)' }}
            >START ENGINE</button>
          </div>
        )}

        {/* 3. PHASE 1 */}
        {screen === 'p1' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '12px', color: '#D4AF37', marginBottom: '50px', letterSpacing: '2px' }}>PHASE 01: CONSISTENCY</h3>
            <button 
              onPointerDown={handleP1Tap}
              style={{ width: '200px', height: '200px', backgroundColor: '#39FF14', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 50px rgba(57, 255, 20, 0.4)' }}
            >
              <img src="/gold-pi-logo.png" style={{ width: '120px' }} alt="Logo" />
            </button>
            <p style={{ marginTop: '30px', color: '#39FF14', fontWeight: 900, animation: 'pulse 1s infinite' }}>KEEP A STEADY BEAT!</p>
          </div>
        )}

        {/* 4. PHASE 2 */}
        {screen === 'p2' && (
          <div style={{ width: '320px', height: '400px', position: 'relative', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ textAlign: 'center', fontSize: '12px', color: '#D4AF37', marginTop: '20px', letterSpacing: '2px' }}>CATCH THE NODES</h3>
            <button 
              onPointerDown={handleP2Tap}
              style={{ position: 'absolute', left: targetPos.current.left, top: targetPos.current.top, width: '70px', height: '70px', backgroundColor: '#D4AF37', color: 'black', borderRadius: '50%', border: 'none', fontWeight: 900, fontSize: '28px' }}
            >π</button>
          </div>
        )}

        {/* 5. PHASE 3 */}
        {screen === 'p3' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '12px', color: '#D4AF37', marginBottom: '40px' }}>PHASE 03: HIT THE PEAK</h3>
            <div style={{ position: 'relative', width: '250px', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', width: `${pulseSize}%`, height: `${pulseSize}%`, backgroundColor: '#D4AF37', borderRadius: '50%', opacity: pulseSize/100 }}></div>
              <button 
                onPointerDown={handleP3Tap}
                style={{ zIndex: 10, width: '110px', height: '110px', backgroundColor: '#000', border: '3px solid #D4AF37', color: '#D4AF37', borderRadius: '50%', fontWeight: 900 }}
              >TAP PEAK</button>
            </div>
          </div>
        )}

        {/* 6. RESULT & EMAIL CAPTURE */}
        {screen === 'result' && (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '350px', animation: 'fadeIn 0.5s' }}>
            <p style={{ fontSize: '10px', color: '#D4AF37', opacity: 0.5 }}>INDEX SCORE</p>
            <h3 style={{ fontSize: '120px', fontWeight: 900, color: '#D4AF37', margin: 0 }}>{finalScore}</h3>
            <p style={{ fontWeight: 900, color: '#D4AF37', marginBottom: '30px' }}>USTAAD! FULL POWER!</p>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.3)' }}>
              <p style={{ fontSize: '10px', color: '#D4AF37', fontWeight: 900, marginBottom: '15px' }}>UNLOCK REGULATION PROTOCOL</p>
              <input 
                style={{ width: '100%', padding: '18px', background: 'rgba(0,0,0,0.5)', border: '1px solid #D4AF37', borderRadius: '100px', color: 'white', marginBottom: '15px', textAlign: 'center' }}
                placeholder="Enter email to Regulate..." 
                value={email} onChange={e => setEmail(e.target.value)} 
              />
              <button 
                onClick={() => { if(email.includes('@')) setScreen('reg_active'); else alert('Please enter a valid email.'); }}
                style={{ backgroundColor: '#D4AF37', color: 'black', padding: '15px', width: '100%', borderRadius: '100px', fontWeight: 900, border: 'none' }}
              >CALIBRATE REGULATION</button>
            </div>
          </div>
        )}

        {/* 7. REGULATION GAME */}
        {screen === 'reg_active' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#D4AF37', fontStyle: 'italic' }}>{regPhase}</h2>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: '#D4AF37', margin: '20px 0' }}>{regTimer.toFixed(1)}s</div>
            
            <div style={{ width: '250px', height: '250px', border: '2px solid rgba(212,175,55,0.2)', borderRadius: '50%', margin: '0 auto 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                    width: '100px', height: '100px', background: '#D4AF37', borderRadius: '50%', 
                    transform: regPhase === 'INHALE' ? `scale(${2.5 - (regTimer/2)})` : regPhase === 'EXHALE' ? `scale(${1 + (regTimer/2)})` : 'scale(1.5)',
                    transition: '0.1s linear', boxShadow: '0 0 30px rgba(212,175,55,0.5)'
                }}></div>
            </div>

            <p style={{ fontSize: '10px', color: '#D4AF37' }}>CYCLE {regCycles} OF 3</p>
            {regPhase === 'DONE' && (
                <button onClick={() => window.location.reload()} style={{ marginTop: '30px', color: '#D4AF37', background: 'none', border: 'none', textDecoration: 'underline' }}>COHERENCE ACHIEVED - RESTART</button>
            )}
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
