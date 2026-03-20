"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function PranaIndex() {
  const [screen, setScreen] = useState('landing');
  const [email, setEmail] = useState('');
  
  // Game Performance Tracking
  const [p1Taps, setP1Taps] = useState<number[]>([]);
  const [p2StartTime, setP2StartTime] = useState(0);
  const [p3Hits, setP3Hits] = useState<number[]>([]); // Stores pulseSize at time of tap
  
  // UI States
  const [p1TimeLeft, setP1TimeLeft] = useState(15);
  const [pulseSize, setPulseSize] = useState(0);
  const [pulseDir, setPulseDir] = useState(1);
  const [isTapping, setIsTapping] = useState(false);
  const [p2Count, setP2Count] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  
  // Regulation States
  const [regPhase, setRegPhase] = useState('READY'); 
  const [regTimer, setRegTimer] = useState(5.0);
  const [regCycles, setRegCycles] = useState(0);

  // Audio/Visual Refs
  const audioCtx = useRef<AudioContext | null>(null);
  const rainAudio = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetPos = useRef({ left: '50%', top: '50%' });
  const engineOsc = useRef<OscillatorNode | null>(null);
  const engineGain = useRef<GainNode | null>(null);

  // --- 1. RAIN ANIMATION (STAYS ACTIVE) ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    let drops: any[] = [];
    for (let i = 0; i < 150; i++) drops.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, l: Math.random() * 25, v: Math.random() * 5 + 3 });
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 1;
      drops.forEach(d => { ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.l); ctx.stroke(); d.y += d.v; if (d.y > canvas.height) d.y = -20; });
      requestAnimationFrame(animate);
    };
    animate();
    return () => window.removeEventListener('resize', resize);
  }, []);

  // --- 2. SOUND SYSTEM ---
  const startAtmosphere = () => {
    if (!rainAudio.current) {
      rainAudio.current = new Audio("https://www.soundjay.com/nature/rain-01.mp3");
      rainAudio.current.loop = true;
      rainAudio.current.volume = 0.4;
    }
    rainAudio.current.play();
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    setScreen('details');
  };

  const playTone = (f: number, t: OscillatorType, d: number, v = 0.1) => {
    if (!audioCtx.current) return;
    const o = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    o.type = t; o.frequency.setValueAtTime(f, audioCtx.current.currentTime);
    g.gain.setValueAtTime(v, audioCtx.current.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + d);
    o.connect(g); g.connect(audioCtx.current.destination);
    o.start(); o.stop(audioCtx.current.currentTime + d);
  };

  const setEngineRev = (freq: number, vol: number) => {
    if (!audioCtx.current) return;
    if (!engineOsc.current) {
      engineOsc.current = audioCtx.current.createOscillator();
      engineGain.current = audioCtx.current.createGain();
      engineOsc.current.type = 'sawtooth';
      engineOsc.current.connect(engineGain.current);
      engineGain.current.connect(audioCtx.current.destination);
      engineOsc.current.start();
    }
    engineOsc.current.frequency.exponentialRampToValueAtTime(freq, audioCtx.current.currentTime + 0.1);
    engineGain.current!.gain.linearRampToValueAtTime(vol, audioCtx.current.currentTime + 0.1);
  };

  const stopEngine = () => {
    if (engineOsc.current) { engineOsc.current.stop(); engineOsc.current = null; }
  };

  // --- 3. SCORE CALCULATION ---
  const calculateFinalScore = (p2TotalTime: number) => {
    // 1. Consistency Score (P1)
    let intervals: number[] = [];
    for(let i=1; i<p1Taps.length; i++) intervals.push(p1Taps[i] - p1Taps[i-1]);
    const avg = intervals.reduce((a,b)=>a+b,0) / intervals.length;
    const variance = intervals.reduce((a,b)=>a + Math.pow(b-avg, 2), 0) / intervals.length;
    const consistency = Math.max(0, 100 - (Math.sqrt(variance) / 10));

    // 2. Reflex Score (P2)
    const reflex = Math.max(0, 100 - (p2TotalTime / 50));

    // 3. Focus Score (P3)
    const focus = p3Hits.reduce((a,b)=>a+b, 0) / (p3Hits.length || 1); // Fixed NaN potential

    const final = (consistency * 0.4) + (reflex * 0.3) + (focus * 0.3);
    setFinalScore(Math.floor(final));
    setScreen('result');
  };

  // --- 4. GAME PHASES ---
  const startP1 = () => {
    setScreen('p1');
    let time = 15;
    const timer = setInterval(() => {
      time--; setP1TimeLeft(time);
      if (time <= 0) { 
        clearInterval(timer); 
        setScreen('p2'); 
        setP2StartTime(Date.now());
        playTone(600, 'sine', 0.5); 
      }
    }, 1000);
  };

  // Phase 3 Pulse Logic
  useEffect(() => {
    if (screen === 'p3') {
      const int = setInterval(() => {
        setPulseSize(s => {
          let next = s + (3.5 * pulseDir);
          if (next >= 100 || next <= 0) setPulseDir(d => d * -1);
          return next;
        });
      }, 16);
      return () => clearInterval(int);
    }
  }, [screen, pulseDir]);

  // --- 5. REGULATION (5-3-5) ---
  const startRegulation = () => {
    if (regCycles >= 3) { setRegPhase('DONE'); return; }
    
    // INHALE
    setRegPhase('INHALE');
    let time = 5.0;
    const inhaleInt = setInterval(() => {
      time -= 0.1; setRegTimer(time);
      setEngineRev(100 + ((5 - time) * 40), 0.05);
      if (time <= 0) {
        clearInterval(inhaleInt);
        // HOLD
        setRegPhase('HOLD');
        setEngineRev(300, 0.02);
        let hTime = 3.0;
        const holdInt = setInterval(() => {
          hTime -= 0.1; setRegTimer(hTime);
          if (hTime <= 0) {
            clearInterval(holdInt);
            // EXHALE
            setRegPhase('EXHALE');
            let eTime = 5.0;
            const exhaleInt = setInterval(() => {
              eTime -= 0.1; setRegTimer(eTime);
              setEngineRev(300 - ((5 - eTime) * 40), 0.05);
              if (eTime <= 0) {
                clearInterval(exhaleInt);
                stopEngine();
                setRegCycles(c => c + 1);
                setRegPhase('READY');
              }
            }, 100);
          }
        }, 100);
      }
    }, 100);
  };

  useEffect(() => {
    if (screen === 'reg' && regPhase === 'READY' && regCycles < 3) {
      setTimeout(startRegulation, 1000);
    }
  }, [screen, regPhase, regCycles]);


  // --- 6. SHARING & SAVING FEATURES ---
  const getShareText = () => `I just scored ${finalScore} on the PI Stress Test! Check your rhythm and beat my score:`;
  const getShareUrl = () => typeof window !== 'undefined' ? window.location.href : 'https://pranaindex.com';

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${getShareText()} ${getShareUrl()}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Prana Index Score',
          text: getShareText(),
          url: getShareUrl()
        });
      } catch (err) { console.error('Share failed:', err); }
    } else {
      alert("Native sharing isn't supported on this browser. Try WhatsApp or Save Image!");
    }
  };

  const downloadScoreImage = () => {
    // Dynamically draw a beautiful square score card
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1080; // Instagram ready
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gold Border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 15;
    ctx.strokeRect(40, 40, 1000, 1000);

    // Text Setup
    ctx.textAlign = 'center';
    
    // Logo "π"
    ctx.font = 'italic 900 180px Inter, sans-serif';
    ctx.fillStyle = '#D4AF37';
    ctx.fillText('π', 540, 280);

    // Branding
    ctx.font = '900 50px Inter, sans-serif';
    ctx.letterSpacing = '10px';
    ctx.fillText('PRANA INDEX', 540, 400);

    // Score Label
    ctx.font = '700 35px Inter, sans-serif';
    ctx.fillStyle = 'white';
    ctx.letterSpacing = '5px';
    ctx.fillText('STRESS SCORE', 540, 520);

    // Final Score
    ctx.font = '900 300px Inter, sans-serif';
    ctx.fillStyle = '#D4AF37';
    ctx.fillText(finalScore.toString(), 540, 800);

    // Verdict Phrase
    const verdict = finalScore > 90 ? "USTAAD! SUPREME FOCUS" : finalScore > 75 ? "ELITE COHERENCE" : "CALIBRATION NEEDED";
    ctx.font = '900 45px Inter, sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(verdict, 540, 940);

    // Trigger Download
    const link = document.createElement('a');
    link.download = `PI_Stress_Score_${finalScore}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // --- STYLING HELPERS ---
  const socialBtnStyle = {
    backgroundColor: 'rgba(212,175,55,0.1)', border: '1px solid #D4AF37', color: '#D4AF37', 
    padding: '12px 20px', borderRadius: '30px', fontWeight: 900, cursor: 'pointer', fontSize: '14px', flex: 1
  };


  return (
    <div style={{ backgroundColor: '#0A0E1A', color: 'white', minHeight: '100vh', touchAction: 'none', overflow: 'hidden', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
      
      {/* PERSISTENT HEADER */}
      {screen !== 'landing' && (
        <div style={{ position: 'absolute', top: '30px', width: '100%', textAlign: 'center', zIndex: 20 }}>
           <div style={{ fontSize: '22px', fontWeight: 900, color: '#D4AF37', fontStyle: 'italic', letterSpacing: '2px' }}>PRANA INDEX</div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        
        {screen === 'landing' && (
          <div style={{ textAlign: 'center' }}>
            <img src="/gold-pi-logo.png" style={{ width: '220px', marginBottom: '10px' }} alt="logo" />
            <h1 style={{ fontSize: '14px', letterSpacing: '8px', color: 'white', marginBottom: '40px' }}>PRANA INDEX</h1>
            <p style={{ color: '#D4AF37', fontSize: '24px', fontWeight: 900, fontStyle: 'italic', marginBottom: '10px' }}>Play your rhythm</p>
            <p style={{ letterSpacing: '1px', marginBottom: '60px', opacity: 0.8 }}>CHECK YOUR PI STRESS SCORE</p>
            <button onClick={startAtmosphere} style={{ border: '2px solid #D4AF37', color: '#D4AF37', padding: '15px 60px', borderRadius: '50px', background: 'none', fontSize: '20px', fontWeight: 900, cursor: 'pointer' }}>START</button>
          </div>
        )}

        {screen === 'details' && (
          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '30px', border: '1px solid #ffffff11', textAlign: 'left' }}>
              <p style={{ fontSize: '12px', marginBottom: '15px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>01 CONSISTENCY:</span> Tap the white node steadily for 15s.</p>
              <p style={{ fontSize: '12px', marginBottom: '15px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>02 REFLUX:</span> Catch the nodes as fast as you can.</p>
              <p style={{ fontSize: '12px' }}><span style={{ color: '#D4AF37', fontWeight: 900 }}>03 FOCUS:</span> Hit the peak when the pulse turns green.</p>
            </div>
            <button onClick={startP1} style={{ marginTop: '40px', backgroundColor: '#D4AF37', color: 'black', padding: '20px 60px', borderRadius: '50px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>START ENGINE</button>
          </div>
        )}

        {screen === 'p1' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', letterSpacing: '2px', marginBottom: '20px' }}>PHASE 01: CONSISTENCY</p>
            <div style={{ fontSize: '50px', fontWeight: 900, marginBottom: '30px' }}>{p1TimeLeft}<span style={{fontSize: '20px'}}>s</span></div>
            <div 
              onPointerDown={() => { setIsTapping(true); setP1Taps([...p1Taps, Date.now()]); playTone(200, 'sine', 0.1); }}
              onPointerUp={() => setIsTapping(false)}
              style={{ 
                width: '200px', height: '200px', backgroundColor: 'white', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: isTapping ? 'scale(0.92)' : 'scale(1)', transition: '0.1s',
                boxShadow: isTapping ? '0 0 60px white' : '0 0 20px rgba(255,255,255,0.2)'
              }}
            >
              <img src="/gold-pi-logo.png" style={{ width: '120px' }} alt="logo" />
            </div>
            <p style={{ marginTop: '40px', opacity: 0.6, fontSize: '12px' }}>MAINTAIN A STEADY RHYTHM</p>
          </div>
        )}

        {screen === 'p2' && (
          <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
             <p style={{ position: 'absolute', top: '120px', width: '100%', textAlign: 'center', color: '#D4AF37', fontSize: '12px' }}>PHASE 02: REFLUX ({p2Count}/5)</p>
             <button 
                onPointerDown={() => {
                    playTone(800, 'triangle', 0.1);
                    if(p2Count + 1 >= 5) {
                        calculateFinalScore(Date.now() - p2StartTime);
                        setScreen('p3');
                    } else {
                        setP2Count(c => c + 1);
                        targetPos.current = { left: Math.random()*70+15+'%', top: Math.random()*70+15+'%' };
                    }
                }}
                style={{ position: 'absolute', left: targetPos.current.left, top: targetPos.current.top, width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#D4AF37', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer' }}
             >π</button>
          </div>
        )}

        {screen === 'p3' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', marginBottom: '50px', fontSize: '12px' }}>PHASE 03: FOCUS ({p3Hits.length}/3)</p>
            <div style={{ width: '280px', height: '280px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: pulseSize+'%', height: pulseSize+'%', borderRadius: '50%', backgroundColor: pulseSize > 85 ? '#39FF14' : '#D4AF37', opacity: pulseSize > 85 ? 0.8 : 0.4, transition: 'background-color 0.1s' }}></div>
                <button onPointerDown={() => {
                    setP3Hits([...p3Hits, pulseSize]);
                    if (pulseSize > 85) playTone(1200, 'sine', 0.2, 0.2); else playTone(100, 'sawtooth', 0.2);
                    if (p3Hits.length + 1 >= 3) {
                       const reflexTime = Date.now() - p2StartTime;
                       calculateFinalScore(reflexTime);
                    }
                }} style={{ zIndex: 10, width: '110px', height: '110px', borderRadius: '50%', backgroundColor: 'black', border: '3px solid #D4AF37', color: '#D4AF37', fontWeight: 900, cursor: 'pointer' }}>TAP PEAK</button>
            </div>
          </div>
        )}

        {screen === 'result' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 1s', maxWidth: '380px', width: '100%' }}>
            <p style={{ fontSize: '12px', color: '#D4AF37', letterSpacing: '3px' }}>STRESS SCORE</p>
            <h3 style={{ fontSize: '130px', fontWeight: 900, color: '#D4AF37', margin: '10px 0', lineHeight: 1 }}>{finalScore}</h3>
            <p style={{ fontWeight: 900, color: 'white', fontSize: '18px', marginBottom: '40px' }}>
              {finalScore > 90 ? "USTAAD! SUPREME FOCUS" : finalScore > 75 ? "ELITE COHERENCE" : "CALIBRATION NEEDED"}
            </p>
            
            {/* SHARING ROW */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center' }}>
               <button onClick={downloadScoreImage} style={socialBtnStyle}>📥 Save</button>
               <button onClick={shareWhatsApp} style={socialBtnStyle}>💬 WhatsApp</button>
               <button onClick={shareNative} style={socialBtnStyle}>🔗 Share</button>
            </div>

            <input placeholder="Email to Regulate..." value={email} onChange={e=>setEmail(e.target.value)} style={{ width: '100%', padding: '20px', borderRadius: '50px', border: '1px solid #D4AF37', background: 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'center', marginBottom: '20px' }} />
            <button onClick={() => { setRegPhase('READY'); setScreen('reg'); }} style={{ backgroundColor: '#D4AF37', color: 'black', padding: '18px 50px', borderRadius: '50px', fontWeight: 900, border: 'none', width: '100%', cursor: 'pointer' }}>CALIBRATE REGULATION</button>
          </div>
        )}

        {screen === 'reg' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#D4AF37', fontSize: '28px', fontWeight: 900, fontStyle: 'italic', marginBottom: '10px' }}>{regPhase}</p>
            <div style={{ fontSize: '80px', fontWeight: 900, marginBottom: '40px' }}>{regTimer.toFixed(1)}<span style={{fontSize: '20px'}}>s</span></div>
            
            <div style={{ width: '250px', height: '250px', borderRadius: '50%', border: '2px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ 
                  width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#D4AF37',
                  transform: regPhase === 'INHALE' ? `scale(${1 + (5-regTimer)*0.3})` : regPhase === 'EXHALE' ? `scale(${2.5 - (5-regTimer)*0.3})` : 'scale(1)',
                  transition: '0.1s linear', boxShadow: '0 0 50px rgba(212,175,55,0.4)'
                }}></div>
            </div>
            
            <p style={{ marginTop: '50px', letterSpacing: '2px', color: '#D4AF37' }}>CYCLE {regCycles + 1} / 3</p>
            {regPhase === 'DONE' && <button onClick={() => window.location.reload()} style={{ color: '#39FF14', fontWeight: 900, textDecoration: 'underline', marginTop: '30px', background: 'none', border: 'none', cursor: 'pointer' }}>COHERENCE ACHIEVED - RESTART</button>}
          </div>
        )}

      </div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;700;900&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
