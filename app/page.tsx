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
  const [p1TimeLeft, setP1TimeLeft] = useState(15);
  
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
    
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    let drops: any[] = [];
    for (let i = 0; i < 200; i++) {
      drops.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, l: Math.random() * 20, v: Math.random() * 5 + 2 });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.25)'; // Dark atmosphere
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
    return () => window.removeEventListener('resize', resize);
  }, []);

  // --- 2. SOUND ENGINE ---
  const startAtmosphere = () => {
    // 1. Start Continuous Rain Audio
    if (!rainAudio.current) {
      rainAudio.current = new Audio("https://www.soundjay.com/nature/rain-01.mp3");
      rainAudio.current.loop = true;
      rainAudio.current.volume = 0.4;
    }
    rainAudio.current.play().catch(e => console.log("Audio blocked by browser", e));

    // 2. Init Game Sound Engine
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    
    // Play Confirmation Tone & Move to Details
    playTone(600, 'sine', 0.2, 0.1);
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
    playTone(440, 'sine', 0.3, 0.1);
    
    let timeLeft = 15;
    setP1TimeLeft(timeLeft);
    
    gameTimer.current = setInterval(() => {
        timeLeft -= 1;
        setP1TimeLeft(timeLeft);
        if (timeLeft <= 0) { 
            clearInterval(gameTimer.current);
            playTone(800, 'sine', 0.4, 0.15); // Transition Tone
            setScreen('p2');
        }
    }, 1000);
  };

  const handleP1Tap = () => {
    playTone(200, 'sine', 0.1, 0.1);
    setP1Taps(prev => [...prev, Date.now()]);
  };

  const handleP2Tap = () => {
    playTone(800, 'triangle', 0.1, 0.1);
    const next = [...p2Taps, Date.now()];
    setP2Taps(next);
    if (next.length >= 5) {
        playTone(1000, 'sine', 0.4, 0.15); // Transition Tone
        setScreen('p3');
    } else {
        targetPos.current = { 
            left: Math.floor(Math.random() * 60 + 20) + '%', 
            top: Math.floor(Math.random() * 60 + 20) + '%' 
        };
    }
  };

  // Phase 3 Animation (0 to 100)
  useEffect(() => {
    if (screen === 'p3' && hitCount < 3) {
      const interval = setInterval(() => {
        setPulseSize(p => {
          let n = p + (2.0 * pulseDir);
          if (n >= 100 || n <= 0) setPulseDir(d => d * -1);
          return n;
        });
      }, 16);
      return () => clearInterval(interval);
    }
  }, [screen, hitCount, pulseDir]);

  const handleP3Tap = () => {
    const isPeak = pulseSize > 80; // If pulse is near the edge
    
    if (isPeak) {
      playTone(1200, 'sine', 0.15, 0.2); // Success High Pitch Tone
      const nextCount = hitCount + 1;
      setHitCount(nextCount);
      
      if(nextCount >= 3) { 
        setFinalScore(Math.floor(Math.random() * 15) + 85); 
        playTone(400, 'triangle', 0.8, 0.2); // Win Tone
        setTimeout(() => setScreen('result'), 500); 
      }
    } else {
      playTone(150, 'sawtooth', 0.2, 0.1); // Miss/Buzz Tone
    }
  };

  // --- 4. STRICT 5-3-5 REGULATION LOGIC ---
  const runRegCycle = () => {
    if (regCycles >= 3) { setRegPhase('DONE'); return; }

    // --- INHALE (5s) ---
    setRegPhase('INHALE (5s)');
    playTone(300, 'sine', 0.5, 0.05); // Soft guide tone
    let time = 5.0;
    
    const inhaleInt = setInterval(() => {
        time -= 0.1; setRegTimer(Math.max(0, time));
        
        if (time <= 0.05) {
            clearInterval(inhaleInt);
            
            // --- HOLD (3s) ---
            setRegPhase('HOLD (3s)');
            playTone(400, 'sine', 0.5, 0.05); // Soft guide tone
            let hTime = 3.0;
            
            const holdInt = setInterval(() => {
                hTime -= 0.1; setRegTimer(Math.max(0, hTime));
                
                if (hTime <= 0.05) {
                    clearInterval(holdInt);
                    
                    // --- EXHALE (5s) ---
                    setRegPhase('EXHALE (5s)');
                    playTone(200, 'sine', 0.5, 0.05); // Soft guide tone
                    let eTime = 5.0;
                    
                    const exhaleInt = setInterval(() => {
                        eTime -= 0.1; setRegTimer(Math.max(0, eTime));
                        
                        if (eTime <= 0.05) {
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
        
        {/* 1. LANDING PAGE - Perfectly Centered */}
        {screen === 'landing' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 2s ease-in' }}>
            <img src="/gold-pi-logo.png" style={{ width: '220px', marginBottom: '20px' }} alt="Prana Index Logo" />
            <p style={{ color: '#D4AF37', fontSize: '24px', fontWeight: 900, fontStyle: 'italic', marginBottom: '10px' }}>Play your rhythm</p>
            <p style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: '50px', letterSpacing: '2px' }}>CHECK YOUR PI STRESS SCORE</p>
            
            <button 
              onClick={startAtmosphere}
              style={{ background: 'none', border: '2px solid #D4AF37', borderRadius: '50px', color: '#D4AF37', padding: '15px 50px', fontSize: '22px', fontWeight: 900, cursor: 'pointer', outline: 'none', transition: '0.2s', boxShadow: '0 0 20px rgba(212,175,55,0.2)' }}
            >START</button>
          </div>
        )}

        {/* 2. INSTRUCTIONS DETAILS */}
        {screen === 'details' && (
          <div style={{ textAlign: 'center', maxWidth: '320px', animation: 'fadeIn 0.5s' }}>
            <img src="/gold-pi-logo.png" style={{ width: '100px', margin: '0 auto 20px' }} alt="Logo" />
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', marginBottom: '40px' }}>
              <p style={{ marginBottom: '15px', fontSize: '12px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>01 CONSISTENCY:</span> Tap the white node steadily for 15 seconds.</p>
              <p style={{ marginBottom: '15px', fontSize: '12px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>02 REFLUX:</span> Catch all 5 nodes as fast as possible.</p>
              <p style={{ fontSize: '12px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>03 FOCUS:</span> Tap exactly when the pulse turns GREEN.</p>
            </div>
            <button 
              onClick={startPhase1}
              style={{ backgroundColor: '#D4AF37', color: 'black', padding: '20px 60px', borderRadius: '100px', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontStyle: 'italic', boxShadow: '0 0 30px rgba(212,175,55,0.3)' }}
            >START ENGINE</button>
          </div>
        )}

        {/* 3. PHASE 1: WHITE CIRCLE */}
        {screen === 'p1' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '12px', color: '#D4AF37', marginBottom: '20px', letterSpacing: '2px' }}>PHASE 01: CONSISTENCY</h3>
            <p style={{ color: 'white', fontSize: '24px', fontWeight: 900, marginBottom: '30px' }}>{p1TimeLeft}s</p>
            <button 
              onPointerDown={handleP1Tap}
              style={{ width: '200px', height: '200px', backgroundColor: '#FFFFFF', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 50px rgba(255, 255, 255, 0.4)', margin: '0 auto' }}
            >
              <img src="/gold-pi-logo.png" style={{ width: '120px' }} alt="Logo" />
            </button>
            <p style={{ marginTop: '40px', color: '#FFFFFF', fontWeight: 900, letterSpacing: '1px' }}>KEEP A STEADY BEAT!</p>
          </div>
        )}

        {/* 4. PHASE 2: CATCH NODES */}
        {screen === 'p2' && (
          <div style={{ width: '320px', height: '450px', position: 'relative', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ textAlign: 'center', fontSize: '12px', color: '#D4AF37', marginTop: '20px', letterSpacing: '2px' }}>PHASE 02: CATCH {5 - p2Taps.length} NODES</h3>
            <button 
              onPointerDown={handleP2Tap}
              style={{ position: 'absolute', left: targetPos.current.left, top: targetPos.current.top, width: '70px', height: '70px', backgroundColor: '#D4AF37', color: 'black', borderRadius: '50%', border: 'none', fontWeight: 900, fontSize: '28px' }}
            >π</button>
          </div>
        )}

        {/* 5. PHASE 3: COLOR CHANGE AT PEAK */}
        {screen === 'p3' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '12px', color: '#D4AF37', marginBottom: '40px', letterSpacing: '1px' }}>PHASE 03: FOCUS ({hitCount}/3)</h3>
            <p style={{ color: 'white', fontSize: '14px', marginBottom: '40px' }}>Tap when the ring turns <span style={{ color: '#39FF14', fontWeight: 900 }}>GREEN</span></p>
            
            <div style={{ position: 'relative', width: '250px', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              {/* Pulse Ring turns Green at >80% size */}
              <div style={{ position: 'absolute', width: `${pulseSize}%`, height: `${pulseSize}%`, backgroundColor: pulseSize > 80 ? '#39FF14' : '#D4AF37', borderRadius: '50%', opacity: pulseSize > 80 ? 0.8 : pulseSize/100, transition: 'background-color 0.1s' }}></div>
              <button 
                onPointerDown={handleP3Tap}
                style={{ zIndex: 10, width: '110px', height: '110px', backgroundColor: '#000', border: '3px solid #D4AF37', color: '#D4AF37', borderRadius: '50%', fontWeight: 900 }}
              >TAP</button>
            </div>
          </div>
        )}

        {/* 6. RESULT & EMAIL */}
        {screen === 'result' && (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '350px', animation: 'fadeIn 0.5s' }}>
            <p style={{ fontSize: '12px', color: '#D4AF37', opacity: 0.8, letterSpacing: '2px' }}>YOUR PRANA INDEX</p>
            <h3 style={{ fontSize: '120px', fontWeight: 900, color: '#D4AF37', margin: 0 }}>{finalScore}</h3>
            <p style={{ fontWeight: 900, color: '#D4AF37', marginBottom: '40px', fontSize: '18px' }}>USTAAD! FULL POWER!</p>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.3)' }}>
              <p style={{ fontSize: '10px', color: '#D4AF37', fontWeight: 900, marginBottom: '15px' }}>UNLOCK REGULATION PROTOCOL</p>
              <input 
                style={{ width: '100%', padding: '18px', background: 'rgba(0,0,0,0.5)', border: '1px solid #D4AF37', borderRadius: '100px', color: 'white', marginBottom: '15px', textAlign: 'center' }}
                placeholder="Enter email to Regulate..." 
                value={email} onChange={e => setEmail(e.target.value)} 
              />
              <button 
                onClick={() => { if(email.includes('@')) setScreen('reg_active'); else alert('Please enter a valid email.'); }}
                style={{ backgroundColor: '#D4AF37', color: 'black', padding: '15px', width: '100%', borderRadius: '100px', fontWeight: 900, border: 'none', cursor: 'pointer' }}
              >CALIBRATE REGULATION</button>
            </div>
          </div>
        )}

        {/* 7. STRICT 5-3-5 REGULATION GAME */}
        {screen === 'reg_active' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s', width: '100%' }}>
            
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#D4AF37', fontStyle: 'italic', margin: 0 }}>{regPhase}</h2>
                <div style={{ fontSize: '4rem', fontWeight: 900, color: 'white', margin: '10px 0' }}>{regTimer.toFixed(1)}s</div>
                <p style={{ fontSize: '12px', color: '#D4AF37', letterSpacing: '1px' }}>CYCLE {regCycles + 1} OF 3</p>
            </div>
            
            <div style={{ width: '250px', height: '250px', border: '2px solid rgba(212,175,55,0.2)', borderRadius: '50%', margin: '0 auto 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Bubble visually matches the breathing phase */}
                <div style={{ 
                    width: '100px', height: '100px', background: '#D4AF37', borderRadius: '50%', 
                    transform: regPhase.includes('INHALE') ? `scale(${2.5 - (regTimer/2)})` : regPhase.includes('EXHALE') ? `scale(${1 + (regTimer/2)})` : 'scale(1.5)',
                    transition: 'transform 0.1s linear', boxShadow: '0 0 30px rgba(212,175,55,0.5)'
                }}></div>
            </div>

            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '20px' }}>
                INSTRUCTIONS: BREATHE IN SYNC WITH THE GOLD BUBBLE. <br/> 5s INHALE → 3s HOLD → 5s EXHALE
            </div>

            {regPhase === 'DONE' && (
                <button onClick={() => window.location.reload()} style={{ marginTop: '40px', color: '#39FF14', background: 'none', border: 'none', textDecoration: 'underline', fontSize: '14px', fontWeight: 900, cursor: 'pointer' }}>COHERENCE ACHIEVED - RESTART ENGINE</button>
            )}
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
